import { hasLineOfSight } from './arena.js';

// Ground marks survive transient particles, throughout the operation.
export class BloodTrails {
  constructor(limit=Infinity){this.limit=limit;this.clear();}
  clear(){this.marks=[];this.cursor=0;}
  add(x,y,size,angle,walls=[]){
    if(walls.some(w=>x>=w.x&&x<=w.x+w.w&&y>=w.y&&y<=w.y+w.h))return;
    const mark={x,y,size,angle};
    if(this.marks.length<this.limit)this.marks.push(mark);
    else{this.marks[this.cursor]=mark;this.cursor=(this.cursor+1)%this.limit;}
  }
  splatter(x,y,angle,walls=[]){
    this.add(x,y,8,angle,walls);
    for(let i=0;i<7;i++){
      const direction=angle+(i-3)*.36,distance=8+(i%3)*7;
      const point={x:x+Math.cos(direction)*distance,y:y+Math.sin(direction)*distance};
      if(hasLineOfSight({x,y},point,walls))this.add(point.x,point.y,2+i%3,direction,walls);
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
      c.fillStyle='#572820';c.beginPath();c.ellipse(0,0,mark.size,mark.size*.6,0,0,Math.PI*2);c.fill();
      c.fillStyle='#76392c';c.beginPath();c.ellipse(-mark.size*.25,-1,mark.size*.55,mark.size*.35,.4,0,Math.PI*2);c.fill();
      c.restore();
    }
    c.restore();
  }
}
