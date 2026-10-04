import test from 'node:test';
import assert from 'node:assert/strict';
import { pointsAtHead,headAimTarget } from '../src/head-aim.js';
import { initBody,bodyHit,resolvePart,applyInjury } from '../src/injury.js';
import { World } from '../src/world.js';
import { CONFIG } from '../src/config.js';
import { Renderer } from '../src/renderer.js';

const make=()=>{const e={x:300,y:300,angle:0,active:true,born:0};initBody(e);return e;};
const local=(e,x,y)=>({x:e.x+x*Math.cos(e.angle)-y*Math.sin(e.angle),y:e.y+x*Math.sin(e.angle)+y*Math.cos(e.angle)});
test('neck below the head counts as head aim without including torso or arms',()=>{
  for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    const e=make();e.angle=angle;
    for(const armor of [60,0]){
      e.body.head.armor=armor;
      assert.ok(pointsAtHead(e,local(e,-6,3)));
      assert.ok(pointsAtHead(e,local(e,-4,5)));
      assert.equal(pointsAtHead(e,local(e,-12,0)),false);
      assert.equal(pointsAtHead(e,local(e,3,-12)),false);
      assert.equal(pointsAtHead(e,local(e,3,12)),false);
    }
  }
});
test('head hover follows rotation, helmet, exposed face and crawling pose',()=>{
  for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    const e=make();e.angle=angle;
    assert.ok(pointsAtHead(e,local(e,1,-4)));
    assert.equal(pointsAtHead(e,local(e,-12,0)),false);
    e.body.head.armor=0;assert.ok(pointsAtHead(e,local(e,4,-3)));
    assert.equal(pointsAtHead(e,local(e,-6,-4)),false);
    e.legsDisabled=true;e.crawling=true;e.crawlPhase=Math.PI/2;
    const x=4-3,y=-3,a=.05;
    assert.ok(pointsAtHead(e,local(e,(x*Math.cos(a)-y*Math.sin(a))*1.25,(x*Math.sin(a)+y*Math.cos(a))*.75)));
    e.headDestroyed=true;assert.equal(pointsAtHead(e,local(e,4,-3)),false);
  }
});
test('hover hides invalid targets and works with both rifle and knife',()=>{
  const e=make(),w={state:'playing',player:{x:100,y:296,angle:0},enemies:[e],walls:[]},point={x:301,y:296};
  assert.equal(headAimTarget(w,point),e);
  w.walls=[{x:200,y:270,w:20,h:60}];assert.equal(headAimTarget(w,point),null);w.walls=[];
  for(const key of ['dead','born']){e[key]=1;assert.equal(headAimTarget(w,point),null);e[key]=0;}
  w.player.knifeEquipped=true;w.player.unarmed=true;assert.equal(headAimTarget(w,point),e);
  w.player.knifeEquipped=false;assert.equal(headAimTarget(w,point),null);
});
test('headshot flag only promotes center contacts and unaimed player hits never randomly hit head',()=>{
  const e=make();
  assert.equal(resolvePart(e,{region:'center',headshot:true},()=>.99),'head');
  assert.equal(resolvePart(e,{region:'leftArm',headshot:true}),'leftArm');
  assert.equal(resolvePart(e,{region:'leftLeg',headshot:true}),'leftLeg');
  for(let i=0;i<100;i++)assert.notEqual(resolvePart(e,{region:'center',headshot:false},()=>i/100),'head');
});
test('all severed limb hitboxes disappear in every aim direction while surviving parts remain hittable',()=>{
  for(const angle of [0,Math.PI/2,Math.PI,-Math.PI/2])for(const [part,x,y] of [['leftArm',10,-12],['rightArm',10,12],['leftLeg',-16,-4],['rightLeg',-16,4]]){
    const e=make();e.angle=angle;const point=local(e,x,y),b={...point,px:point.x,py:point.y,radius:0};
    assert.equal(bodyHit(e,b).region,part);
    e.body[part].armor=0;applyInjury(e,100,{region:part});
    assert.equal(bodyHit(e,b),null);
    const torso=local(e,0,0);assert.equal(bodyHit(e,{...torso,px:torso.x,py:torso.y,radius:0}).region,'center');
  }
});
const idle=point=>({mouse:{...point,down:false},movement:()=>({x:0,y:0})});
function scene(){
  const w=new World({play(){}},()=>.5);w.start();w.walls=[];w.enemies=[];
  Object.assign(w.player,{x:100,y:300,angle:0});w.spawnEnemy('assault',300,300);
  Object.assign(w.enemies[0],{born:0,timer:100,speed:0,angle:Math.PI});return w;
}
test('real shot snapshots head aim, requires impact, and cannot transfer to another enemy',()=>{
  const w=scene(),e=w.enemies[0],point=local(e,1,-4);
  w.update(CONFIG.step,{...idle(point),mouse:{...point,down:true}});
  const b=w.bullets.items[0];assert.equal(b.headTarget,e);assert.equal(e.body.head.armor,60);
  for(let i=0;i<20;i++)w.update(CONFIG.step,idle({x:900,y:500}));
  assert.equal(e.lastHitPart,'head');assert.equal(e.body.head.armor,15);
  const other=scene(),front=other.enemies[0],back=make();back.x=400;
  other.shoot(280,300,0,false,30,1550,false,526,back);other.update(CONFIG.step,idle(point));
  assert.notEqual(front.lastHitPart,'head');
});
test('wall absorbs aimed bullet and pooled bullets clear old head targets',()=>{
  const w=scene(),e=w.enemies[0];w.walls=[{x:200,y:250,w:20,h:100}];
  w.shoot(100,300,0,false,30,1550,false,526,e);
  for(let i=0;i<20;i++)w.update(CONFIG.step,idle({x:301,y:296}));
  assert.equal(e.wasHit,undefined);
  w.shoot(100,300,0,false,30,1550);assert.equal(w.bullets.items[0].headTarget,null);
});

