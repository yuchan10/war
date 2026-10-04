import test from 'node:test';
import assert from 'node:assert/strict';
import {createGrenade,updateGrenades,grenadePrediction,drawGrenadePrediction} from '../src/grenade.js';
const player={x:100,y:300,angle:0};
test('aim preview matches actual range-limited landing and parabolic height',()=>{
 const walls=[{x:250,y:250,w:25,h:100}],target={x:800,y:300};
 const preview=grenadePrediction(player,target,walls,3),g=createGrenade(player,target,walls);
 updateGrenades([g],3,walls,()=>{});
 assert.equal(preview.end.x,g.x);assert.equal(preview.end.y,g.y);assert.equal(preview.end.height,0);
 assert.equal(preview.radius,165);assert.equal(preview.killRadius,65);assert.equal(preview.airburst,false);
 assert.ok(preview.points.some(p=>p.height>85));assert.equal(g.x,460);
});
test('cooked grenade preview stops at actual midair explosion and does not alter the fuse',()=>{
 const fuse=.3,target={x:460,y:300},preview=grenadePrediction(player,target,[],fuse),g=createGrenade(player,target);
 g.fuse=fuse;updateGrenades([g],1,[],()=>{});
 assert.ok(preview.airburst);for(const key of ['x','y','height'])assert.equal(preview.end[key],g[key]);
 assert.ok(preview.radius<165);assert.equal(preview.killRadius,0);
});
test('prediction only renders while holding a live primed grenade',()=>{
 let strokes=0;const c=new Proxy({stroke(){strokes++;}},{get:(o,k)=>k in o?o[k]:()=>{}});
 const w={state:'playing',player,walls:[],time:0};
 drawGrenadePrediction(c,w,{x:400,y:300});assert.equal(strokes,0);
 w.primedGrenade={active:true,fuse:3};drawGrenadePrediction(c,w,{x:400,y:300});assert.ok(strokes>0);const drawn=strokes;
 assert.equal(w.primedGrenade.fuse,3);w.state='settings';drawGrenadePrediction(c,w,{x:400,y:300});assert.equal(strokes,drawn);
});
