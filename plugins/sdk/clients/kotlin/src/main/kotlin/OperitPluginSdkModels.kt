// GENERATED FILE. Source: operit-proxy-scan.

package operit.plugin.sdk

fun decodeBoolean(value: Any?): Boolean = value as Boolean
fun decodeString(value: Any?): String = value as String
fun decodeInt(value: Any?): Int = (value as Number).toInt()
fun decodeDouble(value: Any?): Double = (value as Number).toDouble()
fun decodeUnit(value: Any?): Unit = Unit

fun decodeListString(value: Any?): List<String> = (value as List<*>).map { decodeString(it) }
fun decodeListToolPkgContainerDetails(value: Any?): List<ToolPkgContainerDetails> = (value as List<*>).map { decodeToolPkgContainerDetails(it) }
fun decodeListToolPkgContainerRuntime(value: Any?): List<ToolPkgContainerRuntime> = (value as List<*>).map { decodeToolPkgContainerRuntime(it) }
fun decodeMapStringToolPackage(value: Any?): Map<String, ToolPackage> = value as Map<String, ToolPackage>
fun decodeNullableToolPackage(value: Any?): ToolPackage? = value?.let { decodeToolPackage(it) }
fun decodeNullableToolPkgContainerDetails(value: Any?): ToolPkgContainerDetails? = value?.let { decodeToolPkgContainerDetails(it) }
fun decodeNullableToolPkgLogoBytes(value: Any?): ToolPkgLogoBytes? = value?.let { decodeToolPkgLogoBytes(it) }

data class EnvVar(
    val name: String,
    val description: LocalizedText,
    val required: Boolean,
    val default_value: String?
)

fun decodeEnvVar(value: Any?): EnvVar {
    val input = value as Map<*, *>
    return EnvVar(
        name = input["name"] as String as String,
        description = decodeLocalizedText(input["description"]) as LocalizedText,
        required = input["required"] as Boolean as Boolean,
        default_value = input["default_value"]?.let { it as String } as String?,
    )
}

data class LocalizedText(
    val values: Map<String, String>
)

fun decodeLocalizedText(value: Any?): LocalizedText {
    val input = value as Map<*, *>
    return LocalizedText(
        values = decodeMapStringString(input["values"]) as Map<String, String>,
    )
}

data class PackageTool(
    val name: String,
    val description: LocalizedText,
    val parameters: List<PackageToolParameter>,
    val script: String,
    val advice: Boolean
)

fun decodePackageTool(value: Any?): PackageTool {
    val input = value as Map<*, *>
    return PackageTool(
        name = input["name"] as String as String,
        description = decodeLocalizedText(input["description"]) as LocalizedText,
        parameters = decodeListPackageToolParameter(input["parameters"]) as List<PackageToolParameter>,
        script = input["script"] as String as String,
        advice = input["advice"] as Boolean as Boolean,
    )
}

data class PackageToolParameter(
    val name: String,
    val description: LocalizedText,
    val parameter_type: String,
    val required: Boolean
)

fun decodePackageToolParameter(value: Any?): PackageToolParameter {
    val input = value as Map<*, *>
    return PackageToolParameter(
        name = input["name"] as String as String,
        description = decodeLocalizedText(input["description"]) as LocalizedText,
        parameter_type = input["parameter_type"] as String as String,
        required = input["required"] as Boolean as Boolean,
    )
}

data class ToolPackage(
    val name: String,
    val description: LocalizedText,
    val tools: List<PackageTool>,
    val states: List<ToolPackageState>,
    val env: List<EnvVar>,
    val is_built_in: Boolean,
    val enabled_by_default: Boolean,
    val display_name: LocalizedText,
    val category: String,
    val author: List<String>
)

fun decodeToolPackage(value: Any?): ToolPackage {
    val input = value as Map<*, *>
    return ToolPackage(
        name = input["name"] as String as String,
        description = decodeLocalizedText(input["description"]) as LocalizedText,
        tools = decodeListPackageTool(input["tools"]) as List<PackageTool>,
        states = decodeListToolPackageState(input["states"]) as List<ToolPackageState>,
        env = decodeListEnvVar(input["env"]) as List<EnvVar>,
        is_built_in = input["is_built_in"] as Boolean as Boolean,
        enabled_by_default = input["enabled_by_default"] as Boolean as Boolean,
        display_name = decodeLocalizedText(input["display_name"]) as LocalizedText,
        category = input["category"] as String as String,
        author = decodeListString(input["author"]) as List<String>,
    )
}

