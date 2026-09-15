// GENERATED FILE. Source: operit-proxy-scan.

import 'client.dart';
import 'models.dart';

/// Generated client for Core object `application`.
final class OperitApplicationClient {
  const OperitApplicationClient(this._client);
  final OperitPluginSdkClient _client;
  /// Watches `pluginLoadingProgressFlow` through the Core Link route.
  Stream<PluginLoadingProgress> pluginLoadingProgressFlow([Object? args]) => _client.watchTyped<PluginLoadingProgress>(0, 'pluginLoadingProgressFlow', args, (value) => PluginLoadingProgress.fromMessagePackValue(value as Map<String, Object?>));
}

/// Generated client for Core object `application.packageManager`.
final class OperitApplicationPackageManagerClient {
  const OperitApplicationPackageManagerClient(this._client);
  final OperitPluginSdkClient _client;
  /// Calls `activatePackage` through the Core Link route.
  Future<bool> activatePackage([Object? args]) async { return await _client.callTyped<bool>(4, 'activatePackage', args, (value) => value as bool); }
  /// Calls `isPackageActivated` through the Core Link route.
  Future<bool> isPackageActivated([Object? args]) async { return await _client.callTyped<bool>(4, 'isPackageActivated', args, (value) => value as bool); }
  /// Calls `usePackage` through the Core Link route.
  Future<String> usePackage([Object? args]) async { return await _client.callTyped<String>(4, 'usePackage', args, (value) => value as String); }
  /// Calls `executeUsePackageTool` through the Core Link route.
  Future<ToolResult> executeUsePackageTool([Object? args]) async { return await _client.callTyped<ToolResult>(4, 'executeUsePackageTool', args, (value) => ToolResult.fromMessagePackValue(value as Map<String, Object?>)); }
  /// Calls `getEnabledPackageNames` through the Core Link route.
  Future<List<String>> getEnabledPackageNames([Object? args]) async { return await _client.callTyped<List<String>>(4, 'getEnabledPackageNames', args, (value) => (value as List<Object?>).map((item) => item as String).toList(growable: false)); }
  /// Calls `isPackageEnabled` through the Core Link route.
  Future<bool> isPackageEnabled([Object? args]) async { return await _client.callTyped<bool>(4, 'isPackageEnabled', args, (value) => value as bool); }
  /// Calls `getActivePackageNames` through the Core Link route.
  Future<List<String>> getActivePackageNames([Object? args]) async { return await _client.callTyped<List<String>>(4, 'getActivePackageNames', args, (value) => (value as List<Object?>).map((item) => item as String).toList(growable: false)); }
  /// Calls `enablePackage` through the Core Link route.
  Future<String> enablePackage([Object? args]) async { return await _client.callTyped<String>(4, 'enablePackage', args, (value) => value as String); }
  /// Calls `disablePackage` through the Core Link route.
  Future<String> disablePackage([Object? args]) async { return await _client.callTyped<String>(4, 'disablePackage', args, (value) => value as String); }
  /// Calls `getToolPkgPluginContainerDetails` through the Core Link route.
  Future<List<ToolPkgContainerDetails>> getToolPkgPluginContainerDetails([Object? args]) async { return await _client.callTyped<List<ToolPkgContainerDetails>>(4, 'getToolPkgPluginContainerDetails', args, (value) => (value as List<Object?>).map((item) => ToolPkgContainerDetails.fromMessagePackValue(item as Map<String, Object?>)).toList(growable: false)); }
  /// Calls `getToolPkgContainerRuntimes` through the Core Link route.
  Future<List<ToolPkgContainerRuntime>> getToolPkgContainerRuntimes([Object? args]) async { return await _client.callTyped<List<ToolPkgContainerRuntime>>(4, 'getToolPkgContainerRuntimes', args, (value) => (value as List<Object?>).map((item) => ToolPkgContainerRuntime.fromMessagePackValue(item as Map<String, Object?>)).toList(growable: false)); }
  /// Calls `getToolPkgContainerDetails` through the Core Link route.
  Future<ToolPkgContainerDetails?> getToolPkgContainerDetails([Object? args]) async { return await _client.callTyped<ToolPkgContainerDetails?>(4, 'getToolPkgContainerDetails', args, (value) => value == null ? null : ToolPkgContainerDetails.fromMessagePackValue(value as Map<String, Object?>)); }
  /// Calls `readToolPkgLogoBytes` through the Core Link route.
  Future<ToolPkgLogoBytes?> readToolPkgLogoBytes([Object? args]) async { return await _client.callTyped<ToolPkgLogoBytes?>(4, 'readToolPkgLogoBytes', args, (value) => value == null ? null : ToolPkgLogoBytes.fromMessagePackValue(value as Map<String, Object?>)); }
  /// Calls `getEffectivePackageTools` through the Core Link route.
  Future<ToolPackage?> getEffectivePackageTools([Object? args]) async { return await _client.callTyped<ToolPackage?>(4, 'getEffectivePackageTools', args, (value) => value == null ? null : ToolPackage.fromMessagePackValue(value as Map<String, Object?>)); }
  /// Calls `getPackageTools` through the Core Link route.
  Future<ToolPackage?> getPackageTools([Object? args]) async { return await _client.callTyped<ToolPackage?>(4, 'getPackageTools', args, (value) => value == null ? null : ToolPackage.fromMessagePackValue(value as Map<String, Object?>)); }
  /// Calls `getAvailablePackages` through the Core Link route.
  Future<Map<String, ToolPackage>> getAvailablePackages([Object? args]) async { return await _client.callTyped<Map<String, ToolPackage>>(4, 'getAvailablePackages', args, (value) => (value as Map).map((key, item) => MapEntry(key as String, ToolPackage.fromMessagePackValue(item as Map<String, Object?>)))); }
}

