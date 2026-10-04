import { Settings } from './settings.js';
import {
  CONFIG
}from'./config.js';
import {
  Input
}from'./input.js';
import {
  Audio
}from'./audio.js';
import {
  World
}from'./world.js';
import {
  Renderer
}from'./renderer.js';
import {
  UI
}from'./ui.js';
const canvas=document.querySelector('#game'),audio=new Audio(),world=new World(audio);
let ui;
const input=new Input(canvas,()=>ui.toggleSettings(),()=>ui.toggleSound());
let storage;try{storage=localStorage;}catch{}
const settings=new Settings(storage);
const renderer=new Renderer(canvas,settings);
ui=new UI(world,input,audio,settings);
let last=performance.now(),accumulator=0,uiTime=0;
document.addEventListener('visibilitychange',()=> {
  if(document.hidden&&world.state==='playing')ui.openSettings();
});
document.addEventListener('fullscreenchange',()=>{
  if(!document.fullscreenElement&&world.state==='playing')ui.openSettings();
});
window.addEventListener('blur',()=> {
  if(world.state==='playing')ui.openSettings();
});
function frame(now) {
  const elapsed=Math.min((now-last)/1000,CONFIG.maxFrame);
  last=now;
  if(world.state==='playing'||(world.state==='dead'&&world.deathRemaining>0)) {
    accumulator+=elapsed;
    while(accumulator>=CONFIG.step) {
      world.update(CONFIG.step,input);
      accumulator-=CONFIG.step;
    }
  }else accumulator=0;
  audio.setScene(world.state==='playing'||(world.state==='dead'&&world.deathRemaining>0),settings.values.ambience);
  renderer.draw(world,input);
  uiTime+=elapsed;
  if(uiTime>.06||world.state!==ui.lastState) {
    ui.update();
    uiTime=0;
  }requestAnimationFrame(frame);
}requestAnimationFrame(frame);