data class ToolPackageState(
    val id: String,
    val condition: String,
    val inherit_tools: Boolean,
    val exclude_tools: List<String>,
    val tools: List<PackageTool>
)

fun decodeToolPackageState(value: Any?): ToolPackageState {
    val input = value as Map<*, *>
    return ToolPackageState(
        id = input["id"] as String as String,
        condition = input["condition"] as String as String,
        inherit_tools = input["inherit_tools"] as Boolean as Boolean,
        exclude_tools = decodeListString(input["exclude_tools"]) as List<String>,
        tools = decodeListPackageTool(input["tools"]) as List<PackageTool>,
    )
}

data class ToolPkgContainerDetails(
    val packageName: String,
    val displayName: String,
    val description: String,
    val version: String,
    val apiVersion: String,
    val logoResourceKey: String?,
    val logoMimeType: String?,
    val author: List<String>,
    val requires: List<ToolPkgManifestRequirement>,
    val resourceCount: Int,
    val workspaceTemplateCount: Int,
    val uiModuleCount: Int,
    val toolboxUiModules: List<ToolPkgToolboxUiModule>,
    val subpackages: List<ToolPkgSubpackageInfo>,
    val workspaceTemplates: List<ToolPkgWorkspaceTemplate>
)

fun decodeToolPkgContainerDetails(value: Any?): ToolPkgContainerDetails {
    val input = value as Map<*, *>
    return ToolPkgContainerDetails(
        packageName = input["packageName"] as String as String,
        displayName = input["displayName"] as String as String,
        description = input["description"] as String as String,
        version = input["version"] as String as String,
        apiVersion = input["apiVersion"] as String as String,
        logoResourceKey = input["logoResourceKey"]?.let { it as String } as String?,
        logoMimeType = input["logoMimeType"]?.let { it as String } as String?,
        author = decodeListString(input["author"]) as List<String>,
        requires = decodeListToolPkgManifestRequirement(input["requires"]) as List<ToolPkgManifestRequirement>,
        resourceCount = input["resourceCount"] as Int as Int,
        workspaceTemplateCount = input["workspaceTemplateCount"] as Int as Int,
        uiModuleCount = input["uiModuleCount"] as Int as Int,
        toolboxUiModules = decodeListToolPkgToolboxUiModule(input["toolboxUiModules"]) as List<ToolPkgToolboxUiModule>,
        subpackages = decodeListToolPkgSubpackageInfo(input["subpackages"]) as List<ToolPkgSubpackageInfo>,
        workspaceTemplates = decodeListToolPkgWorkspaceTemplate(input["workspaceTemplates"]) as List<ToolPkgWorkspaceTemplate>,
    )
}

data class ToolPkgLogoBytes(
    val resourceKey: String,
    val mimeType: String,
    val fileName: String,
    val bytes: ByteArray
)

fun decodeToolPkgLogoBytes(value: Any?): ToolPkgLogoBytes {
    val input = value as Map<*, *>
    return ToolPkgLogoBytes(
        resourceKey = input["resourceKey"] as String as String,
        mimeType = input["mimeType"] as String as String,
        fileName = input["fileName"] as String as String,
        bytes = decodeByteArray(input["bytes"]) as ByteArray,
    )
}

data class ToolPkgSubpackageInfo(
    val packageName: String,
    val subpackageId: String,
    val displayName: String,
    val description: String,
    val enabledByDefault: Boolean,
    val toolCount: Int,
    val enabled: Boolean
)

fun decodeToolPkgSubpackageInfo(value: Any?): ToolPkgSubpackageInfo {
    val input = value as Map<*, *>
    return ToolPkgSubpackageInfo(
        packageName = input["packageName"] as String as String,
        subpackageId = input["subpackageId"] as String as String,
        displayName = input["displayName"] as String as String,
        description = input["description"] as String as String,
        enabledByDefault = input["enabledByDefault"] as Boolean as Boolean,
        toolCount = input["toolCount"] as Int as Int,
        enabled = input["enabled"] as Boolean as Boolean,
    )
}

data class ToolPkgToolboxUiModule(
    val containerPackageName: String,
    val toolPkgId: String,
    val routeId: String,
    val uiModuleId: String,
    val runtime: String,
    val screen: String,
    val title: String,
    val description: String,
    val moduleSpec: Map<String, Any?>,
    val keepAlive: Boolean
)

