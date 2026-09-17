export function resizeFromCorner(node, corner, dx, dy, width, height, children=[]) {
  const minW=Math.max(8,...children.map(c=>c.x+c.w)),minH=Math.max(8,...children.map(c=>c.y+c.h));
  let {x,y,w,h}=node;
  if(corner.includes('w')){x=Math.max(0,Math.min(node.x+dx,node.x+node.w-minW));w=node.x+node.w-x;}
  else w=Math.max(minW,Math.min(width-x,node.w+dx));
  if(corner.includes('n')){y=Math.max(0,Math.min(node.y+dy,node.y+node.h-minH));h=node.y+node.h-y;}
  else h=Math.max(minH,Math.min(height-y,node.h+dy));
  return {x,y,w,h};
}
