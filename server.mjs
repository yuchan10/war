import http from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRankingStore,rankingAPI} from './backend/ranking.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
export function createGameServer(store){
 const rate=new Map(),types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.wav':'audio/wav','.png':'image/png'};
 return http.createServer(async(req,res)=>{
  try{
   const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
   if(pathname.startsWith('/api/'))return await rankingAPI(req,res,store,pathname,rate);
   // Serve only game assets; database, Git files and server source are never public.
   if(!['GET','HEAD'].includes(req.method)||!(/^\/(?:src|assets|tests)\/[\w./-]+$/.test(pathname)||['/','/index.html','/style.css','/ranking.html'].includes(pathname))) {res.writeHead(404);res.end('Not found');return;}
   const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname)),rel=path.relative(root,target);
   if(rel.startsWith('..')||path.isAbsolute(rel)||rel.split(/[\\/]/).some(p=>p.startsWith('.'))){res.writeHead(403);res.end();return;}
   const body=await readFile(target);res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(req.method==='HEAD'?undefined:body);
  }catch{res.writeHead(404);res.end('Not found');}
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||4187);await mkdir(path.join(root,'data'),{recursive:true});
 const store=createRankingStore(process.env.RANKING_DB||path.join(root,'data','ranking.sqlite'));
 createGameServer(store).listen(port,'127.0.0.1',()=>console.log(`전초선 · 게임 + 랭킹 http://127.0.0.1:${port}`));
}
