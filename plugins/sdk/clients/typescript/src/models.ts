// GENERATED FILE. Source: operit-proxy-scan.

export interface EnvVar {
  readonly name: string;
  readonly description: LocalizedText;
  readonly required: boolean;
  readonly default_value: string | null;
}

export function decodeEnvVar(value: unknown): EnvVar {
  const input = value as Record<string, unknown>;
  return {
    name: input['name'] as string,
    description: decodeLocalizedText(input['description']) as LocalizedText,
    required: input['required'] as boolean,
    default_value: input['default_value'] == null ? null : input['default_value'] as string | null,
  };
}

export interface LocalizedText {
  readonly values: Record<string, string>;
}

export function decodeLocalizedText(value: unknown): LocalizedText {
  const input = value as Record<string, unknown>;
  return {
    values: input['values'] as Record<string, string>,
  };
}

export interface PackageTool {
  readonly name: string;
  readonly description: LocalizedText;
  readonly parameters: Array<PackageToolParameter>;
  readonly script: string;
  readonly advice: boolean;
}

export function decodePackageTool(value: unknown): PackageTool {
  const input = value as Record<string, unknown>;
  return {
    name: input['name'] as string,
    description: decodeLocalizedText(input['description']) as LocalizedText,
    parameters: (input['parameters'] as unknown[]).map((item) => decodePackageToolParameter(item)) as Array<PackageToolParameter>,
    script: input['script'] as string,
    advice: input['advice'] as boolean,
  };
}

export interface PackageToolParameter {
  readonly name: string;
  readonly description: LocalizedText;
  readonly parameter_type: string;
  readonly required: boolean;
}

export function decodePackageToolParameter(value: unknown): PackageToolParameter {
  const input = value as Record<string, unknown>;
  return {
    name: input['name'] as string,
    description: decodeLocalizedText(input['description']) as LocalizedText,
    parameter_type: input['parameter_type'] as string,
    required: input['required'] as boolean,
  };
}

export interface ToolPackage {
  readonly name: string;
  readonly description: LocalizedText;
  readonly tools: Array<PackageTool>;
  readonly states: Array<ToolPackageState>;
  readonly env: Array<EnvVar>;
  readonly is_built_in: boolean;
  readonly enabled_by_default: boolean;
  readonly display_name: LocalizedText;
  readonly category: string;
  readonly author: Array<string>;
}

export function decodeToolPackage(value: unknown): ToolPackage {
  const input = value as Record<string, unknown>;
  return {
    name: input['name'] as string,
    description: decodeLocalizedText(input['description']) as LocalizedText,
    tools: (input['tools'] as unknown[]).map((item) => decodePackageTool(item)) as Array<PackageTool>,
    states: (input['states'] as unknown[]).map((item) => decodeToolPackageState(item)) as Array<ToolPackageState>,
    env: (input['env'] as unknown[]).map((item) => decodeEnvVar(item)) as Array<EnvVar>,
    is_built_in: input['is_built_in'] as boolean,
    enabled_by_default: input['enabled_by_default'] as boolean,
    display_name: decodeLocalizedText(input['display_name']) as LocalizedText,
    category: input['category'] as string,
    author: (input['author'] as unknown[]).map((item) => item) as Array<string>,
  };
}

export interface ToolPackageState {
  readonly id: string;
  readonly condition: string;
  readonly inherit_tools: boolean;
  readonly exclude_tools: Array<string>;
  readonly tools: Array<PackageTool>;
}

export function decodeToolPackageState(value: unknown): ToolPackageState {
  const input = value as Record<string, unknown>;
  return {
    id: input['id'] as string,
    condition: input['condition'] as string,
    inherit_tools: input['inherit_tools'] as boolean,
    exclude_tools: (input['exclude_tools'] as unknown[]).map((item) => item) as Array<string>,
    tools: (input['tools'] as unknown[]).map((item) => decodePackageTool(item)) as Array<PackageTool>,
  };
}

export interface ToolPkgContainerDetails {
  readonly packageName: string;
  readonly displayName: string;
  readonly description: string;
  readonly version: string;
  readonly apiVersion: string;
  readonly logoResourceKey: string | null;
  readonly logoMimeType: string | null;
  readonly author: Array<string>;
  readonly requires: Array<ToolPkgManifestRequirement>;
  readonly resourceCount: number;
  readonly workspaceTemplateCount: number;
  readonly uiModuleCount: number;
  readonly toolboxUiModules: Array<ToolPkgToolboxUiModule>;
  readonly subpackages: Array<ToolPkgSubpackageInfo>;
  readonly workspaceTemplates: Array<ToolPkgWorkspaceTemplate>;
}

