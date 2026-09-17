import {findNode,projectRoutes} from './project-model.mjs';
import {routes} from './routes.mjs';
import {componentContext, applyRouteReply} from './component-context.mjs';
import {request} from './transport.js';
const $ = selector => document.querySelector(selector);

// The dialog is shared by right-click, touch hold and the accessible toolbar button.
export function setupInteractions({snapshot, commit, notify}) {
  const dialog = $('#component-dialog');
  let componentId, baseDocument, replyBase, sourceReference = null, session = 0;
  const feedback = message => { $('#component-feedback').textContent = message; };
  for (const id of ['component-click-route','component-hold-route']) {
    $('#'+id).replaceChildren(...routes.map(route => new Option(route.label,route.id)));
  }
  function context() {
    const state = snapshot();
    return componentContext(baseDocument, componentId, state.revision, state.dirty, $('#component-request').value.trim(),sourceReference);
  }
  function refreshContext() { $('#component-context').value = JSON.stringify(context(),null,2); }
  async function resolveSource(expectedSession = session) {
    const state = snapshot();
    const result = await request('/api/component-source?id='+encodeURIComponent(componentId)+'&revision='+encodeURIComponent(state.revision));
    if (expectedSession !== session || !dialog.open) return false;
    sourceReference = result;
    refreshContext();
    const {location, status} = context().codeReference;
    $('#component-source-ref').textContent = location
      ? `${location.path}:${location.startLine}–${location.endLine} · ${location.jsonPointer}`+(status === 'modified-component' ? ' · 当前组件有未保存修改，行号指向磁盘版本' : '')
      : '新组件尚未保存 · '+context().codeReference.draftPointer+' · 暂无磁盘行号';
    return true;
  }
  function ensureUnchanged() {
    const current = snapshot();
    if (JSON.stringify(current.document) !== JSON.stringify(baseDocument)) throw new Error('布局在对话期间已变化，请关闭后重新选择组件');
  }
  function open(id) {
    const state = snapshot(), node = findNode(state.document,id)?.node;
    if (!node) return;
    session++;
    componentId = id; baseDocument = state.document; sourceReference = null;
    for(const select of ['component-click-route','component-hold-route'])$('#'+select).replaceChildren(...[...projectRoutes(state.document),...routes].map(route=>new Option(route.label,route.id)));
    replyBase = null;
    $('#component-title').textContent = '引用组件 · '+id;
    $('#component-description').textContent = `${node.type} · ${node.w} × ${node.h} · ${node.text || '无文本'}`;
    $('#component-click-route').value = node.action;
    $('#component-hold-route').value = node.longAction || '';
    $('#component-request').value = ''; $('#component-reply').value = '';
    $('#component-send').disabled = false;
    feedback(window.operitHost?.sendToChat ? '填写需求，连同源码位置一起发送到对话，让 AI 修改功能实现。' : '独立调试页尚未连接对话。复制源码引用给 AI，即可让它定位并修改功能实现。');
    $('#component-source-ref').textContent = '正在定位布局源码…';
    refreshContext();
    if (!dialog.open) dialog.showModal();
    const openingSession = session;
    resolveSource(openingSession).catch(e => { if (openingSession === session) { $('#component-source-ref').textContent = '源码定位失败'; feedback(e.message); } });
  }
  $('#component-request').addEventListener('input',refreshContext);
  $('#component-close').onclick = () => dialog.close();
  $('#component-send').onclick = async () => {
    const button = $('#component-send'), sendingSession = session; button.disabled = true;
    try {
      ensureUnchanged();
      if(!window.operitHost?.sendToChat){dialog.close();window.dispatchEvent(new CustomEvent('operit-ai-component',{detail:{requirement:$('#component-request').value}}));return;}
      if (!await resolveSource(sendingSession)) return; ensureUnchanged();
      const payload = context(); replyBase = JSON.stringify(baseDocument);
      const sentDocument = replyBase;
      const result = await window.operitHost.sendToChat(payload);
      if (sendingSession !== session || !dialog.open) return;
      if (result?.accepted !== true) throw new Error('对话未确认接收，请重试或复制上下文');
      if (sentDocument !== JSON.stringify(baseDocument)) throw new Error('组件已发送，但草稿随后发生变化，请重新发送最新上下文');
      feedback('组件源码引用与需求已发送到对话，AI 可据此修改功能和路由代码。');
      // Hosts may return a structured proposal; it is never auto-applied.
      if (result.proposal) $('#component-reply').value = JSON.stringify(result.proposal,null,2);
    } catch (e) { if (sendingSession === session) feedback(e.message); } finally { if (sendingSession === session) button.disabled = false; }
  };
  $('#component-copy').onclick = async () => {
    try { ensureUnchanged(); if (!await resolveSource()) return; ensureUnchanged(); } catch (e) { feedback(e.message); return; }
    try { await navigator.clipboard.writeText(JSON.stringify(context(),null,2)); replyBase = JSON.stringify(baseDocument); feedback('已复制组件、源码行号和需求，粘贴到 AI 对话后可直接定位实现。'); }
    catch (e) { $('#component-context-details').open = true; $('#component-context').select(); feedback('无法自动复制，请从展开的上下文中手动复制。'+e.message); }
  };
  function apply(next) {
    if (commit(next,componentId)) { baseDocument = structuredClone(next); $('#component-reply').value = ''; refreshContext(); feedback('路由已应用到草稿。关闭后切换运行模式，触摸组件验证；保存后同步固件。'); notify('组件路由已更新 · 切换运行模式测试，保存后同步固件'); }
    else feedback('路由未变化');
  }
  $('#component-apply-routes').onclick = () => {
    try { ensureUnchanged(); apply(applyRouteReply(baseDocument,componentId,{componentId,operations:[{op:'update',id:componentId,changes:{action:$('#component-click-route').value,longAction:$('#component-hold-route').value}}]})); }
    catch (e) { feedback(e.message); }
  };
  $('#component-apply-reply').onclick = () => {
    try {
      ensureUnchanged();
      if (replyBase && replyBase !== JSON.stringify(baseDocument)) throw new Error('回复基于旧草稿，请重新发送上下文');
      if ($('#component-reply').value.length > 65536) throw new Error('回复超过 64 KiB');
      const reply = JSON.parse($('#component-reply').value);
      const next = applyRouteReply(baseDocument,componentId,reply); apply(next);
      const node = findNode(next,componentId)?.node;
      $('#component-click-route').value = node.action; $('#component-hold-route').value = node.longAction || '';
    } catch (e) { feedback('未应用：'+e.message); }
  };
  return {open};
}
