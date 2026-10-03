import { knifePose } from './knife.js';
import { drawHood, drawWristBinding } from './captive-appearance.js';
// Articulated top-down infantry silhouette; gait advances only on movement.
export function animateStride(entity,oldX,oldY){
  const travelled=Math.hypot(entity.x-oldX,entity.y-oldY);
  if(entity.legsDisabled){
    entity.walking=false;entity.crawling=travelled>.002;
    entity.crawlPhase=(entity.crawlPhase||0)+travelled*.6;
    if(entity.crawling)entity.walkAngle=Math.atan2(entity.y-oldY,entity.x-oldX);
    return;
  }
  entity.crawling=false;
  entity.walkPhase=(entity.walkPhase||0)+travelled*.105;
  entity.walking=travelled>.02;
  if(entity.walking)entity.walkAngle=Math.atan2(entity.y-oldY,entity.x-oldX);
}

export function drawSoldier(c,e,player,recoil=0){
  const aim=(e.aimRemaining>0||e.burstLeft>0?e.aimAngle:e.angle);
  const gait=e.walking?Math.sin(e.walkPhase||0)*5:0;
  const cloth=player?'#7e8e63':'#ad936a',dark=player?'#44553c':'#6b573b';
  c.save();c.translate(e.x,e.y);c.rotate(aim);
  const crawl=e.crawling?Math.sin(e.crawlPhase||0):0;
  if(e.legsDisabled){c.scale(1.25,.75);c.rotate(crawl*.05);c.translate(-Math.abs(crawl)*3,0);}
  c.fillStyle='#080f0966';c.beginPath();c.ellipse(-4,4,22,16,0,0,Math.PI*2);c.fill();
  // Lower body follows actual movement; upper body independently aims.
  c.save();c.rotate(e.walking?(e.walkAngle||0)-aim:0);
  for(const side of [-1,1]){
    if(e.missingLegs?.includes(side))continue;
    const standingUnarmed=player&&e.unarmed&&!e.kneeling;
    const step=side*gait,footX=step-(e.legsDisabled?14:e.kneeling?11:standingUnarmed?13:6),footY=side*(e.kneeling?5:7);
    c.lineCap='round';c.strokeStyle=dark;c.lineWidth=6;
    c.beginPath();c.moveTo(-3,side*4);c.lineTo(-4+step*.4,side*6);c.lineTo(footX,footY);c.stroke();
    c.strokeStyle='#20271e';c.lineWidth=5;c.beginPath();c.moveTo(footX-2,footY);c.lineTo(footX+4,footY);c.stroke();
    c.fillStyle=cloth;c.fillRect(-5+step*.4,side*6-2,3,4);
  }
  c.restore();
  // Torso, plate carrier and a small backpack are longer than the helmet.
  c.fillStyle=cloth;
  c.beginPath();c.ellipse(-4,0,12,10,0,0,Math.PI*2);c.fill();
  c.fillStyle=dark;c.fillRect(-13,-7,8,14);if(!e.body||e.body.torso.armor>0){c.fillStyle='#30392b';c.fillRect(-8,-6,9,12);}
  c.fillStyle=cloth;for(const y of [-5,0,5])c.fillRect(-6,y-1,5,3);
  // Missing limbs stay absent from both live and remembered poses.
  c.save();if(e.rifleLowered)c.rotate(.65);
  c.strokeStyle=cloth;c.lineWidth=6;c.lineCap='round';
  for(const side of [-1,1]){
    if(player&&e.unarmed&&!e.restrained)continue;
    if(e.missingArms?.includes(side))continue;
    if(e.unarmed){
      // Captives keep their hands behind their back; an unarmed runner tucks
      // the elbows close instead of retaining the wide rifle-holding pose.
      const handX=e.kneeling?-13:-7+side*gait*.7,handY=side*(e.kneeling?4:11);
      c.beginPath();c.moveTo(-1,side*8);c.lineTo(-6,side*11);c.lineTo(handX,handY);c.stroke();
      c.fillStyle='#c4ad87';c.beginPath();c.arc(handX,handY,2.3,0,Math.PI*2);c.fill();
      continue;
    }
    const reach=e.crawling?Math.sin((e.crawlPhase||0)+side*Math.PI/2)*9:0;
    const handX=(e.crawling?20:e.armsDisabled||e.unarmed?5:side<0?18:11)+reach,handY=e.crawling?side*15:e.armsDisabled||e.unarmed?side*17:side<0?-2:4;
    c.beginPath();c.moveTo(-1,side*10);c.lineTo(7,side*13);c.lineTo(handX,handY);c.stroke();
    c.fillStyle='#c4ad87';c.beginPath();c.arc(handX,handY,2.8,0,Math.PI*2);c.fill();
  }
  if(!e.armsDisabled&&!e.unarmed){
    c.save();if(e.crawling){c.translate(-15,10);c.rotate(.25);}c.translate(-recoil*.6,2);
    c.fillStyle='#4c4535';c.fillRect(1,-2,9,5);
    c.fillStyle='#252c27';c.fillRect(9,-3,14,5);c.fillRect(13,2,4,5);
    c.fillStyle='#687068';c.fillRect(23,-1,13,2);c.fillRect(31,-3,2,4);
    c.fillStyle='#adb4a1';c.fillRect(12,-4,4,1);c.restore();
  }
  c.restore();
  if(e.restrained)drawWristBinding(c,-13,0);
  if(e.knifeEquipped&&!e.armsDisabled){
    const pose=knifePose(e.knifeSwing),shoulder={x:-1,y:8};
    const hand={x:shoulder.x+Math.cos(pose.angle)*pose.reach,y:shoulder.y+Math.sin(pose.angle)*pose.reach};
    c.strokeStyle=cloth;c.lineWidth=6;c.lineCap='round';
    // The shoulder stays attached; the elbow bends as the hand extends and returns.
    c.beginPath();c.moveTo(shoulder.x,shoulder.y);c.lineTo((shoulder.x+hand.x)*.5-2,(shoulder.y+hand.y)*.5+6);c.lineTo(hand.x,hand.y);c.stroke();
    if(!e.missingArms?.includes(-1)){
      c.beginPath();c.moveTo(-1,-9);c.lineTo(5,-13);c.lineTo(12,-8);c.stroke();
      c.fillStyle='#c4ad87';c.beginPath();c.arc(12,-8,2.5,0,Math.PI*2);c.fill();
    }
    c.fillStyle='#c4ad87';c.beginPath();c.arc(hand.x,hand.y,3,0,Math.PI*2);c.fill();
    c.save();c.translate(hand.x,hand.y);c.rotate(pose.angle+pose.wrist);
    c.fillStyle='#30372e';c.fillRect(-1,-2,9,4);
    c.fillStyle='#889386';c.fillRect(7,-4,2,8);
    c.fillStyle='#d5ddd6';c.beginPath();c.moveTo(9,-2);c.lineTo(26,-1);c.lineTo(17,3);c.lineTo(9,2);c.closePath();c.fill();c.restore();
    if(pose.trail>0){
      c.save();c.globalAlpha*=pose.trail*.5;c.strokeStyle='#dbe4ce';c.lineWidth=1.5;
      c.beginPath();c.arc(shoulder.x,shoulder.y,pose.reach+22,pose.angle-.4,pose.angle-.05);c.stroke();c.restore();
    }
  }
  for(const side of e.missingArms||[]){c.fillStyle='#773d30';c.fillRect(-2,side*9-2,5,4);}
  for(const side of e.missingLegs||[]){c.fillStyle='#773d30';c.fillRect(-8,side*6-2,5,4);}
  // Face edge and helmet, visibly separate from the shoulders.
  if(e.hooded)drawHood(c,1,-4);
  else if(!e.headDestroyed){
  c.fillStyle='#bfa580';c.beginPath();c.arc(4,-3,6,0,Math.PI*2);c.fill();
  if(!e.body||e.body.head.armor>0){
  c.fillStyle=player?'#9ead7d':'#c1aa7c';
  c.beginPath();c.ellipse(1,-4,7.5,7,0,0,Math.PI*2);c.fill();
  c.strokeStyle=dark;c.lineWidth=2;c.beginPath();c.arc(1,-4,6,-2.8,.8);c.stroke();
  c.fillStyle=player?'#d3ddbc':'#776041';c.fillRect(-1,-9,4,2);
  }
  }
  if(e.body){
    for(const [key,side,x,y] of [['leftArm',-1,3,-12],['rightArm',1,3,10],['leftLeg',-1,-8,-7],['rightLeg',1,-8,5]]){
      const p=e.body[key];if(p.severed||p.armor<=0)continue;
      c.fillStyle=p.armor/p.maxArmor<.35?'#807555':'#4c5748';c.fillRect(x,y,6,4);
    }
  }
  if(e.aimRemaining>0){c.fillStyle='#d4ac72';c.fillRect(34,1,2,2);}
  if(e.muzzle>0){c.fillStyle='#fff0b5';c.beginPath();c.moveTo(35,-4);c.lineTo(50,2);c.lineTo(35,8);c.fill();}
  c.restore();
}
