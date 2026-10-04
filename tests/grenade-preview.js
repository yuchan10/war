import {World} from '../src/world.js';
import {Renderer} from '../src/renderer.js';
import {UI} from '../src/ui.js';
import {Settings} from '../src/settings.js';
import {Audio} from '../src/audio.js';
import {Input} from '../src/input.js';
import {updateGrenades} from '../src/grenade.js';
const audio=new Audio(),w=new World(audio,()=>.1),settings=new Settings();let ui,frozen=false,last=performance.now();
const canvas=document.querySelector('#game'),input=new Input(canvas,()=>ui.toggleSettings(),()=>ui.toggleSound());
ui=new UI(w,input,audio,settings);const renderer=new Renderer(canvas,settings);
function reset(){
 w.start();w.enemies=[];w.walls=[{x:590,y:345,w:30,h:80,material:'concrete'}];
 Object.assign(w.player,{x:430,y:390,angle:0});input.clear();input.mouse.x=760;input.mouse.y=390;
 for(const [x,y] of [[760,390],[805,360],[875,400]]){w.spawnEnemy('assault',x,y);Object.assign(w.enemies.at(-1),{born:0,angle:Math.PI,speed:0,armsDisabled:true});}
 frozen=false;renderer.fogTime=-1;ui.lastState='';ui.update();
}
document.querySelector('#lab-reset').onclick=()=>{audio.unlock();reset();};
document.querySelector('#lab-air').onclick=()=>{reset();w.primeGrenade();w.throwGrenade({x:760,y:390});updateGrenades(w.grenades,.43,w.walls,g=>w.explodeGrenade(g));frozen=true;};
document.querySelector('#lab-blast').onclick=()=>{reset();w.walls=[];w.explodeGrenade({x:760,y:390});w.effects.update(.12,[]);frozen=true;renderer.draw(w,input);};
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(!frozen)w.update(dt,input);renderer.draw(w,input);ui.update();requestAnimationFrame(frame);}
reset();requestAnimationFrame(frame);
