import {DatabaseSync} from 'node:sqlite';
import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {STAGES} from '../src/stages.js';
export const SEASON='sector-assault-v1';
const hash=s=>createHash('sha256').update(s).digest('hex');
export function createRankingStore(filename=':memory:',now=Date.now){
 const db=new DatabaseSync(filename);db.exec(`PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY, token TEXT NOT NULL, season TEXT NOT NULL, started INTEGER NOT NULL, stages TEXT NOT NULL DEFAULT '[]', finished INTEGER NOT NULL DEFAULT 0); CREATE TABLE IF NOT EXISTS leaderboard(id TEXT PRIMARY KEY, season TEXT NOT NULL, name TEXT NOT NULL, score INTEGER NOT NULL, elapsed INTEGER NOT NULL, kills INTEGER NOT NULL, headshots INTEGER NOT NULL, hits INTEGER NOT NULL, created INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS leaderboard_sort ON leaderboard(season,score DESC,elapsed ASC);`);
 const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
 const get=(id,token)=>{const row=db.prepare('SELECT * FROM runs WHERE id=? AND season=?').get(id,SEASON);if(!row||typeof token!=='string'||!timingSafeEqual(Buffer.from(row.token),Buffer.from(hash(token))))fail('유효하지 않은 기록 세션입니다.',401);if(now()-row.started>86400000)fail('기록 세션이 만료됐습니다.',410);return row;};
 return {
  close:()=>db.close(),
  start(){db.prepare('DELETE FROM runs WHERE started<?').run(now()-86400000);const id=randomBytes(16).toString('hex'),token=randomBytes(32).toString('base64url');db.prepare('INSERT INTO runs(id,token,season,started) VALUES(?,?,?,?)').run(id,hash(token),SEASON,now());return {id,token,season:SEASON};},
  stage(id,token,data){
   const row=get(id,token),stages=JSON.parse(row.stages);if(row.finished)fail('이미 등록한 기록입니다.',409);
   if(!data||!Number.isInteger(data.stage)||data.stage<1||data.stage>STAGES.length)fail('스테이지 정보가 잘못됐습니다.');
   const clean=Object.fromEntries(['stage','elapsedMs','kills','headshots','hits'].map(k=>[k,data[k]]));
   if(Object.values(clean).some(v=>!Number.isSafeInteger(v)||v<0)||clean.elapsedMs<4000||clean.elapsedMs>3600000||clean.kills!==STAGES[clean.stage-1].enemies.length||clean.headshots>clean.kills||clean.hits>1000)fail('기록 범위를 확인해 주세요.');
   if(clean.stage<=stages.length){if(JSON.stringify(stages[clean.stage-1])===JSON.stringify(clean))return {accepted:clean.stage};fail('이미 저장된 구역 기록과 다릅니다.',409);}
   if(clean.stage!==stages.length+1)fail('스테이지 순서가 잘못됐습니다.',409);
   if([...stages,clean].reduce((s,v)=>s+v.elapsedMs,0)>now()-row.started+2500)fail('플레이 시간 검증에 실패했습니다.');
   stages.push(clean);db.prepare('UPDATE runs SET stages=? WHERE id=?').run(JSON.stringify(stages),id);return {accepted:clean.stage};
  },
  finish(id,token,name){
   const row=get(id,token),stages=JSON.parse(row.stages);
   if(row.finished)return {...db.prepare('SELECT name,score,elapsed,kills,headshots,hits FROM leaderboard WHERE id=?').get(id)};
   if(stages.length!==STAGES.length)fail('모든 스테이지를 완료해야 등록할 수 있습니다.');
   if(typeof name!=='string'||!/^[\p{L}\p{N} _.-]{2,16}$/u.test(name.trim()))fail('닉네임은 한글·영문·숫자 등 2~16자로 입력해 주세요.');
   const total=stages.reduce((a,s)=>({elapsed:a.elapsed+s.elapsedMs,kills:a.kills+s.kills,headshots:a.headshots+s.headshots,hits:a.hits+s.hits}),{elapsed:0,kills:0,headshots:0,hits:0});
   const score=total.kills*200+total.headshots*120+Math.max(0,12000-Math.floor(total.elapsed/1000)*8)+Math.max(0,3000-total.hits*150);
   db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO leaderboard VALUES(?,?,?,?,?,?,?,?,?)').run(id,SEASON,name.trim(),score,total.elapsed,total.kills,total.headshots,total.hits,now());db.prepare('UPDATE runs SET finished=1 WHERE id=?').run(id);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
   return {name:name.trim(),score,...total};
  },
  list(){return {season:SEASON,entries:db.prepare('SELECT name,score,elapsed,kills,headshots,hits,created FROM leaderboard WHERE season=? ORDER BY score DESC,elapsed ASC,created ASC LIMIT 50').all(SEASON)};}
 };
}
export async function rankingAPI(req,res,store,pathname,rate){
 const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 try{
  const origin=req.headers.origin;if(origin&&origin!==`http://${req.headers.host}`&&origin!==`https://${req.headers.host}`)return json(403,{error:'허용되지 않은 요청입니다.'});
  if(req.method==='GET'&&pathname==='/api/leaderboard')return json(200,store.list());
  if(req.method==='POST'&&pathname==='/api/runs'){
   const key=req.socket.remoteAddress,time=Date.now(),old=rate.get(key)||[];const recent=old.filter(t=>time-t<60000);if(recent.length>=12)return json(429,{error:'잠시 후 다시 시작해 주세요.'});recent.push(time);rate.set(key,recent);if(rate.size>10000)rate.clear();return json(201,store.start());
  }
  const match=pathname.match(/^\/api\/runs\/([a-f0-9]{32})\/(stages|finish)$/);if(!match||req.method!=='POST')return json(404,{error:'없는 경로입니다.'});
  if(!req.headers['content-type']?.startsWith('application/json'))return json(415,{error:'JSON 요청이 필요합니다.'});
  let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>4096)return json(413,{error:'요청이 너무 큽니다.'});}
  let data;try{data=JSON.parse(body);}catch{return json(400,{error:'요청 형식이 잘못됐습니다.'});}
  const token=req.headers.authorization?.replace(/^Bearer /,'');
  return json(200,match[2]==='stages'?store.stage(match[1],token,data):store.finish(match[1],token,data?.name));
 }catch(e){json(e.status||500,{error:e.status?e.message:'서버에서 기록을 처리하지 못했습니다.'});}
}