export function decodeToolPkgContainerDetails(value: unknown): ToolPkgContainerDetails {
  const input = value as Record<string, unknown>;
  return {
    packageName: input['packageName'] as string,
    displayName: input['displayName'] as string,
    description: input['description'] as string,
    version: input['version'] as string,
    apiVersion: input['apiVersion'] as string,
    logoResourceKey: input['logoResourceKey'] == null ? null : input['logoResourceKey'] as string | null,
    logoMimeType: input['logoMimeType'] == null ? null : input['logoMimeType'] as string | null,
    author: (input['author'] as unknown[]).map((item) => item) as Array<string>,
    requires: (input['requires'] as unknown[]).map((item) => decodeToolPkgManifestRequirement(item)) as Array<ToolPkgManifestRequirement>,
    resourceCount: input['resourceCount'] as number,
    workspaceTemplateCount: input['workspaceTemplateCount'] as number,
    uiModuleCount: input['uiModuleCount'] as number,
    toolboxUiModules: (input['toolboxUiModules'] as unknown[]).map((item) => decodeToolPkgToolboxUiModule(item)) as Array<ToolPkgToolboxUiModule>,
    subpackages: (input['subpackages'] as unknown[]).map((item) => decodeToolPkgSubpackageInfo(item)) as Array<ToolPkgSubpackageInfo>,
    workspaceTemplates: (input['workspaceTemplates'] as unknown[]).map((item) => decodeToolPkgWorkspaceTemplate(item)) as Array<ToolPkgWorkspaceTemplate>,
  };
}

export interface ToolPkgLogoBytes {
  readonly resourceKey: string;
  readonly mimeType: string;
  readonly fileName: string;
  readonly bytes: Uint8Array;
}

export function decodeToolPkgLogoBytes(value: unknown): ToolPkgLogoBytes {
  const input = value as Record<string, unknown>;
  return {
    resourceKey: input['resourceKey'] as string,
    mimeType: input['mimeType'] as string,
    fileName: input['fileName'] as string,
    bytes: decodeUint8Array(input['bytes']) as Uint8Array,
  };
}

export interface ToolPkgSubpackageInfo {
  readonly packageName: string;
  readonly subpackageId: string;
  readonly displayName: string;
  readonly description: string;
  readonly enabledByDefault: boolean;
  readonly toolCount: number;
  readonly enabled: boolean;
}

export function decodeToolPkgSubpackageInfo(value: unknown): ToolPkgSubpackageInfo {
  const input = value as Record<string, unknown>;
  return {
    packageName: input['packageName'] as string,
    subpackageId: input['subpackageId'] as string,
    displayName: input['displayName'] as string,
    description: input['description'] as string,
    enabledByDefault: input['enabledByDefault'] as boolean,
    toolCount: input['toolCount'] as number,
    enabled: input['enabled'] as boolean,
  };
}

export interface ToolPkgToolboxUiModule {
  readonly containerPackageName: string;
  readonly toolPkgId: string;
  readonly routeId: string;
  readonly uiModuleId: string;
  readonly runtime: string;
  readonly screen: string;
  readonly title: string;
  readonly description: string;
  readonly moduleSpec: Record<string, unknown>;
  readonly keepAlive: boolean;
}

export function decodeToolPkgToolboxUiModule(value: unknown): ToolPkgToolboxUiModule {
  const input = value as Record<string, unknown>;
  return {
    containerPackageName: input['containerPackageName'] as string,
    toolPkgId: input['toolPkgId'] as string,
    routeId: input['routeId'] as string,
    uiModuleId: input['uiModuleId'] as string,
    runtime: input['runtime'] as string,
    screen: input['screen'] as string,
    title: input['title'] as string,
    description: input['description'] as string,
    moduleSpec: input['moduleSpec'] as Record<string, unknown>,
    keepAlive: input['keepAlive'] as boolean,
  };
}

export interface ToolPkgWorkspaceTemplate {
  readonly containerPackageName: string;
  readonly toolPkgId: string;
  readonly templateId: string;
  readonly displayName: string;
  readonly description: string;
  readonly resourceKey: string;
  readonly projectType: string;
}

