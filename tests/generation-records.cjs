// node tests/generation-records.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const records=JSON.parse(fs.readFileSync('data/generation.json','utf8'));
/* 프롬프트 경로 검증과 설정 요약은 도감 안에 있던 함수였지만 지금은 lib/toolkit.js 하나가
   가지고 있다. 도감·툴킷·드래프트가 같은 것을 쓰므로 여기서도 그 파일을 그대로 돌린다 */
const ctx={window:{},localStorage:{getItem:()=>null},
 fetch:async url=>({ok:fs.existsSync(url),json:async()=>JSON.parse(fs.readFileSync(url,'utf8'))})};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('lib/toolkit.js','utf8'),ctx);
const ATK=ctx.window.AtelierToolkit;
/* 도감이 이 값들을 실제로 화면에 쓰는지 — 검사가 통과하는데 화면은 딴 것을 보는 일을 막는다 */
const dex=fs.readFileSync('dex.html','utf8');
for(const call of ['ATK.promptPathOf(shown)','ATK.summaryOf(name)','ATK.notesOf(name)'])
 assert(dex.includes(call),'도감이 '+call+' 을 쓰지 않는다');
assert(dex.includes('원문 기록 없음'),'도감에 기록 없음 안내가 없다');
/* 추가 지시 원문은 그대로 심지 않고 Preact 가 글자로 넣어야 한다 */
const tkBody=dex.slice(dex.indexOf('function Toolkit('),dex.indexOf('\n}',dex.indexOf('function Toolkit(')));
assert(tkBody.includes('<pre>${x.text}</pre>'),'추가 지시를 글자 노드로 넣지 않는다');
assert(!tkBody.includes('dangerouslySetInnerHTML'),'툴킷 기록 칸이 HTML 을 그대로 심는다');
(async()=>{
 await ATK.load();await ATK.loadGeneration();
 let known=0,missing=0;
 for(const [file,r] of Object.entries(records)){
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync('img/'+file)).digest('hex'),r.sha256,file);
  const assets=JSON.parse(fs.readFileSync(r.manifest,'utf8')).assets;
  assert(assets.some(a=>a.file===file&&a.card===r.card&&a.sha256===r.sha256),file+' 은 제조서와 어긋난다');
  if(r.prompt){assert(fs.readFileSync(r.prompt,'utf8').trim(),r.prompt+' 이 비었다');assert.equal(ATK.promptPathOf(file),r.prompt,file);known++;}
  else{assert.equal(ATK.promptPathOf(file),null,file);missing++;}
 }
 assert(ATK.summaryOf('건담 발바토스 루프스').includes('추가 지시 있음'));
 assert(ATK.notesOf('건담 발바토스 루프스').some(x=>x.text.includes('31-year-old')));
 ATK.putCardRecords('fixture',{settings:{record:{female:{sel:{},cus:{'hair color':'mint'},sp:'<script>alert("x")</script>'}}}});
 assert(ATK.summaryOf('fixture').includes('머리색 mint'));
 assert.equal(ATK.notesOf('fixture')[0].text,'<script>alert("x")</script>','추가 지시 원문은 손대지 않고 넘긴다');
 ATK.putCardRecords('bad',{images:{bad:{prompt:'javascript:alert(1)'}}});
 assert.equal(ATK.promptPathOf('bad'),null);
 assert.equal(ATK.promptPathOf('unrecorded.webp'),null);
 console.log(`PASS: ${known} exact prompt links, ${missing} explicitly missing originals, image hashes, custom settings and raw-instruction handling`);
})().catch(e=>{console.error(e);process.exitCode=1});
