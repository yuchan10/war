import test from 'node:test';
import assert from 'node:assert/strict';
import { concealed,findRetreatCover } from '../src/cover-retreat.js';
import { updateWounded } from '../src/wounded-ai.js';
import { moveBody } from '../src/arena.js';
import { ENEMIES } from '../src/config.js';

test('wounded enemy routes around cover and stays concealed instead of following allies',()=>{
  const walls=[{x:500,y:280,w:50,h:160}],player={x:300,y:350};
  const e={...ENEMIES.assault,maxHp:120,hp:80,courage:'cautious',x:450,y:350,angle:0,armsDisabled:true,lastContact:{...player}};
  const target=findRetreatCover(e,player,walls);assert.ok(target);assert.ok(concealed(target,player,walls,e.radius));
  for(let i=0;i<2400;i++){
    const motion=updateWounded(e,1/120,player,walls,()=>assert.fail('cannot fire'));
    moveBody(e,motion.x/120,motion.y/120,walls);
  }
  assert.ok(concealed(e,player,walls,e.radius));assert.equal(e.woundedState,'hidden');
  const before={x:e.x,y:e.y};
  const motion=updateWounded(e,.1,player,walls,()=>{});
  assert.deepEqual(motion,{x:0,y:0});assert.deepEqual({x:e.x,y:e.y},before);
});

test('cover selection ignores hidden live player movement and handles no cover',()=>{
  const player={x:300,y:350},walls=[{x:500,y:280,w:50,h:160}];
  const e={...ENEMIES.assault,hp:80,maxHp:120,courage:'cautious',x:450,y:350,angle:0,armsDisabled:true,lastContact:{...player}};
  updateWounded(e,.01,player,walls,()=>{});const target={...e.retreatCover};
  updateWounded(e,1,{x:200,y:450},walls,()=>{});assert.deepEqual(e.retreatCover,target);
  assert.equal(findRetreatCover(e,player,[]),null);
});
