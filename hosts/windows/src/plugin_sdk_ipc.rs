use std::collections::HashMap;
use std::fs::File;
use std::os::windows::io::{FromRawHandle, OwnedHandle, RawHandle};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::JoinHandle;

use operit_host_native_plugin_sdk_ipc::stream::{
    closePluginSdkIpcStream, sendPluginSdkIpcStream, spawnPluginSdkIpcReadLoop,
    PluginSdkIpcStreamSession,
};

use operit_host_api::{
    HostError, HostResult, PluginSdkIpcEndpoint, PluginSdkIpcHost, PluginSdkIpcSessionCallbacks,
    PluginSdkIpcSessionId,
};
use windows_sys::Win32::Foundation::{
    CloseHandle, GetLastError, GENERIC_READ, GENERIC_WRITE, HANDLE, INVALID_HANDLE_VALUE,
};
use windows_sys::Win32::Storage::FileSystem::{
    CreateFileW, FILE_ATTRIBUTE_NORMAL, FILE_SHARE_READ, FILE_SHARE_WRITE, OPEN_EXISTING,
    PIPE_ACCESS_DUPLEX,
};
use windows_sys::Win32::System::Pipes::{
    ConnectNamedPipe, CreateNamedPipeW, PIPE_READMODE_BYTE, PIPE_TYPE_BYTE,
    PIPE_UNLIMITED_INSTANCES, PIPE_WAIT,
};

const ERROR_PIPE_CONNECTED: u32 = 535;

/// Windows named-pipe Plugin SDK IPC carrier.
pub struct WindowsPluginSdkIpcHost {
    inner: Arc<Mutex<WindowsInner>>,
    nextSession: Arc<AtomicU64>,
}

struct WindowsInner {
    listenerStop: Option<Arc<AtomicBool>>,
    listenerThread: Option<JoinHandle<()>>,
    sessions: HashMap<String, Arc<PluginSdkIpcStreamSession>>,
}

