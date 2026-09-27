import { updateWounded } from './wounded-ai.js';
import { updateEnemyFire } from './enemy-fire.js';
import { updateContact } from './contact-memory.js';
import { suppressionTarget,safeShot } from './suppression-target.js';

// Each defender owns a small hide/peek position. It never pursues the player.
export function updateCoverDefender(e,dt,player,walls,shoot){
  const wounded=updateWounded(e,dt,player,walls,shoot);
  if(wounded)return wounded;
  const contact=updateContact(e,player,walls,dt);
  if(contact.target)e.angle=Math.atan2(contact.target.y-e.y,contact.target.x-e.x);
  e.suppressing=!contact.visible&&!!contact.target;
  const post=e.cover||(e.cover={hide:{x:e.x,y:e.y},peek:{x:e.x,y:e.y},delay:1});
  if(!e.suppressing)e.suppressionWall=null;
  const guardedShoot=(x,y,angle,...args)=>{
    if(!safeShot(e,angle,walls))return false;
    shoot(x,y,angle,...args);
    if(e.suppressing)e.suppressionShots=(e.suppressionShots||0)+1;
    return true;
  };
  if(!e.coverState){e.coverState='hidden';e.coverWait=post.delay??1;e.exposure=0;}
  if(e.flash>0&&e.coverState!=='hidden'){
    e.coverState='retreat';e.aimRemaining=0;e.burstLeft=0;
  }
  let target=post.hide;
  if(e.coverState==='hidden'){
    e.coverWait-=dt;
    // If flanked, fight from the post rather than rotating around the whole map.
    if(contact.visible)updateEnemyFire(e,dt,player,guardedShoot,true);
    else updateEnemyFire(e,dt,player,shoot,false);
    if(e.coverWait<=0&&!(e.aimRemaining>0||e.burstLeft>0)){
      e.coverState='peek';e.exposure=0;e.timer=0;
    }
  }
  if(e.coverState==='peek'){
    target=post.peek;
    if(Math.hypot(target.x-e.x,target.y-e.y)<3){
      e.exposure+=dt;
      const fireTarget=e.suppressing?suppressionTarget(e,contact.target,walls):contact.target;
      updateEnemyFire(e,dt,fireTarget||player,guardedShoot,!!fireTarget);
      if(e.exposure>=1.15&&!(e.aimRemaining>0||e.burstLeft>0))e.coverState='retreat';
      if(e.exposure>2)e.coverState='retreat';
    }
  }
  if(e.coverState==='retreat'){
    target=post.hide;e.aimRemaining=0;e.burstLeft=0;
    if(Math.hypot(target.x-e.x,target.y-e.y)<3){e.coverState='hidden';e.coverWait=1.1+(post.delay??0)*.35;}
  }
  const dx=target.x-e.x,dy=target.y-e.y,d=Math.hypot(dx,dy);
  const speed=Math.min(e.speed,d/Math.max(dt,.00001));
  return d>.1?{x:dx/d*speed,y:dy/d*speed}:{x:0,y:0};
}
