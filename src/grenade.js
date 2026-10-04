import { CONFIG } from './config.js';
import { traceBullet,sweepBox } from './arena.js';

export function createGrenade(player,target){
 const c=CONFIG.grenade,dx=target.x-player.x,dy=target.y-player.y,d=Math.hypot(dx,dy),angle=d>0?Math.atan2(dy,dx):player.angle;
 return {x:player.x,y:player.y,vx:Math.cos(angle)*c.speed,vy:Math.sin(angle)*c.speed,radius:4,remainingRange:Math.min(d,c.range),fuse:c.fuse,age:0,active:true};
}
export function updateGrenades(grenades,dt,walls,explode){
 for(const g of grenades){
  if(!g.active)continue;const step=Math.min(Math.max(0,dt),g.fuse);g.fuse=Math.max(0,g.fuse-step);g.age+=step;
  if(g.remainingRange>0){
   traceBullet(g,step,walls);
   if(!g.active){g.remainingRange=0;g.vx=0;g.vy=0;g.active=true;}
  }
  if(g.fuse<=1e-9){g.active=false;explode(g);}
 }
}
export function blastDamage(g,target,walls){
 const c=CONFIG.grenade,d=Math.hypot(target.x-g.x,target.y-g.y);
 if(target.dead||target.active===false||d>=c.radius||walls.some(w=>sweepBox(g.x,g.y,target.x-g.x,target.y-g.y,w,0)))return 0;
 return c.damage*(1-d/c.radius);
}
export function drawGrenades(c,grenades){
 for(const g of grenades){
  if(!g.active)continue;
  const lift=g.remainingRange>0?Math.sin(Math.min(1,g.age/(CONFIG.grenade.range/CONFIG.grenade.speed))*Math.PI)*13:0;
  c.save();c.translate(g.x,g.y);c.fillStyle='#0006';c.beginPath();c.ellipse(1,3,5,2.5,0,0,Math.PI*2);c.fill();
  c.translate(0,-lift);c.rotate(g.age*8);c.fillStyle='#829367';c.strokeStyle='#20291d';c.lineWidth=1.5;
  c.beginPath();c.ellipse(0,0,4,5,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#c1bea3';c.fillRect(-2,-7,4,3);c.restore();
  c.save();c.strokeStyle=g.fuse<.4?'#ffa276':'#ded8a2';c.lineWidth=1.5;c.beginPath();c.arc(g.x,g.y-lift,8,-Math.PI/2,-Math.PI/2+Math.PI*2*g.fuse/CONFIG.grenade.fuse);c.stroke();c.restore();
 }
}
