// Run without a browser: node tests/style-logic.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');

/* 페이지 안의 <script> 를 문법만 확인한다. type="module" 은 vm.Script 로 못 올린다 —
   import 가 있으면 "Cannot use import statement outside a module" 로 터진다.
   그렇다고 건너뛰면 모듈로 짠 화면은 아무도 안 보게 되므로, 임시 .mjs 로 적어
   node --check 에 맡긴다. dex.html · prompt.html 이 Preact 로 바뀌면서 필요해졌다. */
function checkPageScripts(path, assert) {
  const src = require('node:fs').readFileSync(path, 'utf8');
  const os = require('node:os'), pathmod = require('node:path'), fs2 = require('node:fs');
  let n = 0;
  for (const m of src.matchAll(/<script((?:\s[^>]*)?)>([\s\S]*?)<\/script>/g)) {
    const attrs = m[1], body = m[2];
    if (!body.trim()) continue;
    n++;
    if (/\btype\s*=\s*["']module["']/i.test(attrs)) {
      const tmp = pathmod.join(os.tmpdir(), 'atelier-check-' + process.pid + '-' + n + '.mjs');
      fs2.writeFileSync(tmp, body);
      const r = require('node:child_process').spawnSync(process.execPath, ['--check', tmp], { encoding: 'utf8' });
      fs2.unlinkSync(tmp);
      assert.equal(r.status, 0, path + ' 의 module script 문법 오류\n' + (r.stderr || ''));
    } else {
      new (require('node:vm').Script)(body, { filename: path });
    }
  }
  return n;
}

/* 전체 기록 내보내기는 예전 판에만 남아 있다 — 새 툴킷에서는 뺐다 */
const dex=fs.readFileSync('dex.html','utf8'),prompt=fs.readFileSync('prompt-legacy.html','utf8');
function fn(source,name){const a=source.indexOf('function '+name+'('),b=source.indexOf('\n}',a);return source.slice(a,b+2);}
for(const path of ['dex.html','prompt.html','prompt-legacy.html','play.html'])checkPageScripts(path,assert);
for(const path of ['gundam/game.js','gundam/gallery.js'])new vm.Script(fs.readFileSync(path,'utf8'),{filename:path});
/* 화풍 몫 가르기 — dex.html 이 Preact 로 바뀌면서 이름과 인자가 달라졌다.
   tkStyleKey · tkStyleKeys 는 없어지고 stylesOf(entry) 가 되었고, hasPic 은
   lib/img.js 로 갔다. 이름을 따라가되 보는 것은 그대로다 — 기본 몫은 '화풍 미상',
   없는 화풍은 null, 화풍 몫은 제 그림. */
const ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync('lib/img.js','utf8'),ctx);
vm.runInContext("const AIMG=window.AtelierImg; const NOPIC='__none__';",ctx);
for(const name of ['bucketOf','stylesOf'])vm.runInContext(fn(dex,name),ctx);
vm.runInContext("const E={f:'old.webp',byStyle:{painterly:{f:'new.webp'}}};",ctx);
assert.equal(vm.runInContext("JSON.stringify(stylesOf(E))",ctx),'["painterly","unknown"]');
assert.equal(vm.runInContext("bucketOf(E,'unknown').f",ctx),'old.webp');
assert.equal(vm.runInContext("bucketOf(E,'photoreal')",ctx),null);
assert.equal(vm.runInContext("bucketOf(E,'painterly').f",ctx),'new.webp');
assert.equal(vm.runInContext("bucketOf({byStyle:{}},null)",ctx),null);
const start=prompt.indexOf("document.getElementById('exportStore').addEventListener"),end=prompt.indexOf("  document.getElementById('specialInput')",start);
let handler;const box={value:'',classList:{add(){},remove(){}},select(){}};
const sandbox={document:{getElementById(){return {addEventListener(_,fn){handler=fn}}},execCommand(){}},fetch:async()=>({ok:true,json:async()=>({mechs:{},style:{Card:'game_keyart'}})}),DATA_URL:'toolkit-data.json',BASE:{style:{Card:'photoreal'}},STORE:{style:{Card:'painterly'},stylePreferences:{Card:'ink_wash'}},allKeys:()=>[],setStatus(){},downloadJson:()=>true};
vm.runInNewContext(prompt.slice(start,end),sandbox);
sandbox.document.getElementById=()=>box;
(async()=>{await handler();assert.deepEqual(JSON.parse(box.value).style,{Card:'game_keyart'});sandbox.fetch=async()=>{throw Error('offline')};await handler();assert.equal(box.value,'');console.log('PASS: JS syntax, unknown/style bucket isolation, stale local/base export protection, offline guard');})().catch(e=>{console.error(e);process.exitCode=1});
