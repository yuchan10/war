import { CONFIG } from './config.js';
import { clamp, direction } from './core.js';

// Level geometry is data; collision, navigation and rendering share this list.
export const WALLS = [
  { x:270, y:175, w:190, h:38 }, { x:270, y:213, w:38, h:120 },
  { x:740, y:507, w:190, h:38 }, { x:892, y:387, w:38, h:120 },
  { x:740, y:175, w:150, h:44 }, { x:310, y:501, w:150, h:44 },
  { x:554, y:190, w:92, h:52 }, { x:554, y:478, w:92, h:52 },
];

export function sweepBox(x,y,dx,dy,box,r=0) {
  let enter=0,exit=1,nx=0,ny=0;
  for(const [p,d,min,max,ax,ay] of [[x,dx,box.x-r,box.x+box.w+r,1,0],[y,dy,box.y-r,box.y+box.h+r,0,1]]) {
    if(Math.abs(d)<1e-9){if(p<min||p>max)return null;continue;}
    let near=(min-p)/d,far=(max-p)/d,sign=-1;
    if(near>far){[near,far]=[far,near];sign=1;}
    if(near>enter){enter=near;nx=ax*sign;ny=ay*sign;}
    if(near===enter&&nx===0&&ny===0){nx=ax*sign;ny=ay*sign;}
    exit=Math.min(exit,far);if(enter>exit)return null;
  }
  return enter>=0&&enter<=1&&exit>=0?{t:enter,nx,ny}:null;
}

export function hasLineOfSight(from,to,walls=WALLS){
  return !walls.some(w=>sweepBox(from.x,from.y,to.x-from.x,to.y-from.y,w,6));
}

export function moveBody(body,dx,dy,walls=WALLS) {
  // Substeps prevent dash/knockback tunnelling; axes slide along cover.
  const count=Math.max(1,Math.ceil(Math.hypot(dx,dy)/6));
  for(let i=0;i<count;i++)for(const axis of ['x','y']) {
    body[axis]+=(axis==='x'?dx:dy)/count;
    for(const w of walls){
      const cx=clamp(body.x,w.x,w.x+w.w),cy=clamp(body.y,w.y,w.y+w.h);
      const ox=body.x-cx,oy=body.y-cy,d=Math.hypot(ox,oy);
      if(d>=body.radius)continue;
      if(d>1e-6){body.x+=ox/d*(body.radius-d);body.y+=oy/d*(body.radius-d);}
      else {const faces=[{v:Math.abs(body.x-w.x),axis:'x',p:w.x-body.radius},{v:Math.abs(body.x-w.x-w.w),axis:'x',p:w.x+w.w+body.radius},{v:Math.abs(body.y-w.y),axis:'y',p:w.y-body.radius},{v:Math.abs(body.y-w.y-w.h),axis:'y',p:w.y+w.h+body.radius}];faces.sort((a,b)=>a.v-b.v);body[faces[0].axis]=faces[0].p;}
    }
    const a=CONFIG.arena;
    body.x=clamp(body.x,a.left+body.radius,a.right-body.radius);
    body.y=clamp(body.y,a.top+body.radius,a.bottom-body.radius);
  }
}

const a=CONFIG.arena;
const boundaries=[{x:a.left-40,y:a.top-40,w:40,h:a.bottom-a.top+80},{x:a.right,y:a.top-40,w:40,h:a.bottom-a.top+80},{x:a.left-40,y:a.top-40,w:a.right-a.left+80,h:40},{x:a.left-40,y:a.bottom,w:a.right-a.left+80,h:40}];
export function traceBullet(b,dt,walls=WALLS,onSegment=()=>false,onImpact=()=>{}) {
  if(!b.active)return;
  const dx=b.vx*dt,dy=b.vy*dt;let nearest=null;
  for(const wall of [...walls,...boundaries]){
    const hit=sweepBox(b.x,b.y,dx,dy,wall,b.radius);
    if(hit&&(!nearest||hit.t<nearest.t))nearest=hit;
  }
  const t=nearest?nearest.t:1;
  b.px=b.x;b.py=b.y;b.x+=dx*t;b.y+=dy*t;
  if(onSegment(b))return;
  if(nearest){b.active=false;onImpact(b);}
}

function clearPath(from,to,r,walls){return !walls.some(w=>sweepBox(from.x,from.y,to.x-from.x,to.y-from.y,w,r));}
export function routeDirection(entity,target,walls=WALLS){
  const r=entity.radius+4;
  if(clearPath(entity,target,r,walls))return direction(target.x-entity.x,target.y-entity.y);
  const nodes=[entity,target];
  for(const w of walls)for(const x of [w.x-r-2,w.x+w.w+r+2])for(const y of [w.y-r-2,w.y+w.h+r+2]){
    if(x<a.left+r||x>a.right-r||y<a.top+r||y>a.bottom-r)continue;
    if(walls.some(q=>x>q.x-r&&x<q.x+q.w+r&&y>q.y-r&&y<q.y+q.h+r))continue;
    nodes.push({x,y});
  }
  const distance=nodes.map(()=>Infinity),previous=[],visited=new Set();distance[0]=0;
  for(let k=0;k<nodes.length;k++){
    let u=-1;for(let i=0;i<nodes.length;i++)if(!visited.has(i)&&(u<0||distance[i]<distance[u]))u=i;
    if(u<0||distance[u]===Infinity)break;if(u===1)break;visited.add(u);
    for(let v=0;v<nodes.length;v++)if(!visited.has(v)&&clearPath(nodes[u],nodes[v],r,walls)){
      const d=distance[u]+Math.hypot(nodes[u].x-nodes[v].x,nodes[u].y-nodes[v].y);
      if(d<distance[v]){distance[v]=d;previous[v]=u;}
    }
  }
  let next=1;if(previous[next]===undefined)return {x:0,y:0};
  while(previous[next]!==0)next=previous[next];
  return direction(nodes[next].x-entity.x,nodes[next].y-entity.y);
}
