import {pagesOf,pageOf,findNode,routeTarget} from './project-model.mjs';
import {actions} from './routes.mjs';
export {actions, routes, eventBindings} from './routes.mjs';
export const catalog = [
 ['panel','容器','基础',100,70],['label','文本','基础',120,24],['button','按钮','基础',100,40],['icon','图标','基础',48,48],
 ['arc','圆弧','数值',72,72],['bar','进度条','数值',140,20],['slider','滑块','输入',140,28],['switch','开关','输入',54,28],['checkbox','复选框','输入',140,28],['dropdown','下拉框','输入',130,36],['roller','滚轮','输入',100,80],['textarea','文本输入','输入',180,42],['spinbox','数值输入','输入',100,40],['led','指示灯','数值',24,24],['spinner','加载动画','数值',48,48],['line','线条','基础',100,20],['chart','图表','数值',180,95],['table','表格','容器',180,80],['buttonmatrix','按钮矩阵','输入',170,70],['list','列表','容器',150,95],['calendar','日历','容器',230,180],['keyboard','键盘','输入',280,110],['tabview','选项卡','容器',230,150],['tileview','滑动页','容器',230,150],['scale','刻度','数值',150,60],['span','富文本','基础',160,40],['menu','菜单','容器',180,130],['msgbox','消息框','容器',220,130],['win','窗口','容器',220,150],
 ['image','图片','资源',80,80,'需要嵌入图片资源，暂不支持拖入'],['animimg','序列帧','资源',80,80,'需要序列帧资源，暂不支持拖入'],['imagebutton','图片按钮','资源',80,48,'需要各状态图片，暂不支持拖入'],['canvas','像素画布','资源',100,80,'需要像素缓冲区，暂不支持拖入']
].map(([type,label,group,w,h,reason],index)=>({type,label,group,w,h,code:index,editable:!reason,reason:reason||null}));
const color=/^#[0-9a-fA-F]{6}$/;
const id=/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/;
function validatePage(doc, allowedActions=actions){
 const errors=[];const add=s=>errors.push(s);
 if(!doc||typeof doc!=='object'||Array.isArray(doc))return ['布局必须是对象'];
 for(const key of Object.keys(doc))if(!['version','width','height','enabled','background','nodes'].includes(key))add('未知文档字段 '+key);
 if(doc.version!==1)add('version 必须为 1');
 if(doc.width!==320||doc.height!==240)add('当前板型仅支持 320×240');
 if(typeof doc.enabled!=='boolean')add('enabled 必须为布尔值');
 if(!color.test(doc.background))add('background 必须为 #RRGGBB');
 if(!Array.isArray(doc.nodes)||doc.nodes.length>24)return [...errors,'nodes 必须为数组，最多 24 个组件'];
 const seen=new Map();let cost=0;
 for(const [i,n] of doc.nodes.entries()){
  const prefix=`nodes[${i}]`;if(!n||typeof n!=='object'){add(prefix+' 无效');continue;}
  for(const key of Object.keys(n))if(!['id','type','parent','x','y','w','h','text','color','radius','value','action','longAction','binding','fontSize'].includes(key))add(prefix+' 未知字段 '+key);
  const item=catalog.find(c=>c.type===n.type);if(!item?.editable)add(prefix+' 组件尚不支持: '+n.type);
  cost+=['calendar','keyboard','menu','msgbox','win','tabview','tileview'].includes(n.type)?5:1;
  if(!id.test(n.id)||seen.has(n.id))add(prefix+' ID 无效或重复');
  const parent=n.parent?seen.get(n.parent):null;if(n.parent&&(!parent||parent.type!=='panel'))add(prefix+' parent 必须引用前面声明的 panel');
  for(const field of ['x','y','w','h','radius','value'])if(!Number.isInteger(n[field]))add(prefix+'.'+field+' 必须是整数');
  if(n.x<0||n.y<0||n.w<8||n.h<8||n.x+n.w>(parent?.w||320)||n.y+n.h>(parent?.h||240))add(prefix+' 组件超出父容器');
  if(n.radius<0||n.radius>120||n.value<0||n.value>100)add(prefix+' radius/value 超限');
  if(typeof n.text!=='string'||new TextEncoder().encode(n.text).length>160||n.text.includes('\0'))add(prefix+' text 最多 160 字节，不能含 NUL');
  // This firmware currently embeds Montserrat only; do not silently render missing glyphs.
  if(typeof n.text==='string'&&/[^\x20-\x7e\n]/.test(n.text))add(prefix+' 当前固件字体仅支持 ASCII 文本');
  if(!color.test(n.color))add(prefix+' color 无效');
  if(!allowedActions.includes(n.action))add(prefix+' action 不支持');
  if(n.longAction!==undefined&&!allowedActions.includes(n.longAction))add(prefix+' longAction 不支持');
  if(n.type==='icon'&&!['face','wifi','settings','home','play','folder'].includes(n.text))add(prefix+' icon text 请选择 face/wifi/settings/home/play/folder');
  if(n.binding!==undefined&&!['','clock','connection','expression'].includes(n.binding))add(prefix+' binding 不支持');
  if(n.binding && n.type!=='label')add(prefix+' 动态绑定仅用于文本');
  if(n.fontSize!==undefined&&![14,48].includes(n.fontSize))add(prefix+' fontSize 仅支持 14/48');
  seen.set(n.id,n);
 }
 if(cost>40)add('组件复杂度超出 64 KiB LVGL 池的编辑器预算 (40)');
 return errors;
}
export function validate(doc){
 if(doc?.version!==2)return validatePage(doc);
 const errors=[];
 for(const key of Object.keys(doc))if(!['version','width','height','enabled','background','nodes','pages','entryPage','swipeLeft','swipeRight'].includes(key))errors.push('未知文档字段 '+key);
 if(!Array.isArray(doc.pages)||doc.pages.length>11)return ['最多 12 个页面（含首页）'];
 const pages=pagesOf(doc),ids=new Set(['home']),nodeIds=new Set();
 for(const page of doc.pages){if(!page||typeof page!=='object')return ['页面无效'];if(!/^[a-zA-Z][a-zA-Z0-9_-]{0,17}$/.test(page.id)||ids.has(page.id))errors.push('页面 ID 无效或重复');ids.add(page.id);if(typeof page.name!=='string'||page.name.length>40)errors.push('页面名称最多 40 字符');for(const key of Object.keys(page))if(!['id','name','background','nodes','swipeLeft','swipeRight'].includes(key))errors.push('未知页面字段 '+key);}
 if(!ids.has(doc.entryPage))errors.push('启动页面不存在');
 const allowed=[...actions,...pages.map(p=>'go:'+p.id)];
 for(const page of pages){
  for(const error of validatePage({version:1,width:doc.width,height:doc.height,enabled:doc.enabled,background:page.background,nodes:page.nodes},allowed))errors.push(page.id+': '+error);
  for(const field of ['swipeLeft','swipeRight'])if(page[field]&&!ids.has(page[field]))errors.push(page.id+' 滑动目标不存在');
  for(const node of Array.isArray(page.nodes)?page.nodes:[]){if(!node)continue;if(nodeIds.has(node.id))errors.push('跨页面组件 ID 重复 '+node.id);nodeIds.add(node.id);for(const field of ['action','longAction']){const target=routeTarget(node[field]);if(target&&!ids.has(target))errors.push('跳转页面不存在 '+target);}}
 }
 return errors;
}
export function applyOperations(doc,operations){
 if(!Array.isArray(operations)||operations.length>64)throw new Error('operations 最多 64 项');
 const next=structuredClone(doc);
 for(const op of operations){
  if(!op||typeof op!=='object')throw new Error('操作必须是对象');
  if(op.op==='add'){const page=pageOf(next,op.pageId||'home');if(!page)throw new Error('页面不存在');page.nodes.push(op.node);}
  else if(op.op==='update'){const n=findNode(next,op.id)?.node;if(!n)throw new Error('未知组件 '+op.id);if(op.changes?.id&&op.changes.id!==op.id)throw new Error('不能修改 ID');Object.assign(n,op.changes);}
  else if(op.op==='remove'){for(const page of [next,...(next.pages||[])]){const remove=new Set([op.id]);for(const n of page.nodes)if(remove.has(n.parent))remove.add(n.id);page.nodes=page.nodes.filter(n=>!remove.has(n.id));}}
  else if(op.op==='document'){for(const k of Object.keys(op.changes||{})){if(!['background','enabled','entryPage','swipeLeft','swipeRight'].includes(k))throw new Error('不可修改文档字段 '+k);next[k]=op.changes[k];}}
  else if(op.op==='addPage'){if(next.version!==2)throw new Error('需要 v2 项目');next.pages.push(op.page);}
  else if(op.op==='updatePage'){const page=pageOf(next,op.id);if(!page)throw new Error('页面不存在');for(const k of Object.keys(op.changes||{})){if(!['name','background','swipeLeft','swipeRight'].includes(k)||op.id==='home'&&k==='name')throw new Error('不可修改页面字段 '+k);page[k]=op.changes[k];}}
  else if(op.op==='removePage'){if(op.id==='home')throw new Error('不能删除首页');if(next.entryPage===op.id)throw new Error('先更换启动页面');next.pages=next.pages.filter(p=>p.id!==op.id);for(const page of [next,...next.pages]){for(const field of ['swipeLeft','swipeRight'])if(page[field]===op.id)page[field]='';for(const n of page.nodes)for(const field of ['action','longAction'])if(routeTarget(n[field])===op.id)n[field]='';}}
  else throw new Error('未知操作 '+op.op);
 }
 const errors=validate(next);if(errors.length)throw new Error(errors.join('; '));return next;
}