fun decodeToolPkgToolboxUiModule(value: Any?): ToolPkgToolboxUiModule {
    val input = value as Map<*, *>
    return ToolPkgToolboxUiModule(
        containerPackageName = input["containerPackageName"] as String as String,
        toolPkgId = input["toolPkgId"] as String as String,
        routeId = input["routeId"] as String as String,
        uiModuleId = input["uiModuleId"] as String as String,
        runtime = input["runtime"] as String as String,
        screen = input["screen"] as String as String,
        title = input["title"] as String as String,
        description = input["description"] as String as String,
        moduleSpec = decodeMapStringAny?(input["moduleSpec"]) as Map<String, Any?>,
        keepAlive = input["keepAlive"] as Boolean as Boolean,
    )
}

data class ToolPkgWorkspaceTemplate(
    val containerPackageName: String,
    val toolPkgId: String,
    val templateId: String,
    val displayName: String,
    val description: String,
    val resourceKey: String,
    val projectType: String
)

fun decodeToolPkgWorkspaceTemplate(value: Any?): ToolPkgWorkspaceTemplate {
    val input = value as Map<*, *>
    return ToolPkgWorkspaceTemplate(
        containerPackageName = input["containerPackageName"] as String as String,
        toolPkgId = input["toolPkgId"] as String as String,
        templateId = input["templateId"] as String as String,
        displayName = input["displayName"] as String as String,
        description = input["description"] as String as String,
        resourceKey = input["resourceKey"] as String as String,
        projectType = input["projectType"] as String as String,
    )
}

data class ToolPkgAiProviderHandlerRuntime(
    val function: String,
    val functionSource: String?
)

fun decodeToolPkgAiProviderHandlerRuntime(value: Any?): ToolPkgAiProviderHandlerRuntime {
    val input = value as Map<*, *>
    return ToolPkgAiProviderHandlerRuntime(
        function = input["function"] as String as String,
        functionSource = input["functionSource"]?.let { it as String } as String?,
    )
}

data class ToolPkgAiProviderRuntime(
    val id: String,
    val displayName: String,
    val description: String,
    val listModelsHandler: ToolPkgAiProviderHandlerRuntime,
    val sendMessageHandler: ToolPkgAiProviderHandlerRuntime,
    val testConnectionHandler: ToolPkgAiProviderHandlerRuntime,
    val calculateInputTokensHandler: ToolPkgAiProviderHandlerRuntime
)

fun decodeToolPkgAiProviderRuntime(value: Any?): ToolPkgAiProviderRuntime {
    val input = value as Map<*, *>
    return ToolPkgAiProviderRuntime(
        id = input["id"] as String as String,
        displayName = input["displayName"] as String as String,
        description = input["description"] as String as String,
        listModelsHandler = decodeToolPkgAiProviderHandlerRuntime(input["listModelsHandler"]) as ToolPkgAiProviderHandlerRuntime,
        sendMessageHandler = decodeToolPkgAiProviderHandlerRuntime(input["sendMessageHandler"]) as ToolPkgAiProviderHandlerRuntime,
        testConnectionHandler = decodeToolPkgAiProviderHandlerRuntime(input["testConnectionHandler"]) as ToolPkgAiProviderHandlerRuntime,
        calculateInputTokensHandler = decodeToolPkgAiProviderHandlerRuntime(input["calculateInputTokensHandler"]) as ToolPkgAiProviderHandlerRuntime,
    )
}

data class ToolPkgAppLifecycleHookRuntime(
    val id: String,
    val event: String,
    val function: String,
    val functionSource: String?
)

fun decodeToolPkgAppLifecycleHookRuntime(value: Any?): ToolPkgAppLifecycleHookRuntime {
    val input = value as Map<*, *>
    return ToolPkgAppLifecycleHookRuntime(
        id = input["id"] as String as String,
        event = input["event"] as String as String,
        function = input["function"] as String as String,
        functionSource = input["functionSource"]?.let { it as String } as String?,
    )
}

data class ToolPkgChatMessageMenuDialogRuntime(
    val screen: String,
    val title: LocalizedText
)

fun decodeToolPkgChatMessageMenuDialogRuntime(value: Any?): ToolPkgChatMessageMenuDialogRuntime {
    val input = value as Map<*, *>
    return ToolPkgChatMessageMenuDialogRuntime(
        screen = input["screen"] as String as String,
        title = decodeLocalizedText(input["title"]) as LocalizedText,
    )
}

