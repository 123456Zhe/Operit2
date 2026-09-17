#!/usr/bin/env node
/* Dependency-free adapter for Agents on any host with Node.js and HTTP access. */
const base=process.env.OPERIT_UI_URL||'http://127.0.0.1:8766';
const definitions=[
 {name:'ui_component_source',description:'Locate a component in the actual layout file: line range, JSON pointer, revision, excerpt, event binding and implementation source entrypoints. Use ID and re-read before coding.',inputSchema:{type:'object',properties:{id:{type:'string'},revision:{type:'string'}},required:['id'],additionalProperties:false}},
 {name:'ui_read',description:'Read shared UI JSON and revision. Read before editing.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'ui_components',description:'List LVGL components, click/long-press route capabilities, support status and resource limits.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'ui_patch',description:'Apply layout operations with optimistic revision checking. Saves shared source and triggers preview + firmware build.',inputSchema:{type:'object',properties:{revision:{type:'string'},operations:{type:'array',items:{type:'object'}}},required:['revision','operations'],additionalProperties:false}},
 {name:'ui_validate',description:'Validate a candidate document without changing files.',inputSchema:{type:'object',properties:{document:{type:'object'}},required:['document'],additionalProperties:false}},
 {name:'ui_build_status',description:'Read shared source and firmware build status.',inputSchema:{type:'object',properties:{},additionalProperties:false}},
 {name:'ui_build',description:'Build browser preview and ESP32 firmware. Never flashes hardware.',inputSchema:{type:'object',properties:{},additionalProperties:false}}
];
async function invoke(name,args={}){
 const routes={ui_component_source:['/api/component-source?'+new URLSearchParams({id:args.id||'',...(args.revision?{revision:args.revision}:{})}),'GET'],ui_read:['/api/layout','GET'],ui_components:['/api/components','GET'],ui_patch:['/api/layout','PATCH'],ui_validate:['/api/layout/validate','POST'],ui_build_status:['/api/build','GET'],ui_build:['/api/build','POST']};
 if(!routes[name])throw new Error('Unknown tool '+name);const [route,method]=routes[name];
 const res=await fetch(base+route,{method,headers:{'Content-Type':'application/json'},...(method==='GET'?{}:{body:JSON.stringify(args)})});
 const data=await res.json();if(!res.ok)throw new Error(`${res.status}: ${data.error||JSON.stringify(data)}`);return data;
}
if(process.argv.includes('--mcp')){
 const {createInterface}=await import('node:readline');const lines=createInterface({input:process.stdin});
 for await(const line of lines){let request;try{request=JSON.parse(line);if(request.id===undefined)continue;let result;
  if(request.method==='initialize')result={protocolVersion:'2024-11-05',capabilities:{tools:{}},serverInfo:{name:'operit-shared-ui',version:'1.0.0'}};
  else if(request.method==='ping')result={};
  else if(request.method==='tools/list')result={tools:definitions};
  else if(request.method==='tools/call'){try{result={content:[{type:'text',text:JSON.stringify(await invoke(request.params.name,request.params.arguments))}]};}catch(e){result={isError:true,content:[{type:'text',text:e.message}]};}}
  else{process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:request.id,error:{code:-32601,message:'Unknown method'}})+'\n');continue;}
  process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:request.id,result})+'\n');
 }catch(e){process.stdout.write(JSON.stringify({jsonrpc:'2.0',id:request?.id??null,error:{code:-32700,message:e.message}})+'\n');}}
}else{
 try{let args={};if(process.argv[3]){const input=process.argv[3];args=JSON.parse(input.startsWith('@')?await(await import('node:fs/promises')).readFile(input.slice(1),'utf8'):input);}console.log(JSON.stringify(await invoke(process.argv[2]||'ui_read',args),null,2));}catch(e){console.error(e.message);process.exitCode=1;}
}
