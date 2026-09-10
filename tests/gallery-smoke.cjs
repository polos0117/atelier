// Run: node tests/gallery-smoke.cjs (starts its own local static server).
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
 const paths=await page.evaluate(()=>{
  VIEW_M='f';seedPinned=14;reset();gen++;busy=false;
  var c=MECH.find(c=>dailyShots(c,'f').length>1);if(!c)throw Error('missing gallery fixture');
  window.galleryFixture=c;inspectCandidate(c,'기체');return dailyShots(c,'f').map(x=>x.path);
 });
 const snapshot=await page.evaluate(()=>JSON.stringify({teams,round,si,rngState,REC}));
 assert(!await page.locator('#tacticalDialog .gallery-nav').isVisible());
 await page.locator('#tacticalDialog .gallery-tabs button').nth(1).click();
 await page.waitForFunction(()=>{var i=document.querySelector('#tacticalDialog .pick-art img');return i&&i.complete&&i.naturalWidth>0});
 const first=await page.locator('#tacticalDialog .pick-art img').getAttribute('src');
 await page.locator('#tacticalDialog .gallery-nav button').last().click();
 assert.notEqual(await page.locator('#tacticalDialog .pick-art img').getAttribute('src'),first);
 await page.locator('#tacticalDialog .gallery-nav button').first().click();
 assert.equal(await page.locator('#tacticalDialog .pick-art img').getAttribute('src'),first);
 for(const width of [344,690]){
  await page.setViewportSize({width,height:829});await fits('gallery '+width);
  assert(await page.locator('#tacticalDialog').evaluate(e=>e.scrollWidth<=e.clientWidth));
  if(process.env.MOBILE_SCREENSHOTS)await page.screenshot({path:process.env.MOBILE_SCREENSHOTS+'/daily-gallery-'+width+'.png'});
 }
 assert.equal(await page.evaluate(()=>JSON.stringify({teams,round,si,rngState,REC})),snapshot);
 await page.locator('#tacticalDialog .tac-dialog-head button').click();
 const checks=await page.evaluate(()=>{
  var c=['gallery-test',['X']],saved=IMG[c[0]];
  IMG[c[0]]={casual:['old.webp'],byStyle:{styleA:{casual:{f:['female.webp','old.webp'],m:['male.webp']}}}};
  var f=dailyShots(c,'f').map(x=>x.path),m=dailyShots(c,'m').map(x=>x.path);delete IMG[c[0]];
  return {f,m};
 });assert.deepEqual(checks,{f:['old.webp','female.webp'],m:['male.webp']});
 await page.evaluate(()=>{
  setTactical(false);var c=galleryFixture;var team={함:[SHIP[0]],기체:[c],파일럿:[PILOT[0]],지휘관:[]};
  var a=document.getElementById('endArea');a.innerHTML='';a.appendChild(renderMVP(team));
 });
 assert.equal(await page.locator('.mvp-card').count(),1);assert.equal(await page.locator('.mvp-members button').count(),2);
 await page.locator('.mvp-members button').last().click();assert.equal(await page.locator('.mvp-members button').last().getAttribute('aria-pressed'),'true');
 await page.locator('.mvp-members button').first().click();
 await page.locator('.mvp-card').scrollIntoViewIfNeeded();
 if(process.env.MOBILE_SCREENSHOTS)await page.screenshot({path:process.env.MOBILE_SCREENSHOTS+'/daily-mvp.png'});
 assert.deepEqual(errors,[]);console.log('PASS: split assets, real daily images, navigation without draft mutations, gender/style/legacy formats, responsive gallery, MVP members.');
 }finally{await browser.close();if(server)server.close();}})().catch(e=>{console.error(e);if(server)server.close();process.exitCode=1});