export function decodeToolPkgWorkspaceTemplate(value: unknown): ToolPkgWorkspaceTemplate {
  const input = value as Record<string, unknown>;
  return {
    containerPackageName: input['containerPackageName'] as string,
    toolPkgId: input['toolPkgId'] as string,
    templateId: input['templateId'] as string,
    displayName: input['displayName'] as string,
    description: input['description'] as string,
    resourceKey: input['resourceKey'] as string,
    projectType: input['projectType'] as string,
  };
}

export interface ToolPkgAiProviderHandlerRuntime {
  readonly function: string;
  readonly functionSource: string | null;
}

export function decodeToolPkgAiProviderHandlerRuntime(value: unknown): ToolPkgAiProviderHandlerRuntime {
  const input = value as Record<string, unknown>;
  return {
    function: input['function'] as string,
    functionSource: input['functionSource'] == null ? null : input['functionSource'] as string | null,
  };
}

export interface ToolPkgAiProviderRuntime {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
  readonly listModelsHandler: ToolPkgAiProviderHandlerRuntime;
  readonly sendMessageHandler: ToolPkgAiProviderHandlerRuntime;
  readonly testConnectionHandler: ToolPkgAiProviderHandlerRuntime;
  readonly calculateInputTokensHandler: ToolPkgAiProviderHandlerRuntime;
}

export function decodeToolPkgAiProviderRuntime(value: unknown): ToolPkgAiProviderRuntime {
  const input = value as Record<string, unknown>;
  return {
    id: input['id'] as string,
    displayName: input['displayName'] as string,
    description: input['description'] as string,
    listModelsHandler: decodeToolPkgAiProviderHandlerRuntime(input['listModelsHandler']) as ToolPkgAiProviderHandlerRuntime,
    sendMessageHandler: decodeToolPkgAiProviderHandlerRuntime(input['sendMessageHandler']) as ToolPkgAiProviderHandlerRuntime,
    testConnectionHandler: decodeToolPkgAiProviderHandlerRuntime(input['testConnectionHandler']) as ToolPkgAiProviderHandlerRuntime,
    calculateInputTokensHandler: decodeToolPkgAiProviderHandlerRuntime(input['calculateInputTokensHandler']) as ToolPkgAiProviderHandlerRuntime,
  };
}

export interface ToolPkgAppLifecycleHookRuntime {
  readonly id: string;
  readonly event: string;
  readonly function: string;
  readonly functionSource: string | null;
}

export function decodeToolPkgAppLifecycleHookRuntime(value: unknown): ToolPkgAppLifecycleHookRuntime {
  const input = value as Record<string, unknown>;
  return {
    id: input['id'] as string,
    event: input['event'] as string,
    function: input['function'] as string,
    functionSource: input['functionSource'] == null ? null : input['functionSource'] as string | null,
  };
}

export interface ToolPkgChatMessageMenuDialogRuntime {
  readonly screen: string;
  readonly title: LocalizedText;
}

export function decodeToolPkgChatMessageMenuDialogRuntime(value: unknown): ToolPkgChatMessageMenuDialogRuntime {
  const input = value as Record<string, unknown>;
  return {
    screen: input['screen'] as string,
    title: decodeLocalizedText(input['title']) as LocalizedText,
  };
}

export interface ToolPkgChatMessageMenuItemRuntime {
  readonly id: string;
  readonly title: LocalizedText;
  readonly icon: string | null;
  readonly order: number;
  readonly senders: Array<string>;
  readonly function: string;
  readonly functionSource: string | null;
  readonly dialog: ToolPkgChatMessageMenuDialogRuntime | null;
}

export function decodeToolPkgChatMessageMenuItemRuntime(value: unknown): ToolPkgChatMessageMenuItemRuntime {
  const input = value as Record<string, unknown>;
  return {
    id: input['id'] as string,
    title: decodeLocalizedText(input['title']) as LocalizedText,
    icon: input['icon'] == null ? null : input['icon'] as string | null,
    order: input['order'] as number,
    senders: (input['senders'] as unknown[]).map((item) => item) as Array<string>,
    function: input['function'] as string,
    functionSource: input['functionSource'] == null ? null : input['functionSource'] as string | null,
    dialog: input['dialog'] == null ? null : decodeToolPkgChatMessageMenuDialogRuntime(input['dialog']) as ToolPkgChatMessageMenuDialogRuntime | null,
  };
}