data class ToolPkgChatMessageMenuItemRuntime(
    val id: String,
    val title: LocalizedText,
    val icon: String?,
    val order: Int,
    val senders: List<String>,
    val function: String,
    val functionSource: String?,
    val dialog: ToolPkgChatMessageMenuDialogRuntime?
)

fun decodeToolPkgChatMessageMenuItemRuntime(value: Any?): ToolPkgChatMessageMenuItemRuntime {
    val input = value as Map<*, *>
    return ToolPkgChatMessageMenuItemRuntime(
        id = input["id"] as String as String,
        title = decodeLocalizedText(input["title"]) as LocalizedText,
        icon = input["icon"]?.let { it as String } as String?,
        order = input["order"] as Int as Int,
        senders = decodeListString(input["senders"]) as List<String>,
        function = input["function"] as String as String,
        functionSource = input["functionSource"]?.let { it as String } as String?,
        dialog = input["dialog"]?.let { decodeToolPkgChatMessageMenuDialogRuntime(it) } as ToolPkgChatMessageMenuDialogRuntime?,
    )
}

data class ToolPkgContainerRuntime(
    val packageName: String,
    val displayName: LocalizedText,
    val description: LocalizedText,
    val version: String,
    val apiVersion: String,
    val requires: List<ToolPkgManifestRequirement>,
    val author: List<String>,
    val mainEntry: String,
    val sourceType: ToolPkgSourceType,
    val sourcePath: String,
    val subpackages: List<ToolPkgSubpackageRuntime>,
    val resources: List<ToolPkgResourceRuntime>,
    val wasmModules: List<ToolPkgWasmModuleRuntime>,
    val workflowTemplates: List<ToolPkgWorkflowTemplateRuntime>,
    val workspaceTemplates: List<ToolPkgWorkspaceTemplateRuntime>,
    val uiModules: List<ToolPkgUiModuleRuntime>,
    val uiRoutes: List<ToolPkgUiRouteRuntime>,
    val navigationEntries: List<ToolPkgNavigationEntryRuntime>,
    val desktopWidgets: List<ToolPkgDesktopWidgetRuntime>,
    val appLifecycleHooks: List<ToolPkgAppLifecycleHookRuntime>,
    val messageProcessingPlugins: List<ToolPkgFunctionHookRuntime>,
    val xmlRenderPlugins: List<ToolPkgTagFunctionHookRuntime>,
    val inputMenuTogglePlugins: List<ToolPkgFunctionHookRuntime>,
    val chatInputHooks: List<ToolPkgFunctionHookRuntime>,
    val chatViewHooks: List<ToolPkgFunctionHookRuntime>,
    val chatMessageHooks: List<ToolPkgFunctionHookRuntime>,
    val chatMessageMenuItems: List<ToolPkgChatMessageMenuItemRuntime>,
    val chatRuntimeHooks: List<ToolPkgFunctionHookRuntime>,
    val hostEventHooks: List<ToolPkgHostEventHookRuntime>,
    val toolLifecycleHooks: List<ToolPkgFunctionHookRuntime>,
    val promptInputHooks: List<ToolPkgFunctionHookRuntime>,
    val promptHistoryHooks: List<ToolPkgFunctionHookRuntime>,
    val promptEstimateHistoryHooks: List<ToolPkgFunctionHookRuntime>,
    val systemPromptComposeHooks: List<ToolPkgFunctionHookRuntime>,
    val toolPromptComposeHooks: List<ToolPkgFunctionHookRuntime>,
    val promptFinalizeHooks: List<ToolPkgFunctionHookRuntime>,
    val promptEstimateFinalizeHooks: List<ToolPkgFunctionHookRuntime>,
    val summaryGenerateHooks: List<ToolPkgFunctionHookRuntime>,
    val aiProviders: List<ToolPkgAiProviderRuntime>,
    val logoResource: ToolPkgResourceRuntime?,
    val marketOrigin: ToolPkgMarketOrigin?
)

