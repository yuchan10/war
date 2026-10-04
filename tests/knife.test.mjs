import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/world.js';
const idle={mouse:{x:500,y:300,down:false},movement:()=>({x:0,y:0}),clear(){}};
function setup(){
  const w=new World({play(){}},()=>.5);w.startPrologue();w.walls=[];w.prologue.phase='search';
  Object.assign(w.player,{x:300,y:300,angle:0});
  const g=w.prologue.guards[0];w.prologue.guards=[g];
  Object.assign(g,{x:340,y:300,angle:Math.PI,searchWait:10});
  return {w,g};
}
function advance(w,input,seconds=.16){for(let i=0;i<Math.ceil(seconds*120);i++)w.update(1/120,input);}
test('one close knife swing damages armor instead of instantly killing or repeating while held',()=>{
  const {w,g}=setup();advance(w,{...idle,mouse:{...idle.mouse,down:true}});
  assert.equal(g.dead,false);assert.equal(w.kills,0);assert.equal(g.body.torso.armor,30);
  assert.equal(g.body.torso.damage,0);assert.equal(w.prologue.phase,'search');
  advance(w,{...idle,mouse:{...idle.mouse,down:true}},.5);assert.equal(g.body.torso.armor,30);
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

test('knife damage is 60, never hits legs and follows armor, wound and head rules',()=>{
 for(const roll of [.01,.5,.99]){
  const {w,g}=setup();w.random=()=>roll;const part=roll<.05?'head':'torso';
  w.player.knifeHeadTarget=part==='head'?g:null;
  const before=g.body[part].armor;w.strikeKnife(g);assert.equal(g.body[part].armor,Math.max(0,before-60));assert.equal(g.dead,false);
  assert.equal(g.body.leftLeg.armor,55);assert.equal(g.body.rightLeg.armor,55);
  g.body[part].armor=0;const r=w.strikeKnife(g);assert.equal(r.damage,60);
  assert.equal(g.dead,part==='head');if(part==='torso'){assert.equal(g.body.torso.damage,60);assert.equal(g.body.torso.bleedRemaining,5);}
 }
});
test('a flank swing damages the facing-relative arm and cannot choose legs',()=>{
 const {w,g}=setup();g.angle=Math.PI/2;w.strikeKnife(g);
 assert.equal(g.body.rightArm.armor,0);assert.equal(g.body.torso.armor,90);
 assert.equal(g.body.leftLeg.damage,0);assert.equal(g.body.rightLeg.damage,0);
});
test('a bleeding guard can die without another swing and still unlock rifle acquisition once',()=>{
 const {w,g}=setup();g.bloodLoss=99;g.body.torso.bleedRate=10;g.body.torso.bleedRemaining=1;
 advance(w,idle,.2);assert.equal(w.prologue.phase,'arming');assert.equal(w.kills,1);
 assert.equal(w.effects.items.items.find(e=>e.kind==='body').unarmed,true);
 advance(w,idle,.5);assert.equal(w.player.hasRifle,true);assert.equal(w.kills,1);
});

test('60 damage knife breaks arm armor first, then detaches the exposed arm exactly once',()=>{
 const {w,g}=setup();g.angle=Math.PI/2;
 const first=w.strikeKnife(g);assert.equal(first.armorBroken,true);assert.equal(first.detached,false);
 assert.equal(g.body.rightArm.damage,0);assert.equal(w.effects.blood.marks.length,0);
 const second=w.strikeKnife(g);assert.equal(second.detached,true);assert.equal(g.body.rightArm.damage,60);
 assert.deepEqual(g.missingArms,[1]);assert.equal(w.effects.items.items.filter(e=>e.kind==='droppedArm').length,1);
 assert.equal(w.effects.items.items.filter(e=>e.kind==='droppedRifle').length,1);
 w.killEnemy(g);const corpse=w.effects.items.items.find(e=>e.kind==='body');
 assert.deepEqual(corpse.missingArms,[1]);assert.ok(corpse.unarmed);
});
test('knife wounds leave slash marks on the corpse and no bullet impact dust or bullet holes',()=>{
 const {w,g}=setup(),sounds=[];w.audio={play:s=>sounds.push(s)};g.body.torso.armor=0;
 for(let i=0;i<3;i++)w.strikeKnife(g);
 assert.ok(g.dead);w.killEnemy(g);
 const corpse=w.effects.items.items.find(e=>e.kind==='body');assert.equal(corpse.torsoMarks.length,3);
 assert.ok(corpse.torsoMarks.every(m=>m.kind==='cut'));assert.ok(sounds.includes('knifeHit'));assert.ok(!sounds.includes('impact'));
 assert.ok(w.effects.items.items.some(e=>e.kind==='slash'));assert.ok(!w.effects.items.items.some(e=>e.kind==='dust'));
 let holes=0;const c=new Proxy({arc(x,y,r){if(r===.9)holes++;}},{get(t,k){return k in t?t[k]:()=>{};},set(t,k,v){t[k]=v;return true;}});
 w.effects.draw(c);assert.equal(holes,0);
});

test('knife lightly pushes a living guard away, including armor hits, without crossing cover',()=>{
 const {w,g}=setup();const start=g.x;w.strikeKnife(g);assert.ok(g.knockX>0);assert.equal(g.knockY,0);
 advance(w,idle,.4);assert.ok(g.x>start&&g.x-start<8);
 const next=setup();next.w.walls=[{x:360,y:260,w:20,h:80}];next.w.strikeKnife(next.g);
 advance(next.w,idle,.4);assert.ok(next.g.x<=343.001);
});
