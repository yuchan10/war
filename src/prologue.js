import { updateContact } from './contact-memory.js';
import { knifeTargets, updateKnife } from './knife.js';
import { playerMoveSpeed } from './player-movement.js';
import { CONFIG } from './config.js';
import { moveBody,hasLineOfSight,traceBullet,routeDirection } from './arena.js';
import { segmentHits } from './core.js';
import { animateStride,drawSoldier } from './soldier.js';
import { updateEnemyFire } from './enemy-fire.js';
import { visiblePoint, VISION } from './visibility.js';
import { updateFootsteps } from './footsteps.js';

export const SCOUT_VISION={...VISION,angle:Math.PI/4};

export const PROLOGUE_STAGE={name:'마지막 무전',theme:'ambush',
  terrain:{base:'#454636',road:[[42,320],[1158,320]],roadWidth:170,craters:[[370,300,32],[820,345,35]]},
  spawn:{x:195,y:480},exit:{x:1080,y:565,radius:35},
  walls:[
    {x:240,y:370,w:80,h:155,material:'steel',kind:'wreck'},
    {x:105,y:395,w:100,h:40,material:'concrete',kind:'rock'},
    {x:390,y:405,w:165,h:38,material:'concrete'},
    {x:675,y:425,w:140,h:38,material:'sandbag'},
    {x:920,y:380,w:40,h:110,material:'concrete'},
    {x:960,y:170,w:130,h:65,material:'steel',kind:'wreck'}]};

