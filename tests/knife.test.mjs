import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world.js';
const idle={mouse:{x:500,y:300,down:false},movement:()=>({x:0,y:0}),clear(){}};
function setup(){
  const w=new World({play(){}});w.startPrologue();w.walls=[];w.prologue.phase='search';
  Object.assign(w.player,{x:300,y:300,angle:0});
  const g=w.prologue.guards[0];w.prologue.guards=[g];
  Object.assign(g,{x:340,y:300,angle:Math.PI,searchWait:10});
  return {w,g};
}
function advance(w,input,seconds=.16){for(let i=0;i<Math.ceil(seconds*120);i++)w.update(1/120,input);}
test('a close knife hit always removes the head and records one kill',()=>{
  const {w,g}=setup();advance(w,{...idle,mouse:{...idle.mouse,down:true}});
  assert.equal(g.hp,0);assert.equal(g.headDestroyed,true);assert.equal(w.kills,1);
  assert.equal(w.effects.items.items.filter(e=>e.kind==='droppedHead').length,1);
  advance(w,idle,.2);assert.equal(w.kills,1);
});
test('knife misses targets behind the player, out of reach or behind cover',()=>{
  for(const variant of ['behind','far','wall']){
    const {w,g}=setup();
    if(variant==='behind')g.x=260;
    if(variant==='far')g.x=380;
    if(variant==='wall')w.walls=[{x:322,y:250,w:4,h:100}];
    advance(w,{...idle,mouse:{...idle.mouse,down:true}});
    assert.equal(w.kills,0);assert.ok(w.player.knifeSwing>0);assert.ok(!g.subdued);
  }
});
test('E no longer executes a takedown and settings freezes an ongoing swing',()=>{
  const {w}=setup();advance(w,{...idle,consumeInteract:()=>true});assert.equal(w.kills,0);
  w.update(1/120,{...idle,mouse:{...idle.mouse,down:true}});
  const swing=w.player.knifeSwing;w.state='settings';advance(w,idle,1);
  assert.equal(w.player.knifeSwing,swing);assert.equal(w.kills,0);
});
