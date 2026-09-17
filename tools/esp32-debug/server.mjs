import http from 'node:http';
import {aiRoute} from './ai-api.mjs';
import {deployRoute} from './deploy-api.mjs';
import {layoutRoute} from './layout-api.mjs';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url)),uiRoot=path.resolve(root,'../../apps/esp32/lvgl_port'),source=path.join(uiRoot,'operit_lvgl.c');
const argument=process.argv.indexOf('--port'),port=Number(argument>=0?process.argv[argument+1]:process.env.PORT||8766);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid port');
const files=new Map([['/','index.html'],['/app.js','app.js'],['/project-model.mjs','project-model.mjs'],['/geometry.mjs','geometry.mjs'],['/pages.js','pages.js'],['/ai.js','ai.js'],['/shell.js','shell.js'],['/transport.js','transport.js'],['/routes.mjs','routes.mjs'],['/component-context.mjs','component-context.mjs'],['/interactions.js','interactions.js'],['/model.mjs','model.mjs'],['/style.css','style.css'],['/editor.js','editor.js'],['/layout-model.mjs','layout-model.mjs'],['/generated/ui.mjs','generated/ui.mjs'],['/generated/ui.wasm','generated/ui.wasm'],['/generated/manifest.json','generated/manifest.json']]);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.wasm':'application/wasm','.json':'application/json','.css':'text/css; charset=utf-8'};
let running=false,error=null,queued=false,timer,output='';
for(const name of ['deploy.js','package-layout.mjs'])files.set('/'+name,name);
async function hash(){
 const names=await readdir(uiRoot);const files=[...names.filter(n=>n.endsWith('.c')).sort(),...names.filter(n=>n.endsWith('.h')&&n!=='layout.generated.h').sort()];
 const h=createHash('sha256');for(const n of files)h.update(await readFile(path.join(uiRoot,n)));const rust=path.resolve(uiRoot,'../src');for(const n of (await readdir(rust)).filter(n=>n.endsWith('.rs')).sort())h.update(await readFile(path.join(rust,n)));h.update(await readFile(path.resolve(uiRoot,'../partitions.csv')));return h.digest('hex');
}
async function status(){let manifest=null;try{manifest=JSON.parse(await readFile(path.join(root,'generated/manifest.json'),'utf8'));}catch{}return {running,error,manifest,stale:manifest?.runtimeHash!==await hash(),output:output.slice(-3000)};}
function build(){if(running){queued=true;return;}running=true;error=null;output='';const child=spawn('python',['-X','utf8',path.join(root,'build.py'),'--firmware'],{cwd:root,windowsHide:true});const append=d=>{output=(output+d).slice(-16000);};child.stdout.on('data',append);child.stderr.on('data',append);child.on('error',e=>{error=e.message;running=false;});child.on('close',code=>{running=false;if(code!==0)error='查看 tools/esp32-debug/generated 的构建日志；'+output.slice(-700);if(queued){queued=false;build();}});}
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 try{
  if(!['GET','HEAD'].includes(req.method)){const origin=req.headers.origin;if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host)||(origin&&origin!==`http://${req.headers.host}`)){res.writeHead(403);res.end();return;}}
  if(await aiRoute(req,res,url))return;
  if(await deployRoute(req,res,url))return;
  if(await layoutRoute(req,res,url))return;
  if(url.pathname==='/api/build'){
   if(req.method==='POST'){
    // A browser on another origin cannot start local builds.
    const origin=req.headers.origin;
    if(req.headers.host!==`127.0.0.1:${port}`&&req.headers.host!==`localhost:${port}`){res.writeHead(403);res.end();return;}
    if(origin&&origin!==`http://${req.headers.host}`){res.writeHead(403);res.end();return;}
    if(!running)build();
   }else if(req.method!=='GET'){res.writeHead(405);res.end();return;}
   res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(await status()));return;
  }
  if(req.method!=='GET'){res.writeHead(405);res.end();return;}
  if(url.pathname==='/api/board'){
   const c=await readFile(source,'utf8');const themes=[...c.matchAll(/\{0x([\da-f]+),\s*0x([\da-f]+),\s*0x([\da-f]+),\s*0x([\da-f]+),\s*"([^"]+)"\}/gi)].map(m=>({name:m[5],bg:'#'+m[1],surface:'#'+m[2],accent:'#'+m[3],muted:'#'+m[4]}));
   res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({model:'ESP32-2432S028',width:320,height:240,controller:'ST7789',themes,mode:'shared-lvgl-wasm'}));return;
  }
  const file=files.get(url.pathname);if(!file){res.writeHead(404);res.end('Not found');return;}
  const data=await readFile(path.join(root,file));res.writeHead(200,{'Content-Type':mime[path.extname(file)],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);
 }catch(e){res.writeHead(e.code==='ENOENT'?404:500,{'Content-Type':'text/plain; charset=utf-8'});res.end(e.message);}
});
// Builds are explicit developer operations; editing data never starts a compiler.
server.on('error',e=>{console.error(e);process.exit(1);});
server.listen(port,'127.0.0.1',()=>console.log(`ESP32 shared LVGL debugger: http://127.0.0.1:${port}`));
