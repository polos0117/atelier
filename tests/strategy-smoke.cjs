// Run: node tests/strategy-smoke.cjs (starts its own local static server).
// Set MOBILE_BASE_URL to test an existing HTTP server instead.
// Requires Playwright and its Chromium. CHROMIUM_PATH can select an existing browser.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const base=process.env.MOBILE_BASE_URL||'http://127.0.0.1:8765';
let server;
(async()=>{
 if(!process.env.MOBILE_BASE_URL){
  const fs=require('node:fs'),path=require('node:path');
  const root=path.resolve(__dirname,'..');
  server=require('node:http').createServer((req,res)=>{
   const file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,base).pathname));
   if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
   fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end();return;}
    const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png'})[ext]||'application/octet-stream');res.end(data);});
  });
  await new Promise(resolve=>server.listen(8765,'127.0.0.1',resolve));
 }
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 const context=await browser.newContext({viewport:{width:344,height:882},isMobile:true,hasTouch:true});
 const page=await context.newPage();const errors=[];
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin===new URL(base).origin)return route.continue();
  // Resolve the existing GitHub Pages image URLs to the identical checked-out files.
  if(url.origin==='https://polos0117.github.io'&&url.pathname.startsWith('/atelier/img/')){
   const response=await context.request.get(base+url.pathname.slice('/atelier'.length));
   return route.fulfill({response});
  }
  return route.abort();
 });
 page.on('pageerror',e=>errors.push(e.message));
 // Exercise successful copying without depending on OS clipboard permissions.
 await context.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{window.__copied=t}}}));
 async function load(name){await page.goto(base+'/'+name+'.html');await page.waitForFunction(()=>document.readyState==='complete');}
 async function fits(label){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' overflows horizontally');}
 try{
  await load('play');await page.waitForSelector('.setupbox');
  const contract=await page.evaluate(()=>[4,6,8,10].map(n=>{
   DRAFT_FLOW='cross';applyScale(n);return {n,seq:SCHEDULE.slice(),cap:CAP_BONUS};
  }));
  for(const x of contract){
   assert.equal(x.seq.filter(t=>t==='기체').length,x.n);assert.equal(x.seq.filter(t=>t==='파일럿').length,x.n);
   assert.equal(x.seq.filter(t=>t==='지휘관').length,3);assert.deepEqual(x.seq.slice(0,4),['함','지휘관','기체','파일럿']);
   assert.equal(x.seq.length,x.n*2+4);
  }
  await page.evaluate(()=>{DRAFT_FLOW='cross';applyScale(6);seedPinned=14;setup()});
  await page.locator('.setupbox .btn.big').click();
  await page.waitForFunction(()=>!busy&&turnSeq()[si]===0);
  assert(await page.locator('#tacticalArea').isVisible());
  assert.equal(await page.locator('#tacticalArea .tac-card').count(),9);
  for(const width of [344,390,690,768]){
   await page.setViewportSize({width,height:829});await fits('tactical '+width);
   assert(await page.locator('.tac-teams').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight),'summary below viewport '+width);
   if(process.env.MOBILE_SCREENSHOTS)await page.screenshot({path:process.env.MOBILE_SCREENSHOTS+'/tactical-'+width+'.png'});
  }
  const before=await page.evaluate(()=>JSON.stringify({round,si,teams}));
  await page.locator('.tac-card:not(:disabled)').first().click();assert(await page.locator('#tacticalDialog').isVisible());
  assert.equal(await page.evaluate(()=>JSON.stringify({round,si,teams})),before,'inspect mutates game');
  await page.locator('#tacticalDialog .tac-dialog-head button').click();
  assert.equal(await page.evaluate(()=>JSON.stringify({round,si,teams})),before,'cancel mutates game');
  await page.locator('.tac-card:not(:disabled)').first().click();await page.locator('#tacticalDialog .btn.big').click();
  await page.waitForFunction(()=>teams[0].함.length===1&&!busy&&turnSeq()[si]===0);
  const snapshot=await page.evaluate(()=>JSON.stringify({round,si,teams}));
  await page.locator('#viewMode').click();await page.locator('#viewMode').click();
  assert.equal(await page.evaluate(()=>JSON.stringify({round,si,teams})),snapshot,'switching view mutates draft');
  await page.locator('.tac-team').first().click();assert(await page.locator('#tacticalDialog .dock').isVisible());
  await page.locator('#tacticalDialog .tac-dialog-head button').click();
  const supplyBefore=await page.evaluate(()=>({rerolls,team:JSON.stringify(teams[0]),round,si}));
  await page.locator('.tac-meta .btn').click();
  assert.deepEqual(await page.evaluate(()=>({rerolls,team:JSON.stringify(teams[0]),round,si})),{...supplyBefore,rerolls:supplyBefore.rerolls-1},'supply consumes exactly one reroll without picking');
  await page.evaluate(()=>{fogOn=true;renderBoard()});
  assert.equal(await page.locator('.tac-team:disabled').count(),2);
  assert.equal(await page.locator('.tac-team').nth(1).locator('strong').innerText(),'???');
  await page.evaluate(()=>{fogOn=false;renderBoard()});
  // Validate every size, both schedules and supply modes using real game transitions.
  const results=await page.evaluate(()=>{
   gen++;const realRender=render,realSched=schedStep;render=function(){};schedStep=function(){};
   var out=[];
   try{
    [4,6,8,10].forEach(n=>['cross','classic'].forEach(flow=>[true,false].forEach(shared=>{
     DRAFT_FLOW=flow;sharedPack=shared;applyScale(n);seedPinned=41+n;AI_LV=1;objectiveOn=true;reset();
     var count=0;
     while(round<SCHEDULE.length&&count++<150){var type=SCHEDULE[round],who=turnSeq()[si];
      take(type,aiDraw(type,who),who);si++;
      if(si>=3){if(sharedPack)tossRest(type);si=0;round++}
     }
     var scores=teams.map(t=>{var ev=evaluate(t),saved=OBJECTIVE;OBJECTIVE=null;var raw=evaluate(t).total;OBJECTIVE=saved;
      return {total:ev.total,raw,mission:objectiveScore(t),sizes:[t.함.length,t.기체.length,t.파일럿.length,t.지휘관.length],unique:new Set([].concat(t.함,t.기체,t.파일럿,t.지휘관).map(c=>c[0])).size};});
     out.push({n,flow,shared,round,scores,max:OBJECTIVE.max});
    })));
   }finally{render=realRender;schedStep=realSched}
   const saved=OBJECTIVE,team={함:[],기체:[],파일럿:[],지휘관:[]};
   const mass=MECH.filter(c=>tagsOf(c).includes('양산기')).slice(0,3);
   OBJECTIVE={id:'mass',target:2,max:24};team.기체=mass;
   if(objectiveCount(team,OBJECTIVE)!==3||objectiveScore(team)!==24)throw Error('mass objective count/cap');
   OBJECTIVE={id:'mixed',target:2,max:24};team.기체=[['A',['old','X']],['B',['different','X']],['C',['X','Y']]];
   if(objectiveCount(team,OBJECTIVE)!==2||objectiveScore(team)!==24)throw Error('mixed objective current faction/deduplication');
   OBJECTIVE={id:'command',target:2,max:24};team.지휘관=[['leader',['old','X']],['other',['Y']]];team.파일럿=[['pilot',['X']]];
   if(objectiveCount(team,OBJECTIVE)!==3||objectiveScore(team)!==24)throw Error('commander objective uses first commander');
   OBJECTIVE=null;if(objectiveScore(team)!==0)throw Error('disabled objective');OBJECTIVE=saved;
   return out;
  });
  for(const g of results){assert.equal(g.round,g.n*2+4);for(const t of g.scores){assert.deepEqual(t.sizes,[1,g.n,g.n,3]);assert.equal(t.unique,g.n*2+4);assert.equal(t.total,t.raw+t.mission);assert(t.mission>=0&&t.mission<=g.max)}}
  // A full real UI run verifies end screen/record updates and no stale tactical controls.
  await page.reload();await page.waitForSelector('.setupbox');
  await page.evaluate(()=>{applyScale(4);AI_LV=0;sharedPack=true;reset()});
  await page.setViewportSize({width:344,height:829});
  for(let turn=0;turn<12;turn++){
   await page.waitForFunction(()=>round>=SCHEDULE.length||(!busy&&turnSeq()[si]===0));
   if(await page.evaluate(()=>round>=SCHEDULE.length))break;
   await fits('round '+turn);
   assert(await page.locator('.tac-teams').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight),'summary below viewport round '+turn);
   await page.locator('.tac-card:not(:disabled)').first().click();await page.locator('#tacticalDialog .btn.big').click();
  }
  await page.waitForFunction(()=>round>=SCHEDULE.length);
  assert(await page.locator('#endArea .rank').count()===3);assert(!await page.locator('#tacticalArea').isVisible());
  assert.deepEqual(errors,[]);
  console.log('PASS: tactical preview/cancel/pick/view switch/team detail; 4 sizes × 2 schedules × 2 supply modes; objectives; full UI game.');
  console.log(JSON.stringify(results.map(g=>({n:g.n,flow:g.flow,shared:g.shared,scores:g.scores.map(t=>t.total),mission:g.scores.map(t=>t.mission)}))));
 }finally{await browser.close();if(server)server.close();}
})().catch(e=>{console.error(e);if(server)server.close();process.exitCode=1});
