import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareSquad,registerNearMiss,notifyCasualty} from '../src/squad-ai.js';
import {updateTacticalEnemy} from '../src/tactical-ai.js';
import {chooseTacticalCover} from '../src/tactical-cover.js';
import {initBody} from '../src/injury.js';
import {ENEMIES} from '../src/config.js';
import {moveBody} from '../src/arena.js';
import {concealed} from '../src/cover-retreat.js';
import {updateEnemyReload} from '../src/enemy-fire.js';
import {hearSound} from '../src/hearing.js';
const soldier=(role='assault',extra={})=>{const e={...ENEMIES[role],x:600,y:350,angle:Math.PI,ammo:12,timer:0,active:true,born:0,courage:'steady',skill:'regular',...extra};initBody(e);return e;};
function tick(es,p,walls,dt=.05,shoot=()=>{}){prepareSquad(es,p,walls,dt);for(const e of es){if(e.dead)continue;e.timer-=dt;updateEnemyReload(e,dt);const v=updateTacticalEnemy(e,dt,walls,es,shoot,()=>.5);moveBody(e,v.x*dt,v.y*dt,walls);}}
test('reports are delayed snapshots, limited by distance and never relay hidden live movement',()=>{
 const a=soldier(),b=soldier('shooter',{x:650,angle:0}),far=soldier('shooter',{x:1100,angle:0}),p={x:300,y:350};
 prepareSquad([a,b,far],p,[],.01);assert.ok(b.pendingReport);assert.equal(b.reportPosition,null);assert.equal(far.pendingReport,undefined);
 p.x=250;prepareSquad([a,b,far],p,[],.5);assert.equal(b.contact.source,'report');assert.equal(b.contact.target.x,300);assert.equal(b.lastContact,undefined);
});
test('paired squad assigns one mover, and pauses flanking while partner reloads',()=>{
 const a=soldier(),b=soldier('shooter',{x:650,y:390}),p={x:300,y:350};b.lastFiredAt=0;b.aiClock=0;prepareSquad([a,b],p,[],.01);
 assert.equal(a.assignment,'flank');assert.equal(b.assignment,'support');b.ammo=0;
 prepareSquad([a,b],p,[],.01);assert.notEqual(a.assignment,'flank');
});
test('cover shields the whole body and occupied posts are not selected twice',()=>{
 const walls=[{x:460,y:270,w:50,h:180}],e=soldier(),p={x:300,y:350};
 const c=chooseTacticalCover(e,p,walls);assert.ok(c);assert.ok(concealed(c.hide,p,walls,17));
 const friend=soldier('shooter',{tacticalCover:c});const next=chooseTacticalCover(e,p,walls,[e,friend]);
 assert.ok(!next||Math.hypot(next.hide.x-c.hide.x,next.hide.y-c.hide.y)>=65);
});
test('reload drives an exposed soldier toward shelter without firing',()=>{
 const e=soldier('assault',{x:430,y:350,ammo:0}),p={x:300,y:350},walls=[{x:470,y:270,w:55,h:180}];
 e.contact={visible:true,target:p,age:0,source:'sight'};const v=updateTacticalEnemy(e,.05,walls,[e],()=>assert.fail('reloading fired'));
 assert.equal(e.aiState,'reload');assert.ok(e.tacticalCover);assert.ok(Math.hypot(v.x,v.y)>0);
});
test('sound position has bounded uncertainty and is not treated as visual confirmation',()=>{
 const e=soldier('assault',{angle:0}),p={x:500,y:350};hearSound([e],p,'gunshot',[],()=>.5);
 assert.ok(Math.hypot(e.heardPosition.x-p.x,e.heardPosition.y-p.y)>0);assert.ok(Math.hypot(e.heardPosition.x-p.x,e.heardPosition.y-p.y)<=55);
 tick([e],p,[],.01,()=>assert.fail('fired at sound alone'));assert.equal(e.aiState,'search');assert.equal(e.lastContact,undefined);
});
test('search finishes and discards exhausted contact instead of firing forever',()=>{
 const e=soldier('assault',{x:500,y:350,angle:0,lastContact:{x:500,y:350},contactAge:4}),p={x:1100,y:600};
 const wall=[{x:800,y:62,w:35,h:596}];for(let i=0;i<100;i++)tick([e],p,wall,.05);
 assert.equal(e.lastContact,null);assert.equal(e.contact.target,null);assert.equal(e.aiState,'patrol');
});
test('near misses stress only nearby soldiers once per bullet and courage changes response',()=>{
 const a=soldier('assault',{courage:'cautious'}),b=soldier('assault',{x:650,courage:'resolute'}),far=soldier('shooter',{y:550});
 const bullet={px:550,py:350,x:700,y:350};registerNearMiss([a,b,far],bullet);registerNearMiss([a,b,far],bullet);assert.equal(a.stress,.45);assert.equal(far.stress,undefined);
 registerNearMiss([a,b],{...bullet,alertedEnemies:new Set()});
 for(const e of [a,b]){e.contact={visible:true,target:{x:300,y:350},age:0,source:'sight'};e.hadVisual=true;updateTacticalEnemy(e,.01,[],[e],()=>{});}
 assert.equal(a.aiState,'retreat');assert.equal(b.aiState,'engage');
});
test('visible teammate death affects morale but deaths behind walls do not',()=>{
 const dead=soldier('assault',{x:400}),near=soldier(),hidden=soldier('shooter',{x:700});
 notifyCasualty(dead,[dead,near,hidden],[{x:650,y:250,w:20,h:200}]);assert.equal(near.stress,.8);assert.equal(hidden.stress,undefined);
});
test('visible target triggers reaction before fire, repeated reloads work in actual tactical loop',()=>{
 const e=soldier('shooter',{aimDuration:.1,fireInterval:.1}),p={x:300,y:350};let shots=0;
 tick([e],p,[],.05,()=>shots++);assert.equal(e.aiState,'react');assert.equal(shots,0);
 for(let i=0;i<600;i++)tick([e],p,[],.05,()=>shots++);assert.ok(shots>12);assert.ok(e.ammo>=0&&e.ammo<=12);
});
test('tactical firing is withheld when a teammate blocks the line of fire',()=>{
 const e=soldier('shooter'),friend=soldier('assault',{x:450}),p={x:300,y:350};e.contact={visible:true,target:p,source:'sight',age:0};e.hadVisual=true;
 for(let i=0;i<100;i++){e.timer-=.05;updateTacticalEnemy(e,.05,[],[e,friend],()=>assert.fail('fired through ally'));}
});

