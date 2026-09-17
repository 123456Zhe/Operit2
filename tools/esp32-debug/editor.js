import {catalog, validate, applyOperations} from './layout-model.mjs';
import {request} from './transport.js';
import {routes} from './routes.mjs';
import {pagesOf,pageOf,findNode,projectRoutes,expandMatrix} from './project-model.mjs';
import {resizeFromCorner} from './geometry.mjs';
import {setupPages} from './pages.js';
import {setupAI} from './ai.js';
import {setupDeploy} from './deploy.js';
import {setupInteractions} from './interactions.js';
const $ = selector => document.querySelector(selector);
const symbols = {panel:'▣',label:'T',button:'▭',icon:'◈',arc:'◔',bar:'▰',slider:'⊶',switch:'⊷',checkbox:'☑',dropdown:'⌄',roller:'≡',textarea:'¶',spinbox:'±',led:'●',spinner:'◌',line:'╱',chart:'▥',table:'▦',buttonmatrix:'▦',list:'☷',calendar:'▦',keyboard:'⌨',tabview:'▤',tileview:'▣',scale:'┼',span:'Tt',menu:'☰',msgbox:'▢',win:'▣',image:'▧',animimg:'▧',imagebutton:'▧',canvas:'▧'};
const labels = {x:'横坐标 X',y:'纵坐标 Y',w:'宽度 W',h:'高度 H',radius:'圆角',value:'数值 0–100',color:'组件颜色',text:'显示内容',action:'点击动作',longAction:'长按动作',parent:'父容器',binding:'动态内容',fontSize:'字号'};

