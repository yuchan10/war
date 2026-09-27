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
