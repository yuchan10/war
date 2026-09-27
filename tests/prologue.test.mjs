import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {PROLOGUE_STAGE} from '../src/prologue.js';
import {routeDirection,moveBody,hasLineOfSight} from '../src/arena.js';
const idle={mouse:{x:650,y:330,down:false},movement:()=>({x:0,y:0}),consumeReload:()=>true,clear(){}};
function advance(w,seconds,input=idle){for(let i=0;i<Math.ceil(seconds*120);i++)w.update(1/120,input);}
test('search guard stops patrol, aims immediately and damages a visible moving player',()=>{
 const w=new World({play(){}});w.startPrologue();w.walls=[];w.prologue.phase='search';
 const g=w.prologue.guards[0];w.prologue.guards=[g];
 Object.assign(g,{x:300,y:300,angle:0,timer:5});
 Object.assign(w.player,{x:450,y:300});
 const moving={...idle,movement:()=>({x:0,y:.1})};
 w.update(1/120,moving);
 assert.ok(g.aimRemaining>0);assert.equal(g.x,300);assert.equal(g.y,300);
 advance(w,1,moving);assert.ok(w.player.hp<100);
});
test('search guard cannot acquire through cover and cancels aim when sight is lost',()=>{
 const w=new World({play(){}});w.startPrologue();w.walls=[];w.prologue.phase='search';
 const g=w.prologue.guards[0];w.prologue.guards=[g];
 Object.assign(g,{x:300,y:300,angle:0,timer:0,searchWait:10});
 Object.assign(w.player,{x:450,y:300});
 w.update(1/120,idle);assert.ok(g.aimRemaining>0);
 w.walls=[{x:370,y:200,w:20,h:200}];
 advance(w,1);assert.equal(g.aimRemaining,0);assert.equal(g.burstLeft,0);
 assert.equal(w.bullets.items.length,0);assert.equal(w.player.hp,100);
});
test('playable opening hides unarmed, pauses and executes each story beat once',()=>{
 const sounds=[],w=new World({play(name){sounds.push(name);}});w.startPrologue();
 const x=w.player.x;advance(w,.2,{...idle,mouse:{x:600,y:300,down:true},movement:()=>({x:1,y:0})});
 assert.equal(w.player.x,x);assert.ok(w.player.unarmed);assert.equal(w.weapon.ammo,12);assert.equal(w.bullets.items.length,0);
 w.state='paused';const time=w.prologue.elapsed;advance(w,1);assert.equal(w.prologue.elapsed,time);w.state='playing';
 advance(w,15);assert.equal(w.prologue.phase,'search');assert.equal(w.prologue.shots,3);
 assert.equal(w.prologue.allies.filter(e=>e.alive).length,0);
 assert.equal(w.effects.items.items.filter(e=>e.kind==='body').length,3);
 assert.equal(sounds.filter(s=>s==='enemyShot').length,3);
});
test('approaching a searcher for a knife strike starts normal combat',()=>{
 const w=new World({play(){}});w.startPrologue();
 advance(w,15,{...idle,consumeInteract:()=>true});assert.equal(w.prologue.phase,'search');assert.ok(w.player.unarmed);
 const guard=w.prologue.guards[0];Object.assign(w.player,{x:guard.x,y:guard.y+30});
 w.update(1/120,idle);
 assert.equal(w.state,'playing');assert.equal(w.player.hp,100);assert.ok(w.player.knifeEquipped);
 const attack={...idle,mouse:{x:guard.x,y:guard.y,down:true}};
 advance(w,.15,attack);assert.equal(w.prologue.phase,'arming');
 assert.equal(guard.headDestroyed,true);assert.equal(w.kills,1);
 advance(w,.71);assert.equal(w.prologue.phase,'revenge');assert.equal(w.player.unarmed,false);
 assert.equal(w.enemies.length,2);assert.equal(w.kills,1);assert.equal(w.weapon.ammo,12);
 advance(w,.02,{...idle,consumeReload:()=>false,mouse:{x:650,y:330,down:true}});assert.equal(w.weapon.ammo,11);
 for(const e of w.enemies)e.active=false;
 Object.assign(w.player,PROLOGUE_STAGE.exit);advance(w,2);
 assert.equal(w.prologue,null);assert.equal(w.wave,1);assert.equal(w.enemies.length,6);
});
test('knife requires close range and an unobstructed path',()=>{
 const w=new World({play(){}});w.startPrologue();
 assert.deepEqual(w.prologue.knifeTargets(w.player,w.walls),[]);
 Object.assign(w.prologue.guards[0],{x:250,y:480});
 assert.deepEqual(w.prologue.knifeTargets({x:230,y:480,angle:0},w.walls),[]);
});
test('opening escape route is navigable and restart restores allies and unarmed player',()=>{
 const w=new World({play(){}});w.startPrologue();
 const body={...PROLOGUE_STAGE.spawn,radius:15},target=PROLOGUE_STAGE.exit;
 for(let i=0;i<2000&&Math.hypot(body.x-target.x,body.y-target.y)>25;i++){
  const d=routeDirection(body,target,w.walls);moveBody(body,d.x*2,d.y*2,w.walls);
 }
 assert.ok(Math.hypot(body.x-target.x,body.y-target.y)<25);
 advance(w,7.1);w.state='dead';w.startPrologue();
 assert.equal(w.prologue.phase,'witness');assert.equal(w.prologue.allies.filter(e=>e.alive).length,3);assert.equal(w.player.hp,100);assert.ok(w.player.unarmed);
});

