import {readFile,writeFile,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {applyOperations,validate,catalog} from './layout-model.mjs';
import {routes} from './routes.mjs';
const root=new URL('../../',import.meta.url);
export const editableSources=[
 'apps/esp32/lvgl_port/operit_lvgl.c','apps/esp32/lvgl_port/operit_lvgl.h','apps/esp32/src/main.rs',
 'tools/esp32-debug/routes.mjs','tools/esp32-debug/layout-model.mjs','tools/esp32-debug/project-model.mjs',
 'tools/esp32-debug/compile-layout.mjs','tools/esp32-debug/editor.js','tools/esp32-debug/index.html',
 'tools/esp32-debug/style.css','tools/esp32-debug/app.js','tools/esp32-debug/pages.js',
 'apps/esp32/lvgl_port/layout_store.c','apps/esp32/lvgl_port/layout_store.h','apps/esp32/src/ui_deploy.rs',
 'tools/esp32-debug/package-layout.mjs','tools/esp32-debug/deploy.js',
];
const hash=text=>createHash('sha256').update(text).digest('hex');
async function readSource(path){if(!editableSources.includes(path))throw new Error('文件不在可编辑源码范围');const content=await readFile(new URL(path,root),'utf8');return {path,revision:hash(content),content};}
export async function previewCodeEdits(edits){
 if(!Array.isArray(edits)||!edits.length||edits.length>12)throw new Error('代码提案需要 1–12 项精确替换');
 const files=new Map();
 for(const edit of edits){
  const original=files.get(edit.path)||{...await readSource(edit.path)};
  if(original.revision!==edit.revision)throw new Error('源码已变化：'+edit.path+'，请重新读取');
  if(typeof edit.find!=='string'||!edit.find||typeof edit.replace!=='string')throw new Error('代码替换必须包含 find / replace');
  const content=original.updated??original.content,at=content.indexOf(edit.find);
  if(at<0||content.indexOf(edit.find,at+1)>=0)throw new Error('替换位置缺失或不唯一：'+edit.path);
  original.updated=content.slice(0,at)+edit.replace+content.slice(at+edit.find.length);files.set(edit.path,original);
 }
 return [...files.values()];
}
let writes=Promise.resolve();
async function applyCode(edits){
 const task=writes.then(async()=>{
  const files=await previewCodeEdits(edits);
  const applied=[];
  try{for(const file of files){const url=new URL(file.path,root),tmp=new URL(file.path+'.ai-tmp',root);await writeFile(tmp,file.updated);await rename(tmp,url);applied.push(file);}}
  catch(error){for(const file of applied)await writeFile(new URL(file.path,root),file.content);throw error;}
  return {files:files.map(f=>({path:f.path,revision:hash(f.updated)}))};
 });writes=task.catch(()=>{});return task;
}
async function limitedJSON(response,max=512*1024){let text='',size=0;const decoder=new TextDecoder();for await(const chunk of response.body){size+=chunk.byteLength;if(size>max)throw new Error('AI 响应过大');text+=decoder.decode(chunk,{stream:true});}return JSON.parse(text+decoder.decode());}
async function develop(input,signal){
 const {endpoint,model,key,context,task}=input;
 const url=new URL(endpoint.replace(/\/$/,'')+'/chat/completions');
 if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new Error('API 地址无效');
 if(typeof model!=='string'||!model.trim()||typeof task!=='string'||!task.trim())throw new Error('请填写模型和任务');
 if(validate(context?.document).length)throw new Error('当前布局无效');
 const system=`You implement Operit ESP32 UI projects. Reply in Chinese. Context contains the actual project, active page/component and source references. Use read_source to inspect existing source before proposing code changes. No shell execution. Return a JSON object {summary,operations:[],codeEdits:[]} without markdown. Layout operations: add (pageId,node), update (id,changes), remove(id), document(changes), addPage(page:{id,name,background,nodes,swipeLeft?,swipeRight?}), updatePage(id,changes), removePage(id). Root nodes are home; pages are additional pages. version2 enabled:true entryPage controls boot. All IDs unique globally, page IDs <=18 ASCII chars. 320x240, max12 pages,24 nodes/page,complexity40/page. Parent must earlier panel in same page. Text ASCII. Optional label binding clock/connection/expression and fontSize14/48. Actions go:PAGE_ID or registered routes. Composite buttons use panel + child buttons, not opaque buttonmatrix. Code edits use {path,revision,find,replace}, exact unique find from read_source. Propose only necessary changes. The user reviews before applying. Need implement new routes in shared C and catalogue; do not claim saved/built. Available sources: ${JSON.stringify(editableSources)}. Components: ${JSON.stringify(catalog)}. Routes: ${JSON.stringify(routes)}.`;
 const messages=[{role:'system',content:system},{role:'user',content:JSON.stringify({task,context})}];
 const tools=[{type:'function',function:{name:'read_source',description:'Read an allowed project source file and its revision',parameters:{type:'object',properties:{path:{type:'string',enum:editableSources}},required:['path'],additionalProperties:false}}}];
 for(let round=0;round<7;round++){
  if(Buffer.byteLength(JSON.stringify(messages))>768*1024)throw new Error('任务和源码上下文超过 768 KiB，请缩小任务范围');
  const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(key?{Authorization:'Bearer '+key}:{})},body:JSON.stringify({model,messages,tools,tool_choice:'auto'}),signal});
  if(!response.ok)throw new Error('AI 服务请求失败，HTTP '+response.status);
  const result=await limitedJSON(response),message=result.choices?.[0]?.message;if(!message)throw new Error('AI 服务未返回消息');
  if(message.tool_calls?.length){
   if(message.tool_calls.length>4)throw new Error('单轮读取源码过多');messages.push(message);
   for(const call of message.tool_calls){let output;try{if(call.function.name!=='read_source')throw new Error('不支持的工具');output=await readSource(JSON.parse(call.function.arguments).path);}catch(e){output={error:e.message};}messages.push({role:'tool',tool_call_id:call.id,content:JSON.stringify(output)});}continue;
  }
  const content=message.content||'',json=content.replace(/^\s*```(?:json)?\s*/,'').replace(/\s*```\s*$/,'');
  let proposal;try{proposal=JSON.parse(json);}catch{return {summary:content,operations:[],codeEdits:[],notice:'AI 未给出结构化修改，可继续描述任务。'};}
  if(proposal.operations?.length)applyOperations(context.document,proposal.operations);
  if(proposal.codeEdits?.length)await previewCodeEdits(proposal.codeEdits);
  return {summary:String(proposal.summary||'AI 修改提案'),operations:proposal.operations||[],codeEdits:proposal.codeEdits||[]};
 }
 throw new Error('源码读取轮数达到上限，请缩小任务范围');
}
export async function aiRoute(req,res,url){
 if(!['/api/ai/develop','/api/ai/apply-code'].includes(url.pathname))return false;
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),120000);
 res.on('close',()=>{if(!res.writableEnded)controller.abort();});
 try{
  if(req.method!=='POST'){res.writeHead(405);res.end();return true;}
  let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>256*1024)throw new Error('请求超过 256 KiB');}
  const input=JSON.parse(body),result=url.pathname.endsWith('apply-code')?await applyCode(input.codeEdits):await develop(input,controller.signal);
  res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(result));
 }catch(e){if(!res.destroyed){res.writeHead(400,{'Content-Type':'application/json'});res.end(JSON.stringify({error:controller.signal.aborted?'AI 请求已取消或超时':e.message}));}}finally{clearTimeout(timer);}
 return true;
}