test('aimed bullets still miss or hit an arm normally; unaimed center hits are not headshots',()=>{
  for(const [y,aimed,expected] of [[288,true,'rightArm'],[340,true,undefined],[300,false,'leftLeg']]){
    const w=scene(),e=w.enemies[0];
    w.shoot(275,y,0,false,30,1550,false,526,aimed?e:null);
    for(let i=0;i<5;i++)w.update(CONFIG.step,idle({x:900,y:500}));
    assert.equal(e.lastHitPart,expected);assert.equal(e.body.head.armor,60);
  }
});
test('a swept bullet crosses a severed arm and still hits the next soldier',()=>{
  const w=scene(),e=w.enemies[0];e.body.rightArm.armor=0;applyInjury(e,100,{region:'rightArm'});
  w.spawnEnemy('assault',350,288);const behind=w.enemies[1];Object.assign(behind,{born:0,timer:100,speed:0});
  e.wasHit=false;
  w.shoot(275,288,0,false,30,1550);
  for(let i=0;i<8;i++)w.update(CONFIG.step,idle({x:900,y:500}));
  assert.equal(e.wasHit,false);assert.equal(behind.wasHit,true);
});

test('renderer draws a skull only while hovering a visible head',()=>{
  const strokes=[],ctx=new Proxy({stroke(){strokes.push(this.strokeStyle);}},{get:(o,k)=>k in o?o[k]:()=>{}});
  const layer={getContext:()=>ctx},w=scene(),e=w.enemies[0];
  const r=Object.assign(Object.create(Renderer.prototype),{ctx,settings:{values:{}},background:{},backgroundStage:w.stage,entityLayer:layer,sightMask:layer,drawFog(){}});
  r.draw(w,idle(local(e,1,-4)));assert.equal(strokes.at(-1),'#22261f');
  r.draw(w,idle({x:700,y:500}));assert.equal(strokes.at(-1),'#e5e4ceaa');
  w.walls=[{x:200,y:250,w:20,h:100}];r.draw(w,idle(local(e,1,-4)));assert.equal(strokes.at(-1),'#e5e4ceaa');
});
