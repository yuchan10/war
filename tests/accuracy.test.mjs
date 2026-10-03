import test from 'node:test';
import assert from 'node:assert/strict';
import {effectiveAccuracy,accuracySpread,shotAngle} from '../src/accuracy.js';
import {initBody,applyInjury,injuryMoveScale,tickWounds} from '../src/injury.js';
import {updateEnemyFire} from '../src/enemy-fire.js';
import {World} from '../src/world.js';

test('accuracy 100 is exact and 50 uniformly maps random samples into plus/minus five degrees',()=>{
 const aim=1.2;
 for(const roll of [0,.25,.5,.75,1]){
  assert.equal(shotAngle({accuracy:100},aim,()=>roll),aim);
  assert.ok(Math.abs(shotAngle({accuracy:50},aim,()=>roll)-(aim+(roll*2-1)*5*Math.PI/180))<1e-10);
 }
 assert.equal(accuracySpread({accuracy:150}),0);assert.equal(effectiveAccuracy({accuracy:-10}),0);
});
test('partial arm wounds lower accuracy permanently, independently of armor and base accuracy',()=>{
 const e={accuracy:100};initBody(e);applyInjury(e,20,{region:'leftArm'});assert.equal(effectiveAccuracy(e),100);
 e.body.leftArm.armor=0;applyInjury(e,30,{region:'leftArm'});assert.equal(effectiveAccuracy(e),87.5);assert.equal(e.accuracy,100);
 e.body.rightArm.armor=0;applyInjury(e,30,{region:'rightArm'});assert.equal(effectiveAccuracy(e),75);
 tickWounds(e,5);assert.equal(effectiveAccuracy(e),75);e.body.leftArm.armor=45;assert.equal(effectiveAccuracy(e),75);
 e.accuracy=50;assert.equal(effectiveAccuracy(e),25);
});
test('leg damage progressively slows both actors before severing, retains arm penalty and crawl',()=>{
 for(const speed of [126,101.5,59.5]){
  const e={speed};initBody(e);assert.equal(injuryMoveScale(e),1);
  e.body.leftLeg.damage=30;const mild=injuryMoveScale(e);assert.ok(mild<1&&mild>.8);
  e.body.rightLeg.damage=60;const severe=injuryMoveScale(e);assert.ok(severe<mild);
  tickWounds(e,10);const recovered=injuryMoveScale(e);assert.ok(recovered>severe);
  e.missingArms=[-1];assert.ok(Math.abs(injuryMoveScale(e)-(speed-25)/speed*recovered)<1e-10);
  e.legsDisabled=true;e.missingLegs=[1];assert.ok(injuryMoveScale(e)<.05);
 }
});
test('player and enemy shots share the accuracy rule with no extra legacy spread',()=>{
 const w=new World({play(){}},()=>1);w.start();w.walls=[];w.enemies=[];w.spawnEnemy('assault',1000,600);
 Object.assign(w.player,{x:300,y:300,accuracy:50});
 w.update(.01,{mouse:{x:900,y:300,down:true},movement:()=>({x:0,y:0})});
 const bullet=w.bullets.items.find(b=>!b.hostile);assert.ok(Math.abs(Math.atan2(bullet.vy,bullet.vx)-Math.PI/36)<1e-10);
 const e={x:300,y:300,accuracy:50,timer:0,aimDuration:.1,burstCount:3,burstInterval:.1,fireInterval:1,bulletSpeed:1000,damage:30,shotSpread:99},shots=[];
 updateEnemyFire(e,.01,{x:900,y:300},(x,y,a)=>shots.push(a),true,()=>1);
 updateEnemyFire(e,.1,{x:900,y:300},(x,y,a)=>shots.push(a),true,()=>1);
 updateEnemyFire(e,.1,{x:900,y:300},(x,y,a)=>shots.push(a),true,()=>0);
 assert.ok(Math.abs(shots[0]-Math.PI/36)<1e-10);assert.ok(Math.abs(shots[1]+Math.PI/36)<1e-10);
});
