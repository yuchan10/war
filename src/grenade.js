import { CONFIG } from './config.js';
import { moveBody,sweepBox } from './arena.js';

export function createGrenade(player,target,walls=[]){
 const c=CONFIG.grenade,dx=target.x-player.x,dy=target.y-player.y,d=Math.hypot(dx,dy),angle=d>0?Math.atan2(dy,dx):player.angle;
 const distance=Math.min(d,c.range),end={x:player.x+Math.cos(angle)*distance,y:player.y+Math.sin(angle)*distance,radius:4};
 moveBody(end,0,0,walls);
 return {x:player.x,y:player.y,startX:player.x,startY:player.y,endX:end.x,endY:end.y,radius:4,flightTime:.45+distance/c.range*.45,flightAge:0,height:10,fuse:c.fuse,age:0,active:true,held:false};
}
export function updateGrenades(grenades,dt,walls,explode,land=()=>{}){
 for(const g of grenades){
  if(!g.active)continue;const step=Math.min(Math.max(0,dt),g.fuse);g.fuse=Math.max(0,g.fuse-step);g.age+=step;
  if(g.held){
   g.x=g.owner.x+Math.cos(g.owner.angle||0)*12;g.y=g.owner.y+Math.sin(g.owner.angle||0)*12;g.height=8;
  }else if(g.flightTime>0){
   const wasFlying=g.flightAge<g.flightTime;
   g.flightAge=Math.min(g.flightTime,g.flightAge+step);Object.assign(g,grenadePosition(g,g.flightAge));
   if(wasFlying&&g.flightAge>=g.flightTime&&g.fuse>1e-9)land(g);
  }
  if(g.fuse<=1e-9){g.active=false;explode(g);}
 }
}
export const grenadeCountdown=fuse=>`${(Math.ceil(Math.max(0,fuse)*10)/10).toFixed(1)}초`;
export const blastGroundRadius=(height=0,radius=CONFIG.grenade.radius)=>Math.sqrt(Math.max(0,radius**2-height**2));
function drawCountdown(c,x,y,fuse){
 c.save();c.font='bold 13px monospace';c.textAlign='center';c.fillStyle='#111a16e8';c.fillRect(x-29,y-13,58,21);
 c.fillStyle=fuse<=1?'#ffab86':'#fff0c5';c.fillText(grenadeCountdown(fuse),x,y+2);c.restore();
}
export function grenadePosition(g,elapsed){
 const t=Math.max(0,Math.min(1,elapsed/g.flightTime));
 return {x:g.startX+(g.endX-g.startX)*t,y:g.startY+(g.endY-g.startY)*t,height:10*(1-t)+4*CONFIG.grenade.arcHeight*t*(1-t)};
}
export function grenadePrediction(player,target,walls,fuse){
 const g=createGrenade(player,target,walls),duration=Math.min(g.flightTime,Math.max(0,fuse));
 const points=Array.from({length:33},(_,i)=>grenadePosition(g,duration*i/32)),end=points.at(-1);
 return {points,end,airburst:duration<g.flightTime,
  radius:blastGroundRadius(end.height),
  killRadius:blastGroundRadius(end.height,CONFIG.grenade.killRadius)};
}
export function drawGrenadePrediction(c,world,target){
 if(world.state!=='playing'||!world.primedGrenade?.active||world.player.dead)return;
 const p=grenadePrediction(world.player,target,world.walls,world.primedGrenade.fuse),{x,y,height}=p.end;
 c.save();c.lineWidth=1.5;c.strokeStyle='#e8d89abf';c.fillStyle='#e8d89a0b';
 c.setLineDash([7,6]);c.lineDashOffset=-world.time*12;
 c.beginPath();c.arc(x,y,p.radius,0,Math.PI*2);c.fill();c.stroke();
 if(p.killRadius>0){c.strokeStyle='#ef997a9c';c.beginPath();c.arc(x,y,p.killRadius,0,Math.PI*2);c.stroke();}
 c.setLineDash([]);c.beginPath();
 p.points.forEach((q,i)=>i?c.lineTo(q.x,q.y-q.height):c.moveTo(q.x,q.y-q.height));
 c.strokeStyle='#101810b3';c.lineWidth=4;c.stroke();c.strokeStyle='#f2e5b8';c.lineWidth=1.5;c.stroke();
 if(p.airburst){c.setLineDash([3,4]);c.beginPath();c.moveTo(x,y-height);c.lineTo(x,y);c.stroke();c.setLineDash([]);}
 c.beginPath();c.arc(x,y,4,0,Math.PI*2);c.stroke();
 if(p.airburst){c.fillStyle='#ffc69b';c.font='12px sans-serif';c.textAlign='center';c.fillText('공중 폭발 예상',x,y-height-15);}
 drawCountdown(c,target.x,target.y+32,world.primedGrenade.fuse);
 c.restore();
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
  drawCountdown(c,g.x,g.y-lift-23,g.fuse);
 }
}