fun decodeToolPkgContainerRuntime(value: Any?): ToolPkgContainerRuntime {
    val input = value as Map<*, *>
    return ToolPkgContainerRuntime(
        packageName = input["packageName"] as String as String,
        displayName = decodeLocalizedText(input["displayName"]) as LocalizedText,
        description = decodeLocalizedText(input["description"]) as LocalizedText,
        version = input["version"] as String as String,
        apiVersion = input["apiVersion"] as String as String,
        requires = decodeListToolPkgManifestRequirement(input["requires"]) as List<ToolPkgManifestRequirement>,
        author = decodeListString(input["author"]) as List<String>,
        mainEntry = input["mainEntry"] as String as String,
        sourceType = decodeToolPkgSourceType(input["sourceType"]) as ToolPkgSourceType,
        sourcePath = input["sourcePath"] as String as String,
        subpackages = decodeListToolPkgSubpackageRuntime(input["subpackages"]) as List<ToolPkgSubpackageRuntime>,
        resources = decodeListToolPkgResourceRuntime(input["resources"]) as List<ToolPkgResourceRuntime>,
        wasmModules = decodeListToolPkgWasmModuleRuntime(input["wasmModules"]) as List<ToolPkgWasmModuleRuntime>,
        workflowTemplates = decodeListToolPkgWorkflowTemplateRuntime(input["workflowTemplates"]) as List<ToolPkgWorkflowTemplateRuntime>,
        workspaceTemplates = decodeListToolPkgWorkspaceTemplateRuntime(input["workspaceTemplates"]) as List<ToolPkgWorkspaceTemplateRuntime>,
        uiModules = decodeListToolPkgUiModuleRuntime(input["uiModules"]) as List<ToolPkgUiModuleRuntime>,
        uiRoutes = decodeListToolPkgUiRouteRuntime(input["uiRoutes"]) as List<ToolPkgUiRouteRuntime>,
        navigationEntries = decodeListToolPkgNavigationEntryRuntime(input["navigationEntries"]) as List<ToolPkgNavigationEntryRuntime>,
        desktopWidgets = decodeListToolPkgDesktopWidgetRuntime(input["desktopWidgets"]) as List<ToolPkgDesktopWidgetRuntime>,
        appLifecycleHooks = decodeListToolPkgAppLifecycleHookRuntime(input["appLifecycleHooks"]) as List<ToolPkgAppLifecycleHookRuntime>,
        messageProcessingPlugins = decodeListToolPkgFunctionHookRuntime(input["messageProcessingPlugins"]) as List<ToolPkgFunctionHookRuntime>,
        xmlRenderPlugins = decodeListToolPkgTagFunctionHookRuntime(input["xmlRenderPlugins"]) as List<ToolPkgTagFunctionHookRuntime>,
        inputMenuTogglePlugins = decodeListToolPkgFunctionHookRuntime(input["inputMenuTogglePlugins"]) as List<ToolPkgFunctionHookRuntime>,
        chatInputHooks = decodeListToolPkgFunctionHookRuntime(input["chatInputHooks"]) as List<ToolPkgFunctionHookRuntime>,
        chatViewHooks = decodeListToolPkgFunctionHookRuntime(input["chatViewHooks"]) as List<ToolPkgFunctionHookRuntime>,
        chatMessageHooks = decodeListToolPkgFunctionHookRuntime(input["chatMessageHooks"]) as List<ToolPkgFunctionHookRuntime>,
        chatMessageMenuItems = decodeListToolPkgChatMessageMenuItemRuntime(input["chatMessageMenuItems"]) as List<ToolPkgChatMessageMenuItemRuntime>,
        chatRuntimeHooks = decodeListToolPkgFunctionHookRuntime(input["chatRuntimeHooks"]) as List<ToolPkgFunctionHookRuntime>,
        hostEventHooks = decodeListToolPkgHostEventHookRuntime(input["hostEventHooks"]) as List<ToolPkgHostEventHookRuntime>,
        toolLifecycleHooks = decodeListToolPkgFunctionHookRuntime(input["toolLifecycleHooks"]) as List<ToolPkgFunctionHookRuntime>,
        promptInputHooks = decodeListToolPkgFunctionHookRuntime(input["promptInputHooks"]) as List<ToolPkgFunctionHookRuntime>,
        promptHistoryHooks = decodeListToolPkgFunctionHookRuntime(input["promptHistoryHooks"]) as List<ToolPkgFunctionHookRuntime>,
        promptEstimateHistoryHooks = decodeListToolPkgFunctionHookRuntime(input["promptEstimateHistoryHooks"]) as List<ToolPkgFunctionHookRuntime>,
        systemPromptComposeHooks = decodeListToolPkgFunctionHookRuntime(input["systemPromptComposeHooks"]) as List<ToolPkgFunctionHookRuntime>,
        toolPromptComposeHooks = decodeListToolPkgFunctionHookRuntime(input["toolPromptComposeHooks"]) as List<ToolPkgFunctionHookRuntime>,
        promptFinalizeHooks = decodeListToolPkgFunctionHookRuntime(input["promptFinalizeHooks"]) as List<ToolPkgFunctionHookRuntime>,
        promptEstimateFinalizeHooks = decodeListToolPkgFunctionHookRuntime(input["promptEstimateFinalizeHooks"]) as List<ToolPkgFunctionHookRuntime>,
        summaryGenerateHooks = decodeListToolPkgFunctionHookRuntime(input["summaryGenerateHooks"]) as List<ToolPkgFunctionHookRuntime>,
        aiProviders = decodeListToolPkgAiProviderRuntime(input["aiProviders"]) as List<ToolPkgAiProviderRuntime>,
        logoResource = input["logoResource"]?.let { decodeToolPkgResourceRuntime(it) } as ToolPkgResourceRuntime?,
        marketOrigin = input["marketOrigin"]?.let { decodeToolPkgMarketOrigin(it) } as ToolPkgMarketOrigin?,
    )
}

