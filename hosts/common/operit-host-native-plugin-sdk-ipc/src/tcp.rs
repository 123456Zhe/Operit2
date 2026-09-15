use std::collections::HashMap;
use std::net::{TcpListener, TcpStream};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;

use operit_host_api::{
    HostError, HostResult, PluginSdkIpcEndpoint, PluginSdkIpcHost, PluginSdkIpcSessionCallbacks,
    PluginSdkIpcSessionId, PLUGIN_SDK_IPC_ENDPOINT_NAME,
};

use crate::stream::{
    closePluginSdkIpcStream, sendPluginSdkIpcStream, spawnPluginSdkIpcReadLoop,
    PluginSdkIpcStreamSession,
};

/// TCP loopback port used by the standard Plugin SDK IPC endpoint.
pub const PLUGIN_SDK_IPC_TCP_PORT: u16 = 18732;

/// TCP loopback Plugin SDK IPC carrier used by board hosts.
pub struct TcpPluginSdkIpcHost {
    inner: Arc<Mutex<TcpInner>>,
    nextSession: Arc<AtomicU64>,
}

struct TcpInner {
    listenerStop: Option<Arc<AtomicBool>>,
    listenerThread: Option<JoinHandle<()>>,
    sessions: HashMap<String, Arc<PluginSdkIpcStreamSession>>,
}

impl TcpPluginSdkIpcHost {
    /// Creates a TCP loopback Plugin SDK IPC carrier.
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(TcpInner {
                listenerStop: None,
                listenerThread: None,
                sessions: HashMap::new(),
            })),
            nextSession: Arc::new(AtomicU64::new(1)),
        }
    }

    /// Returns the loopback address for one Plugin SDK endpoint.
    #[allow(non_snake_case)]
    fn bindAddress(endpoint: &PluginSdkIpcEndpoint) -> HostResult<String> {
        if endpoint.name != PLUGIN_SDK_IPC_ENDPOINT_NAME {
            return Err(HostError::new(format!(
                "Plugin SDK TCP IPC endpoint is not the standard endpoint: {}",
                endpoint.name
            )));
        }
        Ok(format!("127.0.0.1:{PLUGIN_SDK_IPC_TCP_PORT}"))
    }

    /// Allocates the next session identifier.
    fn nextSessionId(&self) -> PluginSdkIpcSessionId {
        PluginSdkIpcSessionId::new(format!(
            "plugin-sdk-tcp-{}",
            self.nextSession.fetch_add(1, Ordering::Relaxed)
        ))
    }

    /// Locks carrier state.
    fn lock(&self) -> HostResult<std::sync::MutexGuard<'_, TcpInner>> {
        self.inner
            .lock()
            .map_err(|error| HostError::new(format!("Plugin SDK TCP IPC lock poisoned: {error}")))
    }

    /// Attaches one connected TCP stream as a session.
    fn attachStream(
        &self,
        stream: TcpStream,
        callbacks: PluginSdkIpcSessionCallbacks,
        listenerOwned: bool,
    ) -> HostResult<PluginSdkIpcSessionId> {
        let sessionId = self.nextSessionId();
        let reader = stream
            .try_clone()
            .map_err(|error| HostError::new(error.to_string()))?;
        let writer = stream
            .try_clone()
            .map_err(|error| HostError::new(error.to_string()))?;
        let session = Arc::new(PluginSdkIpcStreamSession::new(
            sessionId.clone(),
            Box::new(writer),
            listenerOwned,
        ));
        self.lock()?
            .sessions
            .insert(sessionId.0.clone(), session);
        let sessions = self.inner.clone();
        let closedId = sessionId.clone();
        spawnPluginSdkIpcReadLoop(sessionId.clone(), reader, callbacks.clone(), move || {
            if let Ok(mut inner) = sessions.lock() {
                inner.sessions.remove(&closedId.0);
            }
        })?;
        (callbacks.onConnected)(sessionId.clone());
        Ok(sessionId)
    }
}

impl Default for TcpPluginSdkIpcHost {
    /// Creates a TCP loopback Plugin SDK IPC carrier.
    fn default() -> Self {
        Self::new()
    }
}

