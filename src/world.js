import { hearSound } from './hearing.js';
import { knifeTargets, updateKnife } from './knife.js';
import { updateAssault } from './assault-ai.js';
import { playerMoveSpeed } from './player-movement.js';
import { Prologue, PROLOGUE_STAGE } from './prologue.js';
import { Pickups } from './pickups.js';
import { applyInjury, injuryMoveScale } from './injury.js';
import { skillStats } from './enemy-skill.js';
import { updateFootsteps } from './footsteps.js';
import { updateCoverDefender } from './cover-ai.js';
import { animateStride } from './soldier.js';
import { STAGES } from './stages.js';
import { Feedback } from './feedback.js';
import { moveBody, traceBullet } from './arena.js';
import {
  CONFIG as C,ENEMIES
}from'./config.js';
import {
  segmentHits,Pool,SpatialHash
}from'./core.js';
import { Weapon } from './weapon.js';
import { Effects } from './effects.js';
import { applyKnockback, moveKnockback } from './knockback.js';
export class World {
  constructor(audio,random=Math.random) {
    this.audio=audio;
    this.random=random;
    this.bullets=new Pool(C.bulletLimit);
    this.particles=new Pool(C.particleLimit);
    this.grid=new SpatialHash();
    this.effects=new Effects();
    this.pickups=new Pickups();
    this.feedback=new Feedback();
    this.reset();
  }
  reset() {
    this.battlefieldHistory=[];
    this.prologue=null;
    this.walls=STAGES[0].walls;
    this.stage=STAGES[0];
    this.exitOpen=false;
    this.feedback.reset();
    this.weapon=new Weapon();
    this.effects.clear();
    this.pickups.clear();
    this.player= {
      hasRifle:true,knifeEquipped:false,unarmed:false,x:600,y:360,radius:C.player.radius,hp:C.player.hp,maxHp:C.player.hp,angle:0,invulnerable:0,shotTimer:0,fireInterval:C.weapon.interval,damage:C.weapon.damage
    };
    this.enemies=[];
    this.bullets.clear();
    this.particles.clear();
    this.score=0;
    this.wave=0;
    this.time=0;
    this.shake=0;
    this.kills=0;
    this.recoil=0;
    this.state='menu';
    this.clearTimer=0;
  }
  start() {
    this.reset();
    this.nextStage();
  }
  startPrologue(){
    this.reset();this.prologue=new Prologue();this.stage=PROLOGUE_STAGE;this.walls=this.stage.walls;
    Object.assign(this.player,this.stage.spawn,{hasRifle:false,unarmed:true,knifeEquipped:true,knifeSwing:0,kneeling:false,angle:-.2});
    this.state='playing';
  }
  archiveBattlefield(){
    const record={stage:this.stage,...this.effects.snapshot(),pickups:structuredClone(this.pickups.items)};
    const index=this.battlefieldHistory.findIndex(item=>item.stage===this.stage);
    if(index<0)this.battlefieldHistory.push(record);else this.battlefieldHistory[index]=record;
  }
  nextStage() {
    if(this.wave>0||this.prologue)this.archiveBattlefield();
    this.prologue=null;
    this.wave++;
    this.stage=STAGES[this.wave-1];
    this.walls=this.stage.walls;
    this.exitOpen=false;
    this.enemies=[];
    this.bullets.clear();this.particles.clear();this.effects.clear();this.feedback.reset();
    this.pickups.clear();
    Object.assign(this.player,this.stage.spawn,{knockX:0,knockY:0,shotTimer:0,invulnerable:.8});
    this.weapon.ammo=this.weapon.capacity;this.weapon.reloadRemaining=0;
    for(const enemy of this.stage.enemies)this.spawnEnemy(enemy.type,enemy.x,enemy.y,enemy.cover,enemy.advancePoint,enemy.skill,enemy.courage);
    this.clearTimer=0;this.state='playing';this.audio.play('wave');
  }
  spawnEnemy(type,x=900,y=360,cover=null,advancePoint=null,skill=null,courage='steady') {
    const d=ENEMIES[type];
    this.enemies.push({...d,...skillStats(d,skill),type,x,y,cover,advancePoint,courage,maxHp:d.hp,active:true,born:.6,timer:.6+this.enemies.length*.16,flash:0,angle:Math.PI,aimRemaining:0});
  }
  burst(x,y,color,n=12) {
    for(let i=0;i<n;i++) {
      const a=this.random()*Math.PI*2,s=50+this.random()*210;
      this.particles.spawn( {
        x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.2+this.random()*.3,maxLife:.5,color,size:1+this.random()*3
      });
    }
  }
  emitPlayerSound(type,x=this.player.x,y=this.player.y){
    const listeners=this.prologue&&this.prologue.phase!=='revenge'?this.prologue.guards:this.enemies;
    hearSound(listeners,{x,y},type,this.walls);
  }
  shoot(x,y,angle,hostile,damage,speed,empowered=false,bulletRange=C.weapon.bulletRange) {
    if(!hostile)this.emitPlayerSound('gunshot',x,y);
    if(hostile)this.audio.play('enemyShot',{dx:x-this.player.x,dy:y-this.player.y});
    this.bullets.spawn( {
      x,y,px:x,py:y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius:empowered?8:hostile?6:4,hostile,damage,life:hostile?5:C.weapon.life,empowered,remainingRange:bulletRange
    });
  }
  hurt(damage, bullet=null) {
    const p=this.player;
    if(p.invulnerable>0)return;
    p.hp=Math.max(0,p.hp-damage);
    this.feedback.damaged();
    if(bullet)applyKnockback(p,bullet.vx,bullet.vy,C.knockback.player);
    p.invulnerable=C.player.invulnerability;
    this.shake=9;
    this.audio.play('hit');
    this.effects.impact(p.x,p.y,bullet?Math.atan2(bullet.vy,bullet.vx):p.angle,this.walls);
    if(p.hp===0) {
      this.state='dead';
      this.audio.play('dead');
    }
  }
  update(dt,input) {
    if(this.state!=='playing')return;
    if(input.consumeWeaponSwitch?.()&&this.player.hasRifle){
      const p=this.player;p.knifeEquipped=!p.knifeEquipped;p.unarmed=p.knifeEquipped;
      p.knifeSwing=0;p.knifeAttackHeld=!!input.mouse.down;
      if(p.knifeEquipped)this.weapon.reloadRemaining=0;
    }
    if(this.prologue&&this.prologue.phase!=='revenge'){this.prologue.update(this,dt,input);return;}
    if(this.prologue)this.prologue.phaseTime+=dt;
    this.time+=dt;
    this.shake=Math.max(0,this.shake-dt*35);
    const p=this.player,a=C.arena;
    const mv=input.movement();
    p.angle=Math.atan2(input.mouse.y-p.y,input.mouse.x-p.x);
    p.invulnerable=Math.max(0,p.invulnerable-dt);
    this.feedback.update(dt);
    p.shotTimer-=dt;
    this.recoil=Math.max(0,this.recoil-dt*45);
      this.effects.update(dt,this.walls);
    if(this.weapon.update(dt))this.audio.play('reloadReady');
    if(input.consumeReload?.()&&!p.knifeEquipped&&this.weapon.reload())this.audio.play('reload');
    const moveSpeed=playerMoveSpeed(p,this.weapon,input.mouse.down);
    p.vx=mv.x*moveSpeed;p.vy=mv.y*moveSpeed;
    const oldPX=p.x,oldPY=p.y;
    moveBody(p,p.vx*dt,p.vy*dt,this.walls);
    updateFootsteps(p,oldPX,oldPY,p,(...args)=>{this.audio.play(...args);this.emitPlayerSound('footstep');},true);
    moveKnockback(p,dt,this.walls);
    animateStride(p,oldPX,oldPY);
    if(updateKnife(p,dt,input.mouse.down,(type)=>this.audio.play(type))){
      for(const e of knifeTargets(p,this.enemies.filter(e=>e.born<=0),this.walls)){
        e.hp=0;e.active=false;e.headDestroyed=true;e.aimRemaining=0;e.burstLeft=0;
        this.effects.detachHead(e,p.angle);this.effects.fallen(e,p.angle);this.effects.impact(e.x,e.y,p.angle,this.walls);
        this.kills++;this.score+=e.score;this.feedback.killed(this.time);
        this.pickups.drop(e,this.walls,this.random);this.audio.play('impact');
      }
    }
    if(!p.knifeEquipped&&input.mouse.down&&p.shotTimer<=0&&this.weapon.consume()) {
      const boosted=false;
      this.shoot(p.x,p.y,p.angle,false,p.damage*(boosted?4:1),C.weapon.speed,boosted);
      p.shotTimer=p.fireInterval;
      this.recoil=boosted?10:6;
      this.effects.fire(p,boosted);
      this.shake=Math.max(this.shake,boosted?8:3);
      this.audio.play('shot');
      if(this.weapon.ammo===0&&this.weapon.reload())this.audio.play('reload');
    }
    for(const e of this.enemies) {
      if(!e.active)continue;
      e.flash=Math.max(0,e.flash-dt);
      e.muzzle=Math.max(0,(e.muzzle||0)-dt);
      if(e.born>0) {
        e.born-=dt;
        continue;
      }
      e.timer-=dt;
      let vx=0,vy=0;
      if(e.role==='assault'){const motion=updateAssault(e,dt,p,this.walls,(...args)=>this.shoot(...args));vx=motion.x;vy=motion.y;}
      if(e.type==='shooter') {
        const motion=updateCoverDefender(e,dt,p,this.walls,(...args)=>this.shoot(...args));
        vx=motion.x;vy=motion.y;
      }
      const oldEX=e.x,oldEY=e.y;
      const injuryScale=injuryMoveScale(e);vx*=injuryScale;vy*=injuryScale;
      moveBody(e,vx*dt,vy*dt,this.walls);
      updateFootsteps(e,oldEX,oldEY,p,(...args)=>this.audio.play(...args));
      animateStride(e,oldEX,oldEY);
      moveKnockback(e,dt,this.walls);
      this.effects.blood.trail(e,oldEX,oldEY,this.walls);
    }
    this.grid.clear();
    for(const e of this.enemies)if(e.active&&e.born<=0)this.grid.insert(e);
    for(const b of this.bullets.items) {
      if(!b.active)continue;
      b.life-=dt;
      traceBullet(b,dt,this.walls,()=>{
      if(b.hostile) {
        if(segmentHits(b.px,b.py,b.x,b.y,p.x,p.y,p.radius+b.radius)) {
          b.active=false;
          this.hurt(b.damage,b);
        }
      }else {
        for(const e of this.grid.query((b.x+b.px)/2,(b.y+b.py)/2,Math.hypot(b.x-b.px,b.y-b.py)/2+b.radius)) {
          if(!e.active||!segmentHits(b.px,b.py,b.x,b.y,e.x,e.y,e.radius+b.radius))continue;
          const injury=applyInjury(e,b.damage,this.random);
          if(injury.detached)this.effects.detach(e,injury.part,Math.atan2(b.vy,b.vx));

          applyKnockback(e,b.vx,b.vy,C.knockback.enemy);
          e.flash=.09;
          this.effects.impact(e.x,e.y,Math.atan2(b.vy,b.vx),this.walls);
          this.audio.play('impact');
          b.active=false;

          if(e.hp<=0) {
            e.active=false;
            this.kills++;
            this.feedback.killed(this.time);
            this.score+=e.score;
            this.shake=Math.max(this.shake,2);
            this.effects.fallen(e);
            this.pickups.drop(e,this.walls,this.random);
            this.audio.play('dead');
          }break;
        }
      }
      return !b.active;
      },()=>{this.burst(b.x,b.y,'#b5a485',6);this.effects.add('dust',b.x,b.y,0,'#b5a485',.25,14);this.audio.play('wallHit',{dx:b.x-this.player.x,dy:b.y-this.player.y});});
      if(b.life<=0)b.active=false;
    }
    for(const q of this.particles.items) {
      if(!q.active)continue;
      q.life-=dt;
      q.x+=q.vx*dt;
      q.y+=q.vy*dt;
      if(q.life<=0)q.active=false;
    }this.enemies=this.enemies.filter(e=>e.active);
    if(this.state==='playing'&&this.pickups.collect(p,this.walls)>0)this.audio.play('heal');
    if(this.state==='playing'&&this.enemies.length===0) {
      if(!this.exitOpen){
        this.exitOpen=true;this.bullets.clear();
        this.feedback.show(this.feedback.damageTaken===0?'무피격 돌파 · 출구 개방':'출구 개방');
      }
      const exit=this.stage.exit;
      if(Math.hypot(p.x-exit.x,p.y-exit.y)<exit.radius){
        if(this.wave===STAGES.length){this.archiveBattlefield();this.state='won';}
        else {p.hp=Math.min(p.maxHp,p.hp+C.stage.heal);this.nextStage();input.clear?.();}
      }
    }
  }
}
