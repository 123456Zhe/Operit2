#![allow(non_snake_case)]

use std::sync::Arc;
use std::thread::JoinHandle;

use esp_idf_hal::uart::UartDriver;
use operit_edge_transport::{
    AuthenticatedLinkChannel, EdgePairingAuthority, EdgePairingStore, EdgePeerLink,
    EdgeSpaceRouteClient, LinkChannel,
};
use operit_host_api::{HostError, HostResult};
use operit_link::LinkDeviceInfo;
use tokio::runtime::Builder;

use crate::edge_serial::Esp32UartLinkChannel;
use crate::status::FirmwareStatus;

/// Runs the authenticated standard-Link listener on a dedicated ESP-IDF task.
pub struct Esp32EdgeLinkServer {
    _thread: JoinHandle<()>,
}

impl Esp32EdgeLinkServer {
    pub fn start(
        port: u16,
        token: String,
        status: Arc<FirmwareStatus>,
        store: Arc<dyn EdgePairingStore>,
        uart: Option<UartDriver<'static>>,
    ) -> HostResult<Option<Self>> {
        if token.trim().is_empty() {
            log::warn!("Edge Link disabled: OPERIT_EDGE_TOKEN is not configured");
            return Ok(None);
        }
        let thread = std::thread::Builder::new()
            .name("operit-edge-link".to_string())
            .spawn(move || {
                let runtime = match Builder::new_current_thread().enable_all().build() {
                    Ok(runtime) => runtime,
                    Err(error) => {
                        log::error!("Edge Link runtime: {error}");
                        return;
                    }
                };
                let authority = match EdgePairingAuthority::newWithStore(
                    token,
                    "esp32-edge".to_string(),
                    LinkDeviceInfo {
                        platform: "esp32".to_string(),
                        model: "ESP32-2432S028".to_string(),
                    },
                    store,
                    {
                        let status = Arc::clone(&status);
                        move |code| {
                            status.setPairingCode(code.clone());
                            log::info!("Edge Link pairing code: {code}");
                        }
                    },
                ) {
                    Ok(authority) => Arc::new(authority),
                    Err(error) => {
                        log::error!("Edge Link persistent store: {error}");
                        return;
                    }
                };
                runtime.block_on(async move {
                    let serialChannel = match uart {
                        Some(uart) => match Esp32UartLinkChannel::new(uart) {
                            Ok(channel) => Some(channel),
                            Err(error) => {
                                log::error!("Edge UART listener: {}", error.message);
                                None
                            }
                        },
                        None => None,
                    };
                    if let Some(channel) = serialChannel {
                        let serialAuthority = Arc::clone(&authority);
                        tokio::spawn(async move {
                            loop {
                                match handleChannel(
                                    Arc::clone(&serialAuthority),
                                    channel.clone(),
                                )
                                .await
                                {
                                    Ok(()) => {}
                                    Err(error) => {
                                        log::warn!("Edge UART session: {error}");
                                        if channel.isClosed() {
                                            break;
                                        }
                                    }
                                }
                            }
                        });
                        log::info!("Edge Link listening on UART0 GPIO1/GPIO3 at 115200 baud");
                    }
                    let listener = match operit_edge_transport::tcp::TcpLinkChannel::bind(&format!(
                        "0.0.0.0:{port}"
                    ))
                    .await
                    {
                        Ok(listener) => listener,
                        Err(error) => {
                            log::error!("Edge Link listener: {error}");
                            return;
                        }
                    };
                    log::info!("Edge Link listening on TCP port {port}");
                    loop {
                        let (stream, peer) = match listener.accept().await {
                            Ok(value) => value,
                            Err(error) => {
                                log::warn!("Edge Link accept: {error}");
                                continue;
                            }
                        };
                        log::info!("Edge Link connection from {peer}");
                        let channel =
                            operit_edge_transport::tcp::TcpLinkChannel::fromStream(stream);
                        let authority = Arc::clone(&authority);
                        tokio::spawn(async move {
                            if let Err(error) = handleChannel(authority, channel).await {
                                log::warn!("Edge Link session: {error}");
                            }
                        });
                    }
                });
            })
            .map_err(|error| HostError::new(format!("Edge Link thread: {error}")))?;
        Ok(Some(Self { _thread: thread }))
    }
}

/// Handles the first frame and then serves one authenticated EdgeLink session.
async fn handleChannel(
    authority: Arc<EdgePairingAuthority>,
    channel: Arc<dyn LinkChannel>,
) -> Result<(), String> {
    let first = channel
        .receive()
        .await?
        .ok_or_else(|| "Edge Link carrier closed".to_string())?;
    match &first.payload {
        operit_link::LinkFramePayload::PairStart(request) => {
            let session = authority
                .pairFromStart(channel.clone(), request.clone())
                .await?;
            let peerId = session.peerDeviceId.clone();
            let authenticated = AuthenticatedLinkChannel::new(channel, session);
            let context = tokio::time::timeout(std::time::Duration::from_secs(30), authenticated.receive())
                .await.map_err(|_| "Space admission timed out".to_string())??
                .ok_or_else(|| "Space admission context was not received".to_string())?;
            installSpaceRoute(authenticated, context, &peerId).await?;
            Ok(())
        }
        operit_link::LinkFramePayload::Authenticated { .. } => {
            let (session, inner) = authority.authenticateFrame(&first)?;
            let peerId = session.peerDeviceId.clone();
            let authenticated = AuthenticatedLinkChannel::new(channel, session);
            installSpaceRoute(authenticated, inner, &peerId).await?;
            Ok(())
        }
        _ => Err("Edge Link connection did not start with pairing or authentication".to_string()),
    }
}

async fn installSpaceRoute(
    channel: Arc<dyn LinkChannel>,
    frame: operit_link::LinkFrame,
    peerId: &str,
) -> Result<(), String> {
    let operit_link::LinkFramePayload::SpaceContext { spaceId, adjacentNodeId, ttl, chatId } = frame.payload else {
        return Err("Edge session did not begin with authenticated Space admission".to_string());
    };
    if spaceId.trim().is_empty() || chatId.trim().is_empty() || adjacentNodeId != peerId || ttl == 0 {
        return Err("Invalid authenticated Space route context".to_string());
    }
    let peer = EdgePeerLink::new(channel);
    let client = EdgeSpaceRouteClient::throughAdjacent(peer.clone(), spaceId, adjacentNodeId, ttl);
    operit_link::installCoreRouteRuntime(Arc::new(client.clone()));
    crate::edge_chat::install(client, chatId);
    // Keep the UART session owner alive while PeerLink owns receive(); the
    // listener must not compete with it for the next authenticated frame.
    while peer.isConnected() {
        tokio::time::sleep(std::time::Duration::from_millis(250)).await;
    }
    Ok(())
}
