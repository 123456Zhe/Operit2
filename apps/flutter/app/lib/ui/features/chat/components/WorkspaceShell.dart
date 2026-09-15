// ignore_for_file: file_names

import 'dart:typed_data';

import 'package:flutter/material.dart';

import '../../../common/components/AdaptiveSidePanel.dart';
import '../viewmodel/WorkspaceFileModels.dart';
import 'workspace/WorkspaceLayoutMetrics.dart';
import 'workspace/WorkspacePanel.dart';

class WorkspaceShell extends StatelessWidget {
  const WorkspaceShell({
    super.key,
    required this.workspaceOpen,
    required this.onWorkspaceOpenChanged,
    required this.currentChatId,
    required this.hasBoundWorkspace,
    required this.workspacePath,
    required this.onListWorkspaceFiles,
    required this.onListWorkspaceBindingDirectories,
    required this.onReadWorkspaceTextFile,
    required this.onReadWorkspaceFileBytes,
    required this.onWriteWorkspaceFileBytes,
    required this.onOpenWorkspaceFile,
    required this.onCreateWorkspace,
    required this.onBindWorkspace,
    required this.child,
  });

  final bool workspaceOpen;
  final ValueChanged<bool> onWorkspaceOpenChanged;
  final String? currentChatId;
  final bool hasBoundWorkspace;
  final String? workspacePath;
  final Future<List<WorkspaceFileEntry>> Function(String path)
  onListWorkspaceFiles;
  final Future<List<WorkspaceFileEntry>> Function(String path)
  onListWorkspaceBindingDirectories;
  final Future<String> Function(String path) onReadWorkspaceTextFile;
  final Future<Uint8List> Function(String path) onReadWorkspaceFileBytes;
  final Future<void> Function(String path, Uint8List bytes)
  onWriteWorkspaceFileBytes;
  final Future<void> Function(String path) onOpenWorkspaceFile;
  final Future<void> Function(String name) onCreateWorkspace;
  final Future<void> Function(String workspace) onBindWorkspace;
  final Widget child;

  /// Builds the workspace panel with the common adaptive side-panel behavior.
  @override
  Widget build(BuildContext context) {
    return AdaptiveSidePanel(
      open: workspaceOpen,
      onOpenChanged: onWorkspaceOpenChanged,
      breakpoint: workspaceTabletBreakpoint,
      defaultWidth: workspaceDefaultTabletWidth,
      minWidth: workspaceMinWidth,
      minContentWidth: workspaceMinTabletChatWidth,
      resizeHandleHitWidth: workspaceResizeHandleHitWidth,
      resizeHandleVisualWidth: workspaceResizeHandleVisualWidth,
      resizeHandleHeight: workspaceResizeHandleHeight,
      panel: WorkspacePanel(
        currentChatId: currentChatId,
        hasBoundWorkspace: hasBoundWorkspace,
        workspacePath: workspacePath,
        onListWorkspaceFiles: onListWorkspaceFiles,
        onListWorkspaceBindingDirectories: onListWorkspaceBindingDirectories,
        onReadWorkspaceTextFile: onReadWorkspaceTextFile,
        onReadWorkspaceFileBytes: onReadWorkspaceFileBytes,
        onWriteWorkspaceFileBytes: onWriteWorkspaceFileBytes,
        onOpenWorkspaceFile: onOpenWorkspaceFile,
        onCreateWorkspace: onCreateWorkspace,
        onBindWorkspace: onBindWorkspace,
      ),
      child: child,
    );
  }
}
