// Run: node tests/mobile-smoke.cjs (starts its own local static server).
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
  await load('prompt');
  assert.equal(await page.locator('[data-density-picker]').inputValue(),'compact');
  await page.locator('[data-density-picker]').selectOption('relaxed');
  await load('dex');assert.equal(await page.locator('[data-density-picker]').inputValue(),'relaxed');
  // Cross-tab changes apply without reloading; removing the preference restores compact.
  const peer=await context.newPage();await peer.goto(base+'/prompt.html');
  await peer.locator('[data-density-picker]').selectOption('compact');
  await page.waitForFunction(()=>document.documentElement.dataset.density==='compact');
  await peer.close();
  for(const name of ['prompt','play','dex']){
   await load(name);
   for(const density of ['compact','relaxed']){
    await page.locator('[data-density-picker]').selectOption(density);
    const target=name==='prompt'?'#mechPicker':name==='play'?'#playCardSize':'#q';
    assert.equal(await page.locator(target).evaluate(e=>getComputedStyle(e).fontSize),density==='compact'?'12px':'14px');
    for(const width of [344,690]){
     await page.setViewportSize({width,height:882});await fits(name+' '+density+' '+width);
     if(process.env.MOBILE_SCREENSHOTS)await page.screenshot({path:process.env.MOBILE_SCREENSHOTS+'/'+name+'-'+density+'-'+width+'.png'});
    }
    if(name==='prompt'){
     await page.locator('#tabSingle').click();await page.locator('#panelSingle details').evaluateAll(els=>els.forEach(e=>e.open=true));
     assert(await page.evaluate(()=>Array.from(document.querySelectorAll('#panelSingle label.lab-lock')).every(l=>{
      const b=l.querySelector('.lockbtn'),s=l.nextElementSibling;
      return !s||s.tagName!=='SELECT'||b.getBoundingClientRect().bottom<=s.getBoundingClientRect().top;
     })),'density caused overlapping locks');
    }
   }
   await page.locator('[data-density-picker]').selectOption('compact');
  }
  for(const width of [344,360,690,768,1100]){
   await page.setViewportSize({width,height:882});
   for(const name of ['prompt','play','dex']){
    await load(name);
    await page.waitForSelector(name==='prompt'?'#panelCollage .controls':name==='play'?'.setupbox':'#grid .cell');
    await fits(name+' '+width);
    if(process.env.MOBILE_SCREENSHOTS&&[344,690].includes(width))await page.screenshot({path:process.env.MOBILE_SCREENSHOTS+'/'+name+'-'+width+'.png'});
   }
  }
  await page.setViewportSize({width:344,height:882});
  await load('prompt');
  for(const mode of ['Collage','Single','Anthro']){
   await page.locator('#tab'+mode).click();
   await page.locator('#dockCopy').click();
   await page.waitForFunction(id=>window.__copied===document.getElementById(id).value,'text'+mode);
   assert(await page.locator('#dockStatus').innerText(),'copy status missing');
   assert(await page.evaluate(id=>window.__copied===document.getElementById(id).value,'text'+mode),'wrong mode copied');
   await page.locator('#dockPreview').click();
   assert(await page.locator('#view'+mode).isVisible(),'preview missing');
   await fits(mode+' preview');
   await page.locator('#dockPreview').click();
   assert(!await page.locator('#view'+mode).isVisible(),'preview did not close');
  }
  // Fold/unfold preserves the selected source and active mode.
  const source=await page.locator('#mechPicker').inputValue();
  await page.setViewportSize({width:690,height:829});
  assert.equal(await page.locator('#mechPicker').inputValue(),source);
  assert(await page.locator('#panelAnthro').isVisible());
  await page.locator('#srcBox summary').click();await fits('open source picker');
  await page.setViewportSize({width:882,height:344});await fits('landscape prompt');
  await page.setViewportSize({width:344,height:882});
  await load('dex');await page.waitForSelector('#grid .cell');
  const count=await page.locator('#grid .cell').count();assert(count>0);
  await page.locator('#filterToggle').click();assert(await page.locator('#dexFilters').isVisible());
  await fits('expanded dex filters');
  await page.locator('#q').fill('NO_SUCH_CARD_123');assert(await page.locator('#empty').isVisible());
  await page.locator('#clearFilters').click();assert.equal(await page.locator('#grid .cell').count(),count);
  await page.locator('#cardSize').click();await page.reload();
  assert(await page.locator('body').evaluate(el=>el.classList.contains('dex-compact')),'card size not restored');
  await page.waitForSelector('#grid .cell');await page.locator('#grid .cell').first().click();
  assert(await page.locator('.sheet').isVisible());await fits('dex detail');
  await page.locator('.sheet [data-x]').click();assert(!await page.locator('.sheet').count());
  await load('play');await page.waitForSelector('.setupbox');
  assert(await page.locator('[data-jump="dockArea"]').isDisabled());
  await page.locator('#playCardSize').click();const size=await page.locator('#playCardSize').getAttribute('aria-pressed');
  await page.reload();await page.waitForSelector('.setupbox');assert.equal(await page.locator('#playCardSize').getAttribute('aria-pressed'),size);
  await page.locator('.setupbox .btn.big').click();
  if(await page.locator('body').evaluate(e=>e.classList.contains('tactical')))await page.locator('#viewMode').click();
  await page.waitForSelector('#packArea button.card:not(:disabled)');await fits('draft cards');
  const round=await page.locator('#rdl').innerText();
  await page.locator('[data-jump="dockArea"]').click();
  assert.equal(await page.locator('#rdl').innerText(),round,'navigation advanced draft');
  await page.locator('[data-jump="packArea"]').click();
  for(const shared of [true,false]){
   await page.evaluate(shared=>{gen++;sharedPack=shared;reset()},shared);
   await page.waitForFunction(()=>!busy&&turnSeq()[si]===0);
   const before=await page.evaluate(()=>JSON.stringify({round,si,teams}));
   await page.locator('#packArea button.card:not(:disabled)').first().click();
   assert(await page.locator('#tacticalDialog').isVisible(),'normal view must confirm');
   assert.equal(await page.locator('.pick-art img,.pick-art svg').count(),1);
   assert.equal(await page.evaluate(()=>JSON.stringify({round,si,teams})),before,'preview picked a card');
   await page.locator('.tac-dialog-head button').click();
   assert.equal(await page.evaluate(()=>JSON.stringify({round,si,teams})),before,'cancel changed draft');
   await page.locator('#packArea button.card:not(:disabled)').first().click();
   await page.locator('#tacticalDialog .btn.big').click();
   await page.waitForFunction(()=>teams[0].함.length===1);
   assert(!await page.locator('#tacticalDialog').isVisible());
  }
  await page.waitForFunction(()=>document.querySelector('#dockArea .ship:not(.empty)'));
  for(const width of [344,690,768]){await page.setViewportSize({width,height:882});await fits('active draft '+width);if(process.env.MOBILE_SCREENSHOTS)await page.screenshot({path:process.env.MOBILE_SCREENSHOTS+'/draft-'+width+'.png'});}
  assert.deepEqual(errors,[],'browser errors');
  console.log('PASS: shared density/default/persistence/cross-tab/font sizes/lock layout; mobile widths, fold resize, prompt copy/preview, dex filters/preferences/detail, draft selection/navigation.');
 }finally{await browser.close();if(server)server.close();}
})().catch(e=>{console.error(e);if(server)server.close();process.exitCode=1});
