const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const index=JSON.parse(fs.readFileSync('generation/index.json'));
let count=0;
for(const [name,id] of Object.entries(index.cards)){
 assert.match(id,/^m-[a-f0-9]{16}$/);
 const settings=JSON.parse(fs.readFileSync(`generation/${id}/settings.json`));assert.equal(settings.card,name);
 for(const [file,r] of Object.entries(JSON.parse(fs.readFileSync(`generation/${id}/images.json`)))){
  assert.equal(r.card,name);assert.equal(crypto.createHash('sha256').update(fs.readFileSync('img/'+file)).digest('hex'),r.sha256);
  assert(fs.existsSync(r.manifest));if(r.prompt)assert(fs.readFileSync(r.prompt,'utf8').trim());count++;
 }
}
for(const page of ['prompt.html','dex.html'])for(const m of fs.readFileSync(page,'utf8').matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1],{filename:page});
function extract(source,name){const a=source.indexOf('function '+name+'(');return source.slice(a,source.indexOf('\n}',a)+2);}
const dex=fs.readFileSync('dex.html','utf8');
const ctx={GENERATION:{},CARD_GENERATION:{},esc:x=>x};vm.createContext(ctx);vm.runInContext(extract(dex,'generationDetails'),ctx);
const gunner=index.cards['건너 자쿠 워리어'];Object.assign(ctx.CARD_GENERATION,JSON.parse(fs.readFileSync(`generation/${gunner}/images.json`)));
for(const [file,r] of Object.entries(ctx.CARD_GENERATION))assert(ctx.generationDetails(file).includes(r.prompt));
ctx.CARD_GENERATION.bad={prompt:'javascript:alert(1)'};assert(!ctx.generationDetails('bad').includes('href='));
ctx.CARD_GENERATION.bad={prompt:'generation/../../private.txt'};assert(!ctx.generationDetails('bad').includes('href='));
// The default export reads only the selected card and requires no network call.
const source=fs.readFileSync('prompt.html','utf8');const a=source.indexOf("document.getElementById('exportStore').addEventListener");const b=source.indexOf("document.getElementById('exportAllStore').addEventListener",a);
const box={classList:{remove(){}},select(){}};let callback;
const exportCtx={document:{getElementById:id=>id==='exportStore'?{addEventListener:(_,fn)=>callback=fn}:id==='artStyle'?{value:'game_keyart'}:box,execCommand(){}},mechKey:()=> '선택 기체',persistAnthro(){},stripPrev:r=>r,recOf:()=>({female:{sel:{'apparent age':'20s'}},t:1}),usedOf:()=>[],setStatus(){},downloadJson:()=>true};
vm.runInNewContext(source.slice(a,b),exportCtx);
(async()=>{
 await callback();const out=JSON.parse(box.value);assert.equal(out.card,'선택 기체');assert(!out.mechs);assert.equal(out.record.female.sel['apparent age'],'20s');
 let calls=0,fail=false;
 const loaderCtx={fetch:async p=>{calls++;if(fail)throw Error('offline');return {ok:true,json:async()=>JSON.parse(fs.readFileSync(p))};}};
 vm.createContext(loaderCtx);vm.runInContext(fs.readFileSync('generation/loader.js','utf8'),loaderCtx);
 const [x,y]=await Promise.all([loaderCtx.PerMechRecords.load('건너 자쿠 워리어'),loaderCtx.PerMechRecords.load('건너 자쿠 워리어')]);assert.strictEqual(x,y);assert.equal(calls,3);assert.equal(Object.keys(x.images).length,4);
 const missing=await loaderCtx.PerMechRecords.load('없는 기체');assert.equal(missing.settings,null);
 fail=true;await assert.rejects(loaderCtx.PerMechRecords.load(Object.keys(index.cards)[0]));fail=false;assert((await loaderCtx.PerMechRecords.load(Object.keys(index.cards)[0])).settings);
 console.log(`PASS: ${Object.keys(index.cards).length} card folders, ${count} image hashes/links; export isolation, loader cache/retry, safe links and page syntax`);
})().catch(e=>{console.error(e);process.exitCode=1;});
