import 'package:operit_plugin_sdk/operit_plugin_sdk.dart';

/// Demonstrates reading plugin state and package metadata through IPC.
Future<void> main() async {
  final sdk = await OperitPluginSdkClient.connectTcp();
  final application = OperitApplicationClient(sdk);
  final packageManager = OperitApplicationPackageManagerClient(sdk);

  await _printOneLoadingEvent(application);

  final availablePackages = await packageManager.getAvailablePackages();
  print('Available packages: $availablePackages');

  final containers = await packageManager.getToolPkgPluginContainerDetails(
    <String, Object?>{'useEnglish': true},
  );
  print('Plugin containers: $containers');

  if (containers.isNotEmpty) {
    final first = containers.first;
    final packageName = first.packageName;
      final logo = await packageManager.readToolPkgLogoBytes(
        <String, Object?>{'packageName': packageName},
      );
      print('Logo for $packageName: $logo');

      // Package invocation uses the same Core route and requires a real tool name.
      // final result = await packageManager.executeUsePackageTool(<String, Object?>{
      //   'packageName': packageName,
      //   'toolName': 'your_tool_name',
      // });
      // print('Tool result: $result');
  }
}

/// Prints one plugin loading event and cancels the watch subscription.
Future<void> _printOneLoadingEvent(OperitApplicationClient application) async {
  await for (final event in application.pluginLoadingProgressFlow()) {
    print('Plugin loading: $event');
    break;
  }
}