data class ToolPkgDesktopWidgetRuntime(
    val id: String,
    val routeId: String,
    val renderRouteId: String,
    val title: LocalizedText,
    val subtitle: LocalizedText,
    val description: LocalizedText,
    val icon: String?,
    val order: Int
)

fun decodeToolPkgDesktopWidgetRuntime(value: Any?): ToolPkgDesktopWidgetRuntime {
    val input = value as Map<*, *>
    return ToolPkgDesktopWidgetRuntime(
        id = input["id"] as String as String,
        routeId = input["routeId"] as String as String,
        renderRouteId = input["renderRouteId"] as String as String,
        title = decodeLocalizedText(input["title"]) as LocalizedText,
        subtitle = decodeLocalizedText(input["subtitle"]) as LocalizedText,
        description = decodeLocalizedText(input["description"]) as LocalizedText,
        icon = input["icon"]?.let { it as String } as String?,
        order = input["order"] as Int as Int,
    )
}

data class ToolPkgFunctionHookRuntime(
    val id: String,
    val function: String,
    val functionSource: String?
)

fun decodeToolPkgFunctionHookRuntime(value: Any?): ToolPkgFunctionHookRuntime {
    val input = value as Map<*, *>
    return ToolPkgFunctionHookRuntime(
        id = input["id"] as String as String,
        function = input["function"] as String as String,
        functionSource = input["functionSource"]?.let { it as String } as String?,
    )
}

data class ToolPkgHostEventHookRuntime(
    val id: String,
    val source: String,
    val trigger: Any?,
    val function: String,
    val functionSource: String?,
    val enabled: Boolean
)

fun decodeToolPkgHostEventHookRuntime(value: Any?): ToolPkgHostEventHookRuntime {
    val input = value as Map<*, *>
    return ToolPkgHostEventHookRuntime(
        id = input["id"] as String as String,
        source = input["source"] as String as String,
        trigger = input["trigger"] as Any?,
        function = input["function"] as String as String,
        functionSource = input["functionSource"]?.let { it as String } as String?,
        enabled = input["enabled"] as Boolean as Boolean,
    )
}

data class ToolPkgManifestRequirement(
    val id: String,
    val description: String,
    val minVersion: String?,
    val maxVersion: String?
)

fun decodeToolPkgManifestRequirement(value: Any?): ToolPkgManifestRequirement {
    val input = value as Map<*, *>
    return ToolPkgManifestRequirement(
        id = input["id"] as String as String,
        description = input["description"] as String as String,
        minVersion = input["min_version"]?.let { it as String } as String?,
        maxVersion = input["max_version"]?.let { it as String } as String?,
    )
}

data class ToolPkgMarketOrigin(
    val market: String,
    val toolpkgId: String,
    val version: String,
    val author: List<String>
)

fun decodeToolPkgMarketOrigin(value: Any?): ToolPkgMarketOrigin {
    val input = value as Map<*, *>
    return ToolPkgMarketOrigin(
        market = input["market"] as String as String,
        toolpkgId = input["toolpkgId"] as String as String,
        version = input["version"] as String as String,
        author = decodeListString(input["author"]) as List<String>,
    )
}

