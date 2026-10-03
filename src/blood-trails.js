import { hasLineOfSight } from './arena.js';

// Ground marks survive transient particles, throughout the operation.
export class BloodTrails {
  constructor(limit=Infinity){this.limit=limit;this.clear();}
  clear(){this.marks=[];this.cursor=0;}
  add(x,y,size,angle,walls=[]){
    if(walls.some(w=>x>=w.x&&x<=w.x+w.w&&y>=w.y&&y<=w.y+w.h))return;
    const mark={x,y,size:size*1.5,angle,age:0,spread:.08,reveal:0,wetness:1};
    if(this.marks.length<this.limit)this.marks.push(mark);
    else{this.marks[this.cursor]=mark;this.cursor=(this.cursor+1)%this.limit;}
  }
  drip(x,y,size,angle,walls=[]){
    // Repeated drops at rest feed a pool; moving drops form a broken trail.
    const pool=this.marks.slice(-64).find(m=>m.pool&&Math.hypot(m.x-x,m.y-y)<4&&hasLineOfSight(m,{x,y},walls));
    if(pool){pool.size=Math.min(20,Math.sqrt(pool.size*pool.size+(size*1.5)**2*.6));pool.age=0;return;}
    const before=this.marks.length;this.add(x,y,size,angle,walls);
    if(this.marks.length>before)this.marks.at(-1).pool=true;
  }
  update(dt){for(const m of this.marks){
    m.age=(m.age||0)+dt;
    const targetWetness=Math.max(0,1-m.age/40);
    // Ease fresh drops into an older pool without snapping its color back.
    m.wetness=(m.wetness??targetWetness)+(targetWetness-(m.wetness??targetWetness))*(1-Math.exp(-dt*2));
    m.reveal=Math.min(1,(m.reveal??1)+dt/.9);m.spread=Math.min(1,(m.spread??.08)+dt*.95);
  }}
  splatter(x,y,angle,walls=[],random=Math.random){
    this.add(x,y,6+random()*4,angle+random()*Math.PI,walls);
    const count=9+Math.floor(random()*6);
    for(let i=0;i<count;i++){
      const spread=random()<.2?Math.PI:1.5;
      const direction=angle+(random()*2-1)*spread,distance=6+random()*32;
      const point={x:x+Math.cos(direction)*distance,y:y+Math.sin(direction)*distance};
      if(hasLineOfSight({x,y},point,walls))this.add(point.x,point.y,1.5+random()*3,direction,walls);
    }
  }
  trail(entity,oldX,oldY,walls=[]){
    if(!(entity.missingArms?.length||entity.missingLegs?.length))return;
    const dx=entity.x-oldX,dy=entity.y-oldY,distance=Math.hypot(dx,dy);
    if(distance<1e-6)return;
    const previous=entity.bloodDistance||0,angle=Math.atan2(dy,dx);
    for(let step=8-previous;step<=distance;step+=8){
      const x=oldX+dx*step/distance,y=oldY+dy*step/distance;
      this.add(x,y,entity.missingLegs?.length?3.8:2.8,angle,walls);
    }
    entity.bloodDistance=(previous+distance)%8;
  }
  draw(c,isVisible=()=>true){
    c.save();c.globalAlpha=.78;
    for(const mark of this.marks){
      if(!isVisible(mark))continue;
      c.save();c.translate(mark.x,mark.y);c.rotate(mark.angle);
      const appearing=Math.min(1,.08+(mark.reveal??1));c.globalAlpha=.78*appearing;
      const radius=mark.size*(mark.spread??1),wet=mark.wetness??Math.max(0,1-(mark.age||0)/40);
      c.fillStyle=`rgb(${65+38*wet}, ${37+4*wet}, ${31+wet})`;
      c.beginPath();
      for(let i=0;i<12;i++){
        const a=i*Math.PI/6,r=radius*(.84+.16*Math.sin(mark.x*.3+mark.y*.7+i*2.4));
        const x=Math.cos(a)*r,y=Math.sin(a)*r*.75;i?c.lineTo(x,y):c.moveTo(x,y);
      }
      c.closePath();c.fill();
      if(wet>0){c.globalAlpha=.2*wet*appearing;c.fillStyle='#a45342';c.beginPath();c.ellipse(-radius*.2,-radius*.15,radius*.4,radius*.18,-.4,0,Math.PI*2);c.fill();}

      c.restore();
    }
    c.restore();
  }
}
