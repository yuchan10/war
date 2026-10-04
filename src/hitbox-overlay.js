import { activeBodyBoxes,PARTS } from './injury.js';

export function drawEnemyHitboxes(c,world){
 const intro=world.prologue&&world.prologue.phase!=='revenge';
 const targets=intro?world.prologue.guards:world.enemies;
 for(const e of targets){
  if(e.active===false||e.dead||e.subdued||(e.born??0)>0)continue;
  const aim=e.aimRemaining>0||e.burstLeft>0?e.aimAngle??e.angle:e.angle;
  c.save();c.translate(e.x,e.y);c.rotate(aim||0);c.lineWidth=1;c.setLineDash([]);
  for(const [region,[x1,y1,x2,y2]] of activeBodyBoxes(e)){
   const color=region==='center'?'#f3d78a':PARTS[region]?.kind==='arm'?'#82cfff':'#90e2b2';
   c.fillStyle=color+'18';c.strokeStyle=color;
   c.fillRect(x1,y1,x2-x1,y2-y1);c.strokeRect(x1,y1,x2-x1,y2-y1);
  }
  c.restore();
 }
}
