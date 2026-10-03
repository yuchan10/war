import test from 'node:test';
import assert from 'node:assert/strict';
import { knifePose,updateKnife,KNIFE_DURATION,KNIFE_HIT_TIME } from '../src/knife.js';
test('knife pose stays continuous at phase boundaries and returns to its original guard',()=>{
 const start=knifePose(KNIFE_DURATION),end=knifePose(0);
 assert.equal(start.angle,end.angle);assert.equal(start.reach,end.reach);
 for(const time of [.07,KNIFE_HIT_TIME,.21,KNIFE_DURATION]){
  const a=knifePose(KNIFE_DURATION-time+.000001),b=knifePose(KNIFE_DURATION-time);
  assert.ok(Math.abs(a.angle-b.angle)<.001);assert.ok(Math.abs(a.reach-b.reach)<.001);
 }
 assert.equal(knifePose(KNIFE_DURATION-KNIFE_HIT_TIME).angle,0);
 assert.equal(start.trail,0);assert.equal(end.trail,0);
});
test('swing sound precedes contact, each click hits once at the blade crossing across frame rates',()=>{
 for(const fps of [30,60,120]){
  const p={knifeEquipped:true},sounds=[],hits=[];let elapsed=0;
  updateKnife(p,1/fps,true,()=>sounds.push(elapsed));
  for(let i=0;i<fps;i++){elapsed+=1/fps;if(updateKnife(p,1/fps,true,()=>sounds.push(elapsed)))hits.push(elapsed);}
  assert.equal(hits.length,1);assert.equal(sounds.length,1);assert.ok(sounds[0]<hits[0]);
  assert.ok(Math.abs(hits[0]-KNIFE_HIT_TIME)<=1/fps+.00001);assert.equal(p.knifeSwing,0);
 }
});
