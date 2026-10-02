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
  /* Portrait phones (Fold cover 344×882) get a fixed 60° horizontal view; a fixed vertical fov left them a ~23° tunnel of ceiling. */
  function fitLens() { if(!camera) return; const tall=innerWidth<innerHeight; camera.fovMode=tall?B.Camera.FOVMODE_HORIZONTAL_FIXED:B.Camera.FOVMODE_VERTICAL_FIXED; camera.fov=tall?1.05:.95; }
  function resize() { document.documentElement.style.setProperty('--vh', (window.visualViewport ? visualViewport.height : innerHeight)+'px'); fitLens(); if(engine) engine.resize(); }
  resize(); addEventListener('resize', resize); if(window.visualViewport) visualViewport.addEventListener('resize', resize);
  $('optionsButton').onclick=() => { const open=$('options').hidden; $('options').hidden=!open; $('optionsButton').setAttribute('aria-expanded',String(open)); clearInput(); };
  $('resetView').onclick=() => { if(camera) resetView(); $('options').hidden=true; $('optionsButton').setAttribute('aria-expanded','false'); };
  $('quality').onchange=e => { quality=e.target.value; applyQuality(); persist(); };
  $('gender').onchange=e => { gender=e.target.value; persist(); updateExhibits(); };
  $('changeExhibits').onclick=() => { if(!records.length) return notify('전시 목록을 불러오는 중입니다.'); offset=(offset+bays.length)%records.length; updateExhibits(); notify('전시 기체를 바꿨습니다.'); };
  $('pauseButton').onclick=() => { paused=!paused; clearInput(); $('pauseButton').textContent=paused?'3D 다시 움직이기':'3D 일시정지'; $('pauseButton').setAttribute('aria-pressed',String(paused)); syncLoop(); };
  function applyQuality() { targetFPS=quality==='high'?60:30; if(!engine) return; if(scene)scene.shadowsEnabled=quality!=='low'; const ratio=quality==='low'?.7:quality==='high'?Math.min(devicePixelRatio||1,1.5):1; engine.setHardwareScalingLevel(1/ratio); engine.resize(); }
  function resetView() { camera.position.set(0,2.1,-21.2); camera.rotation.set(innerWidth<innerHeight?-.06:-.16,0,0); clearInput(); }
  function blocked() { return paused||document.hidden||!$('options').hidden||!ready; }
  addEventListener('keydown',e => { if(e.key==='Escape'){ $('options').hidden=true;$('optionsButton').setAttribute('aria-expanded','false');clearInput();return; } if(/^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(document.activeElement.tagName)||blocked())return; if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)){keys[e.code]=true;e.preventDefault();} if(e.code==='KeyE'&&!e.repeat&&currentBay) location.href=detailURL(currentBay.record); });
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
  // Cylindrical pipes, jointed tools and actual trusses retain parallax when walking.
  function rod(name,a,b,r,mat,sides=10){const av=new B.Vector3(...a),bv=new B.Vector3(...b),delta=bv.subtract(av);const m=B.MeshBuilder.CreateCylinder(name,{height:delta.length(),diameter:r*2,tessellation:sides},scene);m.position=av.add(bv).scale(.5);m.rotationQuaternion=B.Quaternion.FromUnitVectorsToRef(B.Axis.Y,delta.normalize(),new B.Quaternion());return group(m,mat);}
  function ring(name,x,y,z,r,t,mat,axis='y'){const m=B.MeshBuilder.CreateTorus(name,{diameter:r*2,thickness:t,tessellation:16},scene);m.position.set(x,y,z);if(axis==='z')m.rotation.x=Math.PI/2;if(axis==='x')m.rotation.z=Math.PI/2;return group(m,mat);}
  function steelBeam(a,b,width,mat){rod('structural web',a,b,width*.22,mat,4);for(const dx of [-width/2,width/2])rod('beam flange',[a[0]+dx,a[1],a[2]],[b[0]+dx,b[1],b[2]],width*.18,mat,4);}
  function textureAsset(file,u=1,v=1){const t=new B.Texture('assets/hangar/'+file,scene,false,true,B.Texture.TRILINEAR_SAMPLINGMODE);t.uScale=u;t.vScale=v;t.anisotropicFilteringLevel=4;return t;}
  // Normal/roughness data are small analytic GPU material maps, not painted lighting.
  function surfaceMaps(name,repeatsU,repeatsV){
    const size=256,norm=new B.DynamicTexture(name+' normal',{width:size,height:size},scene,true),orm=new B.DynamicTexture(name+' roughness',{width:size,height:size},scene,true);
    const nc=norm.getContext(),oc=orm.getContext(),ni=nc.createImageData(size,size),oi=oc.createImageData(size,size);let seed=741;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){seed=(seed*1664525+1013904223)>>>0;const i=(y*size+x)*4,dx=Math.min(x%128,127-x%128),dy=Math.min(y%128,127-y%128),seam=Math.min(dx,dy);ni.data[i]=128+(dx<3?(x%128<64?-32:32):((seed%7)-3));ni.data[i+1]=128+(dy<3?(y%128<64?-32:32):0);ni.data[i+2]=250;ni.data[i+3]=255;oi.data[i]=seam<2?110:255;oi.data[i+1]=seam<3?218:85+((seed>>>12)%64);oi.data[i+2]=seam<2?30:195;oi.data[i+3]=255;}
    nc.putImageData(ni,0,0);oc.putImageData(oi,0,0);norm.update();orm.update();for(const t of [norm,orm]){t.uScale=repeatsU;t.vScale=repeatsV;t.gammaSpace=false;}return {normal:norm,orm};
  }
  function build(){
    B=window.BABYLON;if(!B||!B.Engine.isSupported())throw new Error('WebGL unavailable');
    engine=new B.Engine(canvas,true,{preserveDrawingBuffer:false,stencil:false,powerPreference:'default'},false);applyQuality();
    scene=new B.Scene(engine);scene.clearColor=new B.Color4(.025,.035,.04,1);scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.004;scene.fogColor=color('#303b40');
    scene.environmentTexture=B.CubeTexture.CreateFromPrefilteredData('https://assets.babylonjs.com/environments/environmentSpecular.env',scene);scene.environmentIntensity=.62;
    scene.imageProcessingConfiguration.toneMappingEnabled=true;scene.imageProcessingConfiguration.toneMappingType=B.ImageProcessingConfiguration.TONEMAPPING_ACES;scene.imageProcessingConfiguration.exposure=1.25;scene.imageProcessingConfiguration.contrast=1.15;
    camera=new B.FreeCamera('visitor',new B.Vector3(0,2.1,-16),scene);camera.minZ=.12;camera.maxZ=130;camera.fov=.95;fitLens();camera.inputs.clear();resetView();
    const hemi=new B.HemisphericLight('skylight bounce',new B.Vector3(0,1,0),scene);hemi.intensity=.28;hemi.diffuse=color('#d8e5eb');hemi.groundColor=color('#252b2b');
    const key=new B.DirectionalLight('clerestory daylight',new B.Vector3(.12,-1,.28),scene);key.intensity=2.25;key.diffuse=color('#ebf3f6');key.position.set(-6,22,-12);
    for(const [x,y,z,hex,power] of [[-9,7,-7,'#ffc88b',70],[9,8,8,'#b1e0ed',65]]){const l=new B.PointLight('maintenance light',new B.Vector3(x,y,z),scene);l.diffuse=color(hex);l.intensity=power;l.range=25;}
    const floor=material('brushed deck','#ffffff',.7,.47), wall=material('hull','#5c6466',.45,.7),frame=material('structural steel','#303c43',.75,.44),panel=material('enamel panels','#919994',.22,.52),edge=material('brushed aluminium','#9aa5a7',.88,.3),black=material('rubber','#11181c',.05,.9),gold=material('safety ochre','#bf8c35',.45,.52),cyan=emissive('projection','#3d9cab'),white=emissive('light strips','#d5eaf1'),amber=emissive('hazard lamps','#ffc583'),vent=material('vents','#354047',.6,.62);
    floor.albedoTexture=textureAsset('deck-albedo-v2.webp',8.5,12.5);const fm=surfaceMaps('deck',8.5,12.5);floor.bumpTexture=fm.normal;floor.bumpTexture.level=.35;floor.metallicTexture=fm.orm;floor.useRoughnessFromMetallicTextureGreen=true;floor.useRoughnessFromMetallicTextureAlpha=false;floor.useMetallnessFromMetallicTextureBlue=true;floor.useAmbientOcclusionFromMetallicTextureRed=true;
    panel.albedoTexture=textureAsset('enamel-albedo-v2.webp');const wm=surfaceMaps('enamel',1,1);panel.bumpTexture=wm.normal;panel.bumpTexture.level=.18;
    const ground=B.MeshBuilder.CreateGround('deck',{width:34,height:50},scene);group(ground,floor);
    frame.albedoTexture=textureAsset('deck-albedo-v2.webp');frame.bumpTexture=wm.normal;
    // The approved image is a real in-world continuation behind an inaccessible bulkhead.
    // It is not attached to the camera and is never stretched into a fake 360 panorama.
    box('entry bulkhead',0,10,-25,34,20,1,wall);box('port hull',-17,10,0,1,20,50,wall);box('starboard hull',17,10,0,1,20,50,wall);
    // Frontal image elevations stay on their physical walls; camera motion remains 3D.
    function wallElevation(name,file,width,height,x,y,z,rotation){
      const mesh=B.MeshBuilder.CreatePlane(name,{width,height},scene);
      mesh.position.set(x,y,z);mesh.rotation.y=rotation;
      const mat=emissive(name+' material','#000000');mat.emissiveTexture=textureAsset(file);mat.fogEnabled=false;
      mesh.material=mat;mesh.isPickable=false;mesh.freezeWorldMatrix();return mesh;
    }
    wallElevation('port wall elevation','port-wall-v3.webp',50,50*793/1983,-16.47,10,0,-Math.PI/2);
    wallElevation('starboard wall elevation','starboard-wall-v3.webp',50,50*793/1983,16.47,10,0,Math.PI/2);
    wallElevation('rear wall elevation','rear-wall-v3.webp',34,34*962/1635,0,10,-24.47,Math.PI);
    const backdrop=B.MeshBuilder.CreatePlane('approved hangar extension',{width:42,height:42*941/1672},scene);backdrop.position.set(0,10.65,26.5);const bg=emissive('approved background','#000000');bg.emissiveTexture=textureAsset('hangar-backdrop-v2.webp');bg.fogEnabled=false;backdrop.material=bg;backdrop.isPickable=false;
    box('extension lintel',0,19.8,24.9,34,1,1.8,frame);for(const side of [-1,1]){box('extension jamb',side*15.8,10,24.9,1,20,1.8,panel);box('portal seam',side*15.2,10,23.98,.12,18,.06,amber);}
    // Open clerestory, offset ceiling ribs and bracing replace the former solid roof.
    for(const side of [-1,1])box('roof side',side*11.6,20.1,0,10.7,.32,50,frame);
    const sky=emissive('skylight diffuser','#a8c3ce');box('clerestory glass',0,21.4,0,11.8,.12,50,sky);
    for(let z=-24;z<=24;z+=6){
      box('overhead I web',0,19.4,z,33,.85,.15,frame);box('overhead I flange',0,19.9,z,33,.14,.8,edge);box('overhead I lower flange',0,18.95,z,33,.12,.75,frame);
      for(const side of [-1,1]){box('overhead lighting trough',side*6,19.3,z,1.15,.18,4.8,black);box('overhead light diffuser',side*6,19.18,z,.85,.03,4.3,white);rod('roof diagonal',[side*6,19.95,z-2.7],[side*13,19.95,z+2.7],.065,edge);}
      box('skylight mullion',0,21.2,z,12,.15,.12,frame);
      for(const side of [-1,1]){const x=side*16;
        box('column web',x,9.6,z,.25,19.2,.75,frame);for(const dz of [-.45,.45])box('column flange',x,9.6,z+dz,.85,19.2,.10,edge);
        box('column shoe',x,.25,z,1.3,.5,1.25,frame);rod('knee brace',[x,15,z],[side*11,19,z],.12,edge);
        box('lamp housing',side*14.8,8.8,z,.8,.7,.32,black);box('lamp diffuser',side*14.8,8.8,z-.18,.58,.43,.025,amber);for(const dy of [-.3,.3])box('lamp cage',side*14.8,8.8+dy,z-.23,.8,.035,.045,frame);
        // Double-level service walkways, toe plates, proper handrails and braces.
        for(const y of [5.2,11.3]){box('maintenance platform',side*14.8,y,z,2.6,.22,5.98,frame);box('platform fascia',side*13.45,y-.18,z,.12,.5,5.98,panel);rod('walkway top rail',[side*13.4,y+1.08,z-3],[side*13.4,y+1.08,z+3],.045,gold);rod('walkway mid rail',[side*13.4,y+.58,z-3],[side*13.4,y+.58,z+3],.027,gold);for(const dz of [-2.8,0,2.8])rod('guardrail post',[side*13.4,y,z+dz],[side*13.4,y+1.08,z+dz],.035,gold);rod('platform support',[side*16,y-2,z],[side*13.5,y-.1,z],.085,frame);}
        // Real round pipes and flanges, with separated cable bundles.
        for(let k=0;k<3;k++){const px=side*(15.5-k*.28);rod('service pipe',[px,13.4+k*.35,z-3],[px,13.4+k*.35,z+3],k===0?.12:.07,k===0?edge:vent);ring('pipe flange',px,13.4+k*.35,z,.17,.045,edge,'z');}
        for(let k=0;k<3;k++)rod('vertical service riser',[side*(16.1-k*.25),.5,z+2.7],[side*(16.1-k*.25),16,z+2.7],.075,edge);
      }
    }
    // Deck drainage, inset rails, worn lane markings and light modules.
    for(const side of [-1,1]){
      box('drain trough',side*5.5,.018,0,.52,.025,47,black);
      for(let z=-23;z<24;z+=.42)box('drain grille',side*5.5,.036,z,.52,.015,.07,edge);
      for(let z=-23;z<24;z+=3){box('worn lane stripe',side*4.85,.023,z,.13,.02,2.35,gold);box('lane lamp casing',side*4.3,.045,z,.27,.075,.54,black);box('lane lamp glass',side*4.3,.088,z,.12,.015,.28,white);}
      for(const x of [side*2.1,side*2.3])box('recessed transfer track',x,.013,0,.05,.024,48,edge);
    }
    // End-to-end rail crane with mechanical carriage, wheels and suspended hook.
    for(const side of [-1,1])box('crane travel rail',side*13.6,16.6,0,.7,.8,48,frame);
    for(const z of [1.7,3.2]){box('crane girder web',0,16,z,28,1.0,.18,gold);for(const y of [15.5,16.5])box('crane flange',0,y,z,28,.12,.62,gold);}
    for(let x=-13;x<14;x+=2){rod('crane cross bracing',[x,15.6,1.7],[x+1.8,16.4,1.7],.055,frame);box('gantry stripe',x,16,1.59,.26,.9,.025,black,.3);}
    box('crane motor',6,17.05,2.5,1.7,.85,1.8,vent);for(const x of [5.1,6.9])for(const z of [1.7,3.2])rod('carriage wheel',[x-.12,16.75,z],[x+.12,16.75,z],.3,edge,12);
    for(const x of [5.8,6.2])rod('hoist cable',[x,16,2.5],[x,10,2.5],.025,black);box('hook block',6,9.9,2.5,.75,.8,.65,gold);ring('crane hook',6,9.28,2.5,.3,.13,edge,'z');
    // Service lockers and restrained ground equipment, outside the central aisle.
    for(const side of [-1,1])for(const z of [-22,-8,8,22]){
      const x=side*14.7;box('service cabinet',x,1.15,z,1.8,2.3,1.2,panel);box('cabinet kick plate',x,.16,z-.63,1.85,.3,.12,frame);for(let k=0;k<6;k++)box('cabinet vent',x,1.55+k*.08,z-.61,1.25,.025,.025,black);for(const dx of [-.6,.6])box('door handle',x+dx,1,z-.67,.045,.36,.045,edge);obstacles.push({x,z,w:1.35,d:1.0});
      const tank=B.MeshBuilder.CreateCylinder('pressure vessel',{height:2.3,diameter:.8,tessellation:12},scene);tank.position.set(side*15.6,1.3,z+1.3);group(tank,edge);ring('valve wheel',side*15.6,2.55,z+1.3,.18,.045,gold);
    }
    // Freestanding stairs provide a strong human scale without obstructing movement.
    for(const side of [-1,1]){const x=side*14.3,z0=-24;for(let k=0;k<15;k++){box('stair tread',x,.17+k*.35,z0+k*.28,1.9,.12,.33,edge);box('stair nosing',x,.235+k*.35,z0+k*.28-.16,1.9,.025,.035,gold);}for(const dx of [-1,1]){rod('stair stringer',[x+dx,.08,z0-.2],[x+dx,5.15,z0+4.1],.12,frame,4);rod('stair railing',[x+dx,1.1,z0-.2],[x+dx,6.2,z0+4.1],.045,gold);for(const k of [0,5,10,14])rod('stair rail post',[x+dx,.2+k*.35,z0+k*.28],[x+dx,1.25+k*.35,z0+k*.28],.035,gold);}obstacles.push({x,z:z0+2,w:1.6,d:2.6});}
    // Three paired maintenance berths face each other across an unobstructed aisle.
    const layout=[-16,0,16].flatMap(z=>[
      {x:-12,z,rot:-Math.PI/2,side:'PORT'},
      {x:12,z,rot:Math.PI/2,side:'STARBOARD'}
    ]);
    layout.forEach((loc,index)=>{
      const root=new B.TransformNode('bay '+index,scene);root.position.set(loc.x,0,loc.z);root.rotation.y=loc.rot;
      const localBox=(name,x,y,z,w,h,d,mat)=>{const p=box(name,x,y,z,w,h,d,mat);p.parent=root;return p;};
      // Floor berth outlines and overhead docking hardware make every station a service bay.
      for(const side of [-1,1]){
        localBox('berth floor boundary',side*4.15,.025,.2,.09,.025,5.6,gold);
        localBox('berth corner marking',side*3.6,.03,-2.55,1.15,.03,.12,gold);
        localBox('docking gantry foot',side*3.65,.3,1.75,.8,.6,.8,frame);
        localBox('docking gantry upright',side*3.65,5.45,1.75,.28,10.3,.4,frame);
      }
      localBox('docking crossbeam',0,10.6,1.75,7.6,.4,.6,frame);
      localBox('projection plinth',0,.25,0,6.2,.5,3.2,frame);localBox('plinth enamel fascia',0,.27,-1.61,5.9,.3,.04,panel);localBox('plinth seam light',0,.48,-1.65,5.5,.035,.035,cyan);
      localBox('projection backing',0,5.25,.40,5.4,8.1,.14,black);
      for(const x of [-2.7,2.7]){localBox('projector mast',x,4.5,.8,.18,9,.24,edge);localBox('projection rail',x,5.25,.23,.04,8.1,.04,cyan);for(const y of [2,5,8])localBox('mast clamp',x,y,.75,.42,.24,.4,frame);}
      for(const y of [1.2,9.3])localBox('projection trim',0,y,.22,5.4,.04,.04,cyan);
      const p=B.MeshBuilder.CreatePlane('archive hologram '+index,{width:5.3,height:7.95,sideOrientation:B.Mesh.DOUBLESIDE},scene);p.position.set(0,5.25,.20);p.parent=root;
      const mat=new B.StandardMaterial('hologram '+index,scene);mat.disableLighting=true;mat.emissiveColor=B.Color3.Black();mat.diffuseColor=B.Color3.Black();mat.alpha=.92;p.material=mat;p.isPickable=true;
      const nameplate=label('BAY '+String(index+1).padStart(2,'0')+' / '+loc.side,0,10,.25,5.8,.55);nameplate.parent=root;
      // Articulated maintenance arms behind the display: cylinders and real joints.
      for(const side of [-1,1]){
        const points=[[side*3.6,3,1.6],[side*3.4,6.8,1.2],[side*2.8,7.8,.6]];
        for(let k=0;k<2;k++){const arm=rod('maintenance arm',points[k],points[k+1],.19,panel,8);arm.parent=root;const hydraulic=rod('hydraulic piston',[points[k][0]+side*.2,points[k][1]+.4,points[k][2]],[points[k+1][0]+side*.2,points[k+1][1]-.3,points[k+1][2]],.07,edge);hydraulic.parent=root;}
        for(const pt of points){const joint=rod('arm pivot',[pt[0],pt[1],pt[2]-.19],[pt[0],pt[1],pt[2]+.19],.29,frame,12);joint.parent=root;}
        localBox('service tool',side*2.8,7.8,.15,.32,.6,.65,vent);
      }
      const bay={...loc,index,root,plane:p,mat,record:null,token:0,texture:null};bays.push(bay);targets.push(p);
      // Conservative rotated-rectangle footprints include support arms and visitor clearance.
      const c=Math.abs(Math.cos(loc.rot)),s=Math.abs(Math.sin(loc.rot));obstacles.push({x:loc.x,z:loc.z,w:4.05*c+2.0*s,d:4.05*s+2.0*c});
    });
    // Navigation consoles sit beside the entrance, outside the full-length central aisle.
    [{x:-8,text:'ARCHIVE',href:'dex.html'},{x:-5.5,text:'STUDIO',href:'prompt.html'},{x:8,text:'SORTIE',href:'play.html'}].forEach(c=>{
      const z=-22;box('console pedestal',c.x,.55,z,.55,1.1,.5,frame);box('console body',c.x,1.28,z,1.45,.62,.18,panel);
      const screen=label(c.text,c.x,1.29,z+.11,1.31,.46,Math.PI,c.href==='play.html'?'#f0b764':'#b4ebf4');
      screen.name='entrance console '+c.text;screen.isPickable=true;screen.metadata={href:c.href};targets.push(screen);obstacles.push({x:c.x,z,w:1,d:.9});
    });
    // Merge opaque static geometry by material, but retain bounded chunks for culling.
    for(const [mat,meshes] of staticGroups){for(const m of meshes)m.computeWorldMatrix(true);for(let i=0;i<meshes.length;i+=160){const chunk=meshes.slice(i,i+160);const merged=B.Mesh.MergeMeshes(chunk,true,true,undefined,false,false);if(merged){merged.name='static:'+mat.name+':'+i;merged.isPickable=false;merged.freezeWorldMatrix();}}}
    const shadows=new B.ShadowGenerator(1024,key);shadows.usePercentageCloserFiltering=true;shadows.filteringQuality=B.ShadowGenerator.QUALITY_LOW;shadows.bias=.001;shadows.normalBias=.04;shadows.setDarkness(.15);
    for(const mesh of scene.meshes){mesh.receiveShadows=true;if(mesh.name.startsWith('static:')&&!['static:brushed deck','static:projection','static:light strips','static:hazard lamps','static:skylight diffuser'].some(prefix=>mesh.name.startsWith(prefix)))shadows.addShadowCaster(mesh);}
    shadows.getShadowMap().refreshRate=B.RenderTargetTexture.REFRESHRATE_RENDER_ONCE;scene.executeWhenReady(()=>shadows.getShadowMap().resetRefreshCounter());
    scene.shadowsEnabled=quality!=='low';scene.skipPointerMovePicking=true;scene.autoClear=true;scene.freezeMaterials();
    ready=true;loading.hidden=true;syncLoop();
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
