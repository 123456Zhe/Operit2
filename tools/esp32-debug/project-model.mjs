// The root nodes are the home page (compatible with version 1). Other pages
// share the same schema; only the active page occupies LVGL runtime memory.
export function pagesOf(doc) {
  return [{id:'home',name:'首页',...doc},...(doc.pages || [])];
}
export function pageOf(doc, id='home') { return id === 'home' ? doc : doc.pages?.find(page=>page.id===id); }
export function findNode(doc, id) {
  for (const page of pagesOf(doc)) { const node=page.nodes?.find(n=>n.id===id); if(node)return {node,pageId:page.id}; }
  return null;
}
export function nodePointer(doc, id) {
  const found=findNode(doc,id);if(!found)return null;
  const page=pageOf(doc,found.pageId),index=page.nodes.findIndex(n=>n.id===id);
  return found.pageId==='home'?`/nodes/${index}`:`/pages/${doc.pages.findIndex(p=>p.id===found.pageId)}/nodes/${index}`;
}
export function projectRoutes(doc) {
  return pagesOf(doc).map(page=>({id:'go:'+page.id,label:'页面 · '+page.name,kind:'navigate',target:page.id}));
}
export function routeTarget(action) {
  if(typeof action!=='string')return null;
  if(action?.startsWith('go:'))return action.slice(3);
  if(action==='home'||action==='apps')return action;
  if(action?.startsWith('page:'))return action.slice(5);
  return null;
}
export function pageEdges(doc) {
  const edges=[];
  for(const page of pagesOf(doc)) {
    for(const field of ['swipeLeft','swipeRight']) if(page[field])edges.push({from:page.id,to:page[field],label:field==='swipeLeft'?'左滑':'右滑',field});
    for(const node of page.nodes)for(const field of ['action','longAction']){const to=routeTarget(node[field]);if(to)edges.push({from:page.id,to,nodeId:node.id,field,label:`${node.text||node.id} · ${field==='action'?'点击':'长按'}`});}
  }
  return edges;
}
export function expandMatrix(node) {
  const {w,h}=node,gap=4,half=Math.floor((w-gap)/2),row=Math.floor((h-gap)/2);
  if(half<8||row<8)throw new Error('矩阵至少需要 20 × 20 像素才能展开');
  const labels=(node.text.includes('|')?node.text.split('|'):['One','Two','Three']);
  return [{...node,type:'panel',text:'',action:'',longAction:''},...[[0,0,half,row],[half+gap,0,w-half-gap,row],[0,row+gap,w,h-row-gap]].map(([x,y,w,h],i)=>({
    ...node,id:node.id.slice(0,33)+'_cell'+i,type:'button',parent:node.id,x,y,w,h,text:labels[i]||`Button ${i+1}`,radius:Math.min(node.radius,8),
  }))];
}
