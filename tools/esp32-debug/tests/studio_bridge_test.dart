import 'dart:convert';
import '../../../apps/flutter/app/lib/core/host/browser/ScreenStudioChatBridge.dart';

Future<void> main() async {
  assert(ScreenStudioChatBridge.isStudioUrl('http://127.0.0.1:8766/'));
  assert(ScreenStudioChatBridge.isStudioUrl('http://192.168.1.10:8766/'));
  for (final url in ['https://example.com:8766/', 'http://127.0.0.1:8765/', 'http://192.168.1.1:8766/other', 'http://192.168.1.999:8766/']) {
    assert(!ScreenStudioChatBridge.isStudioUrl(url));
  }
  final owner=Object(),token=ScreenStudioChatBridge.newToken();
  String? received;
  ScreenStudioChatBridge.attach(owner,(text) async { received=text; });
  final envelope={'token':token,'payload':{'kind':'operit.hardware.task','task':'edit home','context':{'pageId':'home'}}};
  assert((await ScreenStudioChatBridge.receive(jsonEncode(envelope),token))['accepted']==true);
  assert(received!.contains('edit home'));
  try {await ScreenStudioChatBridge.receive(jsonEncode(envelope),'wrong');throw 'accepted stale token';} on StateError { }
  ScreenStudioChatBridge.detach(Object());
  assert((await ScreenStudioChatBridge.receive(jsonEncode(envelope),token))['accepted']==true);
  ScreenStudioChatBridge.detach(owner);
  try {await ScreenStudioChatBridge.receive(jsonEncode(envelope),token);throw 'accepted closed chat';} on StateError { }
  print('PASS Studio origin, revision token, current-chat dispatch and detach');
}
