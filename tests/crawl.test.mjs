import test from 'node:test';
import assert from 'node:assert/strict';
import {injuryMoveScale} from '../src/injury.js';
import {animateStride} from '../src/soldier.js';
import {updateFootsteps} from '../src/footsteps.js';
test('leg loss limits crawling to at most four percent speed and keeps arm penalties',()=>{
 for(const speed of [101.5,59.5]){
  const e={speed,legsDisabled:true,missingLegs:[1],crawlPhase:Math.PI/2};
  assert.ok(Math.abs(speed*injuryMoveScale(e)-speed*.04)<1e-8);
  e.missingArms=[1];assert.ok(Math.abs(speed*injuryMoveScale(e)-(speed-25)*.04)<1e-8);
  e.missingLegs=[1,-1];assert.ok(Math.abs(speed*injuryMoveScale(e)-(speed-25)*.025)<1e-8);
 }
});
test('crawling remains possible with both legs and arms missing, slower than one leg loss',()=>{
 const one={legsDisabled:true,missingLegs:[-1]},two={...one,missingLegs:[-1,1]},none={...two,missingArms:[-1,1]};
 assert.ok(injuryMoveScale(one)<.15);assert.ok(injuryMoveScale(two)<injuryMoveScale(one));
 assert.ok(injuryMoveScale(none)>0&&injuryMoveScale(none)<injuryMoveScale(two));
 assert.equal(injuryMoveScale({}),1);
});
test('actual crawling advances arm/torso animation without walking or footsteps and stops at rest',()=>{
 const e={legsDisabled:true,x:305,y:300,crawlPhase:0};let sounds=0;
 animateStride(e,300,300);assert.ok(e.crawling);assert.equal(e.walking,false);assert.ok(e.crawlPhase>0);
 updateFootsteps(e,200,300,e,()=>sounds++);assert.equal(sounds,0);
 const phase=e.crawlPhase;animateStride(e,305,300);assert.equal(e.crawling,false);assert.equal(e.crawlPhase,phase);
});
