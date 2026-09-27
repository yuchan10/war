import test from 'node:test';
import assert from 'node:assert/strict';
import { SightMemory } from '../src/sight-memory.js';
test('hidden enemy fades at its last seen position and then disappears',()=>{
  const memory=new SightMemory(.45),e={x:100,y:100};
  memory.update([e],0,()=>true);e.x=250;
  const first=memory.update([e],.1,()=>false)[0];
  const later=memory.update([e],.3,()=>false)[0];
  assert.equal(first.pose.x,100);assert.ok(later.alpha<first.alpha);assert.ok(later.blur>first.blur);
  assert.equal(memory.update([e],.5,()=>false).length,0);
});
test('unseen, removed and previous-run enemies leave no hidden silhouettes',()=>{
  const memory=new SightMemory(),e={x:10,y:10};
  assert.equal(memory.update([e],5,()=>false).length,0);
  memory.update([e],6,()=>true);assert.equal(memory.update([],6.1,()=>false).length,0);
  memory.update([e],7,()=>true);assert.equal(memory.update([e],0,()=>false).length,0);
});
