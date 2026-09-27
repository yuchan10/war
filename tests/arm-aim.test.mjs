import test from 'node:test';
import assert from 'node:assert/strict';
import {applyInjury} from '../src/injury.js';
import {Effects} from '../src/effects.js';
import {updateEnemyFire,enemyShotAngle} from '../src/enemy-fire.js';
const wound=(e,region,side)=>{const values=[region,side];return applyInjury(e,30,()=>values.shift());};
test('arm and leg sides are independent random choices and only surviving sides can be hit',()=>{
 for(const region of [.7,.9])for(const sideRoll of [.2,.8]){
  const e={hp:100};wound(e,region,sideRoll);const key=region===.7?'missingArms':'missingLegs';
  assert.deepEqual(e[key],[sideRoll<.5?-1:1]);
  wound(e,region,sideRoll);assert.deepEqual([...e[key]].sort(),[-1,1]);
 }
});
test('support arm drops alone, keeps shooting with wobble, then trigger arm drops rifle once',()=>{
 const e={hp:100,x:300,y:300,angle:0,aimAngle:0,timer:0,aimDuration:.1,burstCount:3,burstInterval:.1,shotSpread:.014,damage:20,bulletSpeed:1000,fireInterval:1},fx=new Effects();
 wound(e,.7,.1);fx.detach(e,'arm',0);
 assert.equal(e.armsDisabled,false);assert.equal(e.aimImpaired,true);
 assert.deepEqual(fx.items.items.map(e=>e.kind),['droppedArm']);
 const shots=[];for(let i=0;i<10;i++)updateEnemyFire(e,.05,{x:600,y:300},(x,y,a)=>shots.push(a));
 assert.equal(shots.length,3);assert.ok(shots.some(a=>Math.abs(a)>.04));
 const healthy={...e,aimImpaired:false};
 assert.ok(enemyShotAngle(e,2)-enemyShotAngle(e,0)>enemyShotAngle(healthy,2)-enemyShotAngle(healthy,0));
 wound(e,.7,.1);fx.detach(e,'arm',0);
 assert.ok(e.armsDisabled);assert.equal(e.aimImpaired,false);
 assert.equal(fx.items.items.filter(e=>e.kind==='droppedRifle').length,1);
 for(let i=0;i<10;i++)updateEnemyFire(e,.1,{x:600,y:300},()=>shots.push(99));
 assert.equal(shots.length,3);
});
