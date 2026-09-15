// GENERATED FILE. Source: operit-proxy-scan.

package operit.plugin.sdk

/** Generated client for Core object `application`. */
class OperitApplicationClient(private val client: OperitPluginSdkClient) {
    /** Watches `pluginLoadingProgressFlow` through the Core Link route. */
    fun pluginLoadingProgressFlow(args: Any? = null): kotlinx.coroutines.flow.Flow<PluginLoadingProgress> = client.watchTyped(0, "pluginLoadingProgressFlow", args, ::decodePluginLoadingProgress)
}

/** Generated client for Core object `application.packageManager`. */
class OperitApplicationPackageManagerClient(private val client: OperitPluginSdkClient) {
    /** Calls `activatePackage` through the Core Link route. */
    suspend fun activatePackage(args: Any? = null): Boolean = client.callTyped(4, "activatePackage", args, ::decodeBoolean)
    /** Calls `isPackageActivated` through the Core Link route. */
    suspend fun isPackageActivated(args: Any? = null): Boolean = client.callTyped(4, "isPackageActivated", args, ::decodeBoolean)
    /** Calls `usePackage` through the Core Link route. */
    suspend fun usePackage(args: Any? = null): String = client.callTyped(4, "usePackage", args, ::decodeString)
    /** Calls `executeUsePackageTool` through the Core Link route. */
    suspend fun executeUsePackageTool(args: Any? = null): ToolResult = client.callTyped(4, "executeUsePackageTool", args, ::decodeToolResult)
    /** Calls `getEnabledPackageNames` through the Core Link route. */
    suspend fun getEnabledPackageNames(args: Any? = null): List<String> = client.callTyped(4, "getEnabledPackageNames", args, ::decodeListString)
    /** Calls `isPackageEnabled` through the Core Link route. */
    suspend fun isPackageEnabled(args: Any? = null): Boolean = client.callTyped(4, "isPackageEnabled", args, ::decodeBoolean)
    /** Calls `getActivePackageNames` through the Core Link route. */
    suspend fun getActivePackageNames(args: Any? = null): List<String> = client.callTyped(4, "getActivePackageNames", args, ::decodeListString)
    /** Calls `enablePackage` through the Core Link route. */
    suspend fun enablePackage(args: Any? = null): String = client.callTyped(4, "enablePackage", args, ::decodeString)
    /** Calls `disablePackage` through the Core Link route. */
    suspend fun disablePackage(args: Any? = null): String = client.callTyped(4, "disablePackage", args, ::decodeString)
    /** Calls `getToolPkgPluginContainerDetails` through the Core Link route. */
    suspend fun getToolPkgPluginContainerDetails(args: Any? = null): List<ToolPkgContainerDetails> = client.callTyped(4, "getToolPkgPluginContainerDetails", args, ::decodeListToolPkgContainerDetails)
    /** Calls `getToolPkgContainerRuntimes` through the Core Link route. */
    suspend fun getToolPkgContainerRuntimes(args: Any? = null): List<ToolPkgContainerRuntime> = client.callTyped(4, "getToolPkgContainerRuntimes", args, ::decodeListToolPkgContainerRuntime)
    /** Calls `getToolPkgContainerDetails` through the Core Link route. */
    suspend fun getToolPkgContainerDetails(args: Any? = null): ToolPkgContainerDetails? = client.callTyped(4, "getToolPkgContainerDetails", args, ::decodeNullableToolPkgContainerDetails)
    /** Calls `readToolPkgLogoBytes` through the Core Link route. */
    suspend fun readToolPkgLogoBytes(args: Any? = null): ToolPkgLogoBytes? = client.callTyped(4, "readToolPkgLogoBytes", args, ::decodeNullableToolPkgLogoBytes)
    /** Calls `getEffectivePackageTools` through the Core Link route. */
    suspend fun getEffectivePackageTools(args: Any? = null): ToolPackage? = client.callTyped(4, "getEffectivePackageTools", args, ::decodeNullableToolPackage)
    /** Calls `getPackageTools` through the Core Link route. */
    suspend fun getPackageTools(args: Any? = null): ToolPackage? = client.callTyped(4, "getPackageTools", args, ::decodeNullableToolPackage)
    /** Calls `getAvailablePackages` through the Core Link route. */
    suspend fun getAvailablePackages(args: Any? = null): Map<String, ToolPackage> = client.callTyped(4, "getAvailablePackages", args, ::decodeMapStringToolPackage)
}

