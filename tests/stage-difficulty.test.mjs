import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES } from '../src/stages.js';
import { ENEMIES } from '../src/config.js';
import { updateAssault } from '../src/assault-ai.js';
import { updateCoverDefender } from '../src/cover-ai.js';

test('each later sector adds one veteran and one resolute soldier, retaining both roles',()=>{
  STAGES.forEach((stage,index)=>{
    assert.equal(stage.enemies.length,6);
    assert.equal(stage.enemies.filter(e=>e.skill==='veteran').length,index+1);
    assert.equal(stage.enemies.filter(e=>e.courage==='resolute').length,index+1);
    assert.equal(stage.enemies.filter(e=>e.type==='assault').length,3);
    assert.equal(stage.enemies.filter(e=>e.type==='shooter').length,3);
  });
});

test('both roles fire at visible targets outside bullet range, even when wounded and resolute',()=>{
  for(const type of ['assault','shooter'])for(const wounded of [false,true]){
    const base=ENEMIES[type];
    const e={...base,maxHp:base.hp,hp:wounded?1:base.hp,courage:'resolute',x:200,y:350,angle:0,timer:0};
    const shots=[],shoot=(...args)=>shots.push(args),player={x:1000,y:350};
    const update=type==='assault'?updateAssault:updateCoverDefender;
    update(e,.01,player,[],shoot);update(e,e.aimDuration,player,[],shoot);
    assert.ok(shots.length>0);assert.equal(shots[0][7],base.bulletRange);
  }
});
