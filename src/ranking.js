export class RankingClient{
 constructor(fetcher=(...args)=>fetch(...args)){this.fetcher=fetcher;this.revision=-1;this.status='';}
 async request(path,body,token){const response=await this.fetcher(`/api/${path}`,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(6000)});if(!response.headers.get('content-type')?.includes('application/json'))throw Error('랭킹 서버에 연결되지 않았습니다.');const data=await response.json();if(!response.ok)throw Error(data.error||'기록 저장 실패');return data;}
 sync(w){
  if(w.wave<1)return;
  if(this.revision!==w.runRevision){
   this.revision=w.runRevision;this.session=null;this.sent=0;this.accepted=0;this.status='연결 중';const rev=this.revision;
   this.queue=this.request('runs',{}).then(s=>{if(this.revision===rev){this.session=s;this.status='기록 중';}return s;}).catch(()=>{if(this.revision===rev)this.status='연습 · 서버 연결 없음';return null;});
  }
  for(;this.sent<w.completedStages.length;this.sent++){
   const stage={...w.completedStages[this.sent]},rev=this.revision;
   this.queue=this.queue.then(async s=>{if(s&&this.revision===rev){await this.request(`runs/${s.id}/stages`,stage,s.token);this.accepted=stage.stage;}return s;}).catch(e=>{if(this.revision===rev)this.status=e.message;throw e;});this.queue.catch(()=>{});
  }
 }
 async submit(w,name){if(w.state!=='won')throw Error('작전을 완료한 뒤 등록해 주세요.');try{await this.queue;}catch{this.sent=this.accepted;this.queue=Promise.resolve(this.session);}this.sync(w);const s=await this.queue;if(!s)throw Error('이 플레이는 서버 연결 없이 시작되어 등록할 수 없습니다.');if(w.state!=='won')throw Error('작전을 완료한 뒤 등록해 주세요.');return this.request(`runs/${s.id}/finish`,{name},s.token);}
 list(){return this.request('leaderboard');}
}
export const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const rankingRows=entries=>entries.length?entries.map((e,i)=>`<tr><td>${i+1}</td><td>${escapeHTML(e.name)}</td><td>${e.score.toLocaleString()}</td><td>${(e.elapsed/1000).toFixed(1)}초</td></tr>`).join(''):'<tr><td colspan="4">첫 완주 기록을 남겨보세요.</td></tr>';
