import {RankingClient,rankingRows} from './ranking.js';
const client=new RankingClient(),status=document.querySelector('#ranking-status'),list=document.querySelector('#ranking-list'),button=document.querySelector('#refresh-ranks');
async function refresh(){button.disabled=true;status.textContent='기록을 불러오는 중…';try{const data=await client.list();list.innerHTML=rankingRows(data.entries);status.textContent=data.entries.length?`상위 ${data.entries.length}명`:'아직 등록된 완주 기록이 없습니다.';}catch{status.textContent='랭킹 서버에 연결할 수 없습니다. 로컬 서버에서 실행하거나 잠시 후 다시 시도해 주세요.';}finally{button.disabled=false;}}
button.onclick=refresh;refresh();
