import {findNode,nodePointer} from './project-model.mjs';
// Parse offsets from the actual file, including minified JSON and escaped strings.
// Line numbers are hints at a particular revision; IDs remain the stable identity.
export function layoutSourceReference(text, componentId, revision) {
  const document = JSON.parse(text.replace(/^\uFEFF/,''));
  const found=findNode(document,componentId);
  if(!found)return null;
  const ranges = new Map(); let at = 0;
  const whitespace = () => { while (/\s/.test(text[at] || '') && at < text.length) at++; };
  function string() {
    const start = at++;
    while (at < text.length) { const c = text[at++]; if (c === '\\') at++; else if (c === '"') break; }
    return JSON.parse(text.slice(start,at));
  }
  function value(pointer) {
    whitespace(); const start = at;
    if (text[at] === '{') {
      at++; whitespace();
      while (text[at] !== '}') {
        const key = string(); whitespace(); at++;
        value(pointer+'/'+key.replace(/~/g,'~0').replace(/\//g,'~1'));
        whitespace(); if (text[at] !== ',') break; at++; whitespace();
      }
      at++;
    } else if (text[at] === '[') {
      at++; whitespace(); let child = 0;
      while (text[at] !== ']') { value(pointer+'/'+child++); whitespace(); if (text[at] !== ',') break; at++; }
      at++;
    } else if (text[at] === '"') string();
    else { while (at < text.length && !/[\s,}\]]/.test(text[at])) at++; }
    ranges.set(pointer,{start,end:at});
  }
  value('');
  const line = offset => text.slice(0,offset).split('\n').length;
  const jsonPointer = nodePointer(document,componentId), range = ranges.get(jsonPointer);
  const fields = {};
  for (const key of ['id','action','longAction']) {
    const field = ranges.get(jsonPointer+'/'+key);
    if (field) fields[key] = {line:line(field.start),jsonPointer:jsonPointer+'/'+key};
  }
  return {path:'apps/esp32/ui/layout.json',componentId,jsonPointer,revision,
    startLine:line(range.start),endLine:line(range.end-1),fields,
    excerpt:text.slice(range.start,range.end),component:found.node};
}
