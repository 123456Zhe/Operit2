# Operit Plugin SDK

This client is generated from the canonical Core proxy scan. Its public object
clients send existing `call`, `watch`, and `push` Link requests through the
built-in framed IPC connection. Application code supplies values and invokes
the generated methods; it does not implement a Plugin SDK transport.

Run the package-manager example with:

```shell
dart run example/package_manager.dart
```

The example reads loading progress, package metadata, and a package logo. The
tool invocation section is commented until a real package and tool name are
selected by the integrating application.
