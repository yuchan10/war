import {CONFIG} from './config.js';
import {hasLineOfSight,routeDirection,sweepBox} from './arena.js';
import {concealed} from './cover-retreat.js';
export function clearTacticalPoint(p,walls,r=21){
 const a=CONFIG.arena;return p.x>=a.left+r&&p.x<=a.right-r&&p.y>=a.top+r&&p.y<=a.bottom-r&&!walls.some(w=>p.x>w.x-r&&p.x<w.x+w.w+r&&p.y>w.y-r&&p.y<w.y+w.h+r);
}
// A post consists of a sheltered position and a reachable firing corner.
export function chooseTacticalCover(e,threat,walls,allies=[],flank=false){
 const r=(e.radius??17)+10,candidates=[];
 for(const wall of walls)for(const side of [-1,1])for(const vertical of [true,false]){
  const hide=vertical?{x:side<0?wall.x-r:wall.x+wall.w+r,y:wall.y+wall.h/2}:{x:wall.x+wall.w/2,y:side<0?wall.y-r:wall.y+wall.h+r};
  if(!clearTacticalPoint(hide,walls)||!concealed(hide,threat,walls,e.radius??17))continue;
  if(allies.some(a=>a!==e&&a.active!==false&&!a.dead&&a.tacticalCover&&Math.hypot(a.tacticalCover.hide.x-hide.x,a.tacticalCover.hide.y-hide.y)<65))continue;
  const peeks=[1,2,3,4].flatMap(n=>vertical?[{x:hide.x,y:wall.y-r*n},{x:hide.x,y:wall.y+wall.h+r*n}]:[{x:wall.x-r*n,y:hide.y},{x:wall.x+wall.w+r*n,y:hide.y}]).filter(p=>clearTacticalPoint(p,walls)&&hasLineOfSight(p,threat,walls)&&!walls.some(w=>sweepBox(hide.x,hide.y,p.x-hide.x,p.y-hide.y,w,(e.radius??17)+2)));
  if(!peeks.length)continue;
  peeks.sort((a,b)=>Math.hypot(a.x-hide.x,a.y-hide.y)-Math.hypot(b.x-hide.x,b.y-hide.y));
  if(e.failedPoint&&e.aiClock<e.failedUntil&&Math.hypot(peeks[0].x-e.failedPoint.x,peeks[0].y-e.failedPoint.y)<35)continue;
  const distance=Math.hypot(hide.x-e.x,hide.y-e.y),range=Math.hypot(hide.x-threat.x,hide.y-threat.y);
  const angle=Math.atan2(hide.y-threat.y,hide.x-threat.x)-Math.atan2(e.y-threat.y,e.x-threat.x);
  const lateral=Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)));
  if(flank&&(lateral<.35||distance>550))continue;
  const exposure=[.25,.5,.75].filter(t=>hasLineOfSight(threat,{x:e.x+(hide.x-e.x)*t,y:e.y+(hide.y-e.y)*t},walls)).length;
  const ideal=e.role==='assault'?210:340;
  candidates.push({wall,hide,peek:peeks[0],score:distance+Math.abs(range-ideal)*.35+exposure*(e.skill==='veteran'?65:35)-(flank?lateral*120:0)});
 }
 candidates.sort((a,b)=>a.score-b.score);
 return candidates.slice(0,6).find(p=>Math.hypot(p.hide.x-e.x,p.hide.y-e.y)<8||Object.values(routeDirection(e,p.hide,walls)).some(Boolean))??null;
}