export interface ToolPkgContainerRuntime {
  readonly packageName: string;
  readonly displayName: LocalizedText;
  readonly description: LocalizedText;
  readonly version: string;
  readonly apiVersion: string;
  readonly requires: Array<ToolPkgManifestRequirement>;
  readonly author: Array<string>;
  readonly mainEntry: string;
  readonly sourceType: ToolPkgSourceType;
  readonly sourcePath: string;
  readonly subpackages: Array<ToolPkgSubpackageRuntime>;
  readonly resources: Array<ToolPkgResourceRuntime>;
  readonly wasmModules: Array<ToolPkgWasmModuleRuntime>;
  readonly workflowTemplates: Array<ToolPkgWorkflowTemplateRuntime>;
  readonly workspaceTemplates: Array<ToolPkgWorkspaceTemplateRuntime>;
  readonly uiModules: Array<ToolPkgUiModuleRuntime>;
  readonly uiRoutes: Array<ToolPkgUiRouteRuntime>;
  readonly navigationEntries: Array<ToolPkgNavigationEntryRuntime>;
  readonly desktopWidgets: Array<ToolPkgDesktopWidgetRuntime>;
  readonly appLifecycleHooks: Array<ToolPkgAppLifecycleHookRuntime>;
  readonly messageProcessingPlugins: Array<ToolPkgFunctionHookRuntime>;
  readonly xmlRenderPlugins: Array<ToolPkgTagFunctionHookRuntime>;
  readonly inputMenuTogglePlugins: Array<ToolPkgFunctionHookRuntime>;
  readonly chatInputHooks: Array<ToolPkgFunctionHookRuntime>;
  readonly chatViewHooks: Array<ToolPkgFunctionHookRuntime>;
  readonly chatMessageHooks: Array<ToolPkgFunctionHookRuntime>;
  readonly chatMessageMenuItems: Array<ToolPkgChatMessageMenuItemRuntime>;
  readonly chatRuntimeHooks: Array<ToolPkgFunctionHookRuntime>;
  readonly hostEventHooks: Array<ToolPkgHostEventHookRuntime>;
  readonly toolLifecycleHooks: Array<ToolPkgFunctionHookRuntime>;
  readonly promptInputHooks: Array<ToolPkgFunctionHookRuntime>;
  readonly promptHistoryHooks: Array<ToolPkgFunctionHookRuntime>;
  readonly promptEstimateHistoryHooks: Array<ToolPkgFunctionHookRuntime>;
  readonly systemPromptComposeHooks: Array<ToolPkgFunctionHookRuntime>;
  readonly toolPromptComposeHooks: Array<ToolPkgFunctionHookRuntime>;
  readonly promptFinalizeHooks: Array<ToolPkgFunctionHookRuntime>;
  readonly promptEstimateFinalizeHooks: Array<ToolPkgFunctionHookRuntime>;
  readonly summaryGenerateHooks: Array<ToolPkgFunctionHookRuntime>;
  readonly aiProviders: Array<ToolPkgAiProviderRuntime>;
  readonly logoResource: ToolPkgResourceRuntime | null;
  readonly marketOrigin: ToolPkgMarketOrigin | null;
}

