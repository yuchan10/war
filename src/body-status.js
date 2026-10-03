import { PARTS, WOUNDS } from './injury.js';

// Front-facing, hollow silhouette. Each path is a separate armor/body slot.
const SHAPES={
 head:'M48 23 Q48 9 60 9 Q72 9 72 23 L71 32 Q68 41 60 41 Q52 41 49 32 Z',
 torso:'M53 44 L67 44 L70 49 L78 52 L75 91 L72 115 L48 115 L45 91 L42 52 L50 49 Z',
 leftArm:'M38 53 L42 58 L39 85 L32 112 L29 131 Q24 137 19 132 L20 116 L26 82 L29 59 Z',
 rightArm:'M82 53 L78 58 L81 85 L88 112 L91 131 Q96 137 101 132 L100 116 L94 82 L91 59 Z',
 leftLeg:'M48 120 L58 120 L57 157 L54 194 L54 204 L36 204 L37 197 L42 193 L42 158 L44 130 Z',
 rightLeg:'M62 120 L72 120 L76 130 L78 158 L78 193 L83 197 L84 204 L66 204 L66 194 L63 157 Z'
};
const STUMPS={head:'M52 42 L57 46 L61 42 L66 46',leftArm:'M29 55 L33 60 L36 54 L40 58',rightArm:'M80 58 L84 54 L87 60 L91 55',leftLeg:'M46 121 L50 126 L54 121 L58 125',rightLeg:'M62 125 L66 121 L70 126 L74 121'};
export function armorColor(slot){
 if(slot.armor<=0)return '#78818a';
 const ratio=slot.armor/slot.maxArmor;
 return ratio>.66?'#acd3b2':ratio>.33?'#e0c477':'#e48957';
}
export function bodyStatusMarkup(player,time){
 const parts=Object.entries(PARTS).map(([key,part])=>{
  const slot=player.body[key],remaining=Math.max(0,(slot.hitUntil??0)-time),flash=Math.min(1,remaining/.35);
  const description=part.label+': '+(slot.severed?'절단':`방어구 ${Math.ceil(slot.armor)}/${slot.maxArmor}, 누적 손상 ${Math.round(slot.damage)}`)+(slot.bleedRemaining>0?', 출혈 중':'');
  if(slot.severed)return `<g data-part="${key}" data-severed="true"><title>${description}</title><path class="severed-stump" d="${STUMPS[key]||'M48 92 L55 96 L62 91 L72 95'}" stroke="#ed7668" stroke-width="3"/></g>`;
  const color=armorColor(slot);
  return `<g data-part="${key}"><title>${description}</title><path class="body-outline" d="${SHAPES[key]}" stroke="${color}" stroke-width="2" ${slot.armor<=0?'stroke-dasharray="3 3"':''}/>${flash>0?`<path class="part-hit" d="${SHAPES[key]}" fill="#ff3939" fill-opacity="${(flash*.7).toFixed(3)}" stroke="#ff6565" stroke-opacity="${flash.toFixed(3)}" stroke-width="3"/>`:''}</g>`;
 }).join('');
 const loss=Math.min(1,Math.max(0,player.bloodLoss/WOUNDS.bloodLimit)),level=241-loss*24;
 const bleeding=Object.values(player.body).some(s=>s.bleedRemaining>0);
 const opacity=bleeding?.6+.4*Math.pow(Math.sin(time*5),2):1;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 250" role="img" aria-label="캐릭터 부위별 방어구와 출혈 상태" fill="none" stroke-linecap="round" stroke-linejoin="round">
 <defs><clipPath id="blood-loss-clip"><path d="M60 216 C58 221 51 228 51 233 A9 9 0 0 0 69 233 C69 228 62 221 60 216Z"/></clipPath></defs>
 ${parts}<g opacity="${opacity.toFixed(3)}"><title>누적 출혈 ${Math.floor(player.bloodLoss)} / ${WOUNDS.bloodLimit}${bleeding?', 출혈 중':''}</title><rect x="50" y="${level.toFixed(2)}" width="20" height="24" fill="#e46c62" clip-path="url(#blood-loss-clip)"/><path d="M60 216 C58 221 51 228 51 233 A9 9 0 0 0 69 233 C69 228 62 221 60 216Z" stroke="${bleeding?'#ef8a7d':'#78818a'}" stroke-width="1.5"/></g></svg>`;
}