impl WindowsPluginSdkIpcHost {
    /// Creates a Windows named-pipe Plugin SDK IPC carrier.
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(WindowsInner {
                listenerStop: None,
                listenerThread: None,
                sessions: HashMap::new(),
            })),
            nextSession: Arc::new(AtomicU64::new(1)),
        }
    }

    /// Maps the logical endpoint name to the Windows named-pipe path.
    #[allow(non_snake_case)]
    fn pipeName(endpoint: &PluginSdkIpcEndpoint) -> String {
        format!(r"\\.\pipe\{}", endpoint.name.replace('.', "_"))
    }

    /// Encodes a Windows path as a null-terminated UTF-16 buffer.
    fn wide(value: &str) -> Vec<u16> {
        value.encode_utf16().chain(std::iter::once(0)).collect()
    }

    /// Allocates the next session identifier.
    fn nextSessionId(&self) -> PluginSdkIpcSessionId {
        PluginSdkIpcSessionId::new(format!(
            "plugin-sdk-windows-{}",
            self.nextSession.fetch_add(1, Ordering::Relaxed)
        ))
    }

    /// Locks carrier state.
    fn lock(&self) -> HostResult<std::sync::MutexGuard<'_, WindowsInner>> {
        self.inner.lock().map_err(|error| {
            HostError::new(format!("Plugin SDK Windows IPC lock poisoned: {error}"))
        })
    }

    /// Wraps a Windows pipe handle as a std File.
    fn fileFromHandle(handle: HANDLE) -> HostResult<File> {
        if handle == INVALID_HANDLE_VALUE {
            return Err(HostError::new("Plugin SDK named pipe handle is invalid"));
        }
        let owned = unsafe { OwnedHandle::from_raw_handle(handle as RawHandle) };
        Ok(File::from(owned))
    }

    /// Attaches one connected named-pipe File as a session.
    fn attachFile(
        &self,
        file: File,
        callbacks: PluginSdkIpcSessionCallbacks,
        listenerOwned: bool,
    ) -> HostResult<PluginSdkIpcSessionId> {
        let sessionId = self.nextSessionId();
        let reader = file
            .try_clone()
            .map_err(|error| HostError::new(error.to_string()))?;
        let writer = file
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

impl Default for WindowsPluginSdkIpcHost {
    /// Creates a Windows named-pipe Plugin SDK IPC carrier.
    fn default() -> Self {
        Self::new()
    }
}

impl PluginSdkIpcHost for WindowsPluginSdkIpcHost {
    /// Creates the named-pipe listener and accepts Plugin SDK clients.
    fn startListener(
        &self,
        endpoint: PluginSdkIpcEndpoint,
        callbacks: PluginSdkIpcSessionCallbacks,
    ) -> HostResult<()> {
        let pipeName = Self::pipeName(&endpoint);
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
            .name("operit-plugin-sdk-ipc-pipe-listen".to_string())
            .spawn(move || {
                let wide = WindowsPluginSdkIpcHost::wide(&pipeName);
                while !stop.load(Ordering::SeqCst) {
                    let handle = unsafe {
                        CreateNamedPipeW(
                            wide.as_ptr(),
                            PIPE_ACCESS_DUPLEX,
                            PIPE_TYPE_BYTE | PIPE_READMODE_BYTE | PIPE_WAIT,
                            PIPE_UNLIMITED_INSTANCES,
                            65536,
                            65536,
                            0,
                            std::ptr::null(),
                        )
                    };
                    if handle == INVALID_HANDLE_VALUE {
                        std::thread::sleep(std::time::Duration::from_millis(20));
                        continue;
                    }
                    let connected = unsafe { ConnectNamedPipe(handle, std::ptr::null_mut()) };
                    let lastError = unsafe { GetLastError() };
                    if connected == 0 && lastError != ERROR_PIPE_CONNECTED {
                        unsafe { CloseHandle(handle) };
                        continue;
                    }
                    let Ok(file) = WindowsPluginSdkIpcHost::fileFromHandle(handle) else {
                        continue;
                    };
                    let sessionId = PluginSdkIpcSessionId::new(format!(
                        "plugin-sdk-windows-{}",
                        nextSession.fetch_add(1, Ordering::Relaxed)
                    ));
                    let Ok(reader) = file.try_clone() else {
                        continue;
                    };
                    let Ok(writer) = file.try_clone() else {
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
            })
            .map_err(|error| HostError::new(error.to_string()))?;
        self.lock()?.listenerThread = Some(thread);
        Ok(())
    }

    /// Connects to the Operit named-pipe Plugin SDK listener.
    fn connect(
        &self,
        endpoint: PluginSdkIpcEndpoint,
        callbacks: PluginSdkIpcSessionCallbacks,
    ) -> HostResult<PluginSdkIpcSessionId> {
        let pipeName = Self::pipeName(&endpoint);
        let wide = Self::wide(&pipeName);
        let handle = unsafe {
            CreateFileW(
                wide.as_ptr(),
                GENERIC_READ | GENERIC_WRITE,
                FILE_SHARE_READ | FILE_SHARE_WRITE,
                std::ptr::null(),
                OPEN_EXISTING,
                FILE_ATTRIBUTE_NORMAL,
                std::ptr::null_mut(),
            )
        };
        let file = Self::fileFromHandle(handle)?;
        self.attachFile(file, callbacks, false)
    }

    /// Sends one framed payload on a named-pipe session.
    fn send(&self, sessionId: &PluginSdkIpcSessionId, bytes: Vec<u8>) -> HostResult<()> {
        let session = {
            let inner = self.lock()?;
            inner.sessions.get(&sessionId.0).cloned().ok_or_else(|| {
                HostError::new(format!("Plugin SDK IPC session is closed: {}", sessionId.0))
            })?
        };
        sendPluginSdkIpcStream(&session, bytes)
    }

    /// Closes one named-pipe Plugin SDK session.
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

    /// Stops the named-pipe listener and closes listener-owned sessions.
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