test('guards face each captive and the head impact occurs after muzzle fire',()=>{
 const w=new World({play(){}});w.startPrologue();
 for(let i=0;i<3;i++){
  const a=w.prologue.allies[i],g=w.prologue.guards[i];
  assert.equal(g.x,a.x);assert.ok(g.y<a.y);assert.equal(a.kneeling,true);
 }
 advance(w,5.21);assert.equal(w.prologue.shots,1);assert.equal(w.prologue.allies[0].alive,true);
 assert.equal(w.effects.blood.marks.length,0);
 const shot=w.prologue.executionShots[0],g=w.prologue.guards[0];
 assert.ok(Math.abs(Math.atan2(shot.head.y-g.y,shot.head.x-g.x)-g.angle)<1e-8);
 advance(w,.08);assert.equal(w.prologue.allies[0].alive,false);
 assert.equal(w.effects.blood.marks.length,1);
 const droplets=w.effects.items.items.filter(e=>e.active&&e.kind==='blood');
 assert.equal(droplets.length,3);assert.ok(droplets.every(e=>e.size<2));
 assert.equal(w.effects.hitMarker,0);
 const corpse=w.effects.items.items.find(e=>e.kind==='body');assert.equal(corpse.headDestroyed,true);assert.equal(corpse.color,'#7e8e63');
});

test('prologue player stands and captives fall in place facing away from shooters',()=>{
 const w=new World({play(){}});w.startPrologue();assert.equal(w.player.kneeling,false);
 advance(w,5.21);const shot=w.prologue.executionShots[0];
 advance(w,.08);const corpse=w.effects.items.items.find(e=>e.kind==='body');
 assert.equal(corpse.x,shot.ally.x);assert.equal(corpse.y,shot.ally.y);assert.equal(corpse.directedFall,true);
 assert.ok(Math.sin(corpse.angle)>.99);
});

test('player starts physically concealed from every guard throughout the execution',()=>{
 const w=new World({play(){}});w.startPrologue();
 for(let i=0;i<8*120;i++){
  w.update(1/120,idle);
  for(const g of w.prologue.guards)assert.equal(hasLineOfSight(g,w.player,w.walls),false);
 }
 assert.equal(w.player.hp,100);
 advance(w,7);const y=w.player.y;
 advance(w,.2,{...idle,movement:()=>({x:0,y:1})});assert.ok(w.player.y>y);
});

test('only captive allies have hoods and bound wrists and retain them on death',()=>{
 const w=new World({play(){}});w.startPrologue();
 assert.ok(w.prologue.allies.every(e=>e.hooded&&e.restrained&&e.kneeling));
 assert.ok(!w.player.hooded&&!w.player.restrained);
 assert.ok(w.prologue.guards.every(e=>!e.hooded&&!e.restrained));
 advance(w,7.5);
 const bodies=w.effects.items.items.filter(e=>e.kind==='body');assert.equal(bodies.length,3);
 assert.ok(bodies.every(e=>e.hooded&&e.restrained&&e.headDestroyed));
 w.effects.clear();w.effects.fallen({x:300,y:300,angle:0});
 assert.equal(w.effects.items.items[0].hooded,false);assert.equal(w.effects.items.items[0].restrained,false);
});

test('captives face south while approaching guards keep rifles raised and on target',()=>{
 const w=new World({play(){}});w.startPrologue();
 for(let frame=0;frame<4*120;frame++){
  for(let i=0;i<3;i++){
   const a=w.prologue.allies[i],g=w.prologue.guards[i];
   assert.equal(a.angle,Math.PI/2);assert.equal(g.rifleLowered,false);
   assert.ok(Math.abs(g.angle-Math.atan2(a.y+1-g.y,a.x+4-g.x))<1e-8);
  }
  w.update(1/120,idle);
 }
});
