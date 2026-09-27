import test from 'node:test';
import assert from 'node:assert/strict';
import { safeShot,suppressionTarget } from '../src/suppression-target.js';
import { updateFootsteps } from '../src/footsteps.js';
test('shooter rejects bullets into its own cover including oblique fire',()=>{
  const wall={x:450,y:250,w:32,h:140},e={x:510,y:310,cover:{wall}};
  assert.equal(safeShot(e,Math.PI,[wall]),false);
  assert.equal(safeShot(e,0,[wall]),true);
});
test('suppression selects both exits around the remembered enemy cover',()=>{
  const wall={x:300,y:250,w:32,h:140},e={x:700,y:350};
  const first=suppressionTarget(e,{x:290,y:320},[wall]);e.suppressionShots=3;
  const second=suppressionTarget(e,{x:290,y:320},[wall]);
  assert.ok(first);assert.ok(second);assert.notEqual(first.y,second.y);
  assert.ok(first.y<wall.y||first.y>wall.y+wall.h);
  assert.equal(e.suppressionWall,wall);
});
test('footsteps use distance, stay silent at rest and carry source position',()=>{
  const e={x:100,y:100},sounds=[],listener={x:0,y:100};const play=(...args)=>sounds.push(args);
  updateFootsteps(e,100,100,listener,play);assert.equal(sounds.length,0);
  e.x=130;updateFootsteps(e,100,100,listener,play);assert.equal(sounds.length,0);
  e.x=160;updateFootsteps(e,130,100,listener,play);assert.equal(sounds.length,1);
  assert.equal(sounds[0][0],'enemyFootstep');assert.equal(sounds[0][1].dx,160);
});
