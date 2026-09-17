import {pagesOf,pageOf,pageEdges} from './project-model.mjs';
import {applyOperations} from './layout-model.mjs';
const $=selector=>document.querySelector(selector);
export function setupPages({snapshot,commit,selectPage}) {
  const dialog=$('#pages-dialog'),picker=$('#page-picker');
  function apply(operations){try{const state=snapshot();return commit(applyOperations(state.document,operations));}catch(e){$('#pages-feedback').textContent=e.message;return false;}}
  picker.onchange=()=>selectPage(picker.value);
  $('#manage-pages').onclick=()=>{render();dialog.showModal();};
  $('#pages-close').onclick=()=>dialog.close();
  $('#add-page').onclick=()=>{
    const state=snapshot(),id='screen_'+Date.now().toString(36).slice(-7),name=$('#new-page-name').value.trim()||'新页面';
    if(apply([{op:'addPage',page:{id,name,background:'#091420',nodes:[]}}])){selectPage(id);$('#new-page-name').value='';$('#pages-feedback').textContent='已新建页面。配置跳转按钮或滑动连接，让用户能进入此页。';}
  };
  $('#remove-page').onclick=()=>{
    const state=snapshot();if(state.pageId==='home')return;
    if(!confirm('删除当前页面及其组件？指向此页的跳转也会移除，可以撤销。'))return;
    if(apply([{op:'removePage',id:state.pageId}]))selectPage('home');
  };
  $('#entry-page').onchange=e=>apply([{op:'document',changes:{entryPage:e.target.value}}]);
  $('#page-name').onchange=e=>apply([{op:'updatePage',id:snapshot().pageId,changes:{name:e.target.value}}]);
  for(const [id,field] of [['page-swipe-left','swipeLeft'],['page-swipe-right','swipeRight']])$('#'+id).onchange=e=>apply([{op:'updatePage',id:snapshot().pageId,changes:{[field]:e.target.value}}]);
  function render(){
    const state=snapshot(),doc=state.document,pages=pagesOf(doc),active=pageOf(doc,state.pageId)||doc;
    const options=()=>pages.map(p=>new Option(p.name+(p.id===doc.entryPage?' · 启动':''),p.id));
    picker.replaceChildren(...options());picker.value=state.pageId;
    $('#entry-page').replaceChildren(...options());$('#entry-page').value=doc.entryPage||'home';
    $('#page-name').value=state.pageId==='home'?'首页':active.name;$('#page-name').disabled=state.pageId==='home';
    $('#remove-page').disabled=state.pageId==='home'||state.pageId===doc.entryPage;
    for(const [id,field] of [['page-swipe-left','swipeLeft'],['page-swipe-right','swipeRight']]){const select=$('#'+id);select.replaceChildren(new Option('无连接',''),...options());select.value=active[field]||'';}
    $('#page-count').textContent=pages.length+' / 12 页';
    const graph=$('#page-graph');graph.replaceChildren();
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
    const rows=Math.ceil(pages.length/3),width=850,height=rows*150+30;svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.style.width=width+'px';svg.style.height=height+'px';svg.setAttribute('aria-label','页面跳转关系图');
    const pos=new Map(pages.map((p,i)=>[p.id,{x:30+(i%3)*280,y:25+Math.floor(i/3)*150}]));
    const defs=document.createElementNS(ns,'defs');defs.innerHTML='<marker id="route-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8" fill="#85ddc9"/></marker>';svg.append(defs);
    const edges=pageEdges(doc),drawn=new Set();
    for(const edge of edges){const from=pos.get(edge.from),to=pos.get(edge.to),key=edge.from+'>'+edge.to;if(!from||!to||drawn.has(key)||edge.from===edge.to)continue;drawn.add(key);
      const path=document.createElementNS(ns,'path'),x1=from.x+200,y1=from.y+36,x2=to.x,y2=to.y+36;
      path.setAttribute('d',`M ${x1} ${y1} C ${x1+70} ${y1+60}, ${x2-60} ${y2+60}, ${x2} ${y2}`);path.setAttribute('fill','none');path.setAttribute('stroke','#85ddc960');path.setAttribute('stroke-width','2');path.setAttribute('marker-end','url(#route-arrow)');const title=document.createElementNS(ns,'title');title.textContent=edge.from+' → '+edge.to;path.append(title);svg.append(path);
    }
    for(const page of pages){const {x,y}=pos.get(page.id),g=document.createElementNS(ns,'g');g.setAttribute('transform',`translate(${x},${y})`);g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('aria-label','编辑页面 '+page.name);g.classList.add('graph-page');
      const rect=document.createElementNS(ns,'rect');rect.setAttribute('width','200');rect.setAttribute('height','78');rect.setAttribute('rx','10');rect.setAttribute('fill',page.id===state.pageId?'#23443e':'#202a38');rect.setAttribute('stroke',page.id===state.pageId?'#85ddc9':'#526175');g.append(rect);
      for(const [content,dy,size,color] of [[page.name+(page.id===doc.entryPage?' · 启动':''),29,14,'#eef6ff'],[`${page.id} · ${page.nodes.length} 组件`,54,11,'#9cafc3']]){const text=document.createElementNS(ns,'text');text.setAttribute('x','14');text.setAttribute('y',dy);text.setAttribute('fill',color);text.setAttribute('font-size',size);text.textContent=content;g.append(text);}
      g.onclick=()=>selectPage(page.id);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectPage(page.id);}};svg.append(g);
    }
    graph.append(svg);
    const list=$('#page-connections');list.replaceChildren();
    const currentEdges=edges.filter(e=>e.from===state.pageId);
    if(!currentEdges.length)list.textContent='此页面暂无出口。可设置左滑/右滑目标，或为组件添加点击跳转。';
    for(const edge of currentEdges){const row=document.createElement('button');row.textContent=`${edge.label} → ${pages.find(p=>p.id===edge.to)?.name||edge.to}`;row.onclick=()=>selectPage(edge.to);list.append(row);}
  }
  return {render};
}