export class Prologue {
  constructor(){
    this.phase='witness';this.elapsed=0;this.phaseTime=0;this.shots=0;
    this.canStrike=false;
    this.searchRoutes=[
      [{x:350,y:555},{x:195,y:555},{x:195,y:520},{x:160,y:490}],
      [{x:625,y:365},{x:600,y:520},{x:770,y:550}],
      [{x:850,y:300},{x:1030,y:400},{x:1060,y:570}]
    ];
    this.executionShots=[];
    this.allies=[0,1,2].map(i=>({x:520+i*88,y:330,angle:Math.PI/2,unarmed:true,kneeling:true,restrained:true,hooded:true,alive:true}));
    this.officer={x:850,y:265,angle:Math.PI,unarmed:true,departed:false};
    this.guards=this.allies.map((ally,i)=>({x:ally.x,y:195,vision:SCOUT_VISION,courage:['cautious','steady','resolute'][i],radius:17,routeIndex:0,angle:Math.atan2(ally.y+1-195,4),rifleLowered:false,aimDuration:.75,burstCount:2,burstInterval:.23,
      fireInterval:1.6,bulletSpeed:900,damage:10,shotSpread:.09,trackAim:true,timer:1+i*.5,aimRemaining:0}));
  }
  get caption(){
    if(this.phase==='witness')return this.elapsed<2?'파괴된 수송차 뒤. 숨을 죽인 채 동료들을 바라봤다.':this.elapsed<3.5?'':this.elapsed<5.2?'적 장교: 준비. 조준.':this.elapsed<7.6?'':this.elapsed<9.8?'적 장교: 흩어져. 차량과 잔해를 수색해.':'';
    if(this.phase==='search')return '마우스 왼쪽 클릭 · 칼 휘두르기 — 가까운 적을 겨냥하라.';
    if(this.phase==='arming')return '소총을 확보했다.';
    return this.phaseTime<4?'이제 도망치지 않는다. 마우스로 사격 · R 장전 · 휠로 칼/총 전환':'남은 집행 병사들을 제압하고 오른쪽 출구로 이동하라.';
  }
  knifeTargets(player,walls){return knifeTargets(player,this.guards,walls);
  }
  beginRevenge(w,input){
    const p=w.player;p.hasRifle=true;p.unarmed=false;p.knifeEquipped=false;p.knifeSwing=0;w.weapon.ammo=w.weapon.capacity;w.weapon.reloadRemaining=0;
    for(const g of this.guards.filter(g=>!g.subdued)){
      w.spawnEnemy('assault',g.x,g.y,null,{x:p.x,y:p.y},'regular',g.courage);
      Object.assign(w.enemies.at(-1),{born:0,timer:.65,angle:g.angle,vision:g.vision,heardPosition:{x:p.x,y:p.y}});
    }
    this.phase='revenge';this.phaseTime=0;input.clear?.();w.audio.play('reloadReady');
  }
  update(w,dt,input){
    this.elapsed+=dt;this.phaseTime+=dt;w.time+=dt;
    const p=w.player;
    p.invulnerable=Math.max(0,p.invulnerable-dt);w.effects.update(dt,w.walls);
    const mv=this.phase==='witness'?{x:0,y:0}:input.movement(),oldX=p.x,oldY=p.y;
    const speed=playerMoveSpeed(p,w.weapon,input.mouse.down);
    p.vx=mv.x*speed;p.vy=mv.y*speed;
    moveBody(p,p.vx*dt,p.vy*dt,w.walls);animateStride(p,oldX,oldY);
    updateFootsteps(p,oldX,oldY,p,(...args)=>{w.audio.play(...args);w.emitPlayerSound('footstep');},true);
    p.angle=this.phase==='witness'?Math.atan2(330-p.y,568-p.x):Math.atan2(input.mouse.y-p.y,input.mouse.x-p.x);
    input.consumeReload?.();
    if(this.phase==='witness'){
      for(const guard of this.guards){
        const oldY=guard.y;
        guard.y=195+65*Math.min(1,this.elapsed*.7/2.5);
        animateStride(guard,guard.x,oldY);
        const ally=this.allies[this.guards.indexOf(guard)];
        guard.angle=Math.atan2(ally.y+1-guard.y,ally.x+4-guard.x);
        guard.rifleLowered=false;
      }
      while(this.shots<3&&this.elapsed>=5.2+this.shots*.9){
        const ally=this.allies[this.shots],guard=this.guards[this.shots];
        const head={x:ally.x+Math.cos(ally.angle)+4*Math.sin(ally.angle),y:ally.y+Math.sin(ally.angle)-4*Math.cos(ally.angle)};
        guard.angle=Math.atan2(head.y-guard.y,head.x-guard.x);guard.muzzle=.12;
        this.executionShots.push({ally,head,x:guard.x+Math.cos(guard.angle)*36,y:guard.y+Math.sin(guard.angle)*36,age:0,hit:false});
        w.audio.play('enemyShot',{dx:guard.x-p.x,dy:guard.y-p.y});this.shots++;
      }
      // Keep the establishing view until the officer has walked completely off screen.
      if(this.elapsed>=8.2){
        const officer=this.officer,oldX=officer.x;
        officer.angle=0;officer.x=Math.min(1240,officer.x+70*dt);
        animateStride(officer,oldX,officer.y);
        updateFootsteps(officer,oldX,officer.y,p,(...args)=>w.audio.play(...args));
        officer.departed=officer.x>=1240;
      }
      if(this.officer.departed){this.phase='search';this.phaseTime=0;for(const g of this.guards){g.walking=false;g.rifleLowered=false;}}
    }else if(this.phase==='search'){
      for(const [i,g] of this.guards.entries()){
        if(g.subdued)continue;
        const route=this.searchRoutes[i],target=route[g.routeIndex%route.length];
        const oldX=g.x,oldY=g.y;
        const bearingBeforeMove=Math.atan2(p.y-g.y,p.x-g.x);
        const contact=updateContact(g,p,w.walls,dt);
        const spotted=contact.visible;
        if(spotted){g.angle=bearingBeforeMove;}
        else if(contact.target){
          const target=contact.target,d=routeDirection(g,target,w.walls);
          const distance=Math.hypot(target.x-g.x,target.y-g.y);
          if(distance>16){
            moveBody(g,d.x*56*dt,d.y*56*dt,w.walls);
            if(d.x||d.y)g.angle=Math.atan2(d.y,d.x);
          }else{g.heardPosition=null;g.lastContact=null;g.searchWait=2;}
        }
        else if((g.searchWait||0)>0){g.searchWait-=dt;g.angle=Math.PI+Math.sin(this.phaseTime)*.4;}
        else{
          const d=routeDirection(g,target,w.walls);moveBody(g,d.x*56*dt,d.y*56*dt,w.walls);
          if(Math.hypot(d.x,d.y)>0)g.angle=Math.atan2(d.y,d.x);
          if(Math.hypot(g.x-target.x,g.y-target.y)<8){g.routeIndex++;g.searchWait=g.routeIndex>=3?4:0;}
        }
        animateStride(g,oldX,oldY);updateFootsteps(g,oldX,oldY,p,(...args)=>w.audio.play(...args));
        const bearing=Math.atan2(p.y-g.y,p.x-g.x);
        const sees=updateContact(g,p,w.walls,0).visible;
        g.timer-=dt;
        if(sees&&!g.alert)g.timer=0;
        g.alert=sees;
        if(sees)g.angle=bearing;
        updateEnemyFire(g,dt,p,(...args)=>w.shoot(...args),sees);
      }
      this.canStrike=this.knifeTargets(p,w.walls).length>0;
      if(updateKnife(p,dt,input.mouse.down,(type)=>w.audio.play(type))){
        const targets=this.knifeTargets(p,w.walls);
        for(const target of targets){
          Object.assign(target,{subdued:true,fallen:true,headDestroyed:true,hp:0,walking:false,aimRemaining:0,burstLeft:0,muzzle:0});
          w.effects.detachHead(target,p.angle);w.effects.fallen(target,p.angle);
          w.effects.impact(target.x,target.y,p.angle,w.walls);w.kills++;w.score+=180;w.audio.play('impact');
        }
        if(targets.length){this.phase='arming';this.phaseTime=0;}
      }
    }else if(this.phase==='arming'){
      p.knifeSwing=Math.max(0,(p.knifeSwing||0)-dt);
      if(this.phaseTime>=.35){this.beginRevenge(w,input);return;}
    }
    for(const shot of this.executionShots){
      shot.age+=dt;
      if(!shot.hit&&shot.age>=.055){
        shot.hit=true;shot.ally.alive=false;shot.ally.headDestroyed=true;
        const awayFromShooter=Math.atan2(shot.head.y-shot.y,shot.head.x-shot.x);
        w.effects.hoodImpact(shot.head.x,shot.head.y,awayFromShooter,w.walls);
        w.effects.fallen({...shot.ally,allied:true,armsDisabled:true},awayFromShooter);
      }
    }
    this.executionShots=this.executionShots.filter(shot=>shot.age<.14);
    for(const g of this.guards)g.muzzle=Math.max(0,(g.muzzle||0)-dt);
    for(const b of w.bullets.items){
      if(!b.active)continue;b.life-=dt;
      traceBullet(b,dt,w.walls,()=>{
        if(segmentHits(b.px,b.py,b.x,b.y,p.x,p.y,p.radius+b.radius)){b.active=false;w.hurt(b.damage,b);return true;}
        return false;
      },()=>w.effects.add('dust',b.x,b.y,0,'#b2a68d',.3,15));
      if(b.life<=0)b.active=false;
    }
  }
  draw(c,w){
    if(this.phase==='revenge')return;
    for(const ally of this.allies){
      if(!ally.alive||(this.phase!=='witness'&&!visiblePoint(w.player,ally,w.walls)))continue;
      drawSoldier(c,ally,true);
    }
    for(const guard of this.guards)if(!guard.fallen&&(this.phase==='witness'||visiblePoint(w.player,guard,w.walls)))drawSoldier(c,guard,false);
    if(this.phase==='witness'&&!this.officer.departed){
      drawSoldier(c,this.officer,false);
      c.fillStyle='#c3b88b';c.fillRect(this.officer.x-4,this.officer.y-13,8,2);
    }
    for(const shot of this.executionShots){
      if(this.phase!=='witness'&&!visiblePoint(w.player,shot.head,w.walls))continue;
      c.save();c.strokeStyle='#f5dfa0';c.globalAlpha=Math.max(0,1-shot.age/.14);c.lineWidth=1.5;
      c.beginPath();c.moveTo(shot.x,shot.y);c.lineTo(shot.head.x,shot.head.y);c.stroke();c.restore();
    }
  }
}
