import { exposedHit } from './body-fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {applyInjury,initBody} from '../src/injury.js';
import {Effects} from '../src/effects.js';
test('three torso hits including the lethal hit leave three distinct corpse marks',()=>{
 const e={hp:100,x:300,y:300,angle:0};
 for(let i=0;i<3;i++)exposedHit(e,'torso',50);
 assert.equal(e.dead,true);assert.equal(e.torsoMarks.length,3);
 assert.equal(new Set(e.torsoMarks.map(m=>`${m.x},${m.y}`)).size,3);
 const fx=new Effects();fx.fallen(e);const corpse=fx.items.items[0];
 assert.deepEqual(corpse.torsoMarks,e.torsoMarks);assert.notEqual(corpse.torsoMarks,e.torsoMarks);
 let holes=0;const c=new Proxy({arc(x,y,r){if(r===.9)holes++;}},{get(t,k){return k in t?t[k]:()=>{};},set(t,k,v){t[k]=v;return true;}});
 fx.draw(c);assert.equal(holes,3);
 exposedHit(e,'torso',50);assert.equal(e.torsoMarks.length,3);
});
test('limb and head hits do not add torso marks and pool reuse clears old wounds',()=>{
 const e={hp:100,x:300,y:300,angle:0};exposedHit(e,'torso',50);
 exposedHit(e,'leftArm');exposedHit(e,'head');
 assert.equal(e.torsoMarks.length,1);
 const fx=new Effects();fx.fallen(e);fx.clear();fx.fallen({x:300,y:300,angle:0});
 assert.deepEqual(fx.items.items[0].torsoMarks,[]);
});

 test('knife scars store varied positions and angles and keep them on the corpse',()=>{
 const e={x:300,y:300,angle:0};initBody(e);e.body.torso.armor=0;let n=0;const random=()=>((n++*37+11)%100)/100;
 for(let i=0;i<3;i++){applyInjury(e,1,{region:'torso',weapon:'knife'},i,random);}
 assert.equal(new Set(e.torsoMarks.map(m=>m.angle)).size,3);
 assert.equal(new Set(e.torsoMarks.map(m=>`${m.x},${m.y}`)).size,3);
 for(const m of e.torsoMarks){assert.ok(m.x>=-4&&m.x<=6&&m.y>=-2&&m.y<=2);assert.ok(m.angle>=0&&m.angle<Math.PI);}
 const fx=new Effects(),corpse=fx.fallen(e),before=structuredClone(corpse.torsoMarks);
 fx.update(10);assert.deepEqual(corpse.torsoMarks,before);assert.notEqual(corpse.torsoMarks,e.torsoMarks);
 });
