import test from 'node:test';
import assert from 'node:assert/strict';
import { enterFullscreen } from '../src/fullscreen.js';
test('fullscreen requests the entire game container and is idempotent',async()=>{
 let count=0;const root={requestFullscreen(options){count++;assert.equal(options.navigationUI,'hide');return Promise.resolve();}};
 const doc={querySelector(selector){assert.equal(selector,'main');return root;}};
 await enterFullscreen(doc);assert.equal(count,1);doc.fullscreenElement=root;await enterFullscreen(doc);assert.equal(count,1);
});
test('unsupported or denied fullscreen never interrupts gameplay',async()=>{
 await enterFullscreen({querySelector:()=>({})});
 await enterFullscreen({querySelector:()=>({requestFullscreen:()=>Promise.reject(Error('iframe restriction'))})});
 assert.doesNotThrow(()=>enterFullscreen({querySelector:()=>({requestFullscreen(){throw Error('unsupported');}})}));
});
