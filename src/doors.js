import {hasLineOfSight} from './arena.js';
export function setupDoors(w){w.doors=(w.stage.doors||[]).map(d=>({...d,open:false,slide:0}));w.walls=[...w.stage.walls,...w.doors];}
export function nearbyDoor(w){
 const p=w.player;if(p.dead||w.prologue)return null;
 return (w.doors||[]).map(d=>({d,distance:Math.hypot(p.x-Math.max(d.x,Math.min(d.x+d.w,p.x)),p.y-Math.max(d.y,Math.min(d.y+d.h,p.y)))})).filter(({d,distance})=>distance<=46&&hasLineOfSight(p,{x:d.x+d.w/2,y:d.y+d.h/2},w.walls.filter(wall=>wall!==d))).sort((a,b)=>a.distance-b.distance)[0]?.d||null;
}
export function interactDoor(w){
 const d=nearbyDoor(w);if(!d)return false;
 if(d.open&&[w.player,...w.enemies].some(e=>!e.dead&&e.active!==false&&e.x+e.radius>d.x&&e.x-e.radius<d.x+d.w&&e.y+e.radius>d.y&&e.y-e.radius<d.y+d.h)){
  w.feedback.show('문 안에 사람이 있어 닫을 수 없습니다.');return true;
 }
 d.open=!d.open;w.walls=d.open?w.walls.filter(wall=>wall!==d):[...w.walls,d];
 w.audio.play('door',{dx:d.x-w.player.x,dy:d.y-w.player.y});w.emitPlayerSound('door',d.x+d.w/2,d.y+d.h/2);
 w.feedback.show(d.open?'문 개방 · 안쪽 모서리를 확인하세요':'문 닫힘');return true;
}
export function updateDoors(w,dt){for(const d of w.doors||[])d.slide=Math.max(0,Math.min(1,d.slide+(d.open?1:-1)*dt*5));}
export function drawDoor(c,d){
 c.save();c.translate(d.x,d.y);
 c.fillStyle='#111713';c.fillRect(0,0,d.w,d.h);c.strokeStyle='#a4aa8c';c.lineWidth=2;c.strokeRect(4,0,d.w-8,d.h);
 // The two metal leaves retract into the frame; the black gap shows the passage.
 const panel=d.h/2*(1-(d.slide||0));c.fillStyle='#697360';c.fillRect(4,0,d.w-8,panel);c.fillRect(4,d.h-panel,d.w-8,panel);
 c.fillStyle='#d4c08a';c.fillRect(10,Math.max(0,panel-5),d.w-20,3);c.fillRect(10,d.h-panel+2,d.w-20,3);
 c.fillStyle=d.open?'#badc8e':'#d6a86d';c.fillRect(0,d.h/2-4,4,8);c.fillRect(d.w-4,d.h/2-4,4,8);c.restore();
}
