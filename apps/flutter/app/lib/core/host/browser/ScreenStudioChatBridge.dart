// ignore_for_file: file_names
import 'dart:convert';
import 'dart:math';

/// Ephemeral bridge from the local Screen Studio to the visible conversation.
class ScreenStudioChatBridge {
  static Object? _owner;
  static Future<void> Function(String)? _send;
  static bool _sending = false;

  static void attach(Object owner, Future<void> Function(String) send) {
    _owner = owner;
    _send = send;
  }

  static void detach(Object owner) {
    if (identical(owner, _owner)) {
      _owner = null;
      _send = null;
    }
  }

  static bool isStudioUrl(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null ||
        !['http', 'https'].contains(uri.scheme) ||
        uri.port != 8766 ||
        !['', '/', '/index.html'].contains(uri.path) ||
        uri.userInfo.isNotEmpty) return false;
    if (['localhost', '127.0.0.1', '::1'].contains(uri.host)) return true;
    final ip = uri.host.split('.').map(int.tryParse).toList();
    if (ip.length != 4 || ip.any((n) => n == null || n < 0 || n > 255))
      return false;
    return ip[0] == 10 ||
        ip[0] == 192 && ip[1] == 168 ||
        ip[0] == 172 && ip[1]! >= 16 && ip[1]! <= 31;
  }

  static String newToken() {
    final random = Random.secure();
    return List.generate(
            24, (_) => random.nextInt(256).toRadixString(16).padLeft(2, '0'))
        .join();
  }

  static Future<Map<String, Object>> receive(String raw, String token) async {
    if (utf8.encode(raw).length > 256 * 1024) throw StateError('任务超过 256 KiB');
    final envelope = jsonDecode(raw) as Map<String, dynamic>;
    if (envelope['token'] != token || token.isEmpty)
      throw StateError('页面连接已失效');
    final payload = envelope['payload'] as Map<String, dynamic>;
    if (![
      'operit.hardware.task',
      'operit.hardware.component',
    ].contains(payload['kind'])) {
      throw StateError('不支持的任务类型');
    }
    final send = _send;
    if (send == null) throw StateError('请先打开软件中的当前对话');
    if (_sending) throw StateError('上一个任务正在发送');
    _sending = true;
    try {
      await send('Screen Studio 硬件界面开发任务。请根据下方布局草稿、组件及源码位置实现用户要求。'
          'layout.json 是界面源文件，布局和跳转修改直接打包部署；新增底层能力才修改 C/Rust 并编译基础运行时。'
          '源码位置以 revision 为准，先读取再修改。\n${jsonEncode(payload)}');
    } finally {
      _sending = false;
    }
    return {'accepted': true};
  }

  static String script(String token) => '''
(() => {
  if (window !== window.top || !document.querySelector('#ai-dialog')) return;
  const token = ${jsonEncode(token)}, pending = new Map();
  window.__operitStudioReply = (reply) => {
    const request = pending.get(reply.id); if (!request) return;
    pending.delete(reply.id); clearTimeout(request.timer);
    reply.error ? request.reject(new Error(reply.error)) : request.resolve(reply.result);
  };
  window.operitHost = {...window.operitHost, sendToChat(payload) {
    return new Promise((resolve, reject) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
      const timer = setTimeout(() => { pending.delete(id); reject(new Error('软件对话接收超时')); }, 30000);
      pending.set(id, {resolve, reject, timer});
      OperitScreenStudio.postMessage(JSON.stringify({id, token, payload}));
    });
  }};
  window.dispatchEvent(new Event('operit-host-ready'));
})();
''';
}
