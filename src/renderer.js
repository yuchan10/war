import { headAimTarget } from './head-aim.js';
import { drawEnemyHitboxes } from './hitbox-overlay.js';
import { drawDamageScreen,drawSkull } from './damage-screen.js';
import { drawEnemyIntent } from './enemy-intent.js';
import { drawTerrain, drawLandmark } from './terrain.js';
import { accuracySpread } from './accuracy.js';
import { STAGES } from './stages.js';
import { drawSoldier } from './soldier.js';
import { visiblePoint, visionPolygon, VISION } from './visibility.js';
import { traceBullet } from './arena.js';
import { CONFIG as C } from './config.js';

export class Renderer {
  constructor(canvas,settings){
    this.canvas=canvas;this.ctx=canvas.getContext('2d');this.settings=settings;
    this.background=document.createElement('canvas');this.background.width=C.width;this.background.height=C.height;
    this.fog=document.createElement('canvas');this.fog.width=C.width;this.fog.height=C.height;
    this.entityLayer=document.createElement('canvas');this.entityLayer.width=C.width;this.entityLayer.height=C.height;
    this.sightMask=document.createElement('canvas');this.sightMask.width=C.width;this.sightMask.height=C.height;
    this.fogTime=-1;
    this.fogHistory=document.createElement('canvas');this.fogHistory.width=C.width;this.fogHistory.height=C.height;
    this.drawBackground();
  }
  drawBackground(stage=STAGES[0]){
    drawTerrain(this.background.getContext('2d'),stage);this.backgroundStage=stage;
  }
  wall(c,w){
    c.fillStyle='#0d130d70';c.fillRect(w.x+9,w.y+10,w.w,w.h);
    if(w.material==='sandbag'){
      c.fillStyle='#5b5541';c.fillRect(w.x,w.y,w.w,w.h);
      const vertical=w.h>w.w;
      for(let n=0;n<(vertical?w.h:w.w);n+=18){
        c.fillStyle=n%36?'#8e8260':'#9c8d67';
        const x=w.x+(vertical?2:n),y=w.y+(vertical?n:2),bw=vertical?w.w-4:16,bh=vertical?16:w.h-4;
        c.fillRect(x,y,bw,bh);c.strokeStyle='#c2b58b55';c.strokeRect(x+2,y+2,bw-4,bh-4);
      }
    }else{
      c.fillStyle=w.material==='steel'?'#55626a':'#76786a';c.fillRect(w.x,w.y,w.w,w.h);
      c.fillStyle=w.material==='steel'?'#667982':'#98998b';c.fillRect(w.x+3,w.y+3,w.w-6,5);
      c.strokeStyle='#272e28';c.lineWidth=2;c.strokeRect(w.x,w.y,w.w,w.h);
      for(let n=10;n<(w.h>w.w?w.h:w.w);n+=24){c.fillStyle='#343d33';c.fillRect(w.x+(w.h>w.w?8:n),w.y+(w.h>w.w?n:12),3,3);}
      if(w.material==='steel'){c.strokeStyle='#c9be864e';c.lineWidth=3;c.beginPath();c.moveTo(w.x+5,w.y+w.h-6);c.lineTo(w.x+w.w-5,w.y+10);c.stroke();}
    }
    drawLandmark(c,w);
  }
  prediction(c,ray,walls,color){
    c.save();c.setLineDash([7,9]);c.strokeStyle=color;c.lineWidth=1;
    traceBullet(ray,1,walls,b=>{c.beginPath();c.moveTo(b.px,b.py);c.lineTo(b.x,b.y);c.stroke();return false;},b=>{c.fillStyle=color;c.fillRect(b.x-2,b.y-2,4,4);});c.restore();
  }
  drawFog(c,w){
    const f=this.fog.getContext('2d'),p=w.player,points=visionPolygon(p,w.walls);
    f.clearRect(0,0,C.width,C.height);f.fillStyle='rgba(5,10,7,1)';f.fillRect(0,0,C.width,C.height);
    f.save();f.globalCompositeOperation='destination-out';f.filter='blur(6px)';f.fillStyle='#fff';
    f.beginPath();points.forEach((q,i)=>i?f.lineTo(q.x,q.y):f.moveTo(q.x,q.y));f.closePath();f.fill();f.restore();
    const history=this.fogHistory.getContext('2d');
    const fresh=this.fogTime<0||w.time<this.fogTime||this.fogStage!==w.stage;
    const dt=Math.max(0,w.time-this.fogTime);this.fogTime=w.time;this.fogStage=w.stage;
    const weight=fresh?1:1-Math.exp(-dt/.045);
    history.save();
    if(fresh)history.clearRect(0,0,C.width,C.height);
    history.globalCompositeOperation='destination-out';history.globalAlpha=weight;history.fillStyle='#000';history.fillRect(0,0,C.width,C.height);
    history.globalCompositeOperation='lighter';history.globalAlpha=weight;history.drawImage(this.fog,0,0);history.restore();
    c.drawImage(this.fogHistory,0,0);
  }
  draw(w,input){
    if(this.canvas?.style)this.canvas.style.cursor=w.state==='playing'?'none':'crosshair';
    let c=this.ctx;const screen=c,p=w.player,s=this.settings.values;c.clearRect(0,0,1200,720);c.save();
    const storyOverview=w.prologue?.phase==='witness';
    if(s.cameraShake&&w.shake)c.translate(Math.sin(w.time*65)*Math.min(w.shake,2)*.4,Math.cos(w.time*53)*Math.min(w.shake,2)*.4);
    if(this.backgroundStage!==w.stage)this.drawBackground(w.stage);
    c.drawImage(this.background,0,0);
    const sight=storyOverview?null:visionPolygon(p,w.walls);
    if(sight){
      const mask=this.sightMask.getContext('2d');mask.clearRect(0,0,C.width,C.height);
      mask.save();mask.filter='blur(6px)';mask.fillStyle='#fff';mask.beginPath();
      sight.forEach((point,i)=>i?mask.lineTo(point.x,point.y):mask.moveTo(point.x,point.y));mask.closePath();mask.fill();mask.restore();
    }
    const beginSight=()=>{
      if(!sight)return;c=this.entityLayer.getContext('2d');c.clearRect(0,0,C.width,C.height);
    };
    const endSight=()=>{
      if(!sight)return;
      c.save();c.globalCompositeOperation='destination-in';c.drawImage(this.sightMask,0,0);c.restore();
      c=screen;c.drawImage(this.entityLayer,0,0);
    };
    beginSight();w.effects.blood.draw(c);endSight();
    if(storyOverview)for(const wall of w.walls)this.wall(c,wall);
    if(s.enemyVision){
      const playerSight=visionPolygon(p,w.walls);
      c.save();c.beginPath();playerSight.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));c.closePath();c.clip();
      const observers=w.prologue&&w.prologue.phase!=='revenge'?w.prologue.guards:w.enemies;
      for(const e of observers){
        if(e.active===false||e.subdued||e.fallen||!visiblePoint(p,e,w.walls))continue;
        const sight=visionPolygon(e,w.walls);c.beginPath();
        sight.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));c.closePath();
        c.fillStyle='#dca66516';c.fill();c.strokeStyle='#dca66555';c.lineWidth=1;c.stroke();
      }
      c.restore();
    }
    const exit=w.stage.exit;
    if(!w.prologue||w.prologue.phase==='revenge'){
    c.fillStyle='#151e17';c.fillRect(exit.x-18,exit.y-45,38,90);
    if(!w.exitOpen){c.fillStyle='#777b69';for(let y=-40;y<42;y+=10)c.fillRect(exit.x-16,exit.y+y,34,4);}
    c.fillStyle=w.exitOpen?'#c3ce8b':'#8d5240';c.fillRect(exit.x+23,exit.y-48,6,6);
    if(w.exitOpen){c.strokeStyle='#d3d2a6';c.lineWidth=3;c.beginPath();c.moveTo(exit.x-5,exit.y-8);c.lineTo(exit.x+5,exit.y);c.lineTo(exit.x-5,exit.y+8);c.stroke();}
    }
    beginSight();
    w.prologue?.draw(c,w);
    if(!p.unarmed&&s.playerPrediction&&w.state==='playing')this.prediction(c,{x:p.x,y:p.y,vx:Math.cos(p.angle)*1300,vy:Math.sin(p.angle)*1300,radius:C.weapon.radius,remainingRange:C.weapon.bulletRange,active:true},w.walls,'#d4e6c78a');
    for(const e of w.enemies){
      if(s.enemyPrediction&&visiblePoint(p,e,w.walls)&&(e.aimRemaining>0||e.burstLeft>0)){
        const spread=accuracySpread(e);
        for(const angle of spread>0?[e.aimAngle-spread,e.aimAngle,e.aimAngle+spread]:[e.aimAngle]){
          this.prediction(c,{x:e.x,y:e.y,vx:Math.cos(angle)*1400,vy:Math.sin(angle)*1400,radius:6,remainingRange:e.bulletRange??C.weapon.bulletRange,active:true},w.walls,'#e8a07a90');
        }
      }
      drawSoldier(c,e,false);
      drawEnemyIntent(c,e);
    }
    for(const b of w.bullets.items){
      if(!b.active||!visiblePoint(p,b,w.walls))continue;
      if(b.hostile&&s.enemyPrediction)this.prediction(c,{...b},w.walls,'#e8a07a50');
      if(!b.hostile&&s.playerPrediction)this.prediction(c,{...b},w.walls,'#d4e6c750');
      c.strokeStyle=b.hostile?'#e5b785':'#f4e6b0';c.lineWidth=2;c.beginPath();c.moveTo(b.x,b.y);c.lineTo(b.x-b.vx*.012,b.y-b.vy*.012);c.stroke();
    }
    for(const q of w.particles.items){if(!q.active||!visiblePoint(p,q,w.walls))continue;c.globalAlpha=Math.max(0,q.life/q.maxLife);c.fillStyle='#c4b999';c.fillRect(q.x,q.y,q.size,q.size);}c.globalAlpha=1;

    w.effects.draw(c);
    w.pickups.draw(c,()=>true,p,w.weapon,w.time);
    if(s.enemyHitboxes)drawEnemyHitboxes(c,w);
    endSight();
    // Brief establishing shot shows both the concealed player and the firing line.
    // Normal player visibility resumes as soon as escape control is returned.
    if(!storyOverview)this.drawFog(c,w);
    // A wall does not shade its own surface, but other walls and rear vision still occlude it.
    for(const wall of w.walls){
      const surface=visionPolygon(p,w.walls.filter(other=>other!==wall));
      c.save();c.beginPath();
      surface.forEach((point,i)=>i?c.lineTo(point.x,point.y):c.moveTo(point.x,point.y));
      c.closePath();c.clip();this.wall(c,wall);c.restore();
    }
    c.save();if(!p.dead)drawSoldier(c,p,true,w.recoil);c.restore();
    w.pickups.drawProgress(c,p);
    if(w.weapon.reloading){c.strokeStyle='#cbbb83';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y,27,-Math.PI/2,-Math.PI/2+(1-w.weapon.reloadRemaining/w.weapon.reloadDuration)*Math.PI*2);c.stroke();}
    c.restore();
    if(w.state==='playing'||w.state==='settings'||w.state==='dead')drawDamageScreen(c,p,w.time,C.width,C.height);
    if(input&&w.state==='playing'){
      c.save();const {x,y}=input.mouse;
      if(headAimTarget(w,input.mouse))drawSkull(c,x,y);
      else{
      c.strokeStyle=w.effects.hitMarker>0?'#f8e8b9':'#e5e4ceaa';c.lineWidth=w.effects.hitMarker>0?2:1;c.beginPath();
      for(const [dx,dy]of[[-1,-1],[1,-1],[-1,1],[1,1]]){c.moveTo(x+dx*4,y+dy*4);c.lineTo(x+dx*9,y+dy*9);}c.stroke();
      }c.restore();
    }
  }
}