export function decodeToolPkgContainerRuntime(value: unknown): ToolPkgContainerRuntime {
  const input = value as Record<string, unknown>;
  return {
    packageName: input['packageName'] as string,
    displayName: decodeLocalizedText(input['displayName']) as LocalizedText,
    description: decodeLocalizedText(input['description']) as LocalizedText,
    version: input['version'] as string,
    apiVersion: input['apiVersion'] as string,
    requires: (input['requires'] as unknown[]).map((item) => decodeToolPkgManifestRequirement(item)) as Array<ToolPkgManifestRequirement>,
    author: (input['author'] as unknown[]).map((item) => item) as Array<string>,
    mainEntry: input['mainEntry'] as string,
    sourceType: decodeToolPkgSourceType(input['sourceType']) as ToolPkgSourceType,
    sourcePath: input['sourcePath'] as string,
    subpackages: (input['subpackages'] as unknown[]).map((item) => decodeToolPkgSubpackageRuntime(item)) as Array<ToolPkgSubpackageRuntime>,
    resources: (input['resources'] as unknown[]).map((item) => decodeToolPkgResourceRuntime(item)) as Array<ToolPkgResourceRuntime>,
    wasmModules: (input['wasmModules'] as unknown[]).map((item) => decodeToolPkgWasmModuleRuntime(item)) as Array<ToolPkgWasmModuleRuntime>,
    workflowTemplates: (input['workflowTemplates'] as unknown[]).map((item) => decodeToolPkgWorkflowTemplateRuntime(item)) as Array<ToolPkgWorkflowTemplateRuntime>,
    workspaceTemplates: (input['workspaceTemplates'] as unknown[]).map((item) => decodeToolPkgWorkspaceTemplateRuntime(item)) as Array<ToolPkgWorkspaceTemplateRuntime>,
    uiModules: (input['uiModules'] as unknown[]).map((item) => decodeToolPkgUiModuleRuntime(item)) as Array<ToolPkgUiModuleRuntime>,
    uiRoutes: (input['uiRoutes'] as unknown[]).map((item) => decodeToolPkgUiRouteRuntime(item)) as Array<ToolPkgUiRouteRuntime>,
    navigationEntries: (input['navigationEntries'] as unknown[]).map((item) => decodeToolPkgNavigationEntryRuntime(item)) as Array<ToolPkgNavigationEntryRuntime>,
    desktopWidgets: (input['desktopWidgets'] as unknown[]).map((item) => decodeToolPkgDesktopWidgetRuntime(item)) as Array<ToolPkgDesktopWidgetRuntime>,
    appLifecycleHooks: (input['appLifecycleHooks'] as unknown[]).map((item) => decodeToolPkgAppLifecycleHookRuntime(item)) as Array<ToolPkgAppLifecycleHookRuntime>,
    messageProcessingPlugins: (input['messageProcessingPlugins'] as unknown[]).map((item) => decodeToolPkgFunctionHookRuntime(item)) as Array<ToolPkgFunctionHookRuntime>,
    xmlRenderPlugins: (input['xmlRenderPlugins'] as unknown[]).map((item) => decodeToolPkgTagFunctionHookRuntime(item)) as Array<ToolPkgTagFunctionHookRuntime>,
    inputMenuTogglePlugins: (input['inputMenuTogglePlugins'] as unknown[]).map((item) => decodeToolPkgFunctionHookRuntime(item)) as Array<ToolPkgFunctionHookRuntime>,
    chatInputHooks: (input['chatInputHooks'] as unknown[]).map((item) => decodeToolPkgFunctionHookRuntime(item)) as Array<ToolPkgFunctionHookRuntime>,
    chatViewHooks: (input['chatViewHooks'] as unknown[]).map((item) => decodeToolPkgFunctionHookRuntime(item)) as Array<ToolPkgFunctionHookRuntime>,
    chatMessageHooks: (input['chatMessageHooks'] as unknown[]).map((item) => decodeToolPkgFunctionHookRuntime(item)) as Array<ToolPkgFunctionHookRuntime>,
    chatMessageMenuItems: (input['chatMessageMenuItems'] as unknown[]).map((item) => decodeToolPkgChatMessageMenuItemRuntime(item)) as Array<ToolPkgChatMessageMenuItemRuntime>,
    chatRuntimeHooks: (input['chatRuntimeHooks'] as unknown[]).map((item) => decodeToolPkgFunctionHookRuntime(item)) as Array<ToolPkgFunctionHookRuntime>,
    hostEventHooks: (input['hostEventHooks'] as unknown[]).map((item) => decodeToolPkgHostEventHookRuntime(item)) as Array<ToolPkgHostEventHookRuntime>,
    toolLifecycleHooks: (input['toolLifecycleHooks'] as unknown[]).map((item) => decodeToolPkgFunctionHookRuntime(item)) as Array<ToolPkgFunctionHookRuntime>,
    promptInputHooks: (input['promptInputHooks'] as unknown[]).map((item) => decodeToolPkgFunctionHookRuntime(item)) as Array<ToolPkgFunctionHookRuntime>,
    promptHistoryHooks: (input['promptHistoryHooks'] as unknown[]).map((item) => decodeToolPkgFunctionHookRuntime(item)) as Array<ToolPkgFunctionHookRuntime>,
    promptEstimateHistoryHooks: (input['promptEstimateHistoryHooks'] as unknown[]).map((item) => decodeToolPkgFunctionHookRuntime(item)) as Array<ToolPkgFunctionHookRuntime>,
    systemPromptComposeHooks: (input['systemPromptComposeHooks'] as unknown[]).map((item) => decodeToolPkgFunctionHookRuntime(item)) as Array<ToolPkgFunctionHookRuntime>,
    toolPromptComposeHooks: (input['toolPromptComposeHooks'] as unknown[]).map((item) => decodeToolPkgFunctionHookRuntime(item)) as Array<ToolPkgFunctionHookRuntime>,
    promptFinalizeHooks: (input['promptFinalizeHooks'] as unknown[]).map((item) => decodeToolPkgFunctionHookRuntime(item)) as Array<ToolPkgFunctionHookRuntime>,
    promptEstimateFinalizeHooks: (input['promptEstimateFinalizeHooks'] as unknown[]).map((item) => decodeToolPkgFunctionHookRuntime(item)) as Array<ToolPkgFunctionHookRuntime>,
    summaryGenerateHooks: (input['summaryGenerateHooks'] as unknown[]).map((item) => decodeToolPkgFunctionHookRuntime(item)) as Array<ToolPkgFunctionHookRuntime>,
    aiProviders: (input['aiProviders'] as unknown[]).map((item) => decodeToolPkgAiProviderRuntime(item)) as Array<ToolPkgAiProviderRuntime>,
    logoResource: input['logoResource'] == null ? null : decodeToolPkgResourceRuntime(input['logoResource']) as ToolPkgResourceRuntime | null,
    marketOrigin: input['marketOrigin'] == null ? null : decodeToolPkgMarketOrigin(input['marketOrigin']) as ToolPkgMarketOrigin | null,
  };
}

