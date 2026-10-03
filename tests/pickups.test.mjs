import test from 'node:test';
import assert from 'node:assert/strict';
import {Pickups} from '../src/pickups.js';
import {applyInjury,initBody} from '../src/injury.js';
import {World} from '../src/world.js';
const entity=()=>{const e={x:300,y:300};initBody(e);return e;};
test('loot preserves damaged durability, swaps once and never repairs permanent wounds',()=>{
 const p=entity(),dead=entity(),items=new Pickups();dead.body.leftArm.armor=17;dead.body.torso.armor=0;
 p.body.leftArm.armor=5;p.body.leftArm.damage=22;p.body.leftArm.bleedRemaining=3;p.bloodLoss=12;
 const corpse={armor:{leftArm:17}};items.drop(dead,[],undefined,corpse);
 assert.equal(items.start(p,[]),true);assert.equal(p.body.leftArm.armor,0);assert.equal(items.update(p,[],2.5),1);assert.equal(p.body.leftArm.armor,17);assert.equal(corpse.armor.leftArm,0);
 assert.equal(p.body.leftArm.damage,22);assert.equal(p.body.leftArm.bleedRemaining,3);assert.equal(p.bloodLoss,12);
 assert.equal(items.start(p,[]),false);assert.ok(items.items.some(i=>i.armor.leftArm?.armor===5));
});
test('loot cannot cross cover, restore a missing limb, equip broken armor or be collected when dead',()=>{
 const p=entity(),e=entity(),items=new Pickups();p.x=280;p.body.head.armor=0;e.body.head.armor=0;p.body.leftArm.armor=0;p.body.leftArm.severed=true;p.body.torso.armor=0;items.drop(e);
 assert.equal(items.start(p,[{x:285,y:270,w:10,h:60}]),false);p.dead=true;assert.equal(items.start(p,[]),false);
 p.dead=false;assert.equal(items.start(p,[]),true);assert.equal(p.body.leftArm.armor,0);assert.equal(p.body.head.armor,0);
});
test('E loots a killed soldier without auto-collecting, stage/reset clear local loot',()=>{
 const w=new World({play(){}});w.start();w.walls=[];const e=w.enemies[0];Object.assign(e,{x:300,y:300});Object.assign(w.player,{x:300,y:300});w.player.body.torso.armor=0;e.body.torso.armor=37;w.killEnemy(e);w.killEnemy(e);
 assert.equal(w.pickups.items.length,1);const idle={mouse:{x:900,y:300,down:false},movement:()=>({x:0,y:0})};
 w.update(.01,idle);assert.equal(w.player.body.torso.armor,0);w.update(.01,{...idle,consumeLoot:()=>true,lootHeld:()=>true});assert.equal(w.player.body.torso.armor,0);assert.ok(w.pickups.changing);w.pickups.update(w.player,[],2.5);assert.equal(w.player.body.torso.armor,37);
 w.nextStage();assert.equal(w.pickups.items.length,0);w.start();assert.equal(w.player.body.torso.armor,90);
});

test('changing exposes only the selected part and preserves wounds after equipping',()=>{
 const p=entity(),e=entity(),items=new Pickups();p.body.leftArm.armor=5;p.body.rightArm.armor=5;items.drop(e);
 items.start(p,[]);assert.equal(items.changing.key,'leftArm');assert.equal(p.body.rightArm.armor,5);
 const hit=applyInjury(p,20,{region:'leftArm'},0,()=>.5);assert.equal(hit.armorHit,false);assert.equal(p.body.leftArm.damage,20);
 items.update(p,[],2.49);assert.equal(p.body.leftArm.armor,0);
 items.update(p,[],.02);assert.equal(p.body.leftArm.armor,45);assert.equal(p.body.leftArm.damage,20);
 assert.equal(items.changing.key,'rightArm');assert.equal(p.body.rightArm.armor,0);
});
test('movement cancels without copying or re-equipping armor; restart needs full duration',()=>{
 const p=entity(),e=entity(),items=new Pickups();p.body.torso.armor=12;items.drop(e);items.start(p,[]);items.update(p,[],1);
 p.x+=1;items.update(p,[],.1);assert.equal(items.changing,null);assert.equal(p.body.torso.armor,0);
 assert.equal(items.items[0].armor.torso.armor,90);assert.equal(items.items[1].armor.torso.armor,12);
 items.start(p,[]);items.update(p,[],1.5);assert.equal(p.body.torso.armor,0);items.update(p,[],1);assert.equal(p.body.torso.armor,90);
});
test('attacking or losing the selected limb cancels the change',()=>{
 for(const reason of ['attack','severed','dead']){
 const p=entity(),e=entity(),items=new Pickups();p.body.leftArm.armor=0;items.drop(e);items.start(p,[]);
 if(reason==='severed')p.body.leftArm.severed=true;if(reason==='dead')p.dead=true;
 items.update(p,[],3,reason==='attack');assert.equal(items.changing,null);assert.equal(p.body.leftArm.armor,0);assert.equal(items.items[0].armor.leftArm.armor,45);
 }
});
