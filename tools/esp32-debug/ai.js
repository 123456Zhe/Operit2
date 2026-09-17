import {applyOperations} from './layout-model.mjs';
import {pagesOf,findNode,nodePointer} from './project-model.mjs';
import {request} from './transport.js';
const $=s=>document.querySelector(s);
export function setupAI({snapshot,commit,notify}) {
 const dialog=$('#ai-dialog');let proposal=null,base='',controller=null,busy=false;
 const feedback=text=>$('#ai-feedback').textContent=text;
 function updateContext(){const state=snapshot();$('#ai-context-label').textContent=`${pagesOf(state.document).find(p=>p.id===state.pageId)?.name||'首页'} / ${state.componentId||'整页'}${state.dirty?' · 含未保存修改':''}`;}
 function provider(){const host=$('#ai-provider').value==='host';$('#ai-api-config').hidden=host;$('#ai-provider-status').textContent=host?(window.operitHost?.sendToChat?'已连接软件当前对话。发送当前页面/组件引用及开发任务。':'独立浏览器尚未连接软件对话；可复制任务到软件，或切换独立 API。'):'任务发送到你填写的服务。支持读取项目源码并提出布局与代码修改。';}
 function open(){updateContext();provider();if(!dialog.open)dialog.showModal();}
 window.addEventListener('operit-host-ready',provider);
 $('#open-ai').onclick=open;$('#ai-close').onclick=()=>dialog.close();$('#ai-provider').onchange=provider;
 window.addEventListener('operit-ai-component',e=>{$('#ai-task').value=e.detail?.requirement||'';open();});
 async function context(){
  const state=snapshot(),component=findNode(state.document,state.componentId)?.node;
  let source=null;if(component)source=await request('/api/component-source?id='+encodeURIComponent(component.id)+'&revision='+state.revision);
  return {...state,source,component,pointer:component?nodePointer(state.document,component.id):state.pageId==='home'?'/nodes':'/pages/'+state.document.pages.findIndex(p=>p.id===state.pageId),sourceFile:'apps/esp32/ui/layout.json',instruction:'请阅读引用的项目源码，根据任务实现布局、交互和功能路由。layout.json 是界面源文件，保存布局无需编译，可打包部署到运行时。保留当前未保存草稿；新增底层能力才修改 C/Rust 并构建基础固件。'};
 }
 function showProposal(result){proposal=result;$('#ai-answer').textContent=result.summary||'任务已发送到软件对话。';$('#ai-proposal').textContent=JSON.stringify({operations:result.operations||[],codeEdits:result.codeEdits||[]},null,2);$('#ai-apply').disabled=!result.operations?.length;$('#ai-apply-code').disabled=!result.codeEdits?.length;$('#ai-proposal-details').open=!!(result.operations?.length||result.codeEdits?.length);}
 $('#ai-copy').onclick=async()=>{try{const payload={task:$('#ai-task').value,context:await context()};await navigator.clipboard.writeText(JSON.stringify(payload,null,2));feedback('已复制任务和当前源码位置');}catch(e){feedback(e.message);}};
 $('#ai-send').onclick=async()=>{
  if(busy)return;const task=$('#ai-task').value.trim();if(!task){feedback('请填写开发任务');return;}
  proposal=null;$('#ai-apply').disabled=true;$('#ai-apply-code').disabled=true;busy=true;$('#ai-send').disabled=true;$('#ai-cancel').disabled=false;controller=new AbortController();const signal=controller.signal;
  try{const ctx=await context();base=JSON.stringify(ctx.document);feedback('正在处理任务…');
   if($('#ai-provider').value==='host'){
    if(!window.operitHost?.sendToChat)throw new Error('尚未连接软件当前对话，请复制任务或配置独立 API');
    const result=await window.operitHost.sendToChat({kind:'operit.hardware.task',version:2,task,context:ctx});if(signal.aborted)return;if(result?.accepted!==true)throw new Error('软件未确认接收');showProposal(result.proposal||{summary:'已发送到软件当前对话，Agent 将根据源码引用实施任务。'});feedback('软件对话已接收');
   }else{
    const response=await fetch('./api/ai/develop',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({endpoint:$('#ai-url').value.trim(),model:$('#ai-model').value.trim(),key:$('#ai-key').value,task,context:ctx}),signal});const result=await response.json();if(!response.ok)throw new Error(result.error);showProposal(result);feedback('提案已生成，请查看修改后应用');
   }
  }catch(e){feedback(signal.aborted?'已停止等待 AI 回复':e.message);}finally{busy=false;$('#ai-send').disabled=false;$('#ai-cancel').disabled=true;controller=null;}
 };
 $('#ai-cancel').onclick=()=>{controller?.abort();feedback('正在停止…');};
 $('#ai-apply').onclick=()=>{try{const state=snapshot();if(JSON.stringify(state.document)!==base)throw new Error('生成提案后布局已变化，请基于最新布局重新发送任务');const next=applyOperations(state.document,proposal.operations);if(commit(next)){base=JSON.stringify(next);$('#ai-apply').disabled=true;feedback('已应用到草稿，检查页面后保存项目并部署');notify('AI 已修改项目草稿');}}catch(e){feedback(e.message);}};
 $('#ai-apply-code').onclick=async()=>{if(!proposal?.codeEdits?.length)return;try{await request('/api/ai/apply-code',{method:'POST',body:{codeEdits:proposal.codeEdits}});$('#ai-apply-code').disabled=true;feedback('代码修改已写入项目；由开发环境运行 build.py --firmware 验证。布局提案仍需单独应用并保存。');}catch(e){feedback(e.message);}};
 return {updateContext};
}
