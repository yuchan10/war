import test from 'node:test';
import assert from 'node:assert/strict';
import {CONFIG} from '../src/config.js';
import {World} from '../src/world.js';
const input={mouse:{x:900,y:300,down:false},movement:()=>({x:1,y:0})};
function travel(scale,intro,type,wounded){
  CONFIG.movementScale=scale;
  const w=new World({play(){}},()=>.5);intro?w.startPrologue():w.start();w.walls=[];
  Object.assign(w.player,{x:100,y:100,angle:0});
  let e;
  if(intro){w.prologue.phase='search';e=w.prologue.guards[0];w.prologue.guards=[e];}
  else{w.enemies=[];w.spawnEnemy(type,600,350);e=w.enemies[0];}
  Object.assign(e,{x:600,y:350,angle:0,born:0,timer:100,patrolPoints:[{x:900,y:350}],patrolIndex:0,searchWait:0});
  if(wounded)for(const actor of [w.player,e]){actor.missingArms=[-1];actor.body.leftArm.severed=true;actor.legsDisabled=true;actor.missingLegs=[-1];actor.body.leftLeg.severed=true;}
  const px=w.player.x,py=w.player.y,x=e.x,y=e.y;
  w.update(.01,input);
  return {player:Math.hypot(w.player.x-px,w.player.y-py),enemy:Math.hypot(e.x-x,e.y-y)};
}
test('all live movement including wounded crawling is exactly 80 percent of the former speed',()=>{
  const saved=CONFIG.movementScale;
  try{
    assert.equal(saved,.8);
    for(const intro of [false,true])for(const type of ['assault','shooter'])for(const wounded of [false,true]){
      const before=travel(1,intro,type,wounded),after=travel(.8,intro,type,wounded);
      for(const key of ['player','enemy']){assert.ok(before[key]>0,`${intro}/${type}/${key} moves`);assert.ok(Math.abs(after[key]-before[key]*.8)<1e-8);}
    }
  }finally{CONFIG.movementScale=saved;}
});
