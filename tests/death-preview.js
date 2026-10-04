import {World} from '../src/world.js';
import {Renderer} from '../src/renderer.js';
import {UI} from '../src/ui.js';
import {Settings} from '../src/settings.js';
import {Audio} from '../src/audio.js';
import {updateGrenades} from '../src/grenade.js';
const audio=new Audio(),w=new World(audio,()=>.5),settings=new Settings();
const input={mouse:{x:900,y:360,down:false},movement:()=>({x:0,y:0}),clear(){}};
const ui=new UI(w,input,audio,settings),renderer=new Renderer(document.querySelector('#game'),settings);
let frozen=false,last=performance.now();
function replay(freeze){
 audio.unlock();w.start();w.walls=[];w.enemies=[];Object.assign(w.player,{x:600,y:360,angle:0});
 w.spawnEnemy('assault',760,360);Object.assign(w.enemies[0],{born:0,angle:Math.PI});
 w.player.body.torso.armor=0;w.player.body.torso.damage=149;
 w.shoot(690,360,Math.PI,true,10,1000);w.hurt(1,{vx:-1000,vy:0},{region:'torso',x:600,y:360});
 frozen=freeze;if(frozen)w.update(.12,input);ui.lastState='';ui.update();
}
document.querySelector('#replay').onclick=()=>replay(false);
document.querySelector('#freeze').onclick=()=>replay(true);
function grenadeDemo(freeze){
 audio.unlock();w.start();w.walls=[];w.enemies=[];Object.assign(w.player,{x:450,y:360,angle:0});
 w.spawnEnemy('assault',730,360);Object.assign(w.enemies[0],{born:0,angle:Math.PI,speed:0,timer:100});
 w.primeGrenade();w.throwGrenade({x:730,y:360});frozen=freeze;
 if(freeze){updateGrenades(w.grenades,3,w.walls,g=>w.explodeGrenade(g));w.effects.update(.12,w.walls);}
 ui.lastState='';ui.update();
}
document.querySelector('#grenade-demo').onclick=()=>grenadeDemo(false);
document.querySelector('#grenade-freeze').onclick=()=>grenadeDemo(true);
function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(!frozen&&(w.state==='dead'||w.state==='playing'))w.update(dt,input);audio.setScene(w.state==='playing'||w.state==='dead'&&w.deathRemaining>0,true);renderer.draw(w,input);ui.update();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
