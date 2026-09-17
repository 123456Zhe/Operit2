import {findNode,nodePointer,projectRoutes} from './project-model.mjs';
import {validate, applyOperations} from './layout-model.mjs';
import {routes, eventBindings} from './routes.mjs';

export function componentContext(document, componentId, revision, dirty, requirement = '', sourceReference = null) {
  const component = findNode(document,componentId)?.node;
  if (!component) throw new Error('组件已删除，请重新选择');
  return structuredClone({
    kind:'operit.hardware.component', version:2,
    source:'apps/esp32/ui/layout.json', revision, dirty, componentId, component,
    document, routes:[...projectRoutes(document),...routes], eventBindings, requirement,
    codeReference: sourceReference ? {
      ...sourceReference,
      status: !sourceReference.location ? 'unsaved-component' : JSON.stringify(sourceReference.location.component) === JSON.stringify(component) ? 'saved-component' : 'modified-component',
      draftPointer:nodePointer(document,componentId),
    } : {status:'unresolved',location:null},
    instructions: '这是用户选中的硬件组件代码引用。根据需求直接定位并修改布局、事件绑定和功能路由实现。用 componentId 核对组件；文件行号仅对应给定 revision，修改前重新读取源码。既有路由可修改 action / longAction；新增跳转页面或设备功能须同时实现共用 C/Rust 代码、路由目录与必要校验，并验证预览和固件构建。无需仅返回固定格式 JSON。dirty=true 时保留草稿，先协调草稿再改写布局；新组件未保存时没有磁盘行号。不要编辑生成的 layout.generated.h。',
  });
}

// Chat replies configure only this component's bindings, never execute code.
export function applyRouteReply(document, componentId, reply) {
  if (!reply || reply.componentId !== componentId) throw new Error('回复组件与当前组件不一致');
  if (!Array.isArray(reply.operations) || !reply.operations.length || reply.operations.length > 2) throw new Error('请提供 1–2 项路由 update 操作');
  for (const op of reply.operations) {
    if (op.op !== 'update' || op.id !== componentId || !op.changes || !Object.keys(op.changes).length || Object.keys(op.changes).some(key => !['action','longAction'].includes(key))) {
      throw new Error('这里只接受当前组件的 action / longAction 修改');
    }
  }
  const next = applyOperations(document, reply.operations);
  const errors = validate(next);
  if (errors.length) throw new Error(errors.join('; '));
  return next;
}
