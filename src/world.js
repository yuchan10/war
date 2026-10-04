import { headAimTarget } from './head-aim.js';
import { prepareSquad,registerNearMiss,notifyCasualty } from './squad-ai.js';
import { updateTacticalEnemy } from './tactical-ai.js';
import { updateEnemyReload } from './enemy-fire.js';
import { shotAngle } from './accuracy.js';
import { hearSound } from './hearing.js';
import { knifeTargets, updateKnife, knifeContact, KNIFE_DAMAGE } from './knife.js';
import { playerMoveSpeed } from './player-movement.js';
import { Prologue, PROLOGUE_STAGE } from './prologue.js';
import { Pickups } from './pickups.js';
import { applyInjury, injuryMoveScale, initBody, bodyHit, tickWounds } from './injury.js';
import { skillStats } from './enemy-skill.js';
import { updateFootsteps } from './footsteps.js';
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
      hasRifle:true,knifeEquipped:false,unarmed:false,x:600,y:360,radius:C.player.radius,speed:C.player.speed,accuracy:C.player.accuracy,allied:true,angle:0,shotTimer:0,fireInterval:C.weapon.interval,damage:C.weapon.damage
    };
    initBody(this.player);
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
  skipPrologue(){
    if(this.state!=='playing'||this.prologue?.phase!=='witness')return false;
    this.startPrologue();
    const intro=this.prologue;
    intro.phase='search';intro.elapsed=14;intro.phaseTime=0;intro.shots=3;
    intro.officer.departed=true;intro.officer.x=1240;
    for(const [i,ally] of intro.allies.entries()){
      ally.alive=false;ally.headDestroyed=true;
      this.effects.fallen({...ally,allied:true,armsDisabled:true},Math.PI/2);
      this.effects.blood.add(ally.x,ally.y,3,Math.PI/2,this.walls);
      const guard=intro.guards[i];guard.ammo--;guard.y=260;guard.angle=Math.atan2(ally.y-guard.y,ally.x-guard.x);
    }
    return true;
  }
  startPrologue(){
    this.reset();this.prologue=new Prologue();this.stage=PROLOGUE_STAGE;this.walls=this.stage.walls;
    Object.assign(this.player,this.stage.spawn,{hasRifle:false,unarmed:true,knifeEquipped:true,knifeSwing:0,kneeling:false,angle:-.2});
    this.weapon.ammo=0;this.weapon.reserve=0;
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
    this.stage=STAGES[this.wave-1];this.stageStartedAt=this.time;
    this.walls=this.stage.walls;
    this.exitOpen=false;
    this.enemies=[];
    this.bullets.clear();this.particles.clear();this.effects.clear();this.feedback.reset();
    this.pickups.clear();
    Object.assign(this.player,this.stage.spawn,{knockX:0,knockY:0,shotTimer:0});
    this.weapon.reloadRemaining=0;
    for(const enemy of this.stage.enemies)this.spawnEnemy(enemy.type,enemy.x,enemy.y,enemy.cover,enemy.advancePoint,enemy.skill,enemy.courage);
    this.clearTimer=0;this.state='playing';this.audio.play('wave');
  }
  spawnEnemy(type,x=900,y=360,cover=null,advancePoint=null,skill=null,courage='steady') {
    const d=ENEMIES[type];
    this.enemies.push({...d,...skillStats(d,skill),type,x,y,cover,advancePoint,courage,ammo:C.weapon.magazineSize,active:true,born:.6,timer:.6+this.enemies.length*.16,flash:0,angle:Math.atan2(this.player.y-y,this.player.x-x),aimRemaining:0});
    initBody(this.enemies.at(-1));
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
    hearSound(listeners,{x,y},type,this.walls,this.random);
  }
  shoot(x,y,angle,hostile,damage,speed,empowered=false,bulletRange=C.weapon.bulletRange,headTarget=null) {
    if(!hostile)this.emitPlayerSound('gunshot',x,y);
    if(hostile)this.audio.play('enemyShot',{dx:x-this.player.x,dy:y-this.player.y});
    this.bullets.spawn( {
      x,y,px:x,py:y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius:empowered?8:hostile?6:4,hostile,damage,life:hostile?5:C.weapon.life,empowered,remainingRange:bulletRange,alertedEnemies:new Set(),headTarget
    });
  }
  strikeKnife(target){
    const p=this.player,hit=knifeContact(p,target);if(!hit)return null;
    hit.headshot=p.knifeHeadTarget===target;
    if(hit.headshot)hit.region='head';
    const result=applyInjury(target,KNIFE_DAMAGE,hit,this.time,this.random);
    this.woundEffect(target,result,{vx:Math.cos(p.angle),vy:Math.sin(p.angle)},hit);
    if(result.armorHit||result.damage>0)applyKnockback(target,target.x-p.x,target.y-p.y,C.knockback.knife);
    return result;
  }
  killEnemy(e){
    if(e.deathHandled)return;notifyCasualty(e,this.enemies,this.walls);e.dead=true;e.active=false;e.deathHandled=true;
    this.kills++;this.score+=e.score??180;this.feedback.killed(this.time);
    const corpse=this.effects.fallen(e);this.pickups.drop(e,this.walls,this.random,corpse);this.audio.play('dead');
  }
  woundEffect(e,result,bullet,hit){
    const angle=Math.atan2(bullet?.vy||0,bullet?.vx||1),x=hit?.x??e.x,y=hit?.y??e.y;
    if(result.armorHit){this.effects.armorImpact(x,y,angle,result.armorBroken,result.part,result.weapon==='knife');this.audio.play(result.weapon==='knife'?'knifeArmor':'wallHit');}
    else if(result.damage>0){
      if(result.weapon==='knife')this.effects.knifeImpact(x,y,angle,this.walls);
      else this.effects.impact(x,y,angle,this.walls,e!==this.player);
      if(result.detached){if(result.part==='head')this.effects.detachHead(e,angle);else this.effects.detach(e,result.kind,angle);}
      this.audio.play(result.weapon==='knife'?'knifeHit':'impact');
    }
  }
  hurt(damage,bullet=null,hit=null){
    const p=this.player;if(p.dead)return;
    const injury=applyInjury(p,damage,hit||{region:'center'},this.time,this.random);
    this.feedback.damaged();p.hitFlash=.35;
    if(bullet)applyKnockback(p,bullet.vx,bullet.vy,C.knockback.player);
    this.woundEffect(p,injury,bullet,hit);this.checkPlayerDeath();return injury;
  }
  checkPlayerDeath(){
    const p=this.player;if(!p.dead||p.deathHandled)return;
    p.deathHandled=true;p.knifeSwing=0;this.state='dead';this.effects.fallen(p);this.audio.play('dead');
  }
  updateWounds(e,dt){
    tickWounds(e,dt,(part,size)=>this.effects.bleed(e,part,size,this.walls));
    if(e===this.player)this.checkPlayerDeath();else if(e.dead)this.killEnemy(e);
  }
  update(dt,input) {
    if(this.state!=='playing')return;
    if(input.consumeWeaponSwitch?.()&&this.player.hasRifle){
      const p=this.player;p.knifeEquipped=!p.knifeEquipped;p.unarmed=p.knifeEquipped;
      p.knifeSwing=0;p.knifeHeadTarget=null;p.knifeAttackHeld=!!input.mouse.down;
      if(p.knifeEquipped)this.weapon.reloadRemaining=0;
    }
    if(this.prologue&&this.prologue.phase!=='revenge'){this.prologue.update(this,dt,input);return;}
    if(this.prologue)this.prologue.phaseTime+=dt;
    this.time+=dt;
    this.shake=Math.max(0,this.shake-dt*35);
    const p=this.player,a=C.arena;
    const mv=input.movement();
    p.angle=Math.atan2(input.mouse.y-p.y,input.mouse.x-p.x);
    p.hitFlash=Math.max(0,(p.hitFlash||0)-dt);
    this.updateWounds(p,dt);if(p.dead)return;
    this.feedback.update(dt);
    p.shotTimer-=dt;
    this.recoil=Math.max(0,this.recoil-dt*45);
      this.effects.update(dt,this.walls);
    if(this.weapon.update(dt))this.audio.play('reloadReady');
    if(input.consumeReload?.()&&!p.knifeEquipped&&this.weapon.reload())this.audio.play('reload');
    const moveSpeed=playerMoveSpeed(p,this.weapon,input.mouse.down)*injuryMoveScale(p);
    p.vx=mv.x*moveSpeed;p.vy=mv.y*moveSpeed;
    const oldPX=p.x,oldPY=p.y;
    moveBody(p,p.vx*dt,p.vy*dt,this.walls);
    updateFootsteps(p,oldPX,oldPY,p,(...args)=>{this.audio.play(...args);this.emitPlayerSound('footstep');},true);
    moveKnockback(p,dt,this.walls);
    animateStride(p,oldPX,oldPY);
    const changingInterrupted=!!(mv.x||mv.y||input.mouse.down||!input.lootHeld?.());
    if(input.consumeLoot?.()&&!changingInterrupted&&!this.pickups.changing){
      const rounds=this.pickups.collectAmmo(p,this.walls,this.weapon);
      if(this.pickups.start(p,this.walls)){p.knifeSwing=0;this.feedback.show('부위당 2.5초 · E 유지 · 떼거나 움직이면 중단');}
      else this.feedback.show(rounds?`탄약 ${rounds}발 획득`:'시체 위에서 E · 획득할 장비 필요');
    }
    if(this.pickups.update(p,this.walls,dt,changingInterrupted))this.audio.play('reloadReady');
    if(updateKnife(p,dt,input.mouse.down,(type)=>this.audio.play(type),headAimTarget(this,input.mouse))){
      for(const e of knifeTargets(p,this.enemies.filter(e=>e.born<=0),this.walls)){
        this.strikeKnife(e);if(e.dead)this.killEnemy(e);
      }
    }
    if(!p.armsDisabled&&!p.knifeEquipped&&input.mouse.down&&p.shotTimer<=0&&this.weapon.consume()) {
      const boosted=false;
      this.shoot(p.x,p.y,shotAngle(p,p.angle,this.random),false,p.damage*(boosted?4:1),C.weapon.speed,boosted,C.weapon.bulletRange,headAimTarget(this,input.mouse));
      p.shotTimer=p.fireInterval;
      this.recoil=boosted?10:6;
      this.effects.fire(p,boosted);
      this.shake=Math.max(this.shake,boosted?8:3);
      this.audio.play('shot');
      if(this.weapon.ammo===0&&this.weapon.reload())this.audio.play('reload');
    }
    prepareSquad(this.enemies,p,this.walls,dt);
    for(const e of this.enemies) {
      if(!e.active)continue;
      this.updateWounds(e,dt);if(!e.active)continue;
      e.flash=Math.max(0,e.flash-dt);
      e.muzzle=Math.max(0,(e.muzzle||0)-dt);
      if(e.born>0) {
        e.born-=dt;
        continue;
      }
      updateEnemyReload(e,dt);
      e.timer-=dt;
      const motion=updateTacticalEnemy(e,dt,this.walls,this.enemies,(...args)=>this.shoot(...args),this.random);
      let vx=motion.x,vy=motion.y;
      const oldEX=e.x,oldEY=e.y;
      const injuryScale=injuryMoveScale(e);vx*=injuryScale;vy*=injuryScale;
      moveBody(e,vx*dt,vy*dt,this.walls);
      updateFootsteps(e,oldEX,oldEY,p,(...args)=>this.audio.play(...args));
      animateStride(e,oldEX,oldEY);
      moveKnockback(e,dt,this.walls);

    }
    this.grid.clear();
    for(const e of this.enemies)if(e.active&&e.born<=0)this.grid.insert(e);
    for(const b of this.bullets.items) {
      if(!b.active)continue;
      b.life-=dt;
      traceBullet(b,dt,this.walls,()=>{
      if(!b.hostile)registerNearMiss(this.enemies,b);
      if(b.hostile){
        const hit=bodyHit(p,b);if(hit){b.active=false;this.hurt(b.damage,b,hit);}
      }else{
        const hits=this.enemies.filter(e=>e.active&&e.born<=0).map(e=>({e,hit:bodyHit(e,b)})).filter(v=>v.hit).sort((a,b)=>a.hit.t-b.hit.t);
        if(hits.length){
          const {e,hit}=hits[0];
          hit.headshot=hit.region==='center'&&b.headTarget===e;
          const injury=applyInjury(e,b.damage,hit,this.time,this.random);
          this.woundEffect(e,injury,b,hit);applyKnockback(e,b.vx,b.vy,C.knockback.enemy);e.flash=.09;b.active=false;
          if(e.dead)this.killEnemy(e);
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
    if(this.state==='playing'&&this.enemies.length===0) {
      if(!this.exitOpen){
        this.exitOpen=true;this.bullets.clear();
        this.feedback.show(this.feedback.damageTaken===0?'무피격 돌파 · 출구 개방':'출구 개방');
      }
      const exit=this.stage.exit;
      if(Math.hypot(p.x-exit.x,p.y-exit.y)<exit.radius){
        if(this.wave===STAGES.length){this.archiveBattlefield();this.state='won';}
        else {this.nextStage();input.clear?.();}
      }
    }
  }
}
