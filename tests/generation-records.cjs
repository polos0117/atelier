// node tests/generation-records.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const source=fs.readFileSync('dex.html','utf8');
function fn(name){const a=source.indexOf('function '+name+'('),b=source.indexOf('\n}',a);assert(a>=0&&b>a);return source.slice(a,b+2);}
const records=JSON.parse(fs.readFileSync('data/generation.json','utf8'));
const toolkit=JSON.parse(fs.readFileSync('toolkit-data.json','utf8'));
const ctx=vm.createContext({GENERATION:records,TK:{base:toolkit.mechs,local:{}},TK_LABEL:{'hair color':'머리색'},esc:s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))});
for(const name of ['tkOf','tkSummary','tkDetails','generationDetails'])vm.runInContext(fn(name),ctx);
let known=0,missing=0;
for(const [file,r] of Object.entries(records)){
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync('img/'+file)).digest('hex'),r.sha256,file);
 const assets=JSON.parse(fs.readFileSync(r.manifest,'utf8')).assets;
 assert(assets.some(a=>a.file===file&&a.card===r.card&&a.sha256===r.sha256));
 const html=ctx.generationDetails(file);
 if(r.prompt){assert(fs.readFileSync(r.prompt,'utf8').trim());assert(html.includes('href="'+r.prompt+'"'));known++;}
 else{assert(html.includes('원문 기록 없음'));missing++;}
}
assert(ctx.tkSummary('건담 발바토스 루프스').includes('추가 지시 있음'));
assert(ctx.tkDetails('건담 발바토스 루프스').includes('31-year-old'));
ctx.TK.local.fixture={female:{sel:{},cus:{'hair color':'mint'},sp:'<script>alert("x")</script>'}};
assert(ctx.tkSummary('fixture').includes('머리색 mint'));
assert(!ctx.tkDetails('fixture').includes('<script>'));
assert(ctx.tkDetails('fixture').includes('&lt;script&gt;'));
ctx.GENERATION.bad={prompt:'javascript:alert(1)'};
assert(!ctx.generationDetails('bad').includes('href='));
assert(ctx.generationDetails('unrecorded.webp').includes('원문 기록 없음'));
console.log(`PASS: ${known} exact prompt links, ${missing} explicitly missing originals, image hashes, custom settings and escaped instructions`);
