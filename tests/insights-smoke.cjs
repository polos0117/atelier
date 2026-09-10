// Run: node tests/insights-smoke.cjs (starts its own local static server).
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
    const ext=path.extname(file);res.setHeader('Content-Type',({'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png'})[ext]||'application/octet-stream');res.end(data);});
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
 await page.evaluate(()=>{seedPinned=14;reset();gen++;busy=false;teams[0].함=[SHIP[0]];teams[0].기체=MECH.slice(0,3);teams[0].파일럿=PILOT.slice(0,2);renderDock();renderBoard()});
 const check=await page.evaluate(()=>{
  var t=teams[0],snapshot=JSON.stringify({teams,round,si,rngState,REC}),c=PILOT[2],p=pickPreview(t,c,'파일럿');
  var copy={};Object.keys(t).forEach(k=>copy[k]=t[k].slice());copy.파일럿.push(c);
  if(p.after.total!==evaluate(copy).total)throw Error('preview score');
  if(JSON.stringify(p.after.units)!==JSON.stringify(assign(copy)))throw Error('preview assignment');
  if(Object.values(p.after.parts).reduce((a,b)=>a+b,0)!==p.after.total)throw Error('sum mismatch');
  inspectCandidate(c,'파일럿');return {snapshot,changes:p.changes.length};
 });assert(check.changes>0);
 assert(await page.locator('.pick-preview').isVisible());
 for(const width of [344,690]){
  await page.setViewportSize({width,height:829});await fits('preview '+width);
  assert(await page.locator('#tacticalDialog').evaluate(e=>e.scrollWidth<=e.clientWidth));
  assert(await page.locator('.pick-actions').evaluate(e=>e.getBoundingClientRect().bottom<=innerHeight));
  await page.locator('#tacticalDialog').evaluate(e=>Promise.all(e.getAnimations({subtree:true}).map(a=>a.finished)));
  if(process.env.MOBILE_SCREENSHOTS)await page.screenshot({path:process.env.MOBILE_SCREENSHOTS+'/insight-preview-'+width+'.png'});
 }
 await page.locator('#tacticalDialog .tac-dialog-head button').click();
 assert.equal(await page.evaluate(()=>JSON.stringify({teams,round,si,rngState,REC})),check.snapshot,'inspect mutated game');
 const tiers=await page.evaluate(()=>{
  var saved=COMBO,tags=TCOMBO;try{COMBO=[{n:'테스트 연대',m:['A','B','C'],t:{2:20,3:30}}];TCOMBO=[];
  var result=nearPledges({함:[],지휘관:[],기체:[],파일럿:[['A']]});return result;
  }finally{COMBO=saved;TCOMBO=tags}
 });assert.equal(tiers[0].gain,14);assert.equal(tiers[0].rule,'B / C 중 1명');
 await page.locator('.tac-roster button').first().click();
 assert(await page.locator('#tacticalDialog').isVisible());assert((await page.locator('#tacticalDialog').innerText()).includes('발생한 악연'));
 if(process.env.MOBILE_SCREENSHOTS)await page.screenshot({path:process.env.MOBILE_SCREENSHOTS+'/insight-progress.png'});
 await page.locator('#tacticalDialog .tac-dialog-head button').click();
 await page.evaluate(()=>{setTactical(false);var a=document.getElementById('endArea');a.innerHTML='';a.appendChild(renderResultAnalysis())});
 await page.locator('.result-analysis select').selectOption('2');
 assert((await page.locator('.result-analysis').innerText()).includes('적 2 대비'));
 await page.locator('.result-analysis').scrollIntoViewIfNeeded();
 if(process.env.MOBILE_SCREENSHOTS)await page.screenshot({path:process.env.MOBILE_SCREENSHOTS+'/insight-result.png'});
 assert.deepEqual(errors,[]);console.log('PASS: preview scores/assignments/state isolation, next-tier missing members, progress dialog, result opponent selection and mobile layouts.');
 }finally{await browser.close();if(server)server.close();}})().catch(e=>{console.error(e);if(server)server.close();process.exitCode=1});
