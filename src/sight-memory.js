// Brief visual persistence uses the last seen pose, never hidden live movement.
export class SightMemory {
  constructor(duration=.25){this.duration=duration;this.seen=new Map();this.lastTime=-1;}
  update(enemies,time,isVisible){
    if(time<this.lastTime)this.seen.clear();this.lastTime=time;
    const active=new Set(enemies);for(const key of this.seen.keys())if(!active.has(key))this.seen.delete(key);
    const ghosts=[];
    for(const e of enemies){
      if(isVisible(e)){this.seen.set(e,{time,pose:{...e}});continue;}
      const entry=this.seen.get(e);if(!entry)continue;
      const age=time-entry.time;
      if(age>=this.duration){this.seen.delete(e);continue;}
      ghosts.push({pose:entry.pose,alpha:(1-age/this.duration)*.65,blur:.5+age/this.duration});
    }
    return ghosts;
  }
}
