import test from 'node:test';
import assert from 'node:assert/strict';
import { Settings } from '../src/settings.js';
import { updateEnemyFire } from '../src/enemy-fire.js';
import { hasLineOfSight, traceBullet, routeDirection, moveBody } from '../src/arena.js';
import { STAGES } from '../src/stages.js';

test('prediction toggles persist independently; invalid stored types ignored',()=>{
  let saved='{"enemyPrediction":"false"}';const storage={getItem:()=>saved,setItem:(key,value)=>saved=value};
  const a=new Settings(storage);assert.equal(a.values.enemyPrediction,false);
  a.set('playerPrediction',true);assert.equal(a.values.enemyPrediction,false);
  a.set('enemyPrediction',true);a.set('playerPrediction',false);
  const b=new Settings(storage);assert.equal(b.values.playerPrediction,false);assert.equal(b.values.enemyPrediction,true);
  assert.doesNotThrow(()=>new Settings({getItem(){throw Error('denied');}}));
});
test('cover blocks view and cancels an enemy burst',()=>{
  const e={x:650,y:350,timer:0,aimDuration:.45,burstCount:3,burstInterval:.14,fireInterval:1,damage:22,bulletSpeed:520};
  const target={x:300,y:350};const walls=[{x:365,y:265,w:35,h:170,material:'sandbag'}];const shots=[];
  assert.equal(hasLineOfSight(e,target,walls),false);
  updateEnemyFire(e,.01,target,(...args)=>shots.push(args),true);
  updateEnemyFire(e,.45,target,(...args)=>shots.push(args),true);assert.equal(shots.length,1);
  updateEnemyFire(e,.2,target,(...args)=>shots.push(args),false);
  assert.equal(shots.length,1);assert.equal(e.burstLeft,0);
});
test('rifle fires three spaced shots instead of a single slow shot',()=>{
  const e={x:600,y:350,timer:0,aimDuration:.45,burstCount:3,burstInterval:.14,fireInterval:1,damage:22,bulletSpeed:520};const shots=[];
  const fire=(...args)=>shots.push(args);const p={x:300,y:350};
  updateEnemyFire(e,.01,p,fire);updateEnemyFire(e,.45,p,fire);assert.equal(shots.length,1);
  updateEnemyFire(e,.14,p,fire);updateEnemyFire(e,.14,p,fire);
  assert.equal(shots.length,3);assert.equal(e.timer,1);
});
test('all wall materials absorb bullets',()=>{
  for(const material of ['sandbag','concrete','steel']){
    const b={x:300,y:350,vx:900,vy:0,radius:4,bounces:2,active:true};
    traceBullet(b,.2,[{x:365,y:265,w:35,h:170,material}]);
    assert.equal(b.active,false);
    assert.equal(b.vx,900);
  }
});
test('stage routes remain traversable around short cover',()=>{
  for(const stage of STAGES){
    const body={...stage.spawn,radius:15};
    for(let i=0;i<2200&&Math.hypot(body.x-stage.exit.x,body.y-stage.exit.y)>20;i++){
      const d=routeDirection(body,stage.exit,stage.walls);moveBody(body,d.x*2,d.y*2,stage.walls);
    }
    assert.ok(Math.hypot(body.x-stage.exit.x,body.y-stage.exit.y)<20);
  }
});
