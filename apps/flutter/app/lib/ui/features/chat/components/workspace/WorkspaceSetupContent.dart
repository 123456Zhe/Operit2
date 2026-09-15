// ignore_for_file: file_names

import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../../l10n/generated/app_localizations.dart';
import '../../../../theme/OperitGlassSurface.dart';

class WorkspaceSetupContent extends StatefulWidget {
  const WorkspaceSetupContent({
    super.key,
    required this.onCreateWorkspace,
    required this.onChooseExistingWorkspace,
  });

  final Future<void> Function(String name) onCreateWorkspace;
  final VoidCallback onChooseExistingWorkspace;

  @override
  State<WorkspaceSetupContent> createState() => _WorkspaceSetupContentState();
}

class _WorkspaceSetupContentState extends State<WorkspaceSetupContent> {
  /// Builds the workspace setup actions.
  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Center(
        child: SingleChildScrollView(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: <Widget>[
              Icon(Icons.widgets, size: 48, color: theme.colorScheme.primary),
              const SizedBox(height: 16),
              Text(
                l10n.workspaceSetupTitle,
                style: theme.textTheme.titleLarge?.copyWith(
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  l10n.workspaceSetupSubtitle,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 12,
                runSpacing: 12,
                children: <Widget>[
                  _WorkspaceOption(
                    icon: Icons.create_new_folder,
                    title: l10n.workspaceCreateTitle,
                    description: l10n.workspaceCreateDescription,
                    onTap: _showCreateWorkspaceDialog,
                  ),
                  _WorkspaceOption(
                    icon: Icons.folder_open,
                    title: l10n.workspaceBindExistingTitle,
                    description: l10n.workspaceBindExistingDescription,
                    onTap: _openExistingWorkspacePicker,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Opens the dialog used to create a named workspace.
  void _showCreateWorkspaceDialog() {
    final nameController = TextEditingController();
    var dialogBusy = false;
    String? dialogError;
    final dialogFuture = showDialog<void>(
      context: context,
      builder: (dialogContext) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            final l10n = AppLocalizations.of(context)!;
            Future<void> submitCreateWorkspace() async {
              if (dialogBusy) {
                return;
              }
              final name = nameController.text.trim();
              if (name.isEmpty) {
                setDialogState(() {
                  dialogError = l10n.workspaceNameHint;
                });
                return;
              }
              setDialogState(() {
                dialogBusy = true;
                dialogError = null;
              });
              try {
                await widget.onCreateWorkspace(name);
                if (dialogContext.mounted) {
                  Navigator.of(dialogContext).pop();
                }
              } catch (error, stackTrace) {
                debugPrint('Workspace creation failed: $error\n$stackTrace');
                if (dialogContext.mounted) {
                  setDialogState(() {
                    dialogError = error.toString();
                  });
                }
              } finally {
                if (dialogContext.mounted) {
                  setDialogState(() {
                    dialogBusy = false;
                  });
                }
              }
            }

            return AlertDialog(
              title: Text(l10n.workspaceCreateTitle),
              content: SizedBox(
                width: 420,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      TextField(
                        controller: nameController,
                        autofocus: true,
                        enabled: !dialogBusy,
                        decoration: InputDecoration(
                          labelText: l10n.workspaceNameLabel,
                          hintText: l10n.workspaceNameHint,
                        ),
                      ),
                      if (dialogError != null) ...<Widget>[
                        const SizedBox(height: 10),
                        Text(
                          dialogError!,
                          style: TextStyle(
                            color: Theme.of(context).colorScheme.error,
                          ),
                        ),
                      ],
                      const SizedBox(height: 14),
                    ],
                  ),
                ),
              ),
              actions: <Widget>[
                TextButton(
                  onPressed: dialogBusy
                      ? null
                      : () {
                          Navigator.of(dialogContext).pop();
                        },
                  child: Text(l10n.cancel),
                ),
                FilledButton(
                  onPressed: dialogBusy
                      ? null
                      : () {
                          unawaited(submitCreateWorkspace());
                        },
                  child: Text(l10n.bind),
                ),
              ],
            );
          },
        );
      },
    );
    unawaited(dialogFuture.whenComplete(nameController.dispose));
  }

  /// Opens the picker for an existing workspace folder.
  void _openExistingWorkspacePicker() {
    widget.onChooseExistingWorkspace();
  }
}

/// Renders one workspace setup action.
class _WorkspaceOption extends StatelessWidget {
  const _WorkspaceOption({
    required this.icon,
    required this.title,
    required this.description,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String description;
  final VoidCallback onTap;

  /// Builds the setup action tile.
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return SizedBox(
      width: 132,
      height: 132,
      child: OperitGlassSurface(
        color: theme.colorScheme.surfaceContainerHighest.withValues(
          alpha: 0.42,
        ),
        layer: OperitGlassSurfaceLayer.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: theme.colorScheme.outline.withValues(alpha: 0.18),
        ),
        material: true,
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: <Widget>[
                Icon(icon, size: 34, color: theme.colorScheme.primary),
                const SizedBox(height: 10),
                Text(
                  title,
                  maxLines: 2,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.titleMedium?.copyWith(
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 6),
                SizedBox(
                  height: 34,
                  child: Text(
                    description,
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
