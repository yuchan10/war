import { CONFIG } from './config.js';
import { hasLineOfSight, routeDirection } from './arena.js';

export function concealed(point,threat,walls,radius=0){
  return [[0,0],[radius,0],[-radius,0],[0,radius],[0,-radius]].every(([x,y])=>
    !hasLineOfSight(threat,{x:point.x+x,y:point.y+y},walls));
}

export function findRetreatCover(enemy,threat,walls){
  const radius=enemy.radius??17,margin=radius+10,a=CONFIG.arena;
  const points=[];
  for(const wall of walls){
    for(const fraction of [.25,.5,.75]){
      points.push({x:wall.x-margin,y:wall.y+wall.h*fraction},
        {x:wall.x+wall.w+margin,y:wall.y+wall.h*fraction},
        {x:wall.x+wall.w*fraction,y:wall.y-margin},
        {x:wall.x+wall.w*fraction,y:wall.y+wall.h+margin});
    }
  }
  const valid=points.filter(p=>p.x>=a.left+margin&&p.x<=a.right-margin&&p.y>=a.top+margin&&p.y<=a.bottom-margin&&
    !walls.some(w=>p.x>w.x-margin&&p.x<w.x+w.w+margin&&p.y>w.y-margin&&p.y<w.y+w.h+margin)&&
    concealed(p,threat,walls,radius));
  valid.sort((p,q)=>Math.hypot(p.x-enemy.x,p.y-enemy.y)-Math.hypot(q.x-enemy.x,q.y-enemy.y));
  return valid.find(p=>{
    if(Math.hypot(p.x-enemy.x,p.y-enemy.y)<4)return true;
    const dir=routeDirection({...enemy,radius},p,walls);return dir.x||dir.y;
  })||null;
}
