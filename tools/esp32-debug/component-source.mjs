import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {layoutSourceReference} from './source-reference.mjs';
const root = new URL('../../',import.meta.url);
const hash = text => createHash('sha256').update(text).digest('hex');
const anchors = [
  ['apps/esp32/lvgl_port/operit_lvgl.c','layout_action','static void layout_action('],
  ['apps/esp32/lvgl_port/operit_lvgl.c','operit_lvgl_layout_bind','void operit_lvgl_layout_bind('],
  ['apps/esp32/lvgl_port/operit_lvgl.c','page','static void page(const char *name) {'],
  ['apps/esp32/src/main.rs','device action dispatch','"run_node" =>'],
  ['tools/esp32-debug/routes.mjs','routes','export const routes ='],
];
export async function componentSource(componentId, revision) {
  if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,39}$/.test(componentId || '')) throw new Error('组件 ID 无效');
  const raw = await readFile(new URL('apps/esp32/ui/layout.json',root),'utf8');
  const currentRevision = hash(raw);
  if (revision && revision !== currentRevision) { const error = new Error('布局版本已变化，请关闭面板并同步最新布局后重新引用'); error.status = 409; throw error; }
  const files = new Map(await Promise.all([...new Set(anchors.map(a=>a[0]))].map(async path => [path,await readFile(new URL(path,root),'utf8')])));
  const implementation = anchors.map(([path,symbol,anchor]) => {
    const text = files.get(path), offset = text.indexOf(anchor);
    return {path,symbol,line:offset < 0 ? null : text.slice(0,offset).split('\n').length,revision:hash(text)};
  });
  return {revision:currentRevision,location:layoutSourceReference(raw,componentId,currentRevision),implementation};
}
