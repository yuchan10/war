import { hasLineOfSight } from './arena.js';

export const HEARING={gunshot:850,footstep:150,occludedScale:.65,memory:12};

export function hearSound(listeners,source,type,walls=[]){
  const range=HEARING[type];
  if(typeof range!=='number')return;
  for(const e of listeners){
    if(e.active===false||e.subdued||e.fallen||e.hp===0)continue;
    const radius=range*(hasLineOfSight(e,source,walls)?1:HEARING.occludedScale);
    if(Math.hypot(e.x-source.x,e.y-source.y)>radius)continue;
    // An event snapshot, never a reference to the moving player.
    e.heardPosition={x:source.x,y:source.y};e.heardAge=0;e.heardType=type;
    e.assaultNavTimer=0;e.searchWait=0;
  }
}
