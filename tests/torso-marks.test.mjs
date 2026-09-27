import test from 'node:test';
import assert from 'node:assert/strict';
import {applyInjury} from '../src/injury.js';
import {Effects} from '../src/effects.js';
test('three torso hits including the lethal hit leave three distinct corpse marks',()=>{
 const e={hp:100,x:300,y:300,angle:0};
 for(let i=0;i<3;i++)applyInjury(e,30,()=>.3);
 assert.equal(e.hp,0);assert.equal(e.torsoMarks.length,3);
 assert.equal(new Set(e.torsoMarks.map(m=>`${m.x},${m.y}`)).size,3);
 const fx=new Effects();fx.fallen(e);const corpse=fx.items.items[0];
 assert.deepEqual(corpse.torsoMarks,e.torsoMarks);assert.notEqual(corpse.torsoMarks,e.torsoMarks);
 let holes=0;const c=new Proxy({arc(x,y,r){if(r===.9)holes++;}},{get(t,k){return k in t?t[k]:()=>{};},set(t,k,v){t[k]=v;return true;}});
 fx.draw(c);assert.equal(holes,3);
 applyInjury(e,30,()=>.3);assert.equal(e.torsoMarks.length,3);
});
test('limb and head hits do not add torso marks and pool reuse clears old wounds',()=>{
 const e={hp:100,x:300,y:300,angle:0};applyInjury(e,30,()=>.3);
 applyInjury(e,30,()=>.7);applyInjury(e,30,()=>0);
 assert.equal(e.torsoMarks.length,1);
 const fx=new Effects();fx.fallen(e);fx.clear();fx.fallen({x:300,y:300,angle:0});
 assert.deepEqual(fx.items.items[0].torsoMarks,[]);
});
