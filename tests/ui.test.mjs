import test from 'node:test';
import assert from 'node:assert/strict';
import { UI } from '../src/ui.js';
import { Input } from '../src/input.js';
import { World } from '../src/world.js';
import { Settings } from '../src/settings.js';

function setup(t){
  const nodes=new Map(),events={};
  const query=selector=>{
    if(!nodes.has(selector)){
      const classes=new Set();
      nodes.set(selector,{style:{},innerHTML:'',setAttribute(){},classList:{
        remove(...names){names.forEach(name=>classes.delete(name));},
        toggle(name,on){if(on)classes.add(name);else classes.delete(name);},
        contains(name){return classes.has(name);}
      }});
    }
    return nodes.get(selector);
  };
  const oldDocument=globalThis.document,oldWindow=globalThis.window;
  globalThis.document={querySelector:query};
  globalThis.window={addEventListener(name,handler){events[name]=handler;}};
  t.after(()=>{globalThis.document=oldDocument;globalThis.window=oldWindow;});
  const audio={play(){},unlock(){}},world=new World(audio);
  let ui;
  const input=new Input({addEventListener(){}},()=>ui.toggleSettings(),()=>{});
  ui=new UI(world,input,audio,new Settings());
  const escape=()=>events.keydown({code:'Escape',repeat:false});
  return {ui,world,input,query,escape};
}

test('Escape opens settings, freezes the prologue, and resumes without held inputs',t=>{
  const {ui,world,input,query,escape}=setup(t);
  ui.start();world.update(.1,input);const elapsed=world.time;
  input.mouse.down=true;input.keys.add('KeyW');escape();
  assert.equal(world.state,'settings');assert.ok(ui.settingsOpen);
  assert.match(query('#overlay').innerHTML,/<h2>설정<\/h2>/);
  world.update(1,input);assert.equal(world.time,elapsed);
  escape();assert.equal(world.state,'playing');assert.equal(input.mouse.down,false);
  assert.equal(input.keys.size,0);
  world.update(.1,input);assert.ok(world.time>elapsed);
});

test('settings restores the start menu and return button resumes combat',t=>{
  const {ui,world,query,escape}=setup(t);
  ui.update();assert.ok(query('.controls').classList.contains('hidden'));
  assert.ok(query('.combat-hud').classList.contains('hidden'));
  escape();escape();assert.equal(world.state,'menu');
  assert.ok(query('#overlay').classList.contains('start-screen'));
  ui.start();query('#settings').onclick();query('#close-settings').onclick();
  assert.equal(world.state,'playing');assert.ok(query('#overlay').classList.contains('hidden'));
  assert.equal(query('.combat-hud').classList.contains('hidden'),false);
});

test('Escape settings toggle enemy hitboxes and restore the saved choice',t=>{
 const {ui,world,query,escape}=setup(t);ui.start();escape();
 assert.match(query('#overlay').innerHTML,/적 히트박스 보기/);
 assert.equal(ui.settings.values.enemyHitboxes,false);
 let saved;ui.settings.storage={setItem(key,value){saved=value;},getItem(){return saved;}};
 query('#enemy-hitboxes').onchange({target:{checked:true}});
 assert.equal(new Settings(ui.settings.storage).values.enemyHitboxes,true);
 escape();assert.equal(world.state,'playing');escape();
 assert.match(query('#overlay').innerHTML,/id="enemy-hitboxes" checked/);
 query('#enemy-hitboxes').onchange({target:{checked:false}});assert.equal(ui.settings.values.enemyHitboxes,false);
});

test('fatal hit leaves corpse view unobstructed for 0.4 seconds before showing failure',t=>{
 const {ui,world,input,query}=setup(t);ui.start();
 world.player.body.head.armor=0;world.hurt(1,null,{region:'head'});ui.update();
 assert.equal(ui.lastState,'dying');assert.ok(query('#overlay').classList.contains('hidden'));
 world.update(.2,input);ui.update();assert.ok(query('#overlay').classList.contains('hidden'));
 world.update(.2,input);ui.update();assert.equal(ui.lastState,'dead');
 assert.equal(query('#overlay').classList.contains('hidden'),false);assert.match(query('#overlay').innerHTML,/작전 실패/);
 query('#resume').onclick();assert.equal(world.deathRemaining,0);assert.equal(world.playerCorpse,null);
});

test('intro skip starts search at the hiding place with a knife and no rifle',t=>{
 const {ui,world,input,query}=setup(t);ui.update();assert.ok(query('#skip-prologue').classList.contains('hidden'));
 ui.start();const spawn={x:world.player.x,y:world.player.y};assert.equal(query('#skip-prologue').classList.contains('hidden'),false);
 world.update(6,input);input.mouse.down=true;input.keys.add('KeyW');query('#skip-prologue').onclick();
 assert.equal(world.prologue.phase,'search');assert.equal(world.wave,0);assert.equal(world.enemies.length,0);
 assert.equal(world.player.hasRifle,false);assert.equal(world.player.knifeEquipped,true);
 assert.equal(world.player.x,spawn.x);assert.equal(world.player.y,spawn.y);assert.equal(world.kills,0);
 assert.equal(world.prologue.guards.length,3);assert.ok(world.prologue.guards.every(g=>!g.subdued&&g.y===260));
 assert.equal(world.effects.items.items.filter(e=>e.kind==='body').length,3);assert.equal(world.prologue.executionShots.length,0);
 assert.equal(input.mouse.down,false);assert.equal(input.keys.size,0);assert.ok(query('#skip-prologue').classList.contains('hidden'));
 const intro=world.prologue;query('#skip-prologue').onclick();assert.equal(world.prologue,intro);
});
