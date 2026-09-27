export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function direction(x,y) {
  const n=Math.hypot(x,y);
  return n? {
    x:x/n,y:y/n
  }: {
    x:0,y:0
  };
}
export function segmentHits(ax,ay,bx,by,cx,cy,r) {
  const dx=bx-ax,dy=by-ay,n=dx*dx+dy*dy;
  const t=n?clamp(((cx-ax)*dx+(cy-ay)*dy)/n,0,1):0;
  return (ax+dx*t-cx)**2+(ay+dy*t-cy)**2<=r*r;
}
export class SpatialHash {
  constructor(size=80) {
    this.size=size;
    this.cells=new Map();
  }clear() {
    this.cells.clear();
  }insert(e) {
    const s=this.size;
    for(let x=Math.floor((e.x-e.radius)/s);x<=Math.floor((e.x+e.radius)/s);x++)for(let y=Math.floor((e.y-e.radius)/s);y<=Math.floor((e.y+e.radius)/s);y++) {
      const k=`${x},${y}`;
      if(!this.cells.has(k))this.cells.set(k,[]);
      this.cells.get(k).push(e);
    }
  }query(x,y,r) {
    const found=new Set(),s=this.size;
    for(let a=Math.floor((x-r)/s);a<=Math.floor((x+r)/s);a++)for(let b=Math.floor((y-r)/s);b<=Math.floor((y+r)/s);b++)for(const e of this.cells.get(`${a},${b}`)||[])found.add(e);
    return found;
  }
}
export class Pool {
  constructor(limit) {
    this.limit=limit;
    this.items=[];
  }spawn(data) {
    let item=this.items.find(i=>!i.active);
    if(!item) {
      if(this.items.length>=this.limit)return null;
      item= {
      };
      this.items.push(item);
    }Object.assign(item,data, {
      active:true
    });
    return item;
  }clear() {
    for(const item of this.items)item.active=false;
  }
}
