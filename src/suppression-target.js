import { sweepBox } from './arena.js';

export function firstWall(from,to,walls,radius=6){
  let closest=null;
  for(const wall of walls){const hit=sweepBox(from.x,from.y,to.x-from.x,to.y-from.y,wall,radius);
    if(hit&&(!closest||hit.t<closest.t))closest={...hit,wall};}
  return closest;
}

export function safeShot(enemy,angle,walls){
  const end={x:enemy.x+Math.cos(angle)*1800,y:enemy.y+Math.sin(angle)*1800};
  const first=firstWall(enemy,end,walls);
  if(!first)return true;
  // All bullets in a burst are checked, including the spread at its edges.
  if(first.wall===enemy.cover?.wall)return false;
  if(first.t*1800<65)return false;
  return !enemy.suppressionWall||first.wall===enemy.suppressionWall;
}

export function suppressionTarget(enemy,last,walls){
  const own=enemy.cover?.wall;
  const candidates=walls.filter(w=>w!==own).map(w=>{
    const dx=Math.max(w.x-last.x,0,last.x-w.x-w.w),dy=Math.max(w.y-last.y,0,last.y-w.y-w.h);
    return {wall:w,distance:Math.hypot(dx,dy)};
  }).sort((a,b)=>a.distance-b.distance);
  const targetWall=candidates.find(v=>v.distance<135)?.wall;
  enemy.suppressionWall=targetWall||null;
  if(!targetWall){const a=Math.atan2(last.y-enemy.y,last.x-enemy.x);return safeShot(enemy,a,walls)?last:null;}
  const w=targetWall,margin=28;
  // Fire around the two ends closest to the remembered contact, not its hidden live position.
  const points=w.h>w.w?
    [{x:w.x+w.w/2,y:w.y-margin},{x:w.x+w.w/2,y:w.y+w.h+margin}]:
    [{x:w.x-margin,y:w.y+w.h/2},{x:w.x+w.w+margin,y:w.y+w.h/2}];
  points.sort((a,b)=>Math.hypot(a.x-last.x,a.y-last.y)-Math.hypot(b.x-last.x,b.y-last.y));
  const valid=points.filter(point=>{
    const a=Math.atan2(point.y-enemy.y,point.x-enemy.x);
    return safeShot(enemy,a,walls);
  });
  if(!valid.length)return null;
  return {...valid[Math.floor((enemy.suppressionShots||0)/3)%valid.length],vx:0,vy:0};
}
