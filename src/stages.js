// Layout, deployment and approach routes are authored independently for each sector.
const block=(x,y,w,h,material='concrete',kind='barrier')=>({x,y,w,h,material,kind});
const assault=(x,y,tx,ty)=>({type:'assault',x,y,advancePoint:{x:tx,y:ty}});
function post(wall,side='right',bottom=false,delay=.8){
 const x=side==='right'?wall.x+wall.w+27:wall.x-27,y=bottom?wall.y+wall.h-25:wall.y+25;
 return {type:'shooter',x,y,angle:side==='right'?Math.PI:0,cover:{wall,hide:{x,y},peek:{x,y:bottom?wall.y+wall.h+42:wall.y-42},delay}};
}
function sector(name,theme,spawn,exit,walls,enemies,terrain,strategy){
 return {name,theme,spawn:{x:spawn[0],y:spawn[1]},exit:{x:exit[0],y:exit[1],radius:32},walls,enemies:enemies(walls),terrain,strategy};
}
export const STAGES=[
 sector('매복 현장','ambush',[145,360],[1108,530],[
  block(390,265,70,150,'steel','wreck'),block(710,145,60,130,'steel','wreck'),
  block(890,435,38,120,'sandbag'),block(245,130,105,40,'concrete','rock'),block(540,505,120,45,'concrete','rock')
 ],w=>[post(w[0],'right',true),post(w[1],'right',true,1.2),assault(690,400,310,460),assault(830,340,400,200),post(w[2],'right',true),assault(1050,230,650,340)],
 {base:'#454636',road:[[42,375],[390,355],[740,365],[1158,530]],roadWidth:180,craters:[[320,425,38],[620,300,30],[810,390,45]]},
 '차량을 끼고 돌격병을 먼저 유인한 뒤, 위아래로 사격병의 측면을 돌아라.'),
 sector('외곽 검문소','checkpoint',[130,550],[1100,155],[
  block(335,75,40,350,'sandbag'),block(590,285,40,345,'sandbag'),block(850,75,40,345,'sandbag'),
  block(720,490,95,70,'concrete','booth'),block(165,285,100,35),block(1020,345,60,100,'concrete','booth')
 ],w=>[post(w[0],'right',true),post(w[1],'right',false,1.3),post(w[2],'right',true,.5),post(w[3],'right',true,1.6),assault(500,180,440,480),assault(1010,540,740,225)],
 {base:'#46483d',road:[[100,550],[450,510],[475,195],[745,200],[755,470],[970,480],[1100,155]],roadWidth:85,markings:true},
 '차단벽 끝을 번갈아 돌아 전진하라. 다음 모퉁이의 교차 사격을 끊고 이동하라.'),
 sector('보급 기지','depot',[160,120],[1060,600],[
  block(300,195,210,65,'steel','container'),block(640,195,230,65,'steel','container'),
  block(220,410,235,65,'steel','container'),block(595,410,230,65,'steel','container'),
  block(970,290,75,70,'steel','crates'),block(490,550,75,45,'steel','crates')
 ],w=>[post(w[0],'right',true),post(w[3],'right',false,1.4),assault(580,130,550,310),assault(145,540,145,315),assault(1080,450,920,340),assault(720,565,540,500)],
 {base:'#464843',road:[[160,100],[160,335],[1090,335],[1090,620]],roadWidth:100,markings:true},
 '컨테이너 사이에서 한 무리씩 유인하라. 긴 통로를 가로지르기 전 양쪽 접근로를 확인하라.'),
 sector('통신 초소','relay',[1080,570],[120,145],[
  block(505,250,170,170,'concrete','mast'),block(815,385,95,80,'concrete','generator'),
  block(320,160,40,140,'sandbag'),block(310,465,140,45,'concrete','rock'),
  block(720,135,140,45,'concrete','rock'),block(120,350,85,80,'concrete','rock')
 ],w=>[post(w[1],'left',true),post(w[2],'left',false,1.4),post(w[0],'left',true),assault(690,110,950,275),assault(240,560,600,545),assault(155,240,400,340)],
 {base:'#414c3d',road:[[1080,570],[930,520],[690,510],[415,360],[270,130],[100,145]],roadWidth:80,mast:{x:590,y:335}},
 '중앙 통신탑으로 반대편 사선을 차단하라. 북쪽 사격진지와 남쪽 돌격대를 따로 상대하라.'),
 sector('부대 주둔지','barracks',[130,575],[1090,125],[
  block(270,175,215,150,'concrete','barracks'),block(690,175,215,150,'concrete','barracks'),
  block(270,435,215,140,'concrete','barracks'),block(690,435,215,140,'concrete','barracks'),
  block(555,340,60,75,'sandbag'),block(1000,470,60,65,'steel','crates')
 ],w=>[post(w[0],'left',true),post(w[1],'right',false),assault(575,550,160,385),assault(1000,385,660,385),assault(565,125,565,285),assault(1040,600,965,390)],
 {base:'#514b3d',road:[[130,575],[150,385],[1020,385],[1090,125]],roadWidth:90,courtyard:{x:505,y:335,w:165,h:90}},
 '중앙 교차로에 오래 머물지 마라. 건물 바깥길로 돌아 돌격대와 사격진지를 분리하라.'),
 sector('지휘소','command',[600,600],[600,115],[
  block(475,435,250,50,'sandbag'),block(245,290,175,105,'concrete','bunker'),
  block(780,290,175,105,'concrete','bunker'),block(490,185,220,60,'concrete','bunker'),
  block(135,120,150,45),block(935,120,150,45),block(1030,490,60,80,'steel','crates')
 ],w=>[post(w[0],'left',false,.5),post(w[0],'right',false,1.3),post(w[1],'left',false),post(w[2],'right',false),post(w[3],'right',false,1.6),assault(385,125,600,345)],
 {base:'#3d4542',road:[[600,640],[400,520],[135,450],[135,235],[400,115],[600,115]],roadWidth:95,markings:true,courtyard:{x:460,y:270,w:280,h:135}},
 '정면 방벽을 피해 한쪽 외곽부터 공략하라. 측면 벙커를 정리한 뒤 지휘소 뒤편으로 돌아라.')
].map((stage,index)=>{
 const veterans=[1,3,0,4,2,5].slice(0,index+1),resolute=[4,0,5,1,3,2].slice(0,index+1);
 return {...stage,enemies:stage.enemies.map((enemy,i)=>({...enemy,
  skill:veterans.includes(i)?'veteran':['regular','regular','rookie','regular','rookie','regular'][i],
  courage:resolute.includes(i)?'resolute':['cautious','steady','steady','steady','cautious','steady'][i]
 }))};
});
