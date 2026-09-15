#![allow(non_snake_case)]

mod framing;
mod memory;
pub mod stream;

#[cfg(not(any(
    target_os = "windows",
    target_arch = "wasm32",
    target_os = "ohos"
)))]
#[path = "unix.rs"]
pub mod unix;

mod tcp;


pub use framing::{
    readPluginSdkIpcFrame, writePluginSdkIpcFrame, PLUGIN_SDK_IPC_MAX_FRAME_BYTES,
};
pub use memory::MemoryPluginSdkIpcHost;
#[cfg(not(any(
    target_os = "windows",
    target_arch = "wasm32",
    target_os = "ohos"
)))]
pub use unix::UnixPluginSdkIpcHost;
pub use tcp::{TcpPluginSdkIpcHost, PLUGIN_SDK_IPC_TCP_PORT};
