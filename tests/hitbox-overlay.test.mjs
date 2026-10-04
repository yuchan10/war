import test from 'node:test';
import assert from 'node:assert/strict';
import {activeBodyBoxes,initBody,bodyHit} from '../src/injury.js';
import {drawEnemyHitboxes} from '../src/hitbox-overlay.js';
import {drawSkull} from '../src/damage-screen.js';
test('displayed boxes match actual collision regions and omit detached limbs',()=>{
 const e={x:300,y:300,angle:0,active:true,born:0};initBody(e);
 const rects=[],angles=[];const c={save(){},restore(){},translate(){},rotate(a){angles.push(a);},setLineDash(){},fillRect(){},strokeRect(...box){rects.push(box);}};
 for(const missing of [false,true]){
  if(missing){e.body.leftArm.severed=true;e.missingLegs=[1];}rects.length=0;
  drawEnemyHitboxes(c,{enemies:[e]});assert.equal(rects.length,missing?3:5);
  for(const [region,[x1,y1,x2,y2]] of activeBodyBoxes(e)){
   const x=e.x+(x1+x2)/2,y=e.y+(y1+y2)/2;assert.equal(bodyHit(e,{px:x,py:y,x,y,radius:0}).region,region);
   assert.ok(rects.some(box=>JSON.stringify(box)===JSON.stringify([x1,y1,x2-x1,y2-y1])));
  }
 }
 e.aimRemaining=1;e.aimAngle=1.2;drawEnemyHitboxes(c,{enemies:[e]});assert.equal(angles.at(-1),1.2);
});
test('prologue guard hitboxes work and dead, subdued and spawning enemies have none',()=>{
 const e={x:0,y:0,angle:0};let count=0;
 const c=new Proxy({strokeRect(){count++;}},{get:(o,k)=>k in o?o[k]:()=>{}});
 const world={prologue:{phase:'search',guards:[e]},enemies:[]};
 drawEnemyHitboxes(c,world);assert.equal(count,5);
 for(const key of ['dead','subdued','born']){e[key]=1;count=0;drawEnemyHitboxes(c,world);assert.equal(count,0);e[key]=0;}
});
test('skull uses only outline strokes with no solid fill',()=>{
 let strokes=0;const c=new Proxy({stroke(){strokes++;},fill(){assert.fail('no solid skull fill');},fillRect(){assert.fail('no solid teeth');}},{get:(o,k)=>k in o?o[k]:()=>{}});
 drawSkull(c,200,200);assert.equal(strokes,2);
});