export interface ToolPkgDesktopWidgetRuntime {
  readonly id: string;
  readonly routeId: string;
  readonly renderRouteId: string;
  readonly title: LocalizedText;
  readonly subtitle: LocalizedText;
  readonly description: LocalizedText;
  readonly icon: string | null;
  readonly order: number;
}

export function decodeToolPkgDesktopWidgetRuntime(value: unknown): ToolPkgDesktopWidgetRuntime {
  const input = value as Record<string, unknown>;
  return {
    id: input['id'] as string,
    routeId: input['routeId'] as string,
    renderRouteId: input['renderRouteId'] as string,
    title: decodeLocalizedText(input['title']) as LocalizedText,
    subtitle: decodeLocalizedText(input['subtitle']) as LocalizedText,
    description: decodeLocalizedText(input['description']) as LocalizedText,
    icon: input['icon'] == null ? null : input['icon'] as string | null,
    order: input['order'] as number,
  };
}

export interface ToolPkgFunctionHookRuntime {
  readonly id: string;
  readonly function: string;
  readonly functionSource: string | null;
}

export function decodeToolPkgFunctionHookRuntime(value: unknown): ToolPkgFunctionHookRuntime {
  const input = value as Record<string, unknown>;
  return {
    id: input['id'] as string,
    function: input['function'] as string,
    functionSource: input['functionSource'] == null ? null : input['functionSource'] as string | null,
  };
}

export interface ToolPkgHostEventHookRuntime {
  readonly id: string;
  readonly source: string;
  readonly trigger: unknown;
  readonly function: string;
  readonly functionSource: string | null;
  readonly enabled: boolean;
}

export function decodeToolPkgHostEventHookRuntime(value: unknown): ToolPkgHostEventHookRuntime {
  const input = value as Record<string, unknown>;
  return {
    id: input['id'] as string,
    source: input['source'] as string,
    trigger: input['trigger'] as unknown,
    function: input['function'] as string,
    functionSource: input['functionSource'] == null ? null : input['functionSource'] as string | null,
    enabled: input['enabled'] as boolean,
  };
}

export interface ToolPkgManifestRequirement {
  readonly id: string;
  readonly description: string;
  readonly minVersion: string | null;
  readonly maxVersion: string | null;
}

export function decodeToolPkgManifestRequirement(value: unknown): ToolPkgManifestRequirement {
  const input = value as Record<string, unknown>;
  return {
    id: input['id'] as string,
    description: input['description'] as string,
    minVersion: input['min_version'] == null ? null : input['min_version'] as string | null,
    maxVersion: input['max_version'] == null ? null : input['max_version'] as string | null,
  };
}

export interface ToolPkgMarketOrigin {
  readonly market: string;
  readonly toolpkgId: string;
  readonly version: string;
  readonly author: Array<string>;
}

