import test from 'node:test';
import assert from 'node:assert/strict';
import { visiblePoint, VISION } from '../src/visibility.js';
import { updateContact } from '../src/contact-memory.js';
import { updateWounded } from '../src/wounded-ai.js';
import { injuryMoveScale } from '../src/injury.js';
import { ENEMIES } from '../src/config.js';
import { Settings } from '../src/settings.js';
import { World } from '../src/world.js';
import { visionPolygon } from '../src/visibility.js';

test('opening scouts see 22.5 degrees on each side and retain this after rifle acquisition',()=>{
  const w=new World({play(){}});w.startPrologue();const g=w.prologue.guards[0];
  Object.assign(g,{x:600,y:350,angle:0});
  for(const degrees of [-23,-22,22,23]){
    const angle=degrees*Math.PI/180,p={x:g.x+Math.cos(angle)*100,y:g.y+Math.sin(angle)*100};
    assert.equal(visiblePoint(g,p,[]),Math.abs(degrees)<22.5);
    assert.equal(updateContact(g,p,[],.01).visible,Math.abs(degrees)<22.5);
  }
  for(const point of visionPolygon(g,[])){
    if(Math.hypot(point.x-g.x,point.y-g.y)<.001)continue;
    assert.ok(Math.abs(Math.atan2(point.y-g.y,point.x-g.x))<=Math.PI/8+1e-8);
  }
  w.prologue.beginRevenge(w,{clear(){}});
  assert.ok(w.enemies.every(e=>e.vision.angle===Math.PI/4));
  w.nextStage();assert.ok(w.enemies.every(e=>!e.vision));
});

test('enemy perception uses the same forward cone, range and walls as player vision',()=>{
  const e={x:600,y:350,angle:0};
  for(const target of [{x:800,y:350},{x:400,y:350},{x:600,y:500},{x:600+VISION.range+1,y:350}]){
    for(const walls of [[],[{x:700,y:300,w:30,h:100}]]){
      assert.equal(updateContact({...e},target,walls,.01).visible,visiblePoint(e,target,walls));
    }
  }
  assert.equal(updateContact(e,{x:580,y:350},[],.01).visible,false);
  assert.equal(e.lastContact,undefined);
  e.angle=Math.PI;assert.equal(updateContact(e,{x:580,y:350},[],.01).visible,true);
});

test('losing sight preserves only the last seen position',()=>{
  const e={x:600,y:350,angle:0};updateContact(e,{x:800,y:350},[],.01);
  const contact=updateContact(e,{x:550,y:350},[],1);
  assert.equal(contact.visible,false);assert.deepEqual(contact.target,{x:800,y:350,vx:0,vy:0});
});

test('limb loss follows courage and health, while each arm still reduces speed',()=>{
  for(const courage of ['cautious','steady','resolute'])for(const hp of [100,40]){
    const e={...ENEMIES.assault,maxHp:120,hp,courage,x:600,y:350,angle:0,
      missingArms:[1],missingLegs:[1],armsDisabled:true,legsDisabled:true};
    updateWounded(e,.01,{x:800,y:350},[],()=>assert.fail('lost rifle cannot fire'));
    assert.equal(e.woundedState,courage==='cautious'||courage==='steady'&&hp<=60?'cover':'hold');
    assert.ok(injuryMoveScale(e)>0);
    e.legsDisabled=false;
    assert.ok(Math.abs(e.speed*injuryMoveScale(e)-(e.speed-25))<1e-8);
  }
});

test('enemy vision overlay preference persists independently',()=>{
  let data;const storage={getItem:()=>data,setItem:(key,value)=>data=value};
  const settings=new Settings(storage);settings.set('enemyVision',true);
  const restored=new Settings(storage);assert.equal(restored.values.enemyVision,true);
  assert.equal(restored.values.enemyPrediction,false);
});
