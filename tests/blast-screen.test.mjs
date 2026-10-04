import test from 'node:test';
import assert from 'node:assert/strict';
import {blastScreenState,triggerBlastShock,drawBlastScreen} from '../src/blast-screen.js';
import {World} from '../src/world.js';
test('blast disorientation scales with distance and height and fades completely',()=>{
 const w={time:10,player:{x:0,y:0}};
 triggerBlastShock(w,{x:90,y:0});const near=blastScreenState(w);assert.equal(near.strength,.75);assert.equal(near.flash,.75);
 w.blastShock=null;triggerBlastShock(w,{x:270,y:0});assert.equal(blastScreenState(w).strength,.25);
 w.blastShock=null;triggerBlastShock(w,{x:0,y:0,height:270});assert.equal(blastScreenState(w).strength,.25);
 w.time+=.2;assert.equal(blastScreenState(w).flash,0);assert.ok(blastScreenState(w).strength<.25);
 w.time+=5;assert.equal(blastScreenState(w).strength,0);
 w.blastShock=null;triggerBlastShock(w,{x:400,y:0});assert.equal(w.blastShock,null);
});
test('nearby repeat explosions stay bounded, pause freezes effect and reset clears it',()=>{
 const w=new World({play(){}},()=>.5);w.start();triggerBlastShock(w,w.player);triggerBlastShock(w,w.player);
 assert.equal(blastScreenState(w).strength,1);w.state='settings';w.update(1,{});assert.equal(blastScreenState(w).strength,1);
 w.reset();assert.equal(w.blastShock,null);
});
test('camera shake disabled avoids image copying and double vision',()=>{
 const w={time:0,player:{x:0,y:0}};triggerBlastShock(w,w.player);let fills=0;
 const c={save(){},restore(){},createRadialGradient(){return {addColorStop(){}};},fillRect(){fills++;}};
 drawBlastScreen(c,w,{getContext(){throw Error('motion effect disabled');}},false,1200,720);assert.equal(fills,2);
});