export function decodeToolPkgMarketOrigin(value: unknown): ToolPkgMarketOrigin {
  const input = value as Record<string, unknown>;
  return {
    market: input['market'] as string,
    toolpkgId: input['toolpkgId'] as string,
    version: input['version'] as string,
    author: (input['author'] as unknown[]).map((item) => item) as Array<string>,
  };
}

export interface ToolPkgNavigationActionHookRuntime {
  readonly function: string;
  readonly functionSource: string | null;
}

export function decodeToolPkgNavigationActionHookRuntime(value: unknown): ToolPkgNavigationActionHookRuntime {
  const input = value as Record<string, unknown>;
  return {
    function: input['function'] as string,
    functionSource: input['functionSource'] == null ? null : input['functionSource'] as string | null,
  };
}

export interface ToolPkgNavigationEntryRuntime {
  readonly id: string;
  readonly routeId: string;
  readonly surface: string;
  readonly title: LocalizedText;
  readonly action: ToolPkgNavigationActionHookRuntime | null;
  readonly icon: string | null;
  readonly order: number;
}

export function decodeToolPkgNavigationEntryRuntime(value: unknown): ToolPkgNavigationEntryRuntime {
  const input = value as Record<string, unknown>;
  return {
    id: input['id'] as string,
    routeId: input['routeId'] as string,
    surface: input['surface'] as string,
    title: decodeLocalizedText(input['title']) as LocalizedText,
    action: input['action'] == null ? null : decodeToolPkgNavigationActionHookRuntime(input['action']) as ToolPkgNavigationActionHookRuntime | null,
    icon: input['icon'] == null ? null : input['icon'] as string | null,
    order: input['order'] as number,
  };
}

export interface ToolPkgResourceRuntime {
  readonly key: string;
  readonly path: string;
  readonly mime: string;
}

export function decodeToolPkgResourceRuntime(value: unknown): ToolPkgResourceRuntime {
  const input = value as Record<string, unknown>;
  return {
    key: input['key'] as string,
    path: input['path'] as string,
    mime: input['mime'] as string,
  };
}

export type ToolPkgSourceType = 'ASSET' | 'MARKET' | 'EXTERNAL';
export function decodeToolPkgSourceType(value: unknown): ToolPkgSourceType { return value as ToolPkgSourceType; }

export interface ToolPkgSubpackageRuntime {
  readonly packageName: string;
  readonly containerPackageName: string;
  readonly subpackageId: string;
  readonly entryPath: string;
  readonly displayName: LocalizedText;
  readonly description: LocalizedText;
  readonly enabledByDefault: boolean;
  readonly toolCount: number;
}

export function decodeToolPkgSubpackageRuntime(value: unknown): ToolPkgSubpackageRuntime {
  const input = value as Record<string, unknown>;
  return {
    packageName: input['packageName'] as string,
    containerPackageName: input['containerPackageName'] as string,
    subpackageId: input['subpackageId'] as string,
    entryPath: input['entryPath'] as string,
    displayName: decodeLocalizedText(input['displayName']) as LocalizedText,
    description: decodeLocalizedText(input['description']) as LocalizedText,
    enabledByDefault: input['enabledByDefault'] as boolean,
    toolCount: input['toolCount'] as number,
  };
}

export interface ToolPkgTagFunctionHookRuntime {
  readonly id: string;
  readonly tag: string;
  readonly function: string;
  readonly functionSource: string | null;
}

export function decodeToolPkgTagFunctionHookRuntime(value: unknown): ToolPkgTagFunctionHookRuntime {
  const input = value as Record<string, unknown>;
  return {
    id: input['id'] as string,
    tag: input['tag'] as string,
    function: input['function'] as string,
    functionSource: input['functionSource'] == null ? null : input['functionSource'] as string | null,
  };
}

export interface ToolPkgUiModuleRuntime {
  readonly id: string;
  readonly runtime: string;
  readonly screen: string;
  readonly title: LocalizedText;
  readonly keepAlive: boolean;
}

export function decodeToolPkgUiModuleRuntime(value: unknown): ToolPkgUiModuleRuntime {
  const input = value as Record<string, unknown>;
  return {
    id: input['id'] as string,
    runtime: input['runtime'] as string,
    screen: input['screen'] as string,
    title: decodeLocalizedText(input['title']) as LocalizedText,
    keepAlive: input['keepAlive'] as boolean,
  };
}

