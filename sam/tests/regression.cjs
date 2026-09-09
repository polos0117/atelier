const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');
const code=Array.from(html.matchAll(/<script>\s*([\s\S]*?)<\/script>/g)).find(m=>m[1].includes('var C=['))[1].replace(/^\s*\(function\(\)\{/, '').split('buildTiers(C);buildHelp();buildDex();')[0];
function runtime(storage={},seed=42){
 const nodes={};
 function node(){let n={children:[],childNodes:[{textContent:''}],dataset:{},style:{setProperty(){}},classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},setAttribute(){},removeAttribute(){},appendChild(x){this.children.push(x);return x},insertBefore(){},removeChild(){},remove(){},focus(){},querySelector(){return node()},querySelectorAll(){return []},textContent:'',innerHTML:'',scrollTop:0};return n}
 const document={getElementById(id){return nodes[id]||(nodes[id]=node())},createElement:node,querySelectorAll(){return []},addEventListener(){},body:node()};
 const math=Object.create(Math);math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
 const ctx={console,Math:math,Date,Number,Object,Array,JSON,Promise,document,window:{},navigator:{},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v,removeItem:k=>delete storage[k]},setTimeout:()=>0,clearTimeout(){},fetch:()=>Promise.reject(Error('offline')),location:{protocol:'file:',pathname:'/sam.html'},MutationObserver:class{observe(){}}};
 vm.createContext(ctx);vm.runInContext(code,ctx);ctx.queue=[];ctx.later=(fn)=>ctx.queue.push(fn);ctx.stopTimers=()=>ctx.queue=[];
 ctx.renderPledges=()=>{};ctx.renderPack=()=>{};ctx.chips=()=>{};
 return ctx;
}
function step(c){if(c.lineupOpen)c.confirmLineup();else if(c.queue.length)c.queue.shift()();else if(c.myTurn)c.myPick(c.legalSet(c.mine,c.openIdx())[0]);else if(c.banQ[0]==='me')c.myBan(c.banCand.findIndex(e=>!e.by));else throw Error('stalled')}
function invariant(c){
 const teams=[...c.mine,...c.foe,...(c.foe2||[])];assert.equal(new Set(teams.map(x=>x[0])).size,teams.length,'duplicate picked officer');
 for(const t of [c.mine,c.foe,c.foe2].filter(Boolean))assert(t.length<=13);
 const drawn=(c.packArr||[]).map(x=>x.c[0]);assert.equal(new Set(drawn).size,drawn.length,'duplicate pack');
 const live=[...c.pool,...c.discard,...teams].map(x=>x[0]);assert.equal(new Set(live).size,live.length,'duplicate pool/roster');
 for(const x of c.packArr||[])if(!x.by&&c.myTurn)assert(!live.includes(x.c[0]),'open candidate also in pool');
 for(const n of c.bans.me.concat(c.bans.foe,c.bans.foe2))assert(!live.includes(n),'ban returned');
}
let c=runtime();assert.equal(c.C.length,279);assert.equal(new Set(c.C.map(x=>x[0])).size,279);
for(const cb of c.COMBO)for(const n of cb.m)assert(c.C.some(x=>x[0]===n),'unknown combo '+n);
for(const [id,p] of Object.entries(c.PACKS)){
 if(p.facMap)for(const [n,f] of Object.entries(p.facMap)){assert(c.C.some(x=>x[0]===n),id+' unknown '+n);assert(p.factions[f],id+' unknown faction '+f)}
 if(p.career)for(const [n,ff] of Object.entries(p.career))for(const f of ff)assert(p.factions[f],id+' unknown career faction '+f);
}
assert.equal(c.power(c.byName('여포')),97);assert.equal(c.power(c.byName('전위')),81);assert.equal(c.power(c.byName('허저')),82);
let played=0;
for(const players of [2,3])for(const mode of [0,1])for(const ex of [false,true])for(const pk of [null,'w194','gd200','jb208','end263','mx']){
 c=runtime({},played+1);c.PLAYERS=players;c.MODE=mode;c.exhaustOn=ex;c.PACK2=pk?c.PACKS[pk]:null;c.banOn=played%2===0;c.start();assert.equal(c.PACK,6);
 let guard=0,rerolled=false;
 while(!c.REC.games&&guard++<180){
  if(c.myTurn&&!rerolled){const before=c.openIdx().map(i=>c.packArr[i].c[0]),taken=c.packArr.filter(e=>e.by).map(e=>e.c[0]),len=c.packArr.length;c.reroll();assert.equal(c.packArr.length,len);assert.deepEqual(c.packArr.filter(e=>e.by).map(e=>e.c[0]),taken);for(const i of c.openIdx())assert(!before.includes(c.packArr[i].c[0]),'reroll repeated');rerolled=true;}
  step(c);invariant(c);
 }
 assert.equal(c.REC.games,1,'completion '+[players,mode,ex,pk]);assert.equal(c.mine.length,11);assert.equal(c.foe.length,11);if(players===3)assert.equal(c.foe2.length,11);
 assert(!c.localStorage.getItem(c.GAME_KEY));played++;
}
for(let scn=1;scn<=5;scn++){
 c=runtime({},100+scn);c.SCN=scn;c.start();assert.equal(c.PACK,6);for(let i=0;!c.REC.games&&i<100;i++)step(c);assert.equal(c.REC.games,1);assert.equal(c.mine.length,11);invariant(c);played++;
}
// Reload each stable phase and complete the same game once.
for(const phase of ['ban','draft','next','lineup']){
 const storage={};c=runtime(storage);c.banOn=phase==='ban';c.PLAYERS=3;c.MODE=1;c.start();
 for(let i=0;JSON.parse(storage[c.GAME_KEY]).phase!==phase&&i<180;i++)step(c);
 const save=JSON.parse(storage[c.GAME_KEY]);assert.equal(save.phase,phase);
 const resumed=runtime(storage);assert(resumed.resumeGame(),phase+' resume');assert.equal(resumed.matchId,c.matchId);assert.equal(resumed.mine.length,c.mine.length);assert.equal(JSON.stringify(resumed.packArr),JSON.stringify(c.packArr),'restore visible pack');
 for(let i=0;!resumed.REC.games&&i<180;i++)step(resumed);
 assert.equal(resumed.REC.games,1);resumed.finish();assert.equal(resumed.REC.games,1,'idempotent finish');
}
// Ranked display and record use the same strict-win convention.
c=runtime();c.PLAYERS=3;c.start();c.stopTimers();c.mine=c.C.slice(0,11);c.foe=c.C.slice(11,22);c.foe2=c.C.slice(22,33);c.evaluate=()=>({total:100,rows:[]});c.finish();assert.equal(c.REC.draw,1);assert(c.document.getElementById('res').innerHTML.includes('共 同 一 位'));
// Reroll exhaustion never charges a token and does not discard the remaining pack.
c=runtime();c.start();c.pool=[];c.discard=[];let rr=c.rerolls,pack=c.packArr.map(e=>e.c[0]);c.reroll();assert.equal(c.rerolls,rr);assert.deepEqual(c.packArr.map(e=>e.c[0]),pack);
// A role supplement replaces unusable candidates, keeping size and identity conservation.
c=runtime();c.start();c.mine=c.C.filter(x=>x[2]==='무장').slice(0,5);c.pool=c.C.filter(x=>x[2]==='문관').slice(0,10);c.packArr=c.C.filter(x=>x[2]==='무장').slice(5,13).map(x=>({c:x,by:null}));assert.equal(c.ensureChoices(c.mine),2);assert.equal(c.rawLegal(c.mine,c.openIdx()).length,2);assert.equal(c.packArr.length,8);invariant(c);
// Hidden enemies do not leak via availability labels.
c=runtime();c.start();c.foe=[c.byName('관우')];c.fogOn=true;assert.equal(c.availability('관우'),'불확실');assert.equal(c.availability('장비'),'불확실');c.fogOn=false;assert.equal(c.availability('관우'),'적 보유');
console.log(JSON.stringify({games:played,reloadPhases:4,officers:c.C.length,combos:c.COMBO.length,result:'PASS'}));
// Inspecting and cancelling must never mutate picks, scores or the draft queue.
c=runtime();c.start();while(!c.myTurn)c.queue.shift()();
let idx=c.legalSet(c.mine,c.openIdx())[0],before=JSON.stringify([c.mine,c.foe,c.turnQ,c.packArr]);
c.showDetail(c.packArr[idx].c,idx);assert.equal(JSON.stringify([c.mine,c.foe,c.turnQ,c.packArr]),before);
c.closeDetail();assert.equal(JSON.stringify([c.mine,c.foe,c.turnQ,c.packArr]),before);
c.showDetail(c.packArr[idx].c,idx);const confirm=c.document.getElementById('pickConfirm').onclick,chosen=c.packArr[idx].c[0];
confirm();assert(c.mine.some(x=>x[0]===chosen));const count=c.mine.length;confirm();assert.equal(c.mine.length,count,'double confirm');
c.cfgApply({quickPick:true});assert.equal(c.cfgSnap().quickPick,true);
console.log('PASS: preview/cancel preserve draft, confirmation picks once, quick-pick preference');

