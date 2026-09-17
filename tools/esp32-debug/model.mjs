export const WIDTH=320,HEIGHT=240;
export function point(clientX,clientY,rect){return {x:Math.max(0,Math.min(319,Math.floor((clientX-rect.left)*320/rect.width))),y:Math.max(0,Math.min(239,Math.floor((clientY-rect.top)*240/rect.height)))};}
export function pixel(r,g,b,mode){
  if(mode==='rgb332'){const rr=r>>5,gg=g>>5,bb=b>>6;return [Math.round(rr*255/7),Math.round(gg*255/7),Math.round(bb*255/3)];}
  return [Math.round((r>>3)*255/31),Math.round((g>>2)*255/63),Math.round((b>>3)*255/31)];
}
