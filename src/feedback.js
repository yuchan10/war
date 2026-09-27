// Praise is tied to actual outcomes, never generated at random.
export class Feedback {
  constructor(){this.reset();}
  reset(){this.text='';this.timer=0;this.combo=0;this.lastKill=-Infinity;this.damageTaken=0;}
  update(dt){this.timer=Math.max(0,this.timer-dt);}
  show(text){this.text=text;this.timer=1.1;}
  killed(time){this.combo=time-this.lastKill<=2.5?this.combo+1:1;this.lastKill=time;if(this.combo>=2)this.show(`${this.combo} 연속 제압`);}
  damaged(){this.damageTaken++;this.combo=0;this.lastKill=-Infinity;}
}
