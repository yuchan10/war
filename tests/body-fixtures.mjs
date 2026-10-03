import { initBody,applyInjury,PARTS } from '../src/injury.js';
export function exposedHit(e,part,damage=PARTS[part].threshold){initBody(e);e.body[part].armor=0;return applyInjury(e,damage,{region:part});}
