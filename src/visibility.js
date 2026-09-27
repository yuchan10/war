import { CONFIG } from './config.js';
import { sweepBox } from './arena.js';

export const VISION={range:1200,near:0,angle:Math.PI*.94};
const angularDistance=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));

export function visiblePoint(player,target,walls,vision=player.vision??VISION){
  const dx=target.x-player.x,dy=target.y-player.y,distance=Math.hypot(dx,dy);
  const forward=angularDistance(Math.atan2(dy,dx),player.angle)<=vision.angle/2;
  if(distance>(forward?vision.range:vision.near))return false;
  return !walls.some(w=>sweepBox(player.x,player.y,dx,dy,w,0));
}

// Raycast the light boundary against the same geometry used by bullets.
export function visionPolygon(player,walls,vision=player.vision??VISION){
  const a=CONFIG.arena;
  const edges=[...walls,{x:a.left-20,y:a.top-20,w:20,h:a.bottom-a.top+40},{x:a.right,y:a.top-20,w:20,h:a.bottom-a.top+40},{x:a.left-20,y:a.top-20,w:a.right-a.left+40,h:20},{x:a.left-20,y:a.bottom,w:a.right-a.left+40,h:20}];
  const angles=[];
  for(let i=0;i<180;i++)angles.push(-Math.PI+i*Math.PI*2/180);
  for(const sign of [-1,1])for(const offset of [-.0001,0,.0001])angles.push(Math.atan2(Math.sin(player.angle+sign*vision.angle/2+offset),Math.cos(player.angle+sign*vision.angle/2+offset)));
  for(const w of edges)for(const x of [w.x,w.x+w.w])for(const y of [w.y,w.y+w.h]){
    const angle=Math.atan2(y-player.y,x-player.x);
    for(const offset of [-.0001,0,.0001])angles.push(Math.atan2(Math.sin(angle+offset),Math.cos(angle+offset)));
  }
  angles.sort((x,y)=>x-y);
  return angles.map(angle=>{
    const length=angularDistance(angle,player.angle)<=vision.angle/2?vision.range:vision.near;
    const dx=Math.cos(angle)*length,dy=Math.sin(angle)*length;
    let t=1;for(const w of edges){const hit=sweepBox(player.x,player.y,dx,dy,w);if(hit)t=Math.min(t,hit.t);}
    return {x:player.x+dx*t,y:player.y+dy*t};
  });
}