impl PluginSdkIpcHost for TcpPluginSdkIpcHost {
    /// Binds the Plugin SDK TCP loopback listener.
    fn startListener(
        &self,
        endpoint: PluginSdkIpcEndpoint,
        callbacks: PluginSdkIpcSessionCallbacks,
    ) -> HostResult<()> {
        let address = Self::bindAddress(&endpoint)?;
        let listener =
            TcpListener::bind(&address).map_err(|error| HostError::new(error.to_string()))?;
        listener
            .set_nonblocking(true)
            .map_err(|error| HostError::new(error.to_string()))?;
        let stop = Arc::new(AtomicBool::new(false));
        {
            let mut inner = self.lock()?;
            if inner.listenerThread.is_some() {
                return Err(HostError::new(
                    "Plugin SDK IPC listener is already started",
                ));
            }
            inner.listenerStop = Some(stop.clone());
        }
        let host = self.inner.clone();
        let nextSession = self.nextSession.clone();
        let thread = std::thread::Builder::new()
            .name("operit-plugin-sdk-ipc-tcp-listen".to_string())
            .spawn(move || {
                while !stop.load(Ordering::SeqCst) {
                    match listener.accept() {
                        Ok((stream, _)) => {
                            let sessionId = PluginSdkIpcSessionId::new(format!(
                                "plugin-sdk-tcp-{}",
                                nextSession.fetch_add(1, Ordering::Relaxed)
                            ));
                            let Ok(reader) = stream.try_clone() else {
                                continue;
                            };
                            let Ok(writer) = stream.try_clone() else {
                                continue;
                            };
                            let session = Arc::new(PluginSdkIpcStreamSession::new(
                                sessionId.clone(),
                                Box::new(writer),
                                true,
                            ));
                            if let Ok(mut inner) = host.lock() {
                                inner.sessions.insert(sessionId.0.clone(), session);
                            }
                            let sessions = host.clone();
                            let closedId = sessionId.clone();
                            let _ = spawnPluginSdkIpcReadLoop(
                                sessionId.clone(),
                                reader,
                                callbacks.clone(),
                                move || {
                                    if let Ok(mut inner) = sessions.lock() {
                                        inner.sessions.remove(&closedId.0);
                                    }
                                },
                            );
                            (callbacks.onConnected)(sessionId);
                        }
                        Err(error)
                            if error.kind() == std::io::ErrorKind::WouldBlock
                                || error.kind() == std::io::ErrorKind::Interrupted =>
                        {
                            std::thread::sleep(std::time::Duration::from_millis(20));
                        }
                        Err(_) => break,
                    }
                }
            })
            .map_err(|error| HostError::new(error.to_string()))?;
        self.lock()?.listenerThread = Some(thread);
        Ok(())
    }

    /// Connects to the Operit TCP Plugin SDK listener.
    fn connect(
        &self,
        endpoint: PluginSdkIpcEndpoint,
        callbacks: PluginSdkIpcSessionCallbacks,
    ) -> HostResult<PluginSdkIpcSessionId> {
        let stream = TcpStream::connect(Self::bindAddress(&endpoint)?)
            .map_err(|error| HostError::new(error.to_string()))?;
        self.attachStream(stream, callbacks, false)
    }

    /// Sends one framed payload on a TCP session.
    fn send(&self, sessionId: &PluginSdkIpcSessionId, bytes: Vec<u8>) -> HostResult<()> {
        let session = {
            let inner = self.lock()?;
            inner
                .sessions
                .get(&sessionId.0)
                .cloned()
                .ok_or_else(|| {
                    HostError::new(format!("Plugin SDK IPC session is closed: {}", sessionId.0))
                })?
        };
        sendPluginSdkIpcStream(&session, bytes)
    }

    /// Closes one TCP Plugin SDK session.
    fn closeSession(&self, sessionId: &PluginSdkIpcSessionId) -> HostResult<()> {
        let session = {
            let mut inner = self.lock()?;
            inner.sessions.remove(&sessionId.0).ok_or_else(|| {
                HostError::new(format!("Plugin SDK IPC session is closed: {}", sessionId.0))
            })?
        };
        closePluginSdkIpcStream(&session);
        Ok(())
    }

    /// Stops the TCP listener and closes listener-owned sessions.
    fn stopListener(&self) -> HostResult<()> {
        let (stop, thread, owned);
        {
            let mut inner = self.lock()?;
            stop = inner
                .listenerStop
                .take()
                .ok_or_else(|| HostError::new("Plugin SDK IPC listener is not started"))?;
            thread = inner.listenerThread.take();
            owned = inner
                .sessions
                .iter()
                .filter(|(_, session)| session.listenerOwned)
                .map(|(id, _)| id.clone())
                .collect::<Vec<_>>();
            for id in &owned {
                if let Some(session) = inner.sessions.remove(id) {
                    closePluginSdkIpcStream(&session);
                }
            }
        }
        stop.store(true, Ordering::SeqCst);
        if let Some(thread) = thread {
            let _ = thread.join();
        }
        Ok(())
    }
}
