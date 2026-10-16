import test from 'node:test';
import assert from 'node:assert/strict';
import {RankingClient} from '../src/ranking.js';
const response=data=>({ok:true,headers:{get:()=> 'application/json'},json:async()=>data});
test('client retries unacknowledged stage after transient failure before registering',async()=>{
 const posted=[];let fail=true;const client=new RankingClient(async(url,opts)=>{
  if(url==='/api/runs')return response({id:'run',token:'secret'});
  if(url.endsWith('/stages')){const data=JSON.parse(opts.body);if(fail){fail=false;throw Error('temporary network failure');}posted.push(data.stage);return response({accepted:data.stage});}
  return response({score:100});
 });
 const w={wave:1,runRevision:1,completedStages:[],state:'playing'};client.sync(w);await client.queue;
 w.completedStages=[{stage:1},{stage:2}];client.sync(w);await assert.rejects(client.queue);
 w.state='won';assert.equal((await client.submit(w,'테스트')).score,100);assert.deepEqual(posted,[1,2]);
});
test('an old delayed run response cannot replace the session after restart',async()=>{
 let resolveOld;const client=new RankingClient(()=>new Promise(r=>{resolveOld=r;}));const w={wave:1,runRevision:1,completedStages:[]};client.sync(w);const first=resolveOld;
 w.runRevision=2;client.sync(w);resolveOld(response({id:'new',token:'new'}));await client.queue;first(response({id:'old',token:'old'}));await Promise.resolve();await Promise.resolve();assert.equal(client.session.id,'new');
});
