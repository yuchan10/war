import { CONFIG } from './config.js';
import { visiblePoint } from './visibility.js';
import { hasLineOfSight,routeDirection,moveBody } from './arena.js';
const still={x:0,y:0};
const face=(e,p,dt)=>{const a=Math.atan2(p.y-e.y,p.x-e.x),d=Math.atan2(Math.sin(a-e.angle),Math.cos(a-e.angle));e.angle+=Math.max(-dt*5,Math.min(dt*5,d));};
export function hearGrenadeLanding(enemies,g,walls){
 for(const e of enemies){
  const range=hasLineOfSight(e,g,walls)?300:150;
  if(e.active&&!e.dead&&e.born<=0&&Math.hypot(e.x-g.x,e.y-g.y)<=range)e.grenadeSound={g,x:g.x,y:g.y,remaining:1.2};
 }
}
export function updateGrenadeAvoidance(e,grenades,walls,dt){
 if(e.grenadeSound){e.grenadeSound.remaining-=dt;if(e.grenadeSound.remaining<=0||!e.grenadeSound.g.active)e.grenadeSound=null;}
 if(e.grenadeThreat&&!e.grenadeThreat.active){e.grenadeThreat=null;e.grenadeEscape=null;}
 const seen=grenades.filter(g=>g.active&&!g.held&&Math.hypot(e.x-g.x,e.y-g.y)<350&&visiblePoint(e,g,walls)).sort((a,b)=>Math.hypot(e.x-a.x,e.y-a.y)-Math.hypot(e.x-b.x,e.y-b.y))[0];
 if(seen&&(!e.grenadeThreat||Math.hypot(e.x-seen.x,e.y-seen.y)+30<Math.hypot(e.x-e.grenadeKnown.x,e.y-e.grenadeKnown.y))){e.grenadeThreat=seen;e.grenadeHesitation=.3;e.grenadeEscape=null;e.grenadeKnown={x:seen.x,y:seen.y};}
 if(seen===e.grenadeThreat&&seen)e.grenadeKnown={x:seen.x,y:seen.y};
 const g=e.grenadeThreat;
 if(!g){
  if(!e.grenadeSound)return null;
  e.aiState='grenade-investigate';face(e,e.grenadeSound,dt);e.aimRemaining=0;e.burstLeft=0;return still;
 }
 e.aimRemaining=0;e.burstLeft=0;e.muzzle=0;
 if(e.grenadeHesitation>0){e.grenadeHesitation=Math.max(0,e.grenadeHesitation-dt);face(e,e.grenadeKnown,dt);e.aiState='grenade-startle';return still;}
 // Remember only an observed position. Never track unseen flight through cover.
 if(seen===g||!e.grenadeKnown)e.grenadeKnown={x:g.x,y:g.y};
 const threat=e.grenadeKnown,r=CONFIG.grenade.radius+35;
 if(Math.hypot(e.x-threat.x,e.y-threat.y)>=r){e.aiState='grenade-safe';return still;}
 e.aiState='grenade-flee';
 if(!e.grenadeEscape||Math.hypot(e.grenadeEscape.x-threat.x,e.grenadeEscape.y-threat.y)<r||Math.hypot(e.x-e.grenadeEscape.x,e.y-e.grenadeEscape.y)<10){
  const away=Math.atan2(e.y-threat.y,e.x-threat.x),candidates=[];
  for(let i=0;i<16;i++){
   const a=away+i*Math.PI/8,p={x:threat.x+Math.cos(a)*(r+25),y:threat.y+Math.sin(a)*(r+25),radius:e.radius};moveBody(p,0,0,walls);
   if(Math.hypot(p.x-threat.x,p.y-threat.y)<r)continue;
   const d=routeDirection(e,p,walls);if(d.x||d.y)candidates.push({p,score:Math.hypot(p.x-e.x,p.y-e.y)});
  }
  candidates.sort((a,b)=>a.score-b.score);e.grenadeEscape=candidates[0]?.p;
 }
 if(!e.grenadeEscape)return still;
 const d=routeDirection(e,e.grenadeEscape,walls);face(e,{x:e.x+d.x*100,y:e.y+d.y*100},dt);
 return {x:d.x*e.speed,y:d.y*e.speed};
}
