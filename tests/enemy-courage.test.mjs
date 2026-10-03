import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world.js';
import { STAGES } from '../src/stages.js';
import { ENEMIES } from '../src/config.js';
import { updateWounded } from '../src/wounded-ai.js';

const soldier=courage=>({...ENEMIES.assault,courage,wasHit:true,x:500,y:350,angle:0,timer:0});
test('stages progressively add resolute soldiers and spawning preserves courage',()=>{
  STAGES.forEach((stage,index)=>assert.equal(stage.enemies.filter(e=>e.courage==='resolute').length,index+1));
  const w=new World({play(){}});w.start();
  assert.deepEqual(w.enemies.map(e=>e.courage),w.stage.enemies.map(e=>e.courage));
});

test('a small wound makes cautious enemies seek cover while other profiles can retaliate',()=>{
  const player={x:650,y:350},walls=[{x:380,y:280,w:45,h:150}];
  for(const courage of ['cautious','steady','resolute']){
    const e=soldier(courage);let shots=0;
    updateWounded(e,.01,player,walls,()=>shots++);
    updateWounded(e,.4,player,walls,()=>shots++);
    if(courage==='cautious'){assert.equal(shots,0);assert.equal(e.woundedState,'cover');assert.ok(e.retreatCover);}
    else{assert.equal(shots,1);assert.equal(e.woundedState,'fight');}
  }
});

test('resolute wounded soldiers hold with severe blood loss and suppress memory, and do not flee solely because they lose their gun',()=>{
  const e={...soldier('resolute'),bloodLoss:90,lastContact:{x:650,y:350}},player={x:350,y:350};
  let shots=0;
  updateWounded(e,.01,player,[],()=>shots++);
  updateWounded(e,.4,player,[],()=>shots++);
  assert.equal(e.woundedState,'hold');assert.equal(shots,1);assert.equal(e.lastContact.x,650);
  e.armsDisabled=true;
  updateWounded(e,.1,player,[],()=>shots++);
  assert.equal(e.woundedState,'hold');assert.equal(shots,1);assert.equal(e.burstLeft,0);
});
