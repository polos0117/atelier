/* Real WebGL checks for the mobile entry page. Run with an HTTP server:
   BASE_URL=http://127.0.0.1:8765 node tests/hangar-smoke.cjs
   Optional CHROMIUM_PATH / BROWSER_ARGS_JSON / HTTPS_PROXY / QA_ASSETS_DIR.
   QA_ASSETS_DIR may cache exact upstream engine/env/image bytes and esm-<URL SHA256>.js modules. */
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
(async () => {
  const base = process.env.BASE_URL || 'http://127.0.0.1:8765';
  const browser = await chromium.launch({headless:true,
    ...(process.env.CHROMIUM_PATH ? {executablePath:process.env.CHROMIUM_PATH} : {}),
    args: JSON.parse(process.env.BROWSER_ARGS_JSON || '["--no-sandbox","--enable-unsafe-swiftshader"]'),
    ...(process.env.HTTPS_PROXY ? {proxy:{server:process.env.HTTPS_PROXY,bypass:'127.0.0.1,localhost'}} : {})
  });
  try {
    const ctx=await browser.newContext({viewport:{width:344,height:882},hasTouch:true,
      ignoreHTTPSErrors:process.env.QA_IGNORE_HTTPS_ERRORS==='1'});
    const assets=process.env.QA_ASSETS_DIR;
    if(assets) await ctx.route('**/*',async r=>{
      const u=new URL(r.request().url());
      let file;
      if(u.href==='https://cdn.jsdelivr.net/npm/babylonjs@9.22.1/babylon.js')file=path.join(assets,'babylon-9.22.1.js');
      else if(u.href==='https://assets.babylonjs.com/environments/environmentSpecular.env')file=path.join(assets,'environmentSpecular.env');
      else if(u.origin==='https://polos0117.github.io'&&u.pathname.startsWith('/atelier/img/'))file=path.join(assets,decodeURIComponent(u.pathname.split('/').pop()));
      else if(u.origin==='https://esm.sh')file=path.join(assets,'esm-'+require('node:crypto').createHash('sha256').update(u.href).digest('hex')+'.js');
      if(file&&fs.existsSync(file))return r.fulfill({path:file,contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.webp')?'image/webp':'application/octet-stream'});
      return r.continue();
    });
    const page=await ctx.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(base+'/index.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.BABYLON?.EngineStore.LastCreatedScene?.meshes.filter(m=>m.name.startsWith('archive hologram')).every(m=>m.material.emissiveTexture?.isReady())&&document.getElementById('loading').hidden,null,{timeout:60000});
    await page.waitForFunction(()=>{const t=BABYLON.EngineStore.LastCreatedScene.textures.filter(t=>t.name.startsWith('assets/hangar/'));return t.length>=6&&t.every(t=>t.isReady());},null,{timeout:60000});
    assert(await page.evaluate(()=>{const s=BABYLON.EngineStore.LastCreatedScene;return s.getMaterialByName('brushed deck').bumpTexture&&s.getMaterialByName('brushed deck').metallicTexture&&s.getMeshByName('approved hangar extension').position.z>21;}),'textured materials and world-space backdrop');
    const sceneLayout=await page.evaluate(()=>{const s=BABYLON.EngineStore.LastCreatedScene;return {
      walls:['port wall elevation','starboard wall elevation','rear wall elevation'].map(n=>!!s.getMeshByName(n)?.material.emissiveTexture?.isReady()),
      bays:s.transformNodes.filter(n=>n.name.startsWith('bay ')).map(n=>({x:n.position.x,z:n.position.z,yaw:n.rotation.y}))
    };});
    assert(sceneLayout.walls.every(Boolean),'all wall elevations loaded');
    assert.equal(sceneLayout.bays.length,6,'six berths');
    for(const side of [-1,1]){
      const row=sceneLayout.bays.filter(b=>Math.sign(b.x)===side);assert.equal(row.length,3,'three berths on each side');
      assert.deepEqual(row.map(b=>b.z),[-16,0,16]);assert(row.every(b=>Math.abs(b.x)>=12&&Math.abs(b.yaw-side*Math.PI/2)<.001),'inward facing berths');
    }
    for(const [name,size] of Object.entries({cover:{width:344,height:882},inner:{width:690,height:829},landscape:{width:882,height:344}})){
      await page.setViewportSize(size);
      await page.waitForTimeout(250);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' overflow');
      for(const link of await page.locator('.launchpad a').all()){
        const box=await link.boundingBox();assert(box.x>=0&&box.y>=0&&box.x+box.width<=size.width+1&&box.y+box.height<=size.height+1,name+' clipped link');assert(box.height>=44,name+' tap target');
      }
    }
    await page.setViewportSize({width:344,height:882});
    const pos=()=>page.evaluate(()=>{const c=BABYLON.EngineStore.LastCreatedScene.activeCamera;return {x:c.position.x,z:c.position.z,yaw:c.rotation.y};});
    // Wait for actual frames after the viewport resize (software WebGL may compile slowly).
    await page.evaluate(()=>new Promise(resolve=>{const s=BABYLON.EngineStore.LastCreatedScene;let frames=0;const o=s.onAfterRenderObservable.add(()=>{if(++frames===2){s.onAfterRenderObservable.remove(o);resolve();}});}));
    // Two pointers: a thumb can move while the other rotates the camera.
    const client=await ctx.newCDPSession(page);
    const box=await page.locator('#stick').boundingBox(),cx=box.x+box.width/2,cy=box.y+box.height/2;
    const before=await pos();
    await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1},{x:240,y:300,id:2}]});
    await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx,y:cy-35,id:1},{x:275,y:310,id:2}]});
    await page.waitForTimeout(650);
    await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    const after=await pos();assert(after.z>before.z+.03,'touch movement');assert(after.yaw>before.yaw+.03,'simultaneous view rotation');
    await page.waitForTimeout(200);const stopped=await pos();assert(Math.abs(stopped.z-after.z)<.01,'release stops movement');
    // Place the visitor next to a solid console: W must stop at its front edge.
    await page.evaluate(()=>{const c=BABYLON.EngineStore.LastCreatedScene.activeCamera;c.position.set(-8,2.1,-20.95);c.rotation.set(0,Math.PI,0);document.getElementById('hangarCanvas').focus();});
    await page.keyboard.down('w');await page.waitForTimeout(650);await page.keyboard.up('w');assert((await pos()).z>=-21.1,'console collision');
    await page.evaluate(()=>{const c=BABYLON.EngineStore.LastCreatedScene.activeCamera;c.position.set(0,2.1,-9.6);c.rotation.set(0,0,0);});
    await page.keyboard.down('w');try{await page.waitForFunction(()=>BABYLON.EngineStore.LastCreatedScene.activeCamera.position.z>-8.9,null,{timeout:10000});}finally{await page.keyboard.up('w');}assert((await pos()).z>-8.9,'central aisle no longer blocked by consoles');
    await page.locator('#optionsButton').click();await page.locator('#quality').selectOption('low');
    assert(await page.evaluate(()=>BABYLON.EngineStore.LastCreatedScene.shadowsEnabled===false),'low mode shadows');
    await page.locator('#pauseButton').click();assert(await page.evaluate(()=>BABYLON.EngineStore.LastCreatedScene.getEngine()._activeRenderLoops.length===0),'pause stops GPU loop');
    await page.locator('#pauseButton').click();await page.locator('#resetView').click();
    assert.deepEqual(await page.locator('.launchpad a').evaluateAll(links=>links.map(a=>a.getAttribute('href'))),['dex.html','prompt.html','play.html']);
    const detail=await page.locator('#inspect').getAttribute('href');assert(detail.includes('mech='),'deep link');const expectedName=new URL(detail,base).searchParams.get('mech');
    await page.goto(base+'/'+detail,{waitUntil:'domcontentloaded'});await page.locator('.sheet').waitFor({timeout:60000});assert((await page.locator('.sheet').textContent()).includes(expectedName),'correct detail opens');
    await page.locator('.sheet .bar button').last().click();
    assert(await page.locator('a[href="index.html"]').count(),'archive home link');
    // Runtime failure must not remove access to any of the three applications.
    const fallback=await ctx.newPage();await fallback.route('**/babylon.js',r=>r.abort());await fallback.goto(base+'/index.html',{waitUntil:'domcontentloaded'});await fallback.getByText('3D 격납고를 열지 못했습니다.').waitFor();assert.equal(await fallback.locator('.launchpad a').count(),3);
    assert.deepEqual(errors,[]);console.log('PASS hangar: Fold layouts, multitouch, release, collisions, quality, pause, navigation, archive detail, engine-failure fallback');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
