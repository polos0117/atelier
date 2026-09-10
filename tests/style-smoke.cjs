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
 await load('dex');await page.waitForFunction(()=>MECH.length>0);
 const styles=await page.evaluate(()=>{
   IMG.StyleFixture={f:'legacy.webp',byStyle:{painterly:{f:'paint.webp'}}};
   TK.localStyle.StyleFixture='photoreal';TK.baseStyle.StyleFixture='cinematic_semi_real';
   return {keys:tkStyleKeys('StyleFixture'),unknown:bucketOf('StyleFixture','unknown').f,
     painted:bucketOf('StyleFixture','painterly').f,wrong:bucketOf('StyleFixture','photoreal'),
     label:TK_ART.unknown,unregistered:mergeFiles(['StyleFixture_m.webp'])};
 });
 assert.deepEqual(styles,{keys:['unknown','painterly'],unknown:'legacy.webp',painted:'paint.webp',wrong:null,label:'화풍 미상',unregistered:0});
 await page.evaluate(()=>localStorage.setItem('atelier_toolkit_v1',JSON.stringify({style:{Old:'photoreal'}})));
 await load('prompt');await page.waitForFunction(()=>document.querySelector('#mechPicker').options.length>0 && document.querySelector('#artStyle').options.length>0);
 await page.waitForTimeout(500);
 await page.selectOption('#artStyle','painterly');
 assert((await page.locator('#imageFilenameGuide').textContent()).includes('_painterly_f_casual1.webp'));
 await page.waitForTimeout(350);
 const local=await page.evaluate(()=>JSON.parse(localStorage.getItem('atelier_toolkit_v1')));
 assert.equal(local.style.Old,'photoreal');assert(Object.values(local.stylePreferences).includes('painterly'));
 await page.route('**/toolkit-data.json',r=>r.fulfill({json:{mechs:{},style:{Old:'game_keyart'}}}));
 await page.evaluate(()=>document.querySelector('#exportStore').click());
 await page.waitForFunction(()=>document.querySelector('#exportBox').value.includes('game_keyart'));
 const exported=JSON.parse(await page.locator('#exportBox').inputValue());
 assert.deepEqual(exported.style,{Old:'game_keyart'});assert.equal(exported.stylePreferences,undefined);
 await page.route('**/toolkit-data.json',r=>r.fulfill({status:503,body:'unavailable'}));
 await page.evaluate(()=>document.querySelector('#exportStore').click());
 await page.waitForFunction(()=>document.querySelector('#exportBox').value==='');
 assert.deepEqual(errors,[]);
 console.log('PASS: unknown/style separation, stale local isolation, filenames, fresh export, offline export guard');
 }finally{await browser.close();if(server)await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error(e);if(server)server.close();process.exitCode=1});
