import { CONFIG } from './config.js';
import { moveBody,sweepBox } from './arena.js';

export function createGrenade(player,target,walls=[]){
 const c=CONFIG.grenade,dx=target.x-player.x,dy=target.y-player.y,d=Math.hypot(dx,dy),angle=d>0?Math.atan2(dy,dx):player.angle;
 const distance=Math.min(d,c.range),end={x:player.x+Math.cos(angle)*distance,y:player.y+Math.sin(angle)*distance,radius:4};
 moveBody(end,0,0,walls);
 return {x:player.x,y:player.y,startX:player.x,startY:player.y,endX:end.x,endY:end.y,radius:4,flightTime:.45+distance/c.range*.45,flightAge:0,height:10,fuse:c.fuse,age:0,active:true,held:false};
}
export function updateGrenades(grenades,dt,walls,explode){
 for(const g of grenades){
  if(!g.active)continue;const step=Math.min(Math.max(0,dt),g.fuse);g.fuse=Math.max(0,g.fuse-step);g.age+=step;
  if(g.held){
   g.x=g.owner.x+Math.cos(g.owner.angle||0)*12;g.y=g.owner.y+Math.sin(g.owner.angle||0)*12;g.height=8;
  }else if(g.flightTime>0){
   g.flightAge=Math.min(g.flightTime,g.flightAge+step);const t=g.flightAge/g.flightTime;
   g.x=g.startX+(g.endX-g.startX)*t;g.y=g.startY+(g.endY-g.startY)*t;
   g.height=10*(1-t)+4*CONFIG.grenade.arcHeight*t*(1-t);
  }
  if(g.fuse<=1e-9){g.active=false;explode(g);}
 }
}
export function blastDamage(g,target,walls){
 const c=CONFIG.grenade,d=Math.hypot(target.x-g.x,target.y-g.y,g.height||0);
 if(target.dead||target.active===false||d>=c.radius||walls.some(w=>sweepBox(g.x,g.y,target.x-g.x,target.y-g.y,w,0)))return 0;
 return c.damage*(1-d/c.radius);
}
export function drawGrenades(c,grenades,{airborneOnly=false,groundOnly=false,isVisible=()=>true}={}){
 for(const g of grenades){
  if(!g.active||!isVisible(g)||(airborneOnly&&(g.height||0)<=0)||(groundOnly&&(g.height||0)>0))continue;
  const lift=g.height||0;
  c.save();c.translate(g.x,g.y);c.fillStyle='#0006';c.beginPath();c.ellipse(1,3,5,2.5,0,0,Math.PI*2);c.fill();
  c.translate(0,-lift);c.rotate(g.age*8);c.fillStyle='#829367';c.strokeStyle='#20291d';c.lineWidth=1.5;
  c.beginPath();c.ellipse(0,0,4,5,0,0,Math.PI*2);c.fill();c.stroke();c.fillStyle='#c1bea3';c.fillRect(-2,-7,4,3);c.restore();
  c.save();c.strokeStyle=g.fuse<.4?'#ffa276':'#ded8a2';c.lineWidth=1.5;c.beginPath();c.arc(g.x,g.y-lift,8,-Math.PI/2,-Math.PI/2+Math.PI*2*g.fuse/CONFIG.grenade.fuse);c.stroke();c.restore();
 }
}
