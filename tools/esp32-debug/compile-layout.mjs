import {readFile,writeFile} from 'node:fs/promises';
import {validate,catalog} from './layout-model.mjs';
import {pagesOf} from './project-model.mjs';
const source=new URL('../../apps/esp32/ui/layout.json',import.meta.url),output=new URL('../../apps/esp32/lvgl_port/layout.generated.h',import.meta.url);
const doc=JSON.parse((await readFile(source,'utf8')).replace(/^\uFEFF/,''));
const errors=validate(doc);if(errors.length)throw new Error(errors.join('\n'));
const quote=s=>JSON.stringify(s),pages=pagesOf(doc);
let content='/* Generated from apps/esp32/ui/layout.json; edit JSON, not this file. */\n';
content+=`#define OPERIT_LAYOUT_ENABLED ${doc.enabled?1:0}\n#define OPERIT_LAYOUT_ENTRY ${quote(doc.entryPage||'home')}\n`;
for(const [index,page] of pages.entries()){
 const rows=page.nodes.map(n=>` {${catalog.find(c=>c.type===n.type).code},${n.parent?page.nodes.findIndex(p=>p.id===n.parent):-1},${n.x},${n.y},${n.w},${n.h},0x${n.color.slice(1)},${n.radius},${n.value},${quote(n.text)},${quote(n.action)},${quote(n.longAction||'')},${quote(n.binding||'')},${n.fontSize||14}}`);
 content+=`static const operit_layout_node_t layout_page_${index}[] = {\n${rows.length?rows.join(',\n'):' {0}'}\n};\n`;
}
content+='static const operit_layout_page_t layout_pages[] = {\n'+pages.map((p,i)=>` {${quote(p.id)},0x${p.background.slice(1)},layout_page_${i},${p.nodes.length},${quote(p.swipeLeft||'')},${quote(p.swipeRight||'')}}`).join(',\n')+'\n};\n#define OPERIT_PAGE_COUNT '+pages.length+'\n';
let old='';try{old=await readFile(output,'utf8');}catch{}
if(old!==content)await writeFile(output,content);
