const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert'),vm=require('vm');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'sam');
const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
const legacy=fs.readFileSync(path.join(root,'sam.html'),'utf8');
const assets=JSON.parse(fs.readFileSync(path.join(dir,'images/manifest.json'),'utf8'));
assert.equal(assets.length,301);assert(!html.includes('data:image/'));
for(const a of assets){
 const f=path.resolve(root,a.path);assert(f.startsWith(dir+path.sep));const bytes=fs.readFileSync(f);
 assert.equal(bytes.length,a.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256,a.path);
}
for(const key of ['IMG','IMGL']){
 const map=JSON.parse(html.match(new RegExp('var '+key+'=(\\{[^\\n]+\\});'))[1]);
 for(const file of Object.values(map))assert(fs.existsSync(path.join(dir,file)),file);
}
for(const [file,base] of [['sam.webmanifest','https://example.test/atelier/sam.webmanifest'],['sam/sam.webmanifest','https://example.test/atelier/sam/sam.webmanifest']]){
 const m=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));
 assert.equal(new URL(m.id,base).href,'https://example.test/atelier/sam.html');
 const start=new URL(m.start_url,base);assert.equal(start.pathname,'/atelier/sam/index.html');
 assert(start.href.startsWith(new URL(m.scope,base).href));
 for(const icon of m.icons)assert(fs.existsSync(path.join(root,new URL(icon.src,base).pathname.slice('/atelier/'.length))));
}
assert(html.includes('var SAVE_URL="../data-sam/save.json"'));assert(fs.existsSync(path.join(root,'data-sam/save.json')));
const scripts=s=>Array.from(s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g),m=>m[1]);
for(const script of scripts(html).concat(scripts(legacy)))new vm.Script(script);
const keys=['samgukji_draft_rec_v1','samgukji_draft_cfg_v1','samgukji_draft_game_v2','samgukji_mark_v1'];
const data=Object.fromEntries(keys.map((k,i)=>[k,JSON.stringify({test:i})]));
function redirect(href){let out;const u=new URL(href);vm.runInNewContext(scripts(legacy)[0],{URL,location:{href:u.href,protocol:u.protocol,search:u.search,hash:u.hash,replace:v=>out=v},localStorage:{getItem:k=>data[k]}});return new URL(out)}
let u=redirect('https://example.test/atelier/sam.html?mode=9#round');
assert.equal(u.href,'https://example.test/atelier/sam/index.html?mode=9#round');assert(!u.hash.includes('transfer'));
u=redirect('file:///games/atelier/sam.html?local=1');assert.equal(u.pathname,'/games/atelier/sam/index.html');assert(u.hash.startsWith('#sam-transfer='));
const restored={};let cleaned;
function importSave(){vm.runInNewContext(scripts(html)[0],{location:{protocol:u.protocol,hash:u.hash,pathname:u.pathname,search:u.search},history:{replaceState:(_,__,v)=>cleaned=v},localStorage:{getItem:k=>restored[k],setItem:(k,v)=>restored[k]=v}})}
importSave();assert.deepEqual(restored,data);assert.equal(cleaned,'/games/atelier/sam/index.html?local=1');
restored[keys[0]]=JSON.stringify({newer:true});importSave();assert.equal(restored[keys[0]],JSON.stringify({newer:true}));
assert(html.includes('@media(min-width:600px) and (max-width:999px)'));
assert(html.includes('body[data-pack="9"] .pack{grid-template-columns:repeat(3,minmax(0,1fr))'));
console.log('PASS: 301 image hashes, image/manifest/backup paths, scripts, web redirect, local save transfer, 9-card CSS rule');