test('defender reaches a usable firing corner and fires instead of cycling between hiding and search forever',()=>{
 const e=soldier('shooter',{x:570,y:370,lastContact:{x:300,y:370},contactAge:0}),p={x:300,y:370},walls=[{x:480,y:290,w:50,h:170}];let shots=0;const states=new Set();
 for(let i=0;i<1200;i++){tick([e],p,walls,.05,()=>shots++);states.add(e.aiState);}
 assert.ok(shots>0);assert.ok(states.has('search'));assert.ok(states.has('engage'));
});

test('brief occlusion does not restart reaction time',()=>{
 const e=soldier(),p={x:300,y:350};e.contact={visible:true,target:p,age:0,source:'sight'};
 updateTacticalEnemy(e,.3,[],[e],()=>{});assert.equal(e.reactionRemaining,0);
 e.contact={visible:false,target:p,age:.1,source:'memory'};updateTacticalEnemy(e,.1,[],[e],()=>{});
 e.contact={visible:true,target:p,age:0,source:'sight'};updateTacticalEnemy(e,.01,[],[e],()=>{});
 assert.equal(e.reactionRemaining,0);assert.notEqual(e.aiState,'react');
});
test('permanent wound damage does not lock an armed soldier into permanent retreat',()=>{
 const e=soldier();e.body.torso.damage=120;e.wasHit=true;const p={x:300,y:350};let shots=0;
 for(let i=0;i<200;i++)tick([e],p,[],.05,()=>shots++);
 assert.ok(shots>0);assert.notEqual(e.aiState,'retreat');assert.equal(e.body.torso.damage,120);
});
test('enemy advances into effective range instead of spending magazines at unreachable distances',()=>{
 const e=soldier('assault',{x:900}),p={x:200,y:350};let shots=0;
 for(let i=0;i<600;i++)tick([e],p,[],.05,()=>shots++);
 assert.ok(shots>0);assert.ok(Math.hypot(e.x-p.x,e.y-p.y)<e.bulletRange);
});
test('blocked firing lane causes a real sidestep and resumes fire',()=>{
 const e=soldier('shooter'),friend=soldier('assault',{x:450}),p={x:300,y:350};let shots=0;
 for(let i=0;i<100;i++){
  prepareSquad([e],p,[],.05);e.timer-=.05;const v=updateTacticalEnemy(e,.05,[],[e,friend],()=>shots++,()=>.5);moveBody(e,v.x*.05,v.y*.05,[]);
 }
 assert.ok(Math.abs(e.y-350)>25);assert.ok(shots>0);
});
test('a frozen movement plan times out and releases its destination',()=>{
 const e=soldier('shooter'),p={x:300,y:350};e.plan={point:{x:600,y:500},kind:'reposition',until:10};e.progressAt=0;e.progressPosition={x:600,y:350};
 for(let i=0;i<30;i++){e.contact={visible:true,target:p,source:'sight',age:0};updateTacticalEnemy(e,.05,[],[e],()=>{});}
 assert.equal(e.plan,null);assert.deepEqual(e.failedPoint,{x:600,y:500});
});
test('a teammate with ammunition but no firing opportunity cannot authorize a flank',()=>{
 const a=soldier(),b=soldier('shooter',{x:650,y:390}),p={x:300,y:350};prepareSquad([a,b],p,[],.01);
 assert.notEqual(a.assignment,'flank');b.lastFiredAt=0;b.aiClock=.1;prepareSquad([a,b],p,[],.01);assert.equal(a.assignment,'flank');
});
