import { exposedHit } from './body-fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {applyInjury} from '../src/injury.js';
import {Effects} from '../src/effects.js';
test('two arm wounds remove opposite arms and drop the rifle only once',()=>{
 const e={hp:100,x:300,y:300,angle:0},fx=new Effects();
 let injury=exposedHit(e,'rightArm');assert.ok(injury.detached);fx.detach(e,injury.kind,0);
 assert.deepEqual(fx.items.items.map(e=>e.kind),['droppedArm','droppedRifle']);
 const firstSide=e.missingArm;injury=exposedHit(e,'leftArm');assert.ok(injury.detached);assert.equal(e.missingArm,-firstSide);fx.detach(e,injury.kind,0);const side=e.missingArm;
 assert.equal(fx.items.items.filter(e=>e.kind==='droppedRifle').length,1);assert.equal(fx.items.items.filter(e=>e.kind==='droppedArm').length,2);assert.equal(e.missingArms.length,2);
 fx.fallen(e);const body=fx.items.items.at(-1);assert.equal(body.missingArm,side);assert.equal(body.unarmed,true);
});
test('leg fragments settle, respect cover and keep corpse injury state',()=>{
 const e={hp:100,x:300,y:300,angle:0},fx=new Effects();const injury=exposedHit(e,'leftLeg');
 fx.detach(e,injury.kind,0);const limb=fx.items.items[0];assert.equal(limb.kind,'droppedLeg');
 for(let i=0;i<120;i++)fx.update(1/60,[{x:315,y:270,w:30,h:80}]);
 assert.ok(limb.x<=312.01);assert.ok(Math.abs(limb.vx)<.01);assert.ok(limb.active);
 fx.fallen(e);assert.equal(fx.items.items.at(-1).missingLeg,e.missingLeg);
 fx.clear();assert.ok(fx.items.items.every(e=>!e.active));
});

test('headshot corpse omits its head and pooled reuse restores a healthy head',()=>{
 const fx=new Effects(),e={hp:100,x:300,y:300,angle:0};
 exposedHit(e,'head');fx.fallen(e);assert.ok(fx.items.items[0].headDestroyed);
 let headArcs=0;const c=new Proxy({arc(x,y,r){if(r===6)headArcs++;}},{get(t,k){return k in t?t[k]:()=>{};},set(t,k,v){t[k]=v;return true;}});
 fx.draw(c);assert.equal(headArcs,0);
 fx.clear();fx.fallen({x:300,y:300,angle:0});fx.draw(c);
 assert.equal(headArcs,1);assert.equal(fx.items.items[0].headDestroyed,false);
 assert.deepEqual(fx.items.items[0].missingArms,[]);
});