// Final recommendation must be globally optimal among all legal eleven-card subsets.
c=runtime();c.start();let guard13=0;while(!c.lineupOpen&&guard13++<180)step(c);
assert(c.lineupOpen);assert.equal(c.mine.length,13);assert.equal(c.hist.length,13);assert.equal(c.REC.games,0);
const roster=c.mine.slice(),opt=c.bestLineup(roster,false);let maxScore=-Infinity,minOverflow=Infinity;
for(let a=0;a<13;a++)for(let b=a+1;b<13;b++){
 const subset=roster.filter((_,i)=>i!==a&&i!==b),over=c.lineupOverflow(subset),score=c.evaluateRaw(subset,false).total;
 if(over<minOverflow){minOverflow=over;maxScore=score;}else if(over===minOverflow)maxScore=Math.max(maxScore,score);
}
assert.equal(opt.over,minOverflow);assert.equal(opt.score,maxScore);
c.lineupChoice=[];c.confirmLineup();assert.equal(c.REC.games,0,'incomplete lineup cannot finish');
c.lineupChoice=opt.team.map(x=>x[0]);c.confirmLineup();assert.equal(c.mine.length,11);assert.equal(c.foe.length,11);assert.equal(c.REC.games,1);c.confirmLineup();assert.equal(c.REC.games,1);
// Old v2 saves without round metadata finish at eleven picks, then new games use thirteen.
const oldStorage={};c=runtime(oldStorage);c.start();const legacy=JSON.parse(oldStorage[c.GAME_KEY]);delete legacy.rounds;delete legacy.packSize;oldStorage[c.GAME_KEY]=JSON.stringify(legacy);
let old=runtime(oldStorage);assert(old.resumeGame());assert.equal(old.ROUNDS,11);for(let i=0;!old.REC.games&&i<180;i++)step(old);assert.equal(old.mine.length,11);assert.equal(old.REC.games,1);old.start();assert.equal(old.ROUNDS,13);assert.equal(old.PACK,6);
// Last two picks have no role cap; initial eleven preserve the original role constraint.
c=runtime();c.start();c.mine=c.C.filter(x=>x[2]==='무장').slice(0,5);c.packArr=[{c:c.byName('여포'),by:null},{c:c.byName('유비'),by:null}];assert(!c.legalSet(c.mine,[0,1]).includes(0));c.mine=c.C.slice(0,11);assert.deepEqual(Array.from(c.legalSet(c.mine,[0,1])),[0,1]);
console.log('PASS: thirteen picks, optimal legal eleven, invalid/double confirmation, legacy eleven-round save, reserve role freedom');

// Mid-edit final selection is restored, and a player's legal choice is not auto-replaced.
const editStore={};c=runtime(editStore);c.start();for(let i=0;!c.lineupOpen&&i<180;i++)step(c);
let alternative=null,baseline=c.bestLineup(c.mine,false);
for(let a=0;a<13&&!alternative;a++)for(let b=a+1;b<13;b++){
 const team=c.mine.filter((_,i)=>i!==a&&i!==b);
 if(c.lineupOverflow(team)<=baseline.over){alternative=team;break;}
}
c.lineupChoice=alternative.map(x=>x[0]);const expected=c.lineupChoice.slice();c.lineupChoice.pop();c.saveGame('lineup',[]);
let edited=runtime(editStore);assert(edited.resumeGame());assert(edited.lineupOpen);assert.equal(edited.lineupChoice.length,10);edited.confirmLineup();assert.equal(edited.REC.games,0);
edited.lineupChoice=expected;edited.confirmLineup();assert.deepEqual(Array.from(edited.mine.map(x=>x[0])),Array.from(expected));
console.log('PASS: unfinished final selection resumes and manual lineup is respected');
