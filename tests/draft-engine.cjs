// No browser or npm install required: node tests/draft-engine.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function engine(config,seed=43217){
  const timers=[],saved=new Map([['gundam_draft_cfg_v1',JSON.stringify(config)]]);
  const context={console,URL,queueMicrotask,location:{search:'?seed='+seed,origin:'https://example.test',pathname:'/play.html'},
    localStorage:{getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)},
    setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length},
    fetch:async url=>{const file=path.join(root,'data',url.split('/').pop());return{ok:fs.existsSync(file),status:fs.existsSync(file)?200:404,json:async()=>JSON.parse(fs.readFileSync(file,'utf8'))}}};
  context.window={};vm.createContext(context);
  let source=fs.readFileSync(path.join(root,'gundam/draft-engine.js'),'utf8');
  source=source.replace(/export \{([\s\S]*?)\};/,(_,names)=>'window.engine={'+names.split(',').map(n=>n.trim()).filter(Boolean).map(n=>'get '+n+'(){return '+n+'}').join(',')+'};');
  vm.runInContext(source,context);
  const game=context.window.engine;
  return {game,saved,timers,drain(){let guard=0;while(game.phase==='running'&&!game.isMine()){
    const i=timers.findIndex(t=>t.ms===380);assert(i>=0,'AI turn scheduled');timers.splice(i,1)[0].fn();assert(++guard<10,'AI returns control');
  }}};
}
async function play(config){
  const run=engine(config),g=run.game;await g.boot();assert.equal(g.phase,'setup');g.start();const trace=[];
  let picked=0,resupplied=false;
  while(g.phase==='running'){
    run.drain();if(g.phase==='done')break;
    assert(g.isMine());const available=g.candidates().filter(x=>x.by===null);assert(available.length);
    const card=available[0].c,token=g.turnToken(),before=JSON.stringify(g.teams);
    const preview=g.pickPreview(g.teams[0],card,g.SCHEDULE[g.round]);assert.equal(JSON.stringify(g.teams),before,'preview is read-only');
    assert.equal(Object.values(preview.after.parts).reduce((a,b)=>a+b,0),preview.after.total,'analysis reconciles');
    if(!resupplied&&g.rerolls>0&&g.round<g.SCHEDULE.length-1){
      const taken=g.candidates().filter(x=>x.by!==null).map(x=>x.c[0]),n=g.rerolls;
      assert(g.resupply());assert.equal(g.rerolls,n-1);
      if(g.sharedPack)assert.deepEqual(Array.from(g.candidates().filter(x=>x.by!==null),x=>x.c[0]),Array.from(taken),'resupply preserves taken slots');
      assert(!g.selectCard(card,token),'discarded candidate cannot be picked');resupplied=true;continue;
    }
    trace.push([g.round,card[0]]);assert(g.selectCard(card,token));assert(!g.selectCard(card,token),'double/stale confirm ignored');assert(++picked<100);
  }
  assert.equal(g.phase,'done');assert.equal(g.REC.games,1);assert.equal(g.REC.first+g.REC.second+g.REC.third,1);
  const names=g.teams.flatMap(t=>Object.values(t).flat().map(c=>c[0]));assert.equal(new Set(names).size,names.length,'no duplicate drafted cards');
  g.teams.forEach(team=>{const parts=g.scoreParts(team);assert.equal(Object.values(parts.parts).reduce((a,b)=>a+b,0),g.evaluate(team).total)});
  const result=JSON.stringify({trace,scores:g.teams.map(t=>g.evaluate(t).total),record:g.REC});
  run.timers.splice(0).forEach(t=>t.fn());assert.equal(g.REC.games,1,'effects do not record result twice');
  g.setup();assert(g.configure('sc',g.SCALE_OPTS[0]));assert.equal(JSON.parse(run.saved.get('gundam_draft_cfg_v1')).sc,g.SCALE_OPTS[0]);
  g.start();g.setup();run.timers.splice(0).forEach(t=>t.fn());assert.equal(g.phase,'setup','old AI timers cannot mutate setup');
  return result;
}
(async()=>{
 for(const config of [{lv:0,sc:4,shared:true,flow:'cross',rr:1},{lv:2,sc:4,shared:false,flow:'classic',rr:3,fog:true},{lv:1,sc:6,shared:true,flow:'cross',objective:false,rr:0}]){
  assert.equal(await play(config),await play(config),'same seed and decisions reproduce the game');console.log('PASS',JSON.stringify(config));
 }
 console.log('PASS deterministic games, resupply, stale choices/timers, scoring, record persistence');
})().catch(e=>{console.error(e);process.exitCode=1});
