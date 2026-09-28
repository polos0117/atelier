/* Mobile hangar entry. Uses the archive's canonical image catalog, never copies it.
   Static geometry is merged by material; 30fps / CSS-pixel render targets by default.
   Navigation remains ordinary HTML and works even when WebGL/CDN/data fails. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('hangarCanvas'), loading = $('loading');
  const stick = $('stick'), knob = $('stickKnob');
  let engine, scene, camera, B, paused = false, ready = false, failed = false;
  let lastFrame = 0, targetFPS = 30, quality = 'balanced', gender = 'f', offset = 0;
  let records = [], bays = [], targets = [], currentBay = null, noticeTimer;
  let keys = {}, joy = {x:0,y:0}, stickPointer = null, look = null;
  const staticGroups = new Map(), obstacles = [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function notify(message) { $('notice').textContent = message; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => $('notice').textContent = '', 4500); }
  function persist() { try { localStorage.setItem('atelier_hangar_v1', JSON.stringify({quality,gender})); } catch (_) {} }
  try { const p = JSON.parse(localStorage.getItem('atelier_hangar_v1') || '{}'); if (['low','balanced','high'].includes(p.quality)) quality=p.quality; if (['f','m'].includes(p.gender)) gender=p.gender; } catch (_) {}
  $('quality').value=quality; $('gender').value=gender;
  function clearInput() { keys={}; joy={x:0,y:0}; stickPointer=null; look=null; knob.style.transform=''; }
  function resize() { document.documentElement.style.setProperty('--vh', (window.visualViewport ? visualViewport.height : innerHeight)+'px'); if(engine) engine.resize(); }
  resize(); addEventListener('resize', resize); if(window.visualViewport) visualViewport.addEventListener('resize', resize);
  $('optionsButton').onclick=() => { const open=$('options').hidden; $('options').hidden=!open; $('optionsButton').setAttribute('aria-expanded',String(open)); clearInput(); };
  $('resetView').onclick=() => { if(camera) resetView(); $('options').hidden=true; $('optionsButton').setAttribute('aria-expanded','false'); };
  $('quality').onchange=e => { quality=e.target.value; applyQuality(); persist(); };
  $('gender').onchange=e => { gender=e.target.value; persist(); updateExhibits(); };
  $('changeExhibits').onclick=() => { if(!records.length) return notify('전시 목록을 불러오는 중입니다.'); offset=(offset+bays.length)%records.length; updateExhibits(); notify('전시 기체를 바꿨습니다.'); };
  $('pauseButton').onclick=() => { paused=!paused; clearInput(); $('pauseButton').textContent=paused?'3D 다시 움직이기':'3D 일시정지'; $('pauseButton').setAttribute('aria-pressed',String(paused)); syncLoop(); };
  function applyQuality() { targetFPS=quality==='high'?60:30; if(!engine) return; if(scene)scene.shadowsEnabled=quality!=='low'; const ratio=quality==='low'?.7:quality==='high'?Math.min(devicePixelRatio||1,1.5):1; engine.setHardwareScalingLevel(1/ratio); engine.resize(); }
  function resetView() { camera.position.set(0,2.1,-16); camera.rotation.set(-.16,0,0); clearInput(); }
  function blocked() { return paused||document.hidden||!$('options').hidden||!ready; }
  addEventListener('keydown',e => { if(e.key==='Escape'){ $('options').hidden=true;$('optionsButton').setAttribute('aria-expanded','false');clearInput();return; } if(/INPUT|SELECT|TEXTAREA|BUTTON|A/.test(document.activeElement.tagName)||blocked())return; if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){keys[e.code]=true;e.preventDefault();} if(e.code==='KeyE'&&!e.repeat&&currentBay) location.href=detailURL(currentBay.record); });
  addEventListener('keyup',e=>delete keys[e.code]); addEventListener('blur',clearInput);
  stick.addEventListener('pointerdown',e=>{if(blocked()||stickPointer!==null)return;e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);});
  function moveStick(e){if(e.pointerId!==stickPointer)return;const r=stick.getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2,d=Math.hypot(x,y),s=d>38?38/d:1;joy={x:x*s/38,y:y*s/38};knob.style.transform=`translate(${x*s}px,${y*s}px)`;}
  stick.addEventListener('pointermove',moveStick);
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>stick.addEventListener(type,e=>{if(e.pointerId===stickPointer){stickPointer=null;joy={x:0,y:0};knob.style.transform='';}}));
  canvas.addEventListener('pointerdown',e=>{if(blocked()||look||e.button>0)return;canvas.focus({preventScroll:true});canvas.setPointerCapture(e.pointerId);look={id:e.pointerId,x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,moved:false};});
  canvas.addEventListener('pointermove',e=>{if(!look||look.id!==e.pointerId||blocked())return;const dx=e.clientX-look.x,dy=e.clientY-look.y;look.moved=look.moved||Math.hypot(e.clientX-look.sx,e.clientY-look.sy)>7;camera.rotation.y+=dx*.003;camera.rotation.x=Math.max(-1.15,Math.min(.7,camera.rotation.x+dy*.003));look.x=e.clientX;look.y=e.clientY;});
  canvas.addEventListener('pointerup',e=>{if(!look||look.id!==e.pointerId)return;const tap=!look.moved;look=null;if(tap&&scene&&!blocked()){const r=canvas.getBoundingClientRect();const pick=scene.pick(e.clientX-r.left,e.clientY-r.top,m=>!!m.metadata?.href);if(pick?.hit)location.href=pick.pickedMesh.metadata.href;}});
  ['pointercancel','lostpointercapture'].forEach(type=>canvas.addEventListener(type,()=>look=null));
  function syncLoop(){if(!engine||failed)return;engine.stopRenderLoop(render);lastFrame=0;if(!document.hidden&&!paused&&ready)engine.runRenderLoop(render);}
  document.addEventListener('visibilitychange',()=>{clearInput();syncLoop();});
  addEventListener('pagehide',()=>{clearInput();if(engine)engine.stopRenderLoop(render);});
  addEventListener('pageshow',()=>{resize();syncLoop();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();clearInput();notify('화면을 복구하는 중입니다. 메뉴는 계속 이용할 수 있습니다.');});
  canvas.addEventListener('webglcontextrestored',()=>{notify('격납고 화면을 복구했습니다.');syncLoop();});
  function detailURL(record){return record?'dex.html?mech='+encodeURIComponent(record.name)+'&gender='+gender:'dex.html';}
  function render(){const now=performance.now();if(lastFrame&&now-lastFrame<1000/targetFPS-1)return;const dt=lastFrame?Math.min((now-lastFrame)/1000,.06):1/targetFPS;lastFrame=now;if(!blocked())move(dt);scene.render();}
  function move(dt){let x=joy.x+(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);let z=-joy.y+(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);const n=Math.max(1,Math.hypot(x,z));x/=n;z/=n;const yaw=camera.rotation.y,step=dt*5.2,dx=(x*Math.cos(yaw)+z*Math.sin(yaw))*step,dz=(z*Math.cos(yaw)-x*Math.sin(yaw))*step;function valid(px,pz){return px>-14.7&&px<14.7&&pz>-22&&pz<21&&!obstacles.some(o=>Math.abs(px-o.x)<o.w&&Math.abs(pz-o.z)<o.d);}if(valid(camera.position.x+dx,camera.position.z))camera.position.x+=dx;if(valid(camera.position.x,camera.position.z+dz))camera.position.z+=dz;let best=null,score=-Infinity;for(const bay of bays){if(!bay.record)continue;const vx=bay.x-camera.position.x,vz=bay.z-camera.position.z,d=Math.hypot(vx,vz),facing=(vx*Math.sin(yaw)+vz*Math.cos(yaw))/Math.max(d,.01),s=facing*24-d*.2;if(s>score){score=s;best=bay;}}if(best&&best!==currentBay){currentBay=best;showCaption(best);} }
  function showCaption(bay){$('bayCode').textContent='BAY '+String(bay.index+1).padStart(2,'0')+' / ARCHIVE PROJECTION';$('bayName').textContent=bay.record.name;$('inspect').textContent='이 기체 도감 열기 ↗';$('inspect').href=detailURL(bay.record);}
  function fail(message){failed=true;if(engine)engine.stopRenderLoop(render);$('movement').hidden=true;$('lookHint').hidden=true;loading.hidden=false;loading.replaceChildren();const b=document.createElement('b');b.textContent=message;const span=document.createElement('span');span.textContent='아래 도감·프롬프트·드래프트는 계속 이용할 수 있습니다.';const retry=document.createElement('button');retry.textContent='다시 시도';retry.onclick=()=>location.reload();loading.append(b,span,retry);}
  function loadEngine(){return new Promise((resolve,reject)=>{const script=document.createElement('script');const timer=setTimeout(()=>reject(new Error('engine timeout')),35000);script.src='https://cdn.jsdelivr.net/npm/babylonjs@9.22.1/babylon.js';script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);reject(new Error('engine download'));};document.head.appendChild(script);});}
  function color(hex){return B.Color3.FromHexString(hex);}
  function material(name,hex,metal=.4,rough=.6){const m=new B.PBRMaterial(name,scene);m.albedoColor=color(hex);m.metallic=metal;m.roughness=rough;return m;}
  function emissive(name,hex){const m=new B.StandardMaterial(name,scene);m.disableLighting=true;m.emissiveColor=color(hex);m.diffuseColor=color(hex);return m;}
  function group(mesh,mat){mesh.material=mat;mesh.isPickable=false;if(!staticGroups.has(mat))staticGroups.set(mat,[]);staticGroups.get(mat).push(mesh);return mesh;}
  function box(name,x,y,z,w,h,d,mat,rot=0){const m=B.MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},scene);m.position.set(x,y,z);m.rotation.z=rot;return group(m,mat);}
  function label(text,x,y,z,w,h,rotation=0,ink='#b7d7e5',bg='#142431'){const t=new B.DynamicTexture('label:'+text,{width:1024,height:256},scene,false);const c=t.getContext();c.fillStyle=bg;c.fillRect(0,0,1024,256);c.fillStyle=ink;c.font='500 76px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText(text,512,133,960);t.update();const m=emissive('label material', '#000000');m.emissiveTexture=t;const p=B.MeshBuilder.CreatePlane('label',{width:w,height:h,sideOrientation:B.Mesh.DOUBLESIDE},scene);p.position.set(x,y,z);p.rotation.y=rotation;p.material=m;p.isPickable=false;return p;}
  function build(){
    B=window.BABYLON;if(!B||!B.Engine.isSupported())throw new Error('WebGL unavailable');
    engine=new B.Engine(canvas,true,{preserveDrawingBuffer:false,stencil:false,powerPreference:'default'},false);applyQuality();
    scene=new B.Scene(engine);scene.clearColor=new B.Color4(.026,.046,.064,1);scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.012;scene.fogColor=color('#152736');
    scene.environmentTexture=B.CubeTexture.CreateFromPrefilteredData('https://assets.babylonjs.com/environments/environmentSpecular.env',scene);scene.environmentIntensity=.5;
    scene.imageProcessingConfiguration.toneMappingEnabled=true;scene.imageProcessingConfiguration.toneMappingType=B.ImageProcessingConfiguration.TONEMAPPING_ACES;scene.imageProcessingConfiguration.exposure=1.25;scene.imageProcessingConfiguration.contrast=1.12;
    camera=new B.FreeCamera('visitor',new B.Vector3(0,2.1,-16),scene);camera.minZ=.12;camera.maxZ=110;camera.fov=.95;camera.inputs.clear();resetView();
    const hemi=new B.HemisphericLight('ambient',new B.Vector3(0,1,0),scene);hemi.intensity=.8;hemi.diffuse=color('#c4dbe6');hemi.groundColor=color('#172634');
    const key=new B.DirectionalLight('ceiling spill',new B.Vector3(.15,-1,.35),scene);key.intensity=1.35;key.diffuse=color('#e3f3ff');
    const blue=new B.PointLight('projection light',new B.Vector3(0,5,13),scene);blue.diffuse=color('#60c5ed');blue.intensity=20;blue.range=25;
    const warm=new B.PointLight('service light',new B.Vector3(-10,8,-10),scene);warm.diffuse=color('#ffbd73');warm.intensity=16;warm.range=25;
    const floor=material('brushed deck','#4a5860',.65,.46), wall=material('hull','#384955',.5,.63),frame=material('structural steel','#172832',.65,.42),panel=material('inset panels','#263641',.35,.6),edge=material('edge trims','#71818a',.75,.35),black=material('rubber','#0c151c',.1,.8),gold=material('safety yellow','#cf963e',.3,.5),cyan=emissive('projection','#48d9f2'),white=emissive('light strips','#d9eef5'),amber=emissive('hazard lamps','#ffa53f');
    // Repeating steel decking, with fine deterministic roughness. No large texture downloads.
    const deck=new B.DynamicTexture('deck finish',{width:512,height:512},scene,true);const ctx=deck.getContext();ctx.fillStyle='#788a95';ctx.fillRect(0,0,512,512);let seed=701;for(let i=0;i<16000;i++){seed=(seed*1664525+1013904223)>>>0;const a=seed/4294967296;ctx.fillStyle='rgba(15,26,35,'+(a*.10)+')';ctx.fillRect(seed%512,(seed>>>10)%512,1+(seed%5),1);}ctx.strokeStyle='#34444f';ctx.lineWidth=3;ctx.strokeRect(1,1,510,510);for(const x of [12,500])for(const y of [12,500]){ctx.fillStyle='#303e47';ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}deck.update();deck.uScale=10;deck.vScale=15;floor.albedoTexture=deck;
    const ground=B.MeshBuilder.CreateGround('deck',{width:34,height:50},scene);group(ground,floor);
    box('rear bulkhead',0,9,25,34,18,1,wall);box('entry bulkhead',0,9,-25,34,18,1,wall);box('port wall',-17,9,0,1,18,50,wall);box('starboard wall',17,9,0,1,18,50,wall);box('ceiling',0,18,0,34,.5,50,panel);
    for(let z=-24;z<=24;z+=8){
      box('roof crossbeam',0,16.9,z,34,.7,.5,frame);box('beam flange',0,17.3,z,34,.14,1.1,edge);
      for(const side of [-1,1]){const x=side*15.7;box('vertical rib',x,8.4,z,.6,16.8,.75,frame);box('rib face',x-side*.32,8.4,z,.12,16.8,.92,edge);box('brace',side*13.4,15.6,z,.35,5.7,.5,frame,-side*.72);box('rail',side*12.5,11.8,z,1,.4,7.9,frame);box('ceiling light',side*7,17.1,z,5,.08,.24,white);box('light recess',side*7,17.15,z,5.3,.3,.6,frame);
        for(let y=2;y<14;y+=4){box('wall module',side*16.3,y,z,.25,3.5,7,panel);box('panel seam',side*16.05,y+1.5,z,.08,.07,6.5,edge);}
      }
    }
    for(const side of [-1,1]){
      box('runway line',side*4.2,.012,0,.10,.02,47,gold);
      box('drain',side*5.1,.016,0,.38,.025,47,black);
      for(let z=-23;z<24;z+=1.3){box('drain grille',side*5.1,.035,z,.42,.015,.08,edge);box('guide light',side*4.2,.025,z,.14,.02,.19,cyan);}
      for(let z=-23;z<24;z+=3)box('ceiling pipe',side*15,14.7,z,.2,.2,2.95,edge);
    }
    for(let z=-21;z<18;z+=4)box('center deck marking',0,.021,z,.13,.02,1.1,gold);
    // Rear pressure door, catwalk and overhead gantry make the scale legible.
    box('pressure door recess',0,7.5,24.3,15,15,.3,black);box('door left',-3.7,7.5,24.05,7.2,14.6,.2,panel);box('door right',3.7,7.5,24.05,7.2,14.6,.2,panel);
    for(let y=1;y<15;y+=1.7)box('door rib',0,y,23.88,14.4,.10,.12,edge);
    label('MOBILE SUIT  /  ARCHIVE',0,16.1,23.7,12,1.5);
    box('gantry crane',0,15.1,5,29,.9,1.4,gold);for(let x=-13;x<14;x+=1.3)box('crane warning',x,15.12,4.28,.4,.86,.025,frame,.35);
    box('hoist',5,14.1,5,1.4,1.2,1.7,frame);box('hoist cable',5,10.5,5,.035,6,.035,edge);const hook=B.MeshBuilder.CreateTorus('hook',{diameter:.65,thickness:.12,tessellation:12},scene);hook.position.set(5,7.4,5);hook.rotation.x=Math.PI/2;group(hook,gold);
    for(const side of [-1,1]){box('catwalk',side*14,6.1,0,2,.24,46,frame);box('handrail',side*13.1,7.2,0,.075,.075,46,gold);for(let z=-22;z<24;z+=2.5)box('rail upright',side*13.1,6.65,z,.065,1.1,.065,gold);}
    const layout=[{x:0,z:18,rot:0},{x:-11,z:-5,rot:-Math.PI/2},{x:11,z:-5,rot:Math.PI/2},{x:-11,z:9,rot:-Math.PI/2},{x:11,z:9,rot:Math.PI/2}];
    layout.forEach((loc,index)=>{
      const root=new B.TransformNode('bay '+index,scene);root.position.set(loc.x,0,loc.z);root.rotation.y=loc.rot;
      const localBox=(name,x,y,z,w,h,d,mat)=>{const p=box(name,x,y,z,w,h,d,mat);p.parent=root;return p;};
      localBox('projection plinth',0,.28,0,7.5,.55,3.6,frame);localBox('plinth edge',0,.58,-1.7,7.2,.08,.1,cyan);
      localBox('hologram spine',0,6,.45,7,10.8,.35,frame);localBox('dark surround',0,6,.24,6.8,10.5,.18,black);
      for(const x of [-3.42,3.42]){localBox('projector edge',x,6,.04,.055,10.5,.06,cyan);localBox('support',x,5.5,.8,.26,11,.3,edge);}
      for(const y of [.92,11.16])localBox('screen frame',0,y,.03,6.85,.065,.08,cyan);
      for(const x of [-3,3]){localBox('uplight housing',x,.8,-1.3,.4,.35,.65,black);localBox('uplight glass',x,1,-1.3,.28,.045,.45,cyan);}
      const p=B.MeshBuilder.CreatePlane('archive hologram '+index,{width:6.6,height:9.9,sideOrientation:B.Mesh.DOUBLESIDE},scene);p.position.set(0,6,.015);p.parent=root;
      const mat=new B.StandardMaterial('hologram '+index,scene);mat.disableLighting=true;mat.emissiveColor=B.Color3.Black();mat.diffuseColor=B.Color3.Black();mat.alpha=.96;p.material=mat;p.isPickable=true;
      const nameplate=label('BAY '+String(index+1).padStart(2,'0'),0,12,.1,6.8,.95);nameplate.parent=root;
      const bay={...loc,index,root,plane:p,mat,record:null,token:0,texture:null};bays.push(bay);targets.push(p);
      // Axis-aligned footprints, expanded by the visitor's shoulder radius.
      obstacles.push({x:loc.x,z:loc.z,w:loc.rot?2.3:4.2,d:loc.rot?4.2:2.3});
    });
    // Three physical menu consoles; the same destinations are always in the HUD.
    [{x:-2.3,text:'ARCHIVE',href:'dex.html'},{x:0,text:'STUDIO',href:'prompt.html'},{x:2.3,text:'SORTIE',href:'play.html'}].forEach(c=>{box('console pedestal',c.x,.75,-9,1.3,1.5,.9,frame);box('console rim',c.x,1.65,-9,1.8,.8,.3,edge);const screen=label(c.text,c.x,1.67,-9.18,1.65,.63,0,c.href==='play.html'?'#f0b764':'#b4ebf4');screen.isPickable=true;screen.metadata={href:c.href};targets.push(screen);obstacles.push({x:c.x,z:-9,w:1,d:.9});});
    // Resolve parent world matrices before merging; keep only interactive meshes separate.
    for(const [mat,meshes] of staticGroups){for(const m of meshes)m.computeWorldMatrix(true);if(meshes.length>1){const merged=B.Mesh.MergeMeshes(meshes,true,true,undefined,false,false);if(merged){merged.name='static:'+mat.name;merged.isPickable=false;merged.freezeWorldMatrix();}}else meshes[0].freezeWorldMatrix();}
    // The hangar does not move: render its directional shadow atlas once.
    key.position.set(-6,17,-12);
    const shadows=new B.ShadowGenerator(1024,key);
    shadows.usePercentageCloserFiltering=true;shadows.filteringQuality=B.ShadowGenerator.QUALITY_LOW;
    shadows.bias=.002;shadows.normalBias=.025;shadows.setDarkness(.35);
    for(const mesh of scene.meshes){mesh.receiveShadows=true;if(mesh.name.startsWith('static:')&&!['static:brushed deck','static:projection','static:light strips','static:hazard lamps'].includes(mesh.name))shadows.addShadowCaster(mesh);}
    shadows.getShadowMap().refreshRate=B.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
    scene.shadowsEnabled=quality!=='low';
    scene.skipPointerMovePicking=true;scene.autoClear=true;scene.freezeMaterials();
    ready=true;loading.hidden=true;syncLoop();
    // Do not promise a measured device framerate; these are render caps.
    if(reduced) $('lookHint').lastChild.textContent='드래그로 둘러보기';
  }
  function imageFor(record){const entry=record.entry;return window.AtelierImg.portraitOf(entry,gender,'cinematic_semi_real')||window.AtelierImg.portraitOf(entry,gender==='f'?'m':'f','cinematic_semi_real');}
  function updateExhibits(){if(!scene||!records.length)return;for(const bay of bays){const record=records[(offset+bay.index)%records.length];bay.record=record;bay.plane.metadata={href:detailURL(record)};const file=imageFor(record),token=++bay.token;bay.mat.unfreeze();bay.mat.emissiveTexture=null;if(bay.texture){bay.texture.dispose();bay.texture=null;}bay.mat.markDirty();const texture=new B.Texture(window.AtelierImg.imgURL(file),scene,false,true,B.Texture.TRILINEAR_SAMPLINGMODE,()=>{if(token!==bay.token){texture.dispose();return;}if(bay.texture)bay.texture.dispose();bay.texture=texture;bay.mat.emissiveTexture=texture;bay.mat.markDirty();},()=>{texture.dispose();if(token===bay.token)notify(record.name+' 그림을 불러오지 못했습니다. 도감에서 확인해 주세요.');});texture.anisotropicFilteringLevel=4;}
    currentBay=null;move(0);
  }
  const dataPromise=Promise.all([window.AtelierImg.load(),fetch('data/mech.json',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('catalog');return r.json();})]);
  // Attach a rejection handler immediately while the renderer downloads.
  dataPromise.catch(()=>{});
  loadEngine().then(()=>{if(failed)return;build();return dataPromise.then(([img,mech])=>{const list=mech.cards.filter(c=>window.AtelierImg.portraitOf(img[c.name],'f')||window.AtelierImg.portraitOf(img[c.name],'m'));const preferred=['RX-78-2 건담','유니콘 건담','건담 에어리얼','스트라이크 프리덤','뉴 건담'];list.sort((a,b)=>{const ai=preferred.indexOf(a.name),bi=preferred.indexOf(b.name);return (ai<0?999:ai)-(bi<0?999:bi);});records=list.map(c=>({name:c.name,entry:img[c.name]}));if(!records.length){notify('전시 가능한 기체 초상이 없습니다.');return;}updateExhibits();}).catch(()=>notify('전시 목록을 불러오지 못했습니다. 도감 메뉴를 이용해 주세요.'));}).catch(()=>fail('3D 격납고를 열지 못했습니다.'));
  if(window.AtelierFresh)window.AtelierFresh.watch();
})();