export async function setupEditor(ui, log) {
  const initial = await request('/api/layout');
  const initialErrors=validate(initial.document);if(initialErrors.length)throw new Error(initialErrors.join('; '));
  let doc = initial.document, revision = initial.revision, selected = null, editing = true;
  let activePage = initial.document.entryPage || 'home';
  const currentPage = (project=doc) => pageOf(project,activePage) || project;
  let holdTimer = null, holdPointer = null;
  let saved = JSON.stringify(doc), history = [], future = [], drag = null, saving = false, remotePending = false;
  const layer = $('#edit-layer'), palette = $('#component-list'), props = $('#properties'), tree = $('#layers');
  const copy = () => structuredClone(doc);
  const dirty = () => JSON.stringify(doc) !== saved;
  const notify = message => { $('#editor-status').textContent = message; };
  const snapshot=()=>({document:copy(),revision,dirty:dirty(),pageId:activePage,componentId:selected});
  const interactions = setupInteractions({snapshot,commit,notify});
  const pages = setupPages({snapshot,commit,selectPage});
  const ai = setupAI({snapshot,commit,notify});
  setupDeploy({snapshot,notify});
  function selectPage(id, run=false) { if(!pageOf(doc,id))return; finishDrag();activePage=id;selected=null;editing=!run;layer.hidden=run;$('#edit-mode').checked=!run;preview();render();notify(run?'运行页面 · '+id:'正在编辑页面 · '+id); }
  window.addEventListener('operit-navigate-page',e=>selectPage(e.detail,true));
  function cancelHold() { clearTimeout(holdTimer); holdTimer = null; holdPointer = null; }
  function openLogic(id) { cancelHold(); selected = id; drag = null; render(); interactions.open(id); }
  function buttons() {
    $('#save-layout').disabled = saving || !dirty();
    $('#save-layout').textContent = saving ? '保存中…' : '保存项目';
    $('#undo-layout').disabled = !history.length;
    $('#redo-layout').disabled = !future.length;
    for (const id of ['delete-node','duplicate-node','inspect-node','component-logic']) $('#'+id).disabled = !selected;
  }
  function change() { buttons(); notify(dirty() ? '未保存 · 保存项目后可下发到设备，无需编译' : '已恢复到保存版本'); }
  function checkpoint() { history.push(copy()); if (history.length > 20) history.shift(); future = []; }
  function absolute(n) {
    let x = n.x, y = n.y, p = n.parent;
    while (p) { const a = currentPage().nodes.find(node => node.id === p); x += a.x; y += a.y; p = a.parent; }
    return {x,y};
  }
  function preview() {
    if(!pageOf(doc,activePage))activePage=doc.entryPage||'home';
    const errors = validate(doc);
    if (errors.length) { notify(errors.join('; ')); return; }
    ui._operit_lvgl_layout_clear(parseInt(currentPage().background.slice(1),16));
    if(ui._operit_lvgl_layout_page_meta)ui.ccall('operit_lvgl_layout_page_meta',null,['string','string','string'],[activePage,currentPage().swipeLeft||'',currentPage().swipeRight||'']);
    currentPage().nodes.forEach(n => {
      const type = catalog.find(c => c.type === n.type), parent = n.parent ? currentPage().nodes.findIndex(p => p.id === n.parent) : -1;
      const result = ui.ccall('operit_lvgl_layout_add','number',Array(9).fill('number').concat(['string','string']),[type.code,parent,n.x,n.y,n.w,n.h,parseInt(n.color.slice(1),16),n.radius,n.value,n.text,n.action]);
      if (result < 0) notify('LVGL 组件创建失败：'+n.id);
      else if (ui._operit_lvgl_layout_bind) { ui.ccall('operit_lvgl_layout_bind',null,['number','string','string'],[result,n.action,n.longAction || '']);if(ui._operit_lvgl_layout_style)ui.ccall('operit_lvgl_layout_style',null,['number','string','number'],[result,n.binding||'',n.fontSize||14]); }
      else if (n.longAction || n.action.startsWith('page:')) notify('当前预览尚未包含新路由，请等待同源构建完成');
    });
  }
  function enterEdit() { editing = true; layer.hidden = false; $('#edit-mode').checked = true; }
  function commit(next, selection = selected) {
    const errors = validate(next);
    if (errors.length) { notify(errors.join('; ')); return false; }
    if (JSON.stringify(next) === JSON.stringify(doc)) return false;
    checkpoint(); doc = next; selected = selection; enterEdit(); preview(); render(); change(); return true;
  }
  function overlays() {
    layer.replaceChildren();
    for (const n of currentPage().nodes) {
      const el = document.createElement('div'), pos = absolute(n);
      el.className = 'editable-node'+(selected === n.id ? ' selected' : ''); el.dataset.id = n.id;
      el.style.cssText = `left:${pos.x/320*100}%;top:${pos.y/240*100}%;width:${n.w/320*100}%;height:${n.h/240*100}%`;
      el.title = n.id+' · '+n.type;
      if (selected === n.id) {
        const tag = document.createElement('span'); tag.textContent = n.id;
        el.append(tag);
        for(const corner of ['nw','ne','sw','se']){const handle=document.createElement('i');handle.className='resize-handle handle-'+corner;handle.dataset.corner=corner;el.append(handle);}
      }
      layer.append(el);
    }
  }
  function nudge(dx, dy) {
    if (!selected) return;
    const next = copy(), n = currentPage(next).nodes.find(n => n.id === selected), p = currentPage(next).nodes.find(p => p.id === n.parent);
    n.x = Math.max(0,Math.min((p?.w || 320)-n.w,n.x+dx));
    n.y = Math.max(0,Math.min((p?.h || 240)-n.h,n.y+dy));
    commit(next);
  }
  function fields() {
    for(const input of props.querySelectorAll('input,select,textarea'))input.onchange=null;
    props.replaceChildren(); const n = currentPage().nodes.find(n => n.id === selected);
    if (!n) { const empty = document.createElement('div'); empty.className = 'empty-state'; empty.innerHTML = '<span class="empty-icon">⌖</span>选择画布上的组件<br>或从组件库添加一个'; props.append(empty); return; }
    const title = document.createElement('strong'); title.textContent = catalog.find(c => c.type === n.type).label+' / '+n.id; props.append(title);
    for (const key of Object.keys(labels)) {
      const label = document.createElement('label'); label.textContent = labels[key];
      if (['text','action','longAction','parent','color','binding'].includes(key)) label.className = 'wide';
      let input;
      if (key === 'action' || key === 'longAction' || key === 'parent' || key === 'binding' || key === 'fontSize' || (key === 'text' && n.type === 'icon')) {
        input = document.createElement('select');
        const options = ['action','longAction'].includes(key) ? [...projectRoutes(doc),...routes].map(route => route.id) : key === 'binding' ? ['', 'clock','connection','expression'] : key === 'fontSize' ? ['14','48'] : key === 'text' ? ['face','wifi','settings','home','play','folder'] : ['',...currentPage().nodes.slice(0,currentPage().nodes.indexOf(n)).filter(p => p.type === 'panel').map(p => p.id)];
        options.forEach(v => input.add(new Option(['action','longAction'].includes(key) ? [...projectRoutes(doc),...routes].find(route => route.id === v).label : v || '无',v)));
      } else { input = document.createElement(key === 'text' ? 'textarea' : 'input'); if (input.tagName === 'INPUT') input.type = key === 'color' ? 'color' : typeof n[key] === 'number' ? 'number' : 'text'; }
      if (typeof n[key] === 'number') { input.step = '1'; input.min = ['w','h'].includes(key) ? '8' : '0'; }
      input.value = n[key] ?? (key==='fontSize'?14:''); input.dataset.property = key;
      input.onchange = () => {
        const next = copy(), node = currentPage(next).nodes.find(node => node.id === n.id);
        node[key] = typeof n[key] === 'number' || key==='fontSize' ? Number(input.value) : key === 'parent' ? input.value || null : input.value;
        if (!commit(next)) fields();
      };
      label.append(input); props.append(label);
    }
    const controls = document.createElement('div'); controls.className = 'nudge-controls';
    for (const [text,dx,dy,name] of [['←',-1,0,'左移 1 像素'],['↑',0,-1,'上移 1 像素'],['↓',0,1,'下移 1 像素'],['→',1,0,'右移 1 像素']]) {
      const b = document.createElement('button'); b.textContent = text; b.title = name; b.setAttribute('aria-label',name); b.onclick = () => nudge(dx,dy); controls.append(b);
    }
    props.append(controls);
    if(n.type==='buttonmatrix'){const expand=document.createElement('button');expand.className='wide';expand.textContent='展开为可编辑子按钮';expand.onclick=()=>{const next=copy(),nodes=currentPage(next).nodes,index=nodes.findIndex(c=>c.id===n.id);try{nodes.splice(index,1,...expandMatrix(n));commit(next);}catch(e){notify(e.message);}};props.append(expand);}
  }
  function render() {
    if(!pageOf(doc,activePage))activePage=doc.entryPage||'home';
    if (!currentPage().nodes.some(n => n.id === selected)) selected = null;
    overlays(); fields(); tree.replaceChildren();
    for (const n of currentPage().nodes) {
      const b = document.createElement('button'); b.textContent = (n.parent ? '↳ ' : '')+n.id;
      const type = document.createElement('small'); type.textContent = catalog.find(c => c.type === n.type).label; b.append(type);
      b.classList.toggle('active',selected === n.id); b.setAttribute('aria-pressed',String(selected === n.id));
      b.onclick = () => { selected = n.id; enterEdit(); preview(); render(); }; tree.append(b);
    }
    $('#node-count').textContent = currentPage().nodes.length+' / 24';
    $('#selection-name').textContent = selected || '选择组件开始编辑';
    $('#layout-enabled').checked = doc.enabled; $('#layout-bg').value = currentPage().background; buttons();pages.render();ai.updateContext();
  }
  function add(type,x=24,y=48) {
    const c = catalog.find(c => c.type === type); if (!c?.editable) return;
    const n = {id:type+'_'+Date.now().toString(36),type,parent:null,x:Math.max(0,Math.min(320-c.w,Math.round(x/4)*4)),y:Math.max(0,Math.min(240-c.h,Math.round(y/4)*4)),w:c.w,h:c.h,text:type === 'icon' ? 'face' : ['dropdown','roller'].includes(type) ? 'One\nTwo\nThree' : type === 'panel' ? '' : type,color:['label','icon','span'].includes(type) ? '#f4f8ff' : '#216c73',radius:12,value:50,action:''};
    const next = copy(); currentPage(next).nodes.push(...(type==='buttonmatrix'?expandMatrix(n):[n]));
    if (commit(next,n.id)) window.dispatchEvent(new Event('operit-component-added'));
  }
  for (const group of [...new Set(catalog.map(c => c.group))]) {
    const section = document.createElement('section'); section.className = 'component-group';
    const h = document.createElement('h3'); h.textContent = group; section.append(h);
    for (const c of catalog.filter(c => c.group === group)) {
      const b = document.createElement('button'); b.className = 'component-card'; b.dataset.type = c.type; b.dataset.search = (c.label+' '+c.type).toLowerCase();
      const symbol = document.createElement('span'); symbol.className = 'component-symbol'; symbol.textContent = symbols[c.type]; symbol.setAttribute('aria-hidden','true');
      const name = document.createElement('span'); name.textContent = c.label;
      const code = document.createElement('small'); code.textContent = c.type; b.append(symbol,name,code);
      if (!c.editable) { const reason = document.createElement('small'); reason.className = 'component-reason'; reason.textContent = '需资源接入'; b.append(reason); }
      b.draggable = c.editable; b.disabled = !c.editable; b.title = c.reason || '拖到屏幕或点击添加';
      b.ondragstart = e => e.dataTransfer.setData('text/plain',c.type); b.onclick = () => add(c.type); section.append(b);
    }
    palette.append(section);
  }
  $('#component-search').oninput = e => {
    const q = e.target.value.trim().toLowerCase(); let visible = 0;
    for (const section of palette.children) {
      let count = 0; for (const b of section.querySelectorAll('button')) { b.hidden = !b.dataset.search.includes(q); if (!b.hidden) count++; }
      section.hidden = !count; visible += count;
    }
    $('#search-empty').hidden = !!visible;
  };
  layer.ondragover = e => e.preventDefault();
  layer.ondrop = e => { e.preventDefault(); const r = layer.getBoundingClientRect(); add(e.dataTransfer.getData('text/plain'),(e.clientX-r.left)*320/r.width,(e.clientY-r.top)*240/r.height); };
  layer.oncontextmenu = e => {
    if (!editing) return; const el = e.target.closest('.editable-node'); if (!el) return;
    e.preventDefault(); openLogic(el.dataset.id);
  };
  $('#component-logic').onclick = () => { if (selected) openLogic(selected); };
  layer.onpointerdown = e => {
    cancelHold();
    if (e.button !== 0) return;
    const el = e.target.closest('.editable-node');
    if (!el) { selected = null; render(); return; }
    e.preventDefault(); selected = el.dataset.id;
    const n = currentPage().nodes.find(n => n.id === selected);
    drag = {id:selected,startX:e.clientX,startY:e.clientY,node:{...n},before:copy(),moved:false,resize:e.target.dataset.corner||null};
    layer.setPointerCapture(e.pointerId); render();
    if (e.pointerType !== 'mouse' && !drag.resize) {
      holdPointer = {x:e.clientX,y:e.clientY};
      holdTimer = setTimeout(() => { if (drag && !drag.moved) { const id = drag.id; if (layer.hasPointerCapture(e.pointerId)) layer.releasePointerCapture(e.pointerId); openLogic(id); } },550);
    }
  };
  layer.onpointermove = e => {
    if (!drag) return;
    if (holdPointer) {
      if (Math.hypot(e.clientX-holdPointer.x,e.clientY-holdPointer.y) <= 8) return;
      cancelHold();
    }
    const r = layer.getBoundingClientRect(), dx = Math.round((e.clientX-drag.startX)*320/r.width/4)*4, dy = Math.round((e.clientY-drag.startY)*240/r.height/4)*4;
    const n = currentPage().nodes.find(n => n.id === drag.id), p = currentPage().nodes.find(p => p.id === n.parent), w = p?.w || 320, h = p?.h || 240;
    if (!drag.moved && !dx && !dy) return;
    if (!drag.moved) { checkpoint(); drag.moved = true; }
    if (drag.resize) {
      Object.assign(n,resizeFromCorner(drag.node,drag.resize,dx,dy,w,h,currentPage().nodes.filter(c=>c.parent===n.id)));
    } else { n.x = Math.max(0,Math.min(w-n.w,drag.node.x+dx)); n.y = Math.max(0,Math.min(h-n.h,drag.node.y+dy)); }
    ui._operit_lvgl_layout_geometry(currentPage().nodes.indexOf(n),n.x,n.y,n.w,n.h); overlays(); change();
  };
  function finishDrag() { cancelHold(); if (!drag) return; if (drag.moved && JSON.stringify(drag.before) === JSON.stringify(doc)) history.pop(); drag = null; render(); }
  layer.onpointerup = finishDrag; layer.onpointercancel = finishDrag; layer.onlostpointercapture = finishDrag;
  $('#delete-node').onclick = () => {
    if (!selected) return;
    const next = copy(), ids = new Set([selected]); for (const n of currentPage(next).nodes) if (ids.has(n.parent)) ids.add(n.id);
    currentPage(next).nodes = currentPage(next).nodes.filter(n => !ids.has(n.id)); commit(next,null);
  };
  $('#duplicate-node').onclick = () => {
    if (!selected) return;
    const next = copy(), ids = new Map(), original = currentPage().nodes.find(n => n.id === selected), p = currentPage().nodes.find(n => n.id === original.parent);
    for (const n of currentPage().nodes) if (n.id === selected || ids.has(n.parent)) {
      const clone = {...n,id:n.type+'_'+Date.now().toString(36)+'_'+ids.size}; ids.set(n.id,clone.id);
      if (n.id === selected) { clone.x = Math.min((p?.w || 320)-n.w,n.x+8); clone.y = Math.min((p?.h || 240)-n.h,n.y+8); }
      else clone.parent = ids.get(n.parent);
      currentPage(next).nodes.push(clone);
    }
    commit(next,ids.get(selected));
  };
  function travel(from,to) { if (!from.length) return; to.push(copy()); if (to.length > 20) to.shift(); doc = from.pop(); enterEdit(); preview(); render(); change(); }
  $('#undo-layout').onclick = () => travel(history,future); $('#redo-layout').onclick = () => travel(future,history);
  $('#edit-mode').onchange = e => { editing = e.target.checked; layer.hidden = !editing; preview(); notify(editing ? '编辑模式 · 拖动组件，四角调整尺寸' : '运行模式 · 点击或滑动体验 LVGL 控件'); };
  $('#layout-enabled').onchange = e => { const next = copy(); next.enabled = e.target.checked; commit(next); };
  $('#layout-bg').onchange = e => { const next = copy(); currentPage(next).background = e.target.value; commit(next); };
  $('#save-layout').onclick = async () => {
    if (saving || !dirty()) return;
    const submitted = copy(), errors = validate(submitted); if (errors.length) { notify(errors.join('; ')); return; }
    saving = true; buttons();
    try {
      const result = await request('/api/layout',{method:'PUT',body:{revision,document:submitted}});
      revision = result.revision; saved = JSON.stringify(submitted);
      notify(dirty() ? '已保存提交版本；还有新修改未保存' : '已写入 apps/esp32/ui/layout.json · '+revision.slice(0,8)+' · 可部署到设备'); log('layout saved '+revision.slice(0,12));
    } catch (e) { notify(e.message); } finally { saving = false; buttons(); }
  };
  $('#reload-layout').onclick = async () => {
    if (saving || (dirty() && !confirm('丢弃未保存的布局修改并重新读取？'))) return;
    try {
      const before = JSON.stringify(doc), data = await request('/api/layout');
      if (JSON.stringify(doc) !== before || saving || drag) { notify('读取期间产生新修改，已保留草稿'); return; }
      doc = data.document; revision = data.revision; saved = JSON.stringify(doc); history = []; future = []; selected = null;
      enterEdit(); preview(); render(); notify('已读取最新布局');
    } catch (e) { notify(e.message); }
  };
  window.addEventListener('operit-runtime-navigation',() => { editing = false; layer.hidden = true; $('#edit-mode').checked = false; notify('运行内置页面 · 开启编辑布局可返回草稿'); });
  window.addEventListener('keydown',e => {
    const typing = e.target.closest?.('input,textarea,select,[contenteditable=true]'), mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); $('#save-layout').click(); return; }
    if (typing || !editing || $('#component-dialog').open || $('#ai-dialog').open || $('#pages-dialog').open || $('#deploy-dialog').open) return;
    if (selected && (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10'))) { e.preventDefault(); openLogic(selected); return; }
    if (mod && ['z','y','d'].includes(e.key.toLowerCase())) {
      e.preventDefault(); const key = e.key.toLowerCase(); $(key === 'd' ? '#duplicate-node' : key === 'y' || e.shiftKey ? '#redo-layout' : '#undo-layout').click();
    } else if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); $('#delete-node').click(); }
    else if (selected && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) {
      e.preventDefault(); const step = e.shiftKey ? 8 : 1; nudge(e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0,e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0);
    }
  });
  window.addEventListener('beforeunload',e => { if (dirty()) { e.preventDefault(); e.returnValue = ''; } });
  // Host integration reads state; mutations still use the revision-checked API.
  window.operitEditor = {isDirty:dirty, isEditing:() => editing, isBusy:() => saving || !!drag || $('#component-dialog').open || $('#ai-dialog').open || $('#pages-dialog').open || $('#deploy-dialog').open};
  setInterval(async () => {
    if (remotePending || window.operitEditor.isBusy() || document.hidden) return;
    remotePending = true;
    try {
      const requestedRevision = revision;
      const current = await request('/api/layout');
      if (saving || drag || revision !== requestedRevision) return;
      if (current.revision !== revision) {
        if (dirty()) { notify('AI 或其他编辑器已修改布局 · 草稿已保留，请在图层面板重新读取；读取会询问是否丢弃草稿'); return; }
        if(validate(current.document).length){notify('外部布局无效，保留当前页面');return;}
        doc = current.document; revision = current.revision; saved = JSON.stringify(doc); history = []; future = [];
        if (editing) preview(); render(); notify('已同步 AI / 外部编辑器的布局修改');
      }
    } catch { /* Offline does not destroy the local draft. */ } finally { remotePending = false; }
  },2000);
  preview(); render(); notify('正在编辑实际首页 · 保存项目后可下发到设备，无需编译');
}