data class ToolPkgNavigationActionHookRuntime(
    val function: String,
    val functionSource: String?
)

fun decodeToolPkgNavigationActionHookRuntime(value: Any?): ToolPkgNavigationActionHookRuntime {
    val input = value as Map<*, *>
    return ToolPkgNavigationActionHookRuntime(
        function = input["function"] as String as String,
        functionSource = input["functionSource"]?.let { it as String } as String?,
    )
}

data class ToolPkgNavigationEntryRuntime(
    val id: String,
    val routeId: String,
    val surface: String,
    val title: LocalizedText,
    val action: ToolPkgNavigationActionHookRuntime?,
    val icon: String?,
    val order: Int
)

fun decodeToolPkgNavigationEntryRuntime(value: Any?): ToolPkgNavigationEntryRuntime {
    val input = value as Map<*, *>
    return ToolPkgNavigationEntryRuntime(
        id = input["id"] as String as String,
        routeId = input["routeId"] as String as String,
        surface = input["surface"] as String as String,
        title = decodeLocalizedText(input["title"]) as LocalizedText,
        action = input["action"]?.let { decodeToolPkgNavigationActionHookRuntime(it) } as ToolPkgNavigationActionHookRuntime?,
        icon = input["icon"]?.let { it as String } as String?,
        order = input["order"] as Int as Int,
    )
}

data class ToolPkgResourceRuntime(
    val key: String,
    val path: String,
    val mime: String
)

fun decodeToolPkgResourceRuntime(value: Any?): ToolPkgResourceRuntime {
    val input = value as Map<*, *>
    return ToolPkgResourceRuntime(
        key = input["key"] as String as String,
        path = input["path"] as String as String,
        mime = input["mime"] as String as String,
    )
}

enum class ToolPkgSourceType { ASSET, MARKET, EXTERNAL }
fun decodeToolPkgSourceType(value: Any?): ToolPkgSourceType = ToolPkgSourceType.valueOf(value.toString())

data class ToolPkgSubpackageRuntime(
    val packageName: String,
    val containerPackageName: String,
    val subpackageId: String,
    val entryPath: String,
    val displayName: LocalizedText,
    val description: LocalizedText,
    val enabledByDefault: Boolean,
    val toolCount: Int
)

fun decodeToolPkgSubpackageRuntime(value: Any?): ToolPkgSubpackageRuntime {
    val input = value as Map<*, *>
    return ToolPkgSubpackageRuntime(
        packageName = input["packageName"] as String as String,
        containerPackageName = input["containerPackageName"] as String as String,
        subpackageId = input["subpackageId"] as String as String,
        entryPath = input["entryPath"] as String as String,
        displayName = decodeLocalizedText(input["displayName"]) as LocalizedText,
        description = decodeLocalizedText(input["description"]) as LocalizedText,
        enabledByDefault = input["enabledByDefault"] as Boolean as Boolean,
        toolCount = input["toolCount"] as Int as Int,
    )
}

data class ToolPkgTagFunctionHookRuntime(
    val id: String,
    val tag: String,
    val function: String,
    val functionSource: String?
)

fun decodeToolPkgTagFunctionHookRuntime(value: Any?): ToolPkgTagFunctionHookRuntime {
    val input = value as Map<*, *>
    return ToolPkgTagFunctionHookRuntime(
        id = input["id"] as String as String,
        tag = input["tag"] as String as String,
        function = input["function"] as String as String,
        functionSource = input["functionSource"]?.let { it as String } as String?,
    )
}

data class ToolPkgUiModuleRuntime(
    val id: String,
    val runtime: String,
    val screen: String,
    val title: LocalizedText,
    val keepAlive: Boolean
)

fun decodeToolPkgUiModuleRuntime(value: Any?): ToolPkgUiModuleRuntime {
    val input = value as Map<*, *>
    return ToolPkgUiModuleRuntime(
        id = input["id"] as String as String,
        runtime = input["runtime"] as String as String,
        screen = input["screen"] as String as String,
        title = decodeLocalizedText(input["title"]) as LocalizedText,
        keepAlive = input["keepAlive"] as Boolean as Boolean,
    )
}

data class ToolPkgUiRouteRuntime(
    val id: String,
    val routeId: String,
    val runtime: String,
    val screen: String,
    val title: LocalizedText,
    val keepAlive: Boolean
)