export interface ToolPkgUiRouteRuntime {
  readonly id: string;
  readonly routeId: string;
  readonly runtime: string;
  readonly screen: string;
  readonly title: LocalizedText;
  readonly keepAlive: boolean;
}

export function decodeToolPkgUiRouteRuntime(value: unknown): ToolPkgUiRouteRuntime {
  const input = value as Record<string, unknown>;
  return {
    id: input['id'] as string,
    routeId: input['routeId'] as string,
    runtime: input['runtime'] as string,
    screen: input['screen'] as string,
    title: decodeLocalizedText(input['title']) as LocalizedText,
    keepAlive: input['keepAlive'] as boolean,
  };
}

export interface ToolPkgWasmModuleRuntime {
  readonly id: string;
  readonly path: string;
  readonly exports: Array<string>;
  readonly sourceLanguage: string;
  readonly abi: string;
}

export function decodeToolPkgWasmModuleRuntime(value: unknown): ToolPkgWasmModuleRuntime {
  const input = value as Record<string, unknown>;
  return {
    id: input['id'] as string,
    path: input['path'] as string,
    exports: (input['exports'] as unknown[]).map((item) => item) as Array<string>,
    sourceLanguage: input['sourceLanguage'] as string,
    abi: input['abi'] as string,
  };
}

export interface ToolPkgWorkflowTemplateRuntime {
  readonly id: string;
  readonly display_name: LocalizedText;
  readonly description: LocalizedText;
  readonly resource_key: string;
}

export function decodeToolPkgWorkflowTemplateRuntime(value: unknown): ToolPkgWorkflowTemplateRuntime {
  const input = value as Record<string, unknown>;
  return {
    id: input['id'] as string,
    display_name: decodeLocalizedText(input['display_name']) as LocalizedText,
    description: decodeLocalizedText(input['description']) as LocalizedText,
    resource_key: input['resource_key'] as string,
  };
}

export interface ToolPkgWorkspaceTemplateRuntime {
  readonly id: string;
  readonly display_name: LocalizedText;
  readonly description: LocalizedText;
  readonly resource_key: string;
  readonly project_type: string;
}

export function decodeToolPkgWorkspaceTemplateRuntime(value: unknown): ToolPkgWorkspaceTemplateRuntime {
  const input = value as Record<string, unknown>;
  return {
    id: input['id'] as string,
    display_name: decodeLocalizedText(input['display_name']) as LocalizedText,
    description: decodeLocalizedText(input['description']) as LocalizedText,
    resource_key: input['resource_key'] as string,
    project_type: input['project_type'] as string,
  };
}

export interface ToolResult {
  readonly toolName: string;
  readonly success: boolean;
  readonly result: unknown;
  readonly error: string | null;
}

export function decodeToolResult(value: unknown): ToolResult {
  const input = value as Record<string, unknown>;
  return {
    toolName: input['toolName'] as string,
    success: input['success'] as boolean,
    result: input['result'] as unknown,
    error: input['error'] == null ? null : input['error'] as string | null,
  };
}

export interface PluginLoadingItem {
  readonly id: string;
  readonly displayName: string;
  readonly kind: string;
  readonly status: string;
  readonly message: string;
  readonly logText: string;
}

export function decodePluginLoadingItem(value: unknown): PluginLoadingItem {
  const input = value as Record<string, unknown>;
  return {
    id: input['id'] as string,
    displayName: input['displayName'] as string,
    kind: input['kind'] as string,
    status: input['status'] as string,
    message: input['message'] as string,
    logText: input['logText'] as string,
  };
}

export interface PluginLoadingProgress {
  readonly visible: boolean;
  readonly forceExpanded: boolean;
  readonly progress: number;
  readonly phase: string;
  readonly currentTask: string;
  readonly pluginsStarted: number;
  readonly pluginsTotal: number;
  readonly plugins: Array<PluginLoadingItem>;
}

export function decodePluginLoadingProgress(value: unknown): PluginLoadingProgress {
  const input = value as Record<string, unknown>;
  return {
    visible: input['visible'] as boolean,
    forceExpanded: input['forceExpanded'] as boolean,
    progress: input['progress'] as number,
    phase: input['phase'] as string,
    currentTask: input['currentTask'] as string,
    pluginsStarted: input['pluginsStarted'] as number,
    pluginsTotal: input['pluginsTotal'] as number,
    plugins: (input['plugins'] as unknown[]).map((item) => decodePluginLoadingItem(item)) as Array<PluginLoadingItem>,
  };
}

