import {readFile,writeFile,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {componentSource} from './component-source.mjs';
import {projectRoutes} from './project-model.mjs';
import {validate,applyOperations,catalog,actions,routes,eventBindings} from './layout-model.mjs';
export const documentPath=new URL('../../apps/esp32/ui/layout.json',import.meta.url);
export async function loadLayout(){const data=await readFile(documentPath,'utf8');return {document:JSON.parse(data.replace(/^\uFEFF/,'')),revision:createHash('sha256').update(data).digest('hex')};}
let writes=Promise.resolve();
export function saveLayout(revision,document,operations){
 const result=writes.then(async()=>{
  const current=await loadLayout();if(!revision||revision!==current.revision){const e=new Error('布局已被其他编辑器或 Agent 修改，请重新读取');e.status=409;throw e;}
  const next=operations?applyOperations(current.document,operations):document;
  const errors=validate(next);if(errors.length){const e=new Error(errors.join('; '));e.status=422;throw e;}
  if(JSON.stringify(next)===JSON.stringify(current.document))return current;
  const tmp=new URL('../../apps/esp32/ui/layout.json.tmp',import.meta.url);
  await writeFile(tmp,JSON.stringify(next,null,2)+'\n');await rename(tmp,documentPath);return loadLayout();
 });writes=result.catch(()=>{});return result;
}
export async function layoutRoute(req,res,url){
 if(!['/api/layout','/api/components','/api/layout/validate','/api/component-source'].includes(url.pathname))return false;
 const respond=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
 try{
  if(url.pathname==='/api/component-source'){if(req.method!=='GET'){respond(405,{error:'GET required'});return true;}respond(200,await componentSource(url.searchParams.get('id'),url.searchParams.get('revision')));return true;}
  if(url.pathname==='/api/components'){if(req.method!=='GET'){respond(405,{error:'GET required'});return true;}const dynamic=projectRoutes((await loadLayout()).document);respond(200,{catalog,maxPages:12,maxNodesPerPage:24,maxComplexityPerPage:40,actions:[...actions,...dynamic.map(r=>r.id)],routes:[...routes,...dynamic],eventBindings});return true;}
  if(req.method==='GET'&&url.pathname==='/api/layout'){respond(200,await loadLayout());return true;}
  if(!['PUT','PATCH','POST'].includes(req.method)){respond(405,{error:'Unsupported method'});return true;}
  let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>65536){respond(413,{error:'Layout body exceeds 64 KiB'});return true;}}
  const input=JSON.parse(body);
  if(url.pathname==='/api/layout/validate'){respond(200,{errors:validate(input.document||input)});return true;}
  if(!['PUT','PATCH'].includes(req.method)){respond(405,{error:'Use PUT or PATCH'});return true;}
  const saved=await saveLayout(input.revision,input.document,req.method==='PATCH'?input.operations:null);respond(200,saved);
 }catch(e){respond(e.status||400,{error:e.message});}
 return true;
}
