// GENERATED FILE. Source: operit-proxy-scan.

import { OperitPluginSdkClient, OperitPluginSdkEvent, OperitPluginSdkPushSink } from './client.js';
import * as models from './models.js';

/** Generated client for Core object `application`. */
export class OperitApplicationClient {
  public constructor(private readonly client: OperitPluginSdkClient) {}
  /** Watches `pluginLoadingProgressFlow` through the Core Link route. */
  public pluginLoadingProgressFlow(args?: unknown): AsyncIterable<models.PluginLoadingProgress> { return this.client.watchTyped<models.PluginLoadingProgress>(0, 'pluginLoadingProgressFlow', args, (value) => models.decodePluginLoadingProgress(value)); }
}

/** Generated client for Core object `application.packageManager`. */
export class OperitApplicationPackageManagerClient {
  public constructor(private readonly client: OperitPluginSdkClient) {}
  /** Calls `activatePackage` through the Core Link route. */
  public activatePackage(args?: unknown): Promise<boolean> { return this.client.callTyped<boolean>(4, 'activatePackage', args, (value) => value as boolean); }
  /** Calls `isPackageActivated` through the Core Link route. */
  public isPackageActivated(args?: unknown): Promise<boolean> { return this.client.callTyped<boolean>(4, 'isPackageActivated', args, (value) => value as boolean); }
  /** Calls `usePackage` through the Core Link route. */
  public usePackage(args?: unknown): Promise<string> { return this.client.callTyped<string>(4, 'usePackage', args, (value) => value as string); }
  /** Calls `executeUsePackageTool` through the Core Link route. */
  public executeUsePackageTool(args?: unknown): Promise<models.ToolResult> { return this.client.callTyped<models.ToolResult>(4, 'executeUsePackageTool', args, (value) => models.decodeToolResult(value)); }
  /** Calls `getEnabledPackageNames` through the Core Link route. */
  public getEnabledPackageNames(args?: unknown): Promise<Array<string>> { return this.client.callTyped<Array<string>>(4, 'getEnabledPackageNames', args, (value) => (value as unknown[]).map((item) => item as string)); }
  /** Calls `isPackageEnabled` through the Core Link route. */
  public isPackageEnabled(args?: unknown): Promise<boolean> { return this.client.callTyped<boolean>(4, 'isPackageEnabled', args, (value) => value as boolean); }
  /** Calls `getActivePackageNames` through the Core Link route. */
  public getActivePackageNames(args?: unknown): Promise<Array<string>> { return this.client.callTyped<Array<string>>(4, 'getActivePackageNames', args, (value) => (value as unknown[]).map((item) => item as string)); }
  /** Calls `enablePackage` through the Core Link route. */
  public enablePackage(args?: unknown): Promise<string> { return this.client.callTyped<string>(4, 'enablePackage', args, (value) => value as string); }
  /** Calls `disablePackage` through the Core Link route. */
  public disablePackage(args?: unknown): Promise<string> { return this.client.callTyped<string>(4, 'disablePackage', args, (value) => value as string); }
  /** Calls `getToolPkgPluginContainerDetails` through the Core Link route. */
  public getToolPkgPluginContainerDetails(args?: unknown): Promise<Array<models.ToolPkgContainerDetails>> { return this.client.callTyped<Array<models.ToolPkgContainerDetails>>(4, 'getToolPkgPluginContainerDetails', args, (value) => (value as unknown[]).map((item) => models.decodeToolPkgContainerDetails(item))); }
  /** Calls `getToolPkgContainerRuntimes` through the Core Link route. */
  public getToolPkgContainerRuntimes(args?: unknown): Promise<Array<models.ToolPkgContainerRuntime>> { return this.client.callTyped<Array<models.ToolPkgContainerRuntime>>(4, 'getToolPkgContainerRuntimes', args, (value) => (value as unknown[]).map((item) => models.decodeToolPkgContainerRuntime(item))); }
  /** Calls `getToolPkgContainerDetails` through the Core Link route. */
  public getToolPkgContainerDetails(args?: unknown): Promise<models.ToolPkgContainerDetails | null> { return this.client.callTyped<models.ToolPkgContainerDetails | null>(4, 'getToolPkgContainerDetails', args, (value) => value == null ? null : models.decodeToolPkgContainerDetails(value)); }
  /** Calls `readToolPkgLogoBytes` through the Core Link route. */
  public readToolPkgLogoBytes(args?: unknown): Promise<models.ToolPkgLogoBytes | null> { return this.client.callTyped<models.ToolPkgLogoBytes | null>(4, 'readToolPkgLogoBytes', args, (value) => value == null ? null : models.decodeToolPkgLogoBytes(value)); }
  /** Calls `getEffectivePackageTools` through the Core Link route. */
  public getEffectivePackageTools(args?: unknown): Promise<models.ToolPackage | null> { return this.client.callTyped<models.ToolPackage | null>(4, 'getEffectivePackageTools', args, (value) => value == null ? null : models.decodeToolPackage(value)); }
  /** Calls `getPackageTools` through the Core Link route. */
  public getPackageTools(args?: unknown): Promise<models.ToolPackage | null> { return this.client.callTyped<models.ToolPackage | null>(4, 'getPackageTools', args, (value) => value == null ? null : models.decodeToolPackage(value)); }
  /** Calls `getAvailablePackages` through the Core Link route. */
  public getAvailablePackages(args?: unknown): Promise<Record<string, models.ToolPackage>> { return this.client.callTyped<Record<string, models.ToolPackage>>(4, 'getAvailablePackages', args, (value) => Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, models.decodeToolPackage(item)]))); }
}

