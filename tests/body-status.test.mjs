import test from 'node:test';
import assert from 'node:assert/strict';
import { bodyStatusMarkup, armorColor } from '../src/body-status.js';
import { initBody, applyInjury } from '../src/injury.js';
const player=()=>{const p={};initBody(p);return p;};
test('healthy status is a hollow standing figure without visible text and armor loss changes the outline',()=>{
 const p=player(),html=bodyStatusMarkup(p,0);
 assert.equal((html.match(/class="body-outline"/g)||[]).length,6);assert.ok(!html.includes('<text'));assert.ok(!html.includes('part-hit'));
 const slot=p.body.torso,colors=[];
 for(const armor of [90,45,10,0]){slot.armor=armor;colors.push(armorColor(slot));}
 assert.equal(new Set(colors).size,4);assert.match(bodyStatusMarkup(p,0),/stroke-dasharray="3 3"/);
});
test('simultaneous hits highlight only their own parts and fade on simulation time',()=>{
 const p=player();applyInjury(p,10,{region:'leftArm'},3);applyInjury(p,10,{region:'torso'},3.1);
 let html=bodyStatusMarkup(p,3.2);assert.equal((html.match(/class="part-hit"/g)||[]).length,2);
 html=bodyStatusMarkup(p,3.4);assert.equal((html.match(/class="part-hit"/g)||[]).length,1);
 assert.ok(!bodyStatusMarkup(p,3.5).includes('class="part-hit"'));
});
test('severing removes the corresponding limb outline and leaves a visible stump',()=>{
 const p=player();p.body.leftArm.armor=0;applyInjury(p,60,{region:'leftArm'},1);
 const html=bodyStatusMarkup(p,2),part=html.match(/<g data-part="leftArm"[\s\S]*?<\/g>/)[0];
 assert.match(part,/data-severed="true"/);assert.match(part,/severed-stump/);assert.ok(!part.includes('body-outline'));
 assert.equal((html.match(/class="body-outline"/g)||[]).length,5);
});
