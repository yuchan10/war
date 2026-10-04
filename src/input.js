import {
  direction
}from'./core.js';
export class Input {
  constructor(canvas,onSettings,onSound) {
    this.keys=new Set();
    this.mouse= {
      x:600,y:360,down:false
    };
    this.loot=false;this.reload=false;this.grenade=false;this.switchWeapon=false;this.lastWheel=-Infinity;
    window.addEventListener('keydown',e=> {
      if(e.code==='KeyG'&&!e.repeat)this.grenade=true;
      if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();this.keys.add(e.code);if(!e.repeat&&e.code==='KeyE')this.loot=true;if(!e.repeat&&e.code==='KeyR')this.reload=true;if(!e.repeat&&e.code==='Escape')onSettings();if(!e.repeat&&e.code==='KeyM')onSound();
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    canvas.addEventListener('pointermove',e=>this.point(e,canvas));
    canvas.addEventListener('wheel',e=>{
      if(e.ctrlKey||!e.deltaY)return;
      e.preventDefault();
      if(e.timeStamp-this.lastWheel<180)return;
      this.lastWheel=e.timeStamp;this.switchWeapon=true;
    },{passive:false});
    canvas.addEventListener('pointerdown',e=> {
      if(e.button!==0)return;this.point(e,canvas);this.mouse.down=true;
    });
    window.addEventListener('pointerup',()=>this.mouse.down=false);
    window.addEventListener('blur',()=>this.clear());
  }point(e,c) {
    const r=c.getBoundingClientRect();
    this.mouse.x=(e.clientX-r.left)/r.width*c.width;
    this.mouse.y=(e.clientY-r.top)/r.height*c.height;
  }movement() {
    return direction(Number(this.keys.has('KeyD'))-Number(this.keys.has('KeyA')),Number(this.keys.has('KeyS'))-Number(this.keys.has('KeyW')));
  }consumeGrenade(){const value=this.grenade;this.grenade=false;return value;}consumeReload() {
    const value=this.reload;
    this.reload=false;
    return value;
  }lootHeld(){return this.keys.has('KeyE');}consumeLoot(){const value=this.loot;this.loot=false;return value;}consumeWeaponSwitch(){const value=this.switchWeapon;this.switchWeapon=false;return value;}clear() {
    this.keys.clear();
    this.mouse.down=false;
    this.switchWeapon=false;this.lastWheel=-Infinity;
    this.reload=false;this.loot=false;this.grenade=false;
  }
}
