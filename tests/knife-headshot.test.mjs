import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world.js';
import { headAimTarget } from '../src/head-aim.js';
import { updateKnife,knifeContact } from '../src/knife.js';
const idle=point=>({mouse:{...point,down:false},movement:()=>({x:0,y:0})});
function scene(){
  const w=new World({play(){}},()=>.5);w.start();w.walls=[];w.enemies=[];
  Object.assign(w.player,{x:300,y:300,angle:0,knifeEquipped:true,unarmed:true});
  w.spawnEnemy('assault',340,300);const e=w.enemies[0];Object.assign(e,{born:0,timer:100,speed:0,angle:Math.PI});return {w,e};
}
test('head-aimed knife contact overrides both torso and arm contacts while preserving helmet armor',()=>{
  for(const angle of [Math.PI,Math.PI/2]){
    const {w,e}=scene();e.angle=angle;
    const region=knifeContact(w.player,e).region;assert.equal(region,angle===Math.PI?'center':'rightArm');
    w.player.knifeHeadTarget=e;
    const first=w.strikeKnife(e);assert.equal(first.part,'head');assert.equal(first.armorBroken,true);assert.equal(e.dead,false);
    const second=w.strikeKnife(e);assert.equal(second.part,'head');assert.equal(e.dead,true);
    assert.equal(e.body.rightArm.armor,45);assert.equal(e.body.torso.armor,90);
  }
});
test('knife captures head aim when swing starts and cannot transfer it to another target',()=>{
  const {w,e}=scene(),p=w.player;
  updateKnife(p,1/120,true,()=>{},e);
  for(let i=0;i<15;i++)updateKnife(p,1/120,true,()=>{},null);
  assert.equal(p.knifeHeadTarget,e);assert.equal(w.strikeKnife(e).part,'head');
  w.spawnEnemy('assault',345,300);const other=w.enemies[1];assert.notEqual(w.strikeKnife(other).part,'head');
  updateKnife(p,1,false,()=>{});updateKnife(p,.01,true,()=>{},null);assert.equal(p.knifeHeadTarget,null);
});
test('actual knife swings require range and a clear path even with head aim',()=>{
  for(const kind of ['hit','far','wall']){
    const {w,e}=scene();if(kind==='far')e.x=400;if(kind==='wall')w.walls=[{x:318,y:270,w:5,h:60}];
    const point={x:e.x-1,y:e.y+4};
    w.update(1/120,{...idle(point),mouse:{...point,down:true}});
    for(let i=0;i<16;i++)w.update(1/120,idle(point));
    assert.equal(e.body.head.armor,kind==='hit'?0:60);
  }
});
test('prologue search guards support knife head aim and witness phase does not',()=>{
  const w=new World({play(){}},()=>.5);w.startPrologue();w.walls=[];
  const g=w.prologue.guards[0];Object.assign(w.player,{x:300,y:300,angle:0});Object.assign(g,{x:340,y:300,angle:Math.PI,speed:0,searchWait:100,timer:100});
  const point={x:339,y:304};assert.equal(headAimTarget(w,point),null);
  w.prologue.phase='search';assert.equal(headAimTarget(w,point),g);
  w.update(1/120,{...idle(point),mouse:{...point,down:true}});
  for(let i=0;i<16;i++)w.update(1/120,idle(point));
  assert.equal(g.body.head.armor,0);assert.equal(g.body.torso.armor,90);
});
