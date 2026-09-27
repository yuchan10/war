import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES } from '../src/stages.js';
import { ENEMIES } from '../src/config.js';
import { updateCoverDefender } from '../src/cover-ai.js';
import { hasLineOfSight,moveBody } from '../src/arena.js';

test('all defenders start concealed from the entry and can peek around cover',()=>{
  for(const stage of STAGES)for(const post of stage.enemies.filter(e=>e.cover)){
    assert.equal(hasLineOfSight(post,stage.spawn,stage.walls),false);
    assert.ok(Math.hypot(post.cover.peek.x-post.x,post.cover.peek.y-post.y)<80);
  }
});
test('defender peeks, fires, retreats and stays near its assigned post',()=>{
  const stage=STAGES[0],post=stage.enemies[0];
  const e={...ENEMIES.shooter,...post,timer:0,flash:0};let shots=0;const states=new Set();
  for(let i=0;i<2400;i++){
    e.timer-=1/120;const v=updateCoverDefender(e,1/120,stage.spawn,stage.walls,()=>shots++);
    moveBody(e,v.x/120,v.y/120,stage.walls);states.add(e.coverState);
    assert.ok(Math.hypot(e.x-post.x,e.y-post.y)<85);
  }
  assert.ok(shots>0);assert.ok(states.has('hidden'));assert.ok(states.has('peek'));assert.ok(states.has('retreat'));
});
test('defender retaliates against a flanking player only when facing that side',()=>{
  const stage=STAGES[0],post=stage.enemies[0];const e={...ENEMIES.shooter,...post,timer:0,flash:0};
  e.angle=0;const player={x:post.x+160,y:post.y};let shots=0;
  assert.equal(hasLineOfSight(e,player,stage.walls),true);
  for(let i=0;i<500;i++){e.timer-=.01;const v=updateCoverDefender(e,.01,player,stage.walls,()=>shots++);moveBody(e,v.x*.01,v.y*.01,stage.walls);}
  assert.ok(shots>0);assert.ok(e.x<post.x+5);
});