fun decodeToolPkgUiRouteRuntime(value: Any?): ToolPkgUiRouteRuntime {
    val input = value as Map<*, *>
    return ToolPkgUiRouteRuntime(
        id = input["id"] as String as String,
        routeId = input["routeId"] as String as String,
        runtime = input["runtime"] as String as String,
        screen = input["screen"] as String as String,
        title = decodeLocalizedText(input["title"]) as LocalizedText,
        keepAlive = input["keepAlive"] as Boolean as Boolean,
    )
}

data class ToolPkgWasmModuleRuntime(
    val id: String,
    val path: String,
    val exports: List<String>,
    val sourceLanguage: String,
    val abi: String
)

fun decodeToolPkgWasmModuleRuntime(value: Any?): ToolPkgWasmModuleRuntime {
    val input = value as Map<*, *>
    return ToolPkgWasmModuleRuntime(
        id = input["id"] as String as String,
        path = input["path"] as String as String,
        exports = decodeListString(input["exports"]) as List<String>,
        sourceLanguage = input["sourceLanguage"] as String as String,
        abi = input["abi"] as String as String,
    )
}

data class ToolPkgWorkflowTemplateRuntime(
    val id: String,
    val display_name: LocalizedText,
    val description: LocalizedText,
    val resource_key: String
)

fun decodeToolPkgWorkflowTemplateRuntime(value: Any?): ToolPkgWorkflowTemplateRuntime {
    val input = value as Map<*, *>
    return ToolPkgWorkflowTemplateRuntime(
        id = input["id"] as String as String,
        display_name = decodeLocalizedText(input["display_name"]) as LocalizedText,
        description = decodeLocalizedText(input["description"]) as LocalizedText,
        resource_key = input["resource_key"] as String as String,
    )
}

data class ToolPkgWorkspaceTemplateRuntime(
    val id: String,
    val display_name: LocalizedText,
    val description: LocalizedText,
    val resource_key: String,
    val project_type: String
)

fun decodeToolPkgWorkspaceTemplateRuntime(value: Any?): ToolPkgWorkspaceTemplateRuntime {
    val input = value as Map<*, *>
    return ToolPkgWorkspaceTemplateRuntime(
        id = input["id"] as String as String,
        display_name = decodeLocalizedText(input["display_name"]) as LocalizedText,
        description = decodeLocalizedText(input["description"]) as LocalizedText,
        resource_key = input["resource_key"] as String as String,
        project_type = input["project_type"] as String as String,
    )
}

data class ToolResult(
    val toolName: String,
    val success: Boolean,
    val result: Any?,
    val error: String?
)

fun decodeToolResult(value: Any?): ToolResult {
    val input = value as Map<*, *>
    return ToolResult(
        toolName = input["toolName"] as String as String,
        success = input["success"] as Boolean as Boolean,
        result = input["result"] as Any?,
        error = input["error"]?.let { it as String } as String?,
    )
}

data class PluginLoadingItem(
    val id: String,
    val displayName: String,
    val kind: String,
    val status: String,
    val message: String,
    val logText: String
)

fun decodePluginLoadingItem(value: Any?): PluginLoadingItem {
    val input = value as Map<*, *>
    return PluginLoadingItem(
        id = input["id"] as String as String,
        displayName = input["displayName"] as String as String,
        kind = input["kind"] as String as String,
        status = input["status"] as String as String,
        message = input["message"] as String as String,
        logText = input["logText"] as String as String,
    )
}

data class PluginLoadingProgress(
    val visible: Boolean,
    val forceExpanded: Boolean,
    val progress: Double,
    val phase: String,
    val currentTask: String,
    val pluginsStarted: Int,
    val pluginsTotal: Int,
    val plugins: List<PluginLoadingItem>
)

fun decodePluginLoadingProgress(value: Any?): PluginLoadingProgress {
    val input = value as Map<*, *>
    return PluginLoadingProgress(
        visible = input["visible"] as Boolean as Boolean,
        forceExpanded = input["forceExpanded"] as Boolean as Boolean,
        progress = input["progress"] as Double as Double,
        phase = input["phase"] as String as String,
        currentTask = input["currentTask"] as String as String,
        pluginsStarted = input["pluginsStarted"] as Int as Int,
        pluginsTotal = input["pluginsTotal"] as Int as Int,
        plugins = decodeListPluginLoadingItem(input["plugins"]) as List<PluginLoadingItem>,
    )
}

