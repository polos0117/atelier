// Run without a browser: node tests/style-logic.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const dex=fs.readFileSync('dex.html','utf8'),prompt=fs.readFileSync('prompt.html','utf8');
function fn(source,name){const a=source.indexOf('function '+name+'('),b=source.indexOf('\n}',a);return source.slice(a,b+2);}
for(const path of ['dex.html','prompt.html','play.html']){
 const html=fs.readFileSync(path,'utf8');for(const m of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(m[1],{filename:path});
}
for(const path of ['gundam/game.js','gundam/gallery.js'])new vm.Script(fs.readFileSync(path,'utf8'),{filename:path});
const ctx=vm.createContext({IMG:{Card:{f:'old.webp',byStyle:{painterly:{f:'new.webp'}}}},TK:{localStyle:{Card:'photoreal'},baseStyle:{Card:'game_cgi'}}});
for(const name of ['hasPic','bucketOf','tkStyleKey','tkStyleKeys'])vm.runInContext(fn(dex,name),ctx);
assert.equal(vm.runInContext("JSON.stringify(tkStyleKeys('Card'))",ctx),'["unknown","painterly"]');
assert.equal(vm.runInContext("bucketOf('Card','unknown').f",ctx),'old.webp');
assert.equal(vm.runInContext("bucketOf('Card','photoreal')",ctx),null);
assert.equal(vm.runInContext("bucketOf('Card','painterly').f",ctx),'new.webp');
const start=prompt.indexOf("document.getElementById('exportStore').addEventListener"),end=prompt.indexOf("  document.getElementById('specialInput')",start);
let handler;const box={value:'',classList:{add(){},remove(){}},select(){}};
const sandbox={document:{getElementById(){return {addEventListener(_,fn){handler=fn}}},execCommand(){}},fetch:async()=>({ok:true,json:async()=>({mechs:{},style:{Card:'game_keyart'}})}),DATA_URL:'toolkit-data.json',BASE:{style:{Card:'photoreal'}},STORE:{style:{Card:'painterly'},stylePreferences:{Card:'ink_wash'}},allKeys:()=>[],setStatus(){},downloadJson:()=>true};
vm.runInNewContext(prompt.slice(start,end),sandbox);
sandbox.document.getElementById=()=>box;
(async()=>{await handler();assert.deepEqual(JSON.parse(box.value).style,{Card:'game_keyart'});sandbox.fetch=async()=>{throw Error('offline')};await handler();assert.equal(box.value,'');console.log('PASS: JS syntax, unknown/style bucket isolation, stale local/base export protection, offline guard');})().catch(e=>{console.error(e);process.exitCode=1});
