// Staggered full-height cover forces deliberate corner checks between three pockets.
const block=(x,y,w,h,material='concrete',kind='barrier')=>({x,y,w,h,material,kind});
const names=['매복 현장','외곽 검문소','보급 기지','통신 초소','부대 주둔지','지휘소'];
const themes=['ambush','checkpoint','depot','relay','barracks','command'];
const labels=[['차량 뒤 확보','우회로 확보','탈출로 확보'],['첫 검문선','검문소 내부','출구 검문선'],['하역장','보급 통로','저장고'],['발전기 접근로','통신선','통신 초소'],['외곽 진입로','병영 사이길','집결지'],['방어선 돌파','측면 벙커','지휘실 접근로']];
export const STAGES=names.map((name,index)=>{
 const offset=(index%3)*20,mirrorX=index===3||index===5,mirrorY=index===1||index===4;
 const walls=[block(450,430,40,70,'steel','wreck'),block(340+offset,62,40,418),block(720,240,40,418),block(540,150,40,70,'sandbag'),block(940,440,40,70,'sandbag'),block(980,180,45,70,'steel','crates'),block(340+offset,560,40,98),block(720,62,40,98)];
 const point=p=>({x:mirrorX?1200-p.x:p.x,y:mirrorY?720-p.y:p.y});
 const wallMap=new Map(walls.map(w=>[w,{...w,x:mirrorX?1200-w.x-w.w:w.x,y:mirrorY?720-w.y-w.h:w.y}]));
 const guard=(wall,zoneIndex,bottom=false)=>{const x=wall.x+wall.w+27,y=bottom?wall.y+wall.h-25:wall.y+25;return {type:'shooter',x,y,zoneIndex,cover:{wall,hide:{x,y},peek:{x,y:bottom?wall.y+wall.h+42:wall.y-42},delay:1.1}};};
 const rush=(x,y,zoneIndex)=>({type:'assault',x,y,zoneIndex,advancePoint:{x,y:y+25}});
 const enemies=[guard(walls[0],0,true),guard(walls[3],1),guard(walls[4],2,true),rush(1050,350,2)];
 if(index>=1)enemies.splice(1,0,rush(610,510,0));
 if(index>=2)enemies.splice(3,0,index===2?guard(walls[5],2):rush(640,320,1));
 if(index===1){enemies[2]=rush(620,170,1);}
 const zones=[{x:570,y:550},{x:650,y:125},{x:1040,y:560}].map((p,i)=>({...point(p),name:labels[index][i],radius:58}));
 const spawn=point({x:125+index*3,y:540-index*4}),exit={...point({x:1100-index*3,y:570+index*3}),radius:32};
 const doors=[block(340+offset,480,40,80,'steel','door'),block(720,160,40,80,'steel','door')].map(d=>({...d,x:mirrorX?1200-d.x-d.w:d.x,y:mirrorY?720-d.y-d.h:d.y}));
 return {doors,name,theme:themes[index],spawn,exit,zones,walls:[...wallMap.values()],
  enemies:enemies.map((e,i)=>({...e,...point(e),skill:index>=2&&i>=enemies.length-Math.floor(index/2)?'veteran':i%2?'regular':'rookie',courage:index>=3&&i===enemies.length-1?'resolute':i%2?'steady':'cautious',
   ...(e.advancePoint?{advancePoint:point(e.advancePoint)}:{}),...(e.cover?{cover:{...e.cover,wall:wallMap.get(e.cover.wall),hide:point(e.cover.hide),peek:point(e.cover.peek)}}:{})})),
  terrain:{base:['#454636','#46483d','#464843','#414c3d','#514b3d','#3d4542'][index],road:[spawn,...zones,exit].map(p=>[p.x,p.y]),roadWidth:85,markings:index%2===1},
  strategy:`${labels[index][0]}부터 진입하라. E로 문을 열고 엄폐물 끝에서 시야를 확인한 뒤, 적을 제압한 뒤 표시 지점을 확보하라.`};
});
