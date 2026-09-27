// Stage geometry is shared by collision, visibility, navigation and rendering.
const block=(x,y,w,h,material='concrete',kind='barrier')=>({x,y,w,h,material,kind});
function post(wall,bottom,delay){
  const x=wall.x+wall.w+27,y=bottom?wall.y+wall.h-25:wall.y+25;
  return {type:'shooter',x,y,cover:{wall,hide:{x,y},peek:{x,y:bottom?wall.y+wall.h+50:wall.y-50},delay}};
}
function stage(name,theme,walls,terrain){
  const posts=walls.slice(0,3);
  return {name,theme,terrain,spawn:{x:145,y:360},exit:{x:1108,y:360,radius:36},walls,
    enemies:[
      ...posts.map((wall,i)=>({...post(wall,i%2===1,.7+i*.4),skill:['regular','veteran','rookie'][i]})),
      ...posts.map((wall,i)=>({type:'assault',x:wall.x+wall.w+65,y:wall.y+wall.h/2,
        skill:['veteran','rookie','regular'][i],advancePoint:{x:280+i*40,y:285+i*70}}))
    ]};
}
export const STAGES=[
  stage('매복 현장','ambush',[
    block(435,270,64,140,'steel','wreck'),block(710,155,58,135,'steel','wreck'),
    block(880,440,38,125,'sandbag'),block(265,125,125,45,'concrete','rock'),
    block(550,515,115,45,'concrete','rock')
  ],{base:'#454636',road:[[42,375],[390,355],[740,365],[1158,340]],roadWidth:180,craters:[[350,400,38],[620,300,30],[810,390,45]]}),
  stage('외곽 검문소','checkpoint',[
    block(450,245,32,150,'sandbag'),block(735,135,70,150,'concrete','booth'),
    block(850,445,32,130,'sandbag'),block(295,160,130,32),block(590,515,130,32)
  ],{base:'#46483d',road:[[42,360],[1158,360]],roadWidth:210,markings:true}),
  stage('보급 기지','depot',[
    block(430,150,85,160,'steel','container'),block(710,430,85,125,'steel','container'),
    block(930,180,60,135,'steel','crates'),block(260,500,105,55,'steel','crates'),
    block(610,100,150,48,'steel','container'),block(840,575,135,40,'steel','crates')
  ],{base:'#464843',road:[[42,365],[1158,365]],roadWidth:130,markings:true}),
  stage('통신 초소','relay',[
    block(440,245,40,135,'sandbag'),block(715,145,70,135,'concrete','generator'),
    block(900,445,38,125,'sandbag'),block(560,510,125,65,'concrete','rock'),
    block(890,115,120,80,'concrete','mast')
  ],{base:'#414c3d',road:[[42,360],[330,410],[630,355],[900,345],[1158,360]],roadWidth:95,mast:{x:950,y:155}}),
  stage('부대 주둔지','barracks',[
    block(415,155,110,160,'concrete','barracks'),block(700,420,100,130,'concrete','barracks'),
    block(930,155,85,145,'concrete','barracks'),block(260,495,115,40,'sandbag'),
    block(620,105,120,40,'sandbag'),block(925,535,110,50,'steel','crates')
  ],{base:'#514b3d',road:[[42,360],[1158,360]],roadWidth:110,courtyard:{x:545,y:245,w:145,h:200}}),
  stage('지휘소','command',[
    block(425,255,38,130,'sandbag'),block(700,140,90,160,'concrete','bunker'),
    block(895,430,95,140,'concrete','bunker'),block(535,515,135,38),
    block(870,85,160,45,'concrete','bunker'),block(1060,185,38,100)
  ],{base:'#3d4542',road:[[42,360],[1158,360]],roadWidth:155,markings:true,courtyard:{x:665,y:315,w:365,h:100}})
];

