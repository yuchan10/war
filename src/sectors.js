import {visiblePoint} from './visibility.js';
export function updateSectors(w,dt){
 if(!w.stage.zones||w.prologue)return;
 const zone=w.stage.zones[w.sectorIndex];
 for(const e of w.enemies){
  if(e.zoneIndex===undefined)continue;
  if(e.zoneIndex<=w.sectorIndex||e.wasHit||visiblePoint(e,w.player,w.walls))e.sectorAlert=true;
  e.holdingSector=!e.sectorAlert;
 }
 if(!zone)return;
 const remaining=w.enemies.filter(e=>e.active&&!e.dead&&e.zoneIndex===w.sectorIndex).length;
 w.sectorRemaining=remaining;
 if(remaining||Math.hypot(w.player.x-zone.x,w.player.y-zone.y)>zone.radius){w.sectorHold=0;return;}
 w.sectorHold+=dt;
 if(w.sectorHold>=.8){
  w.sectorIndex++;w.sectorHold=0;const ammo=w.weapon.collectAmmo(12);
  w.feedback.show(`${zone.name} 확보${ammo?` · 탄약 +${ammo}`:''}`);w.feedback.timer=2.4;w.audio.play('wave');
 }
}
export function drawSectors(c,w){
 if(!w.stage.zones||w.prologue)return;
 c.save();
 w.stage.zones.forEach((zone,i)=>{
  if(i>w.sectorIndex)return;
  const done=i<w.sectorIndex;c.strokeStyle=done?'#b2c69a77':'#e8d69d';c.fillStyle=done?'#b2c69a0d':'#e8d69d0d';c.lineWidth=1.5;
  c.setLineDash(done?[]:[6,6]);c.beginPath();c.arc(zone.x,zone.y,zone.radius,0,Math.PI*2);c.fill();c.stroke();c.setLineDash([]);
  c.font='12px sans-serif';c.textAlign='center';c.fillStyle=done?'#b2c69a':'#f1e6c2';c.fillText(done?'확보 완료':`${i+1}. ${zone.name}`,zone.x,zone.y-zone.radius-12);
  if(!done&&w.sectorHold>0){c.lineWidth=4;c.beginPath();c.arc(zone.x,zone.y,zone.radius,-Math.PI/2,-Math.PI/2+Math.PI*2*w.sectorHold/.8);c.stroke();}
 });c.restore();
}
