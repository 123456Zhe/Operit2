# Operit Plugin SDK clients

The clients in this directory are generated from the same `operit-proxy-scan`
model used by the Core Rust and Flutter proxies. Generation is driven only by
methods explicitly marked for the external SDK in their source route
annotation. Each generated object client forwards the existing Link `call`,
`watch`, and `push` primitives through the Plugin SDK IPC session. The IPC
server enforces the same generated route allowlist; the client has no tool
catalog, discovery API, or user-provided transport contract.

The generated artifacts are refreshed by the `operit-proxy-local` build script:

- `clients/rust/src/generated.rs`
- `clients/dart/lib/src/generated.dart`
- `clients/kotlin/src/main/kotlin/OperitPluginSdkGenerated.kt`
- `clients/typescript/src/generated.ts`
