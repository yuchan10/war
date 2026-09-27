import {
  direction
}from'./core.js';
export class Input {
  constructor(canvas,onPause,onSound) {
    this.keys=new Set();
    this.mouse= {
      x:600,y:360,down:false
    };
    this.reload=false;this.interact=false;
    window.addEventListener('keydown',e=> {
      if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();this.keys.add(e.code);if(!e.repeat&&e.code==='KeyR')this.reload=true;if(!e.repeat&&e.code==='KeyE')this.interact=true;if(!e.repeat&&e.code==='Escape')onPause();if(!e.repeat&&e.code==='KeyM')onSound();
    });
    window.addEventListener('keyup',e=>this.keys.delete(e.code));
    canvas.addEventListener('pointermove',e=>this.point(e,canvas));
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
  }consumeReload() {
    const value=this.reload;
    this.reload=false;
    return value;
  }consumeInteract(){const value=this.interact;this.interact=false;return value;}clear() {
    this.keys.clear();
    this.mouse.down=false;
    this.reload=false;this.interact=false;
  }
}
