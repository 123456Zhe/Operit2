// ignore_for_file: file_names

import 'package:flutter/widgets.dart';

import '../../../../core/proxy/generated/CoreProxyClients.g.dart';

/// Makes the window-scoped chat runtime available to descendant renderers.
class ChatRuntimeScope extends InheritedWidget {
  const ChatRuntimeScope({
    super.key,
    required this.chatCore,
    required super.child,
  });

  final GeneratedChatRuntimeHolderMainCoreProxy chatCore;

  static GeneratedChatRuntimeHolderMainCoreProxy? maybeOf(
    BuildContext context,
  ) {
    return context
        .dependOnInheritedWidgetOfExactType<ChatRuntimeScope>()
        ?.chatCore;
  }

  @override
  bool updateShouldNotify(ChatRuntimeScope oldWidget) {
    return oldWidget.chatCore != chatCore;
  }
}
