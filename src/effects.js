import { Pool } from './core.js';
import { BloodTrails } from './blood-trails.js';
import { drawHood, drawWristBinding } from './captive-appearance.js';
import { moveBody } from './arena.js';

// Bounded cosmetic effects never change combat timing or damage.
export class Effects {
  constructor() { this.items = new Pool(120); this.hitMarker = 0; this.blood=new BloodTrails(); }
  clear() { this.items.clear(); this.items=new Pool(120); this.hitMarker = 0; this.blood.clear(); }
  persist(data){this.items.limit++;return this.items.spawn({...data,persistent:true,age:0});}
  snapshot(){return structuredClone({remains:this.items.items.filter(e=>e.active&&e.persistent),blood:this.blood.marks});}
  add(kind, x, y, angle, color, life, size) {
    this.items.spawn({ persistent:false,kind, x, y, angle, color, life, duration: life, size });
  }
  fire(player, boosted) {
    const { x, y, angle } = player;
    this.add('muzzle', x + Math.cos(angle) * 30, y + Math.sin(angle) * 30,
      angle, '#fff0ad', .04, 16);
    this.add('casing', x, y, angle + Math.PI / 2, '#dabb76', .65, 5);
  }
  impact(x,y,angle=0,walls=[],showHitMarker=true) {
    this.blood.splatter(x,y,angle,walls);
    if(showHitMarker)this.hitMarker=.16;
    for(let i=0;i<9;i++)this.add('blood',x,y,angle+(i-4)*.19,'#984a3b',.42,3+i%3);
    this.add('dust',x,y,angle,'#b2a68d',.32,19);
  }
  hoodImpact(x,y,angle=0,walls=[]){
    this.blood.add(x,y,3,angle,walls);
    for(let i=0;i<3;i++)this.add('blood',x,y,angle+(i-1)*.3,'#793d34',.18,1.2+i*.2);
  }
  fallen(soldier,fallAngle=null) {
    this.persist({kind:'body',x:soldier.x,y:soldier.y,angle:fallAngle??soldier.angle+1.1,directedFall:fallAngle!==null,color:soldier.allied?'#7e8e63':'#897451',life:24,duration:24,size:1,
      torsoMarks:(soldier.torsoMarks||[]).map(mark=>({...mark})),
      restrained:!!soldier.restrained,hooded:!!soldier.hooded,
      missingArm:soldier.missingArm||0,missingLeg:soldier.missingLeg||0,missingArms:[...(soldier.missingArms||[])],missingLegs:[...(soldier.missingLegs||[])],headDestroyed:!!soldier.headDestroyed,unarmed:!!soldier.armsDisabled});
  }
  detach(soldier,part,impactAngle){
    const side=part==='arm'?soldier.missingArm:soldier.missingLeg;
    const aim=soldier.aimAngle??soldier.angle;
    const a=aim+side*Math.PI/2;
    const spawn=(kind,offset,speed,angle)=>this.persist({kind,x:soldier.x+Math.cos(a)*offset,y:soldier.y+Math.sin(a)*offset,
      angle,color:'#ad936a',life:24,duration:24,size:1,radius:3,
      vx:Math.cos(impactAngle)*speed+Math.cos(a)*55,vy:Math.sin(impactAngle)*speed+Math.sin(a)*55,spin:side*7});
    spawn(part==='arm'?'droppedArm':'droppedLeg',10,100,aim+side*.7);
    if(part==='arm'&&soldier.armsDisabled&&!soldier.rifleDropped){spawn('droppedRifle',16,145,aim);soldier.rifleDropped=true;}
  }
  detachHead(soldier,angle){
    this.persist({kind:'droppedHead',x:soldier.x,y:soldier.y,angle,color:'#c1aa7c',life:24,duration:24,size:1,radius:6,
      vx:Math.cos(angle)*130,vy:Math.sin(angle)*130,spin:5});
  }
  update(dt,walls=[]) {
    this.hitMarker = Math.max(0, this.hitMarker - dt);
    for (const e of this.items.items) {
      if (!e.active) continue;
      if(e.persistent)e.age+=dt;else e.life-=dt;
      if(e.kind.startsWith('dropped')){
        const decay=Math.exp(-7*dt),travel=(1-decay)/7;
        moveBody(e,e.vx*travel,e.vy*travel,walls);e.angle+=e.spin*travel;
        e.vx*=decay;e.vy*=decay;e.spin*=decay;
      }
      if(e.kind==='blood'){
        e.x+=Math.cos(e.angle)*95*e.life/e.duration*dt;
        e.y+=Math.sin(e.angle)*95*e.life/e.duration*dt;
      }
      if (e.kind === 'casing') {
        e.x += Math.cos(e.angle) * 140 * e.life / e.duration * dt;
        e.y += Math.sin(e.angle) * 140 * e.life / e.duration * dt;
      }
      if (e.life <= 0) e.active = false;
    }
  }
  draw(c,isVisible=()=>true) {
    c.save();
    for (const e of this.items.items) {
      if (!e.active || !isVisible(e)) continue;
      const progress=e.persistent?Math.min(1,e.age/e.duration):1-e.life/e.duration;
      c.save(); c.translate(e.x, e.y); c.rotate(e.angle);
      c.globalAlpha=e.persistent?1:1-progress;
      c.fillStyle = e.color; c.strokeStyle = e.color;
      if(e.kind==='body'){
        const fall=Math.min(1,progress*70);
        if(e.directedFall)c.scale(.55+fall*.45,1);
        else c.rotate(fall*.35);
        c.globalAlpha=Math.min(1,e.life/2);
        c.fillStyle='#332e2290';c.beginPath();c.ellipse(0,3,24,10,0,0,Math.PI*2);c.fill();
        c.strokeStyle='#61543a';c.lineWidth=6;c.lineCap='round';
        c.beginPath();if(!e.missingLegs.includes(-1)){c.moveTo(-3,-4);c.lineTo(-19,-8);}if(!e.missingLegs.includes(1)){c.moveTo(-3,4);c.lineTo(-22,7);}c.stroke();
        c.fillStyle=e.color;c.fillRect(-9,-7,20,14);
        c.strokeStyle=e.color;c.lineWidth=5;c.beginPath();
        if(e.restrained){
          c.moveTo(5,-6);c.lineTo(-4,-8);c.lineTo(-7,-2);
          c.moveTo(5,6);c.lineTo(-4,8);c.lineTo(-7,2);
        }else{
          if(!e.missingArms.includes(-1)){c.moveTo(7,-5);c.lineTo(16,-12);}
          if(!e.missingArms.includes(1)){c.moveTo(7,5);c.lineTo(12,13);}
        }
        c.stroke();
        if(e.restrained)drawWristBinding(c,-7,0);
        if(e.hooded)drawHood(c,12,0,e.headDestroyed);
        else if(!e.headDestroyed){c.fillStyle='#a18e65';c.beginPath();c.arc(12,0,6,0,Math.PI*2);c.fill();}
        else{c.fillStyle='#773d30';c.fillRect(9,-4,4,8);}
        if(!e.unarmed){c.fillStyle='#20291f';c.fillRect(6,14,23,3);}
        for(const mark of e.torsoMarks){
          c.fillStyle='#713a2f';c.beginPath();c.arc(mark.x,mark.y,1.9,0,Math.PI*2);c.fill();
          c.fillStyle='#211b17';c.beginPath();c.arc(mark.x,mark.y,.9,0,Math.PI*2);c.fill();
        }
      }else if(e.kind.startsWith('dropped')){
        c.globalAlpha=Math.min(1,e.life/2);
        if(e.kind==='droppedHead'){
          c.fillStyle='#bfa580';c.beginPath();c.arc(2,0,5,0,Math.PI*2);c.fill();
          c.fillStyle=e.color;c.beginPath();c.ellipse(0,-1,7,6,0,0,Math.PI*2);c.fill();
          c.strokeStyle='#6b573b';c.lineWidth=2;c.beginPath();c.arc(0,-1,5,-2.8,.8);c.stroke();
        }else if(e.kind==='droppedRifle'){
          c.fillStyle='#4c4535';c.fillRect(-17,-3,10,6);c.fillStyle='#252c27';c.fillRect(-7,-3,15,5);c.fillRect(-3,2,4,6);
          c.fillStyle='#899084';c.fillRect(8,-1,14,2);c.fillRect(18,-3,2,4);
        }else{
          c.lineCap='round';c.strokeStyle=e.color;c.lineWidth=e.kind==='droppedLeg'?7:6;
          c.beginPath();c.moveTo(-7,0);c.lineTo(0,3);c.lineTo(8,1);c.stroke();
          c.fillStyle=e.kind==='droppedLeg'?'#20271e':'#c4ad87';c.fillRect(6,-2,e.kind==='droppedLeg'?9:5,6);
          c.fillStyle='#773d30';c.fillRect(-9,-2,3,4);
        }
      }else if(e.kind==='blood'){
        c.beginPath();c.ellipse(progress*8,0,e.size,e.size*.55,0,0,Math.PI*2);c.fill();
      }else if(e.kind==='dust'){
        c.globalAlpha*=.3;c.beginPath();c.ellipse(0,0,3+progress*e.size,2+progress*e.size*.6,0,0,Math.PI*2);c.fill();
      }else if (e.kind === 'ring') {
        c.lineWidth = 3 * (1 - progress) + 1;
        c.beginPath(); c.arc(0, 0, 4 + progress * e.size, 0, Math.PI * 2); c.stroke();
      } else if (e.kind === 'muzzle') {
        c.globalCompositeOperation = 'lighter';
        c.beginPath(); c.moveTo(-7, 0); c.lineTo(7, -10);
        c.lineTo(e.size, 0); c.lineTo(7, 10); c.closePath(); c.fill();

      } else {
        c.rotate(progress * 12); c.fillRect(-e.size / 2, -2, e.size, 4);
      }
      c.restore();
    }
    c.restore();
  }
}
