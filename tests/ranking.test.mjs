import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createRankingStore} from '../backend/ranking.mjs';
import {createGameServer} from '../server.mjs';
import {STAGES} from '../src/stages.js';
import {RankingClient,rankingRows} from '../src/ranking.js';
const stage=i=>({stage:i+1,elapsedMs:10000,kills:STAGES[i].enemies.length,headshots:1,hits:0});
test('server calculates score, saves all six stages, handles retry and survives reopening',async t=>{
 const dir=await mkdtemp(path.join(tmpdir(),'war-rank-'));t.after(()=>rm(dir,{recursive:true,force:true}));let now=1000;const file=path.join(dir,'ranking.sqlite');let store=createRankingStore(file,()=>now);
 const s=store.start();assert.throws(()=>store.finish(s.id,s.token,'완주자'),/모든/);assert.throws(()=>store.stage(s.id,'bad',stage(0)),/세션/);
 for(let i=0;i<6;i++){now+=10000;store.stage(s.id,s.token,stage(i));store.stage(s.id,s.token,stage(i));}
 const record=store.finish(s.id,s.token,'완주자');assert.equal(record.elapsed,60000);assert.equal(record.kills,STAGES.reduce((n,s)=>n+s.enemies.length,0));assert.equal(record.score,record.kills*200+6*120+12000-60*8+3000);
 assert.deepEqual(store.finish(s.id,s.token,'중복'),record);store.close();store=createRankingStore(file,()=>now);assert.equal(store.list().entries.length,1);assert.equal(store.list().entries[0].name,'완주자');store.close();
});
test('record service rejects out-of-order, impossible time and forged counts',()=>{
 let now=0;const store=createRankingStore(':memory:',()=>now),s=store.start();
 assert.throws(()=>store.stage(s.id,s.token,stage(1)),/순서/);assert.throws(()=>store.stage(s.id,s.token,stage(0)),/시간/);now=20000;
 for(const bad of [{...stage(0),kills:999},{...stage(0),headshots:99},{...stage(0),elapsedMs:-1},{...stage(0),hits:1.5}])assert.throws(()=>store.stage(s.id,s.token,bad));
 store.stage(s.id,s.token,stage(0));assert.throws(()=>store.stage(s.id,s.token,{...stage(0),hits:1}),/다릅니다/);store.close();
});
test('HTTP API serves shared records, blocks cross-origin writes and keeps database private',async t=>{
 const store=createRankingStore(),server=createGameServer(store);await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{await new Promise(r=>server.close(r));store.close();});const base=`http://127.0.0.1:${server.address().port}`;
 assert.equal((await fetch(base+'/api/leaderboard')).status,200);
 assert.equal((await fetch(base+'/api/runs',{method:'POST',headers:{Origin:'https://attacker.example'}})).status,403);
 assert.equal((await fetch(base+'/data/ranking.sqlite')).status,404);assert.equal((await fetch(base+'/.git/config')).status,404);
 const session=await (await fetch(base+'/api/runs',{method:'POST'})).json();assert.ok(session.token);
 const response=await fetch(base+`/api/runs/${session.id}/finish`,{method:'POST',headers:{Authorization:`Bearer ${session.token}`,'Content-Type':'application/json'},body:JSON.stringify({name:'tester'})});assert.equal(response.status,400);
});
test('ranking renders names as text and client does not submit an unranked or unfinished run',async()=>{
 assert.ok(!rankingRows([{name:'<img>',score:1,elapsed:1000}]).includes('<img>'));
 const client=new RankingClient(async()=>{throw Error('offline');});const w={wave:1,runRevision:1,completedStages:[],state:'won'};client.sync(w);await assert.rejects(()=>client.submit(w,'test'),/연결 없이/);
});
