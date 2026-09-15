/* 일상컷(단일 컷) 프롬프트 만들기 — 화면 없이 도는 부분.
   lib/prompt-anthro.js 와 같은 규칙이다. 값은 부르는 쪽이 걷어서 넘긴다.

   st 에 담기는 것:
     source {mech, series}   ex, cat, catCustom, exCustom
     aspect, frame, expr, orient, pose, scene, outfit, camera, custom
     carryFace, carryBody, axes{}
     gender  'female' | 'male'      — 가슴/소유격 단어와 이어받기 성별을 가른다
     style   화풍 열쇠
     record  이 기체의 저장된 설정 (이어받기·전통 의상 계통에 쓴다). 없으면 null */
(function (root) {
  'use strict';

  var S = root.AtelierSpec;
  var AP = root.AtelierPrompt;

  /* 성별에 따라 갈리는 두 단어. 원본에서는 화면을 보고 정했다 */
  function GCHEST(g) { return g === 'male' ? 'chest' : 'bust'; }
  function GW(g) { return g === 'male' ? 'man' : 'woman'; }
  function GPOSS(g) { return g === 'male' ? 'his' : 'her'; }

  var CAT = null;
  function catTable() {
    if (!CAT) {
      CAT = {};
      S.CATS.forEach(function (r) { catTable()[r[0]] = { eng: r[1], ko: r[2], guide: r[3], sex: r[4] || '' }; });
    }
    return CAT;
  }

  function exampleRecord(cat,value){
    const list=S.EXAMPLE_MAP[cat]||[];
    return list.find(r=>r[0]===value)||null;
  }

  function exampleText(cat,value,custom=''){
    if(value==='__custom__')return custom.trim();
    /* AUTO 는 "예시를 안 골랐다" 는 뜻인데, 그 줄도 라벨이 "AUTO" 라 예전에는
       "thematic anchor: AUTO." 가 그대로 프롬프트에 실렸다. 아무 말도 아닌
       문장을 모든 판에 한 줄씩 넣고 있던 셈이다. 안 골랐으면 아무것도 안 낸다 */
    if(!value)return '';
    const r=exampleRecord(cat,value);return r?(r[5]||r[1]):'';
  }

  /* 저장된 설정에서 이어받을 값을 꺼낸다. rec 은 이 기체의 기록, g 는 성별 */
  function carryValues(list, rec, g) {
    if (!rec || !rec[g]) return [];
    var sel = (rec[g] && rec[g].sel) || {}, cus = (rec[g] && rec[g].cus) || {};
    var out = [];
    /* 기록은 고른 값과 직접 입력한 글을 따로 담는다. '직접 입력' 을 고른 항목은
       sel 에 __custom__ 이라는 표가 들어 있을 뿐이라, cus 에서 실제 글을 꺼내야
       한다. 안 그러면 프롬프트에 __custom__ 이 그대로 실려 나간다. */
    (list || S.CARRY_FACE.concat(S.CARRY_BODY)).forEach(function (p) {
      var k = p[0], en = p[1], v = sel[k];
      if (v === '__custom__') v = (cus[k] || '').trim();
      if (v) out.push([en, v]);
    });
    return out;
  }

  function ethnicityOf(rec, g) {
    if (!rec || !rec[g]) return '';          /* carryValues 와 같은 규칙 */
    return ((rec[g] || {}).sel || {})['facial ethnicity'] || '';
  }

  function carryBlock(includeFace,includeBody,rec,g){
    const v=[];
    if(includeFace){v.push(...carryValues(S.CARRY_FACE,rec,g)); AP.eyeNote(v);}
    if(includeBody)v.push(...carryValues(S.CARRY_BODY,rec,g));
    if(!v.length)return '';
    return '[CHARACTER IDENTITY SPEC]\n\n'+
      'The attached anthropomorphized reference image was generated from this specification:\n'+
      v.map(x=>'- '+x[0]+': '+x[1]).join('\n')+
      '\n\nPrecedence: the attached image remains the primary reference. Use this list to resolve anything the image leaves ambiguous'+
      (includeBody?' — including body proportions that the mobile-suit armor in the reference image may obscure'+
        (includeFace?', and to prevent facial drift across panels — especially ethnicity, facial structure, and apparent age, which tend to slide toward a generic default over six panels':'')+'. ':
        (includeFace?', and to prevent drift across panels — especially ethnicity, facial structure, and apparent age, which tend to slide toward a generic default over six panels. ':'. '))+
      /* 예전에는 여기서 끝났다. 그러면 장갑·포즈·원근 때문에 몸이 가려져
         '어긋나 보이는' 경우까지 이미지가 이기고, 정작 이 목록이 필요한
         자리에서 아무 일도 안 하게 된다. 뚜렷이 보일 때와 애매할 때를 가른다. */
      'Where the image shows something clearly and unambiguously, follow the image. '+
      'Where armor, pose, foreshortening, camera angle, cropping, or occlusion makes a detail ambiguous, use this list to resolve it rather than guessing.';
  }

  function lifestyleReferenceLock(g) {
    return S.LIFESTYLE_REFERENCE_LOCK_BASE.replace('{POSS}', GPOSS(g));
  }

  function lifestyleStyleBlock(styleKey) {
    var profile = S.STYLE_PROFILES[styleKey];
    return AP.styleBlock(styleKey) + '\n\n[LIFESTYLE STYLE EXTENSION]\n\n' +
      profile.lifestyle + '\n\n' + S.LIFESTYLE_STYLE_LOCK;
  }

  function heritageLine(catKey,ex,rec,g){
    if(catKey!=='traditional'&&!S.TRAD_EX[ex])return '';
    const named=ex&&ex!=='auto_traditional'&&ex!=='__custom__';
    /* 예시가 이미 문화를 지정했으면(한복·기모노 등) 그쪽이 이긴다.
       계통과 예시가 어긋날 때 두 지시가 싸우지 않게 한다. */
    if(named)return '\nHeritage source: the example above already names the tradition — follow it, '+
      'and keep construction, layering, and fastening faithful to it rather than mixing in other cultures.';
    const e=ethnicityOf(rec,g);
    return '\nHeritage source: '+(e?
      'use the clothing tradition of '+e+' heritage.':
      'infer the character\'s ethnic background from the attached reference image and use that clothing tradition.')+
      ' Keep construction, layering, and fastening faithful to that tradition — no mixed-culture pastiche.';
  }

  function buildSingle(st) {
    const src=st.source, cat=st.cat;
    const en=a2=>Object.fromEntries(a2.map(o=>[o[0],(o[1]||'').split(' — ')[0]]));
    const EX=en(S.EXPRESSION_OPTIONS), OR=en(S.ORIENTATION_OPTIONS), PO=en(S.POSE_OPTIONS);
    const parts=[
      '[INPUT]\n\nSOURCE MOBILE SUIT: ['+src.mech+']\n\nThis name is identity-provenance metadata only, used for lore, personality, and occupation context. It must not be used to reconstruct, restore, or invent mobile-suit armor, weapons, shields, backpacks, mechanical limbs, or other canonical equipment.\n\nUse the attached clearly adult anthropomorphized character as the absolute identity and equipment reference for this image.',
      '[IDENTITY LOCK]\n\nUse the SAME clearly adult '+GW(st.gender)+' as the attached reference. Preserve the same character identity, apparent adult age, ethnicity, recognizable eye shape, nose shape, mouth shape, jawline, skin tone, hair color, hairstyle, length, height, physique, shoulders, '+GCHEST(st.gender)+', waist, hips, and leg proportions. The facial identity must remain recognizable, but the facial rendering and facial proportions may be translated into a more refined anime-inspired visual language. The photorealism level of the reference image is not identity information and must not be copied. No identity drift, age drift, hairstyle redesign, or body redesign. Facial expression is not identity. The brows, eyelids, eye openness, mouth shape and lip parting must follow the expression specified elsewhere in this prompt \u2014 "preserve mouth shape" refers to the resting structure and proportion of the lips, not to holding a neutral mouth. A specified expression must be clearly readable on the face.',
      lifestyleReferenceLock(st.gender)
    ];
    parts.push(carryBlock(st.carryFace,st.carryBody,st.record,st.gender));
    parts.push(lifestyleStyleBlock(st.style));
    parts.push('[OUTPUT]\n\nCreate ONE SINGLE image in '+st.aspect+
      ' aspect. Exactly one '+GW(st.gender)+'. No collage, no panels, no split frames, no numerals, no captions, titles, labels, or any other text.');
    /* 카테고리 안내문은 콜라주 기준으로 쓰여 있어 "이 쌍은" 같은 말이 섞인다.
       한 장짜리에는 쌍도 다른 패널도 없으므로 단일 컷 문장으로 바꿔 넣는다. */
    const soloGuide=g=>String(g||'')
      .replace(/This pair is/g,'This cut is')
      .replace(/This pair should/g,'This cut should')
      .replace(/this pair/g,'this cut')
      .replace(/not already used by the other pairs/g,'not already used for this character')
      .replace(/the other pairs/g,'the other cuts')
      .replace(/\bpairs\b/g,'cuts').replace(/\bpair\b/g,'cut');
    let dir='[DIRECTION]\n\n';
    if(cat==='__custom__')dir+='Interpret this cut as: '+
      (st.catCustom||'a fresh mature concept of your choice')+'.';
    else if(cat==='auto_random')dir+='Invent a fresh mature concept of your own choosing.';
    /* 예전에는 카테고리 영문 이름을 한 줄 찍고 그 아래 가이드를 붙였다. 그런데
       가이드가 이미 같은 말을 쓸 수 있는 꼴로 다시 한다("Use tasteful adult
       lingerie-inspired evening fashion…"). 콜라주는 Pair 를 가르는 머리글이
       필요하지만 한 장짜리에는 나눌 것이 없어 이름표만 덩그러니 남았다 */
    else dir+=soloGuide((catTable()[cat]||{}).guide);
    const ex=exampleText(cat,st.ex,st.exCustom);
    if(ex)dir+='\nUse this as the thematic anchor: '+ex+'.';
    dir+=heritageLine(cat,st.ex,st.record,st.gender);
    parts.push(dir);
    const lines=[];
    const fr=st.frame; if(fr)lines.push('Framing: '+fr+'.');
    const e2=st.expr;
    if(e2)lines.push('Expression: '+(EX[e2]||e2)+
      (S.EXPRESSION_DETAIL[e2]?' \u2014 '+S.EXPRESSION_DETAIL[e2]:'')+'.');
    const o2=st.orient; if(o2)lines.push('Body orientation: '+(OR[o2]||o2)+'.');
    const p2=st.pose; if(p2)lines.push('Pose: '+(PO[p2]||p2)+'.');
    [['scene','Scene / Location'],['outfit','Outfit'],['camera','Camera / Lighting']].forEach(([k,lab])=>{
      const v=st[k]; if(v)lines.push(lab+': '+v+'.');
    });
    S.LOCAL_AXES.forEach(k=>{
      const v=st.axes[k];
      if(v)lines.push((S.ADV_EN[k]||k)+': '+v+'.');
    });
    const cu=st.custom; if(cu)lines.push('Additional instruction: '+cu+'.');
    if(lines.length)parts.push('[SETTINGS]\n\n'+lines.map(l=>'- '+l).join('\n'));
    /* 단일 컷도 같은 까닭으로 뺐다. 목록에 들어가던 것이 내부 열쇠였다.
       카테고리 회피는 sgAvoid 가 뽑기 단계에서 한다 */
    parts.push('[NON-EXPLICIT LIMITS]\n\nThe character must clearly read as an adult. The garments are securely fitted and fully opaque, and the styling is suitable for a mainstream fashion or lifestyle editorial. Allowed: sensual modern fashion, adult roleplay-inspired fashion, modern occupation styling, everyday fashion, swimwear, active fashion, source-inspired editorial fashion, lingerie-inspired fashion, exposed shoulders, back, waist, abdomen, thighs, high slits, secure cutouts, and semi-sheer outer layers over opaque inner garments. Do NOT depict exposed nipples, visible areolae, exposed genitals, transparent intimate exposure, wet-fabric nipple reveal, sexual activity, or sexual contact.');
    parts.push('[FINAL CHECK]\n\nVerify: exactly one image and one '+GW(st.gender)+'; the requested aspect ratio; no text anywhere in the frame; the selected category and example are followed; no explicit nudity or sexual activity.');
    const full=parts.filter(Boolean).join('\n\n==================================================\n\n');
    AP.audit(S.MODE.LIFESTYLE,full);
    return full;
  }


  /* 여섯 칸 모두 그 항목이 정해져 있는가. 하나라도 비면 다양성 지시를 넣는다 */
  function fixedAll(ps,key){
    for(var n=1;n<=6;n++){
      var v=ps.panels[n].ov[key]||'';
      if(!v){
        var sk={expression:'expr',orientation:'orient',pose:'pose'}[key];
        v=ps.pairs[pairForPanel(n)][sk]||'';
      }
      if(!v)return false;
    }
    return true;
  }

  function pairForPanel(n){return n<=2?1:n<=4?2:3;}

  function pairUsed(n,ps){return ps.pairs[n].use;}

  function getPair(n,ps){var q=ps.pairs[n];
    return{key:q.key,custom:q.custom,exampleKey:q.exampleKey,exampleCustom:q.exampleCustom};}

  function panelCat(n,ps){
    var p=pairForPanel(n);
    return pairUsed(p,ps)?ps.pairs[p].key:(ps.panels[n].cat||'auto_random');
  }

  function panelCatCustom(n,ps){
    var p=pairForPanel(n);
    return pairUsed(p,ps)?ps.pairs[p].custom:ps.panels[n].catCustom;
  }

  function panelLabel(n,ps){
    const cat=panelCat(n,ps);
    if(cat==='__custom__')return panelCatCustom(n,ps)||('Custom Panel '+n);
    return (catTable()[cat]||CAT.auto_random).eng;
  }

  function pairLabel(p,n){if(p.key==='__custom__')return p.custom||('Custom Pair '+n);return(catTable()[p.key]||CAT.auto_random).eng;}

  function panelDirection(n,ps,rec,g){
    const cat=panelCat(n,ps);
    let txt='PANEL '+n+' — ';
    if(cat==='__custom__'){
      txt+='CUSTOM\nInterpret this panel as: '+(panelCatCustom(n)||'Create a fresh mature category of your choice.')+'.';
    }else if(cat==='auto_random'){
      txt+='AUTO / RANDOM\nInvent a fresh mature category not duplicated by any other panel.';
    }else{
      const c=catTable()[cat]; txt+=c.eng+'\n'+c.guide;
    }
    const pn=ps.panels[n];
    const ex=exampleText(cat,pn.exampleKey,(pn.exampleCustom||'').trim());
    if(ex)txt+='\nUse this as the thematic anchor: '+ex+'.';
    txt+=heritageLine(cat,pn.exampleKey,rec,g);
    return txt;
  }

  function pairInstruction(p,pairNum,a,b,ps,rec,g){
    let txt='';
    if(p.key==='__custom__'){
      txt='PAIR '+pairNum+' — PANELS '+a+'-'+b+' — CUSTOM\nInterpret this pair as: '+(p.custom||'Create a fresh mature category of your choice.')+'.\nPanel '+a+' is the lighter or more restrained version. Panel '+b+' is the clearly stronger version.';
    }else if(p.key==='auto_random'){
      txt='PAIR '+pairNum+' — PANELS '+a+'-'+b+' — AUTO / RANDOM\nInvent a fresh mature category not duplicated by the other pairs. Panel '+a+' is lighter; Panel '+b+' is clearly stronger.';
    }else{
      const c=catTable()[p.key];
      txt='PAIR '+pairNum+' — PANELS '+a+'-'+b+' — '+c.eng+'\n'+c.guide+'\nPanel '+a+' should be comparatively lighter or more restrained. Panel '+b+' should be clearly bolder or stronger while remaining non-explicit.';
    }
    const ex=exampleText(p.key,p.exampleKey,p.exampleCustom);
    if(ex)txt+='\nUse this pair-level example as the thematic anchor: '+ex+'.';
    txt+=heritageLine(p.key,p.exampleKey);
    const pgv=ps.pairs[pairNum].adv.pair_gap||'';
    if(pgv)txt+='\nIntensity gap between these two panels: '+pgv+
      ' (overrides the global pair-gap setting for this pair only).';
    return txt;
  }

  function structureBlock(ps){
    const rows=[];
    [1,2,3].forEach(p=>{
      const a=(p-1)*2+1,b=a+1;
      if(pairUsed(p,ps)){
        rows.push('Pair '+p+' = Panel '+a+' < Panel '+b+' = '+pairLabel(getPair(p,ps),p));
      }else{
        rows.push('Panel '+a+' = '+panelLabel(a,ps)+'   (independent)');
        rows.push('Panel '+b+' = '+panelLabel(b,ps)+'   (independent)');
      }
    });
    let txt='[PANEL STRUCTURE]\n\n'+rows.join('\n');
    if([1,2,3].some(q=>pairUsed(q,ps)))
      txt+='\n\nWithin each pair, the first panel is relatively lighter or more restrained and the second panel is clearly stronger, bolder, more visually striking, or more intense.';
    if(![1,2,3].every(q=>pairUsed(q,ps)))
      txt+='\n\nPanels marked independent are not paired. Do not build a lighter/stronger relationship between them — treat each as its own separate concept.';
    return txt;
  }

  function diversityBlock(ps,adv){
    const anyPair=[1,2,3].some(p=>pairUsed(p,ps));
    const parts=['Create six substantially different scenes. The six panels should differ in location, action, outfit silhouette, body configuration, camera distance, camera angle, lighting, and atmosphere.',
      'Changing only colors, accessories, minor straps, mirrored poses, hand positions, or room props does NOT count as meaningful novelty.',
      'If several outfits would look almost identical as black silhouettes, redesign them.'];
    if(!adv.action_level)
      parts.push('At least four panels should show meaningful action and at least two should feel caught midway.');
    if(!fixedAll(ps,'expression'))
      parts.push('Avoid defaulting to the same blank neutral face across the collage.');
    if(!fixedAll(ps,'orientation'))
      parts.push('Deliberately vary front-facing, side, and rear-three-quarter body orientation.');
    parts.push('Avoid repeating the same dominant sensual mechanism across multiple panels.');
    return '[GLOBAL DIVERSITY]\n\n'+parts.join(' ')+(anyPair?'':'');
  }

  function directionBlocks(ps,rec,g){
    const out=[];
    [1,2,3].forEach(p=>{
      const a=(p-1)*2+1,b=a+1;
      if(pairUsed(p,ps))out.push(pairInstruction(getPair(p,ps),p,a,b,ps,rec,g));
      else{out.push(panelDirection(a,ps,rec,g));out.push(panelDirection(b,ps,rec,g));}
    });
    return out.join('\n\n');
  }

  function panelOverrideBlocks(ps){
    const out=[];
    /* 라벨은 "sleepy — 졸린 느낌" 형태다. 프롬프트에는 영문만 넣는다 */
    const en=a2=>Object.fromEntries(a2.map(o=>[o[0],(o[1]||'').split(' — ')[0]]));
    const exprMap=en(S.EXPRESSION_OPTIONS);
    const orientMap=en(S.ORIENTATION_OPTIONS);
    const poseMap=en(S.POSE_OPTIONS);
    for(let n=1;n<=6;n++){
      const cat=panelCat(n,ps);
      const pn=ps.panels[n];
      const exampleValue=pn.exampleKey;
      const exampleCustom=pn.exampleCustom;
      const ex=exampleText(cat,exampleValue,exampleCustom);
      const vals={};
      Object.keys(pn.ov).forEach(k=>{const v=(pn.ov[k]||'').trim();if(v)vals[k]=v;});
      /* 패널에 값이 없으면 그 Pair 값을 물려받는다 */
      const pp=pairForPanel(n);
      const axes=[];
      S.LOCAL_AXES.forEach(k=>{
        let v=ps.panels[n].ov['adv_'+k]||'';
        if(!v)v=ps.pairs[pp].adv[k]||'';
        if(v)axes.push([k,v]);
      });
      [['expression','expr','Expr'],['orientation','orient','Orient'],['pose','pose','Pose']].forEach(([k,sk,id])=>{
        if(vals[k])return;
        const v=ps.pairs[pp][sk];
        if(v)vals[k]=v;
      });
      if(ex||Object.keys(vals).length||axes.length){
        const lines=['[PANEL '+n+' OVERRIDE]'];
        if(ex)lines.push('Panel Example Concept: '+ex);
        if(vals.expression)lines.push('Expression: '+(exprMap[vals.expression]||vals.expression)+
          (S.EXPRESSION_DETAIL[vals.expression]?' \u2014 '+S.EXPRESSION_DETAIL[vals.expression]:''));
        if(vals.orientation)lines.push('Body Orientation: '+(orientMap[vals.orientation]||vals.orientation));
        if(vals.pose)lines.push('Pose: '+(poseMap[vals.pose]||vals.pose));
        if(vals.scene)lines.push('Scene / Location: '+vals.scene);
        if(vals.outfit)lines.push('Outfit: '+vals.outfit);
        if(vals.action)lines.push('Action / Pose: '+vals.action);
        if(vals.camera)lines.push('Camera / Lighting: '+vals.camera);
        if(vals.extra)lines.push('Extra: '+vals.extra);
        axes.forEach(([k,v])=>lines.push((S.ADV_EN[k]||k)+': '+v+' (overrides the global setting for this panel only)'));
        out.push(lines.join('\n'));
      }
    }
    return out;
  }

  function finalCheckBlock(ps,g,){
    const v=['exactly six panels','3×2 landscape layout','same adult '+GW(g)+' in all panels',
      'only numbers 1–6 appear','the selected category and example for each panel is followed'];
    if([1,2,3].some(q=>pairUsed(q,ps)))
      v.push('within each linked pair, the second panel is clearly stronger than the first');
    if(![1,2,3].every(q=>pairUsed(q,ps)))
      v.push('panels marked independent share no lighter/stronger relationship');
    if(!fixedAll(ps,'expression'))v.push('expressions are meaningfully varied and do not collapse into blank faces');
    if(!fixedAll(ps,'orientation'))v.push('front/side/back body orientation is intentionally distributed');
    v.push('outfits, scenes, actions, poses, and camera treatments remain varied');
    v.push('no explicit nudity or sexual activity');
    return '[FINAL CHECK]\n\nVerify: '+v.join('; ')+'.';
  }

  function additionalSettings(adv,custom,suppressed,g2,ps){
    const map={
      overall_intensity:'Overall sensual intensity',
      pair_gap:'Pair intensity gap',
      outfit_variety:'Outfit variety',
      scene_variety:'Scene variety',
      pose_variety:'Pose variety',
      camera_variety:'Camera variety',
      skin_exposure:'Visible non-intimate skin exposure',
      separates_preference:'Separates preference',
        action_level:'Action balance',
      direct_gaze_limit:'Maximum direct-camera gazes',
      smile_limit:'Maximum obvious smiles',
      unexpected_cuts:'Minimum unexpected coherent cuts',
      source_influence:'SOURCE influence outside source-editorial panels'
    };
    /* 표정·시점·포즈를 여섯 칸 모두 직접 지정했다면, 그 개수를 세는 전역 축은
       의미가 없어지고 지시가 겹친다. 그럴 때는 프롬프트에서 뺀다. */
    const SK={expression:'expr',orientation:'orient',pose:'pose'};
    const one=(n,key)=>ps.panels[n].ov[key]||ps.pairs[pairForPanel(n)][SK[key]]||'';
    const allSet=key=>{
      for(let n=1;n<=6;n++)if(!one(n,key))return false;
      return true;
    };
    /* 한 칸이라도 직접 지정했나 */
    const anySet=key=>{
      for(let n=1;n<=6;n++)if(one(n,key))return true;
      return false;
    };
    const drop={};
    if(allSet('expression'))drop.smile_limit=1;
    if(allSet('orientation')){drop.direct_gaze_limit=1;drop.camera_variety=1;}
    if(allSet('pose'))drop.pose_variety=1;
    const lines=[];
    Object.entries(adv).forEach(([k,v])=>{if(!drop[k])lines.push('- '+(map[k]||k)+': '+v+'.');});
    suppressed=Object.keys(drop).filter(k=>adv[k]);
    const expr=g2.expressionMode||'';
    const orient=g2.orientationMix||'';
    /* 여섯 칸을 다 지정했으면 "다양하게 하라"는 지정값과 정면으로 부딪힌다. 그때는 빼고,
       일부만 지정했으면 지정 안 한 칸에만 걸도록 범위를 좁힌다 */
    if(expr&&!allSet('expression'))
      lines.push('- Global expression mode: '+expr+
        (anySet('expression')
          ? '. Apply this only to panels that carry no explicit Expression setting; panels that specify one keep it exactly as written.'
          : '. Use varied expressions and avoid repeated blank faces.'));
    if(orient&&!allSet('orientation'))
      lines.push('- Global body-orientation mix: '+orient+
        (anySet('orientation')
          ? '. Apply this only to panels that carry no explicit Body Orientation setting; panels that specify one keep it exactly as written.'
          : '. Deliberately vary front-facing, side, and back-emphasis shots.'));
    const frameBase=g2.frame||'';
    if(frameBase)lines.push('- Baseline framing across all six panels: '+frameBase+'. Camera-distance and angle variation should happen around this baseline rather than replacing it, unless an individual panel explicitly overrides it.');
    if(custom)lines.push('- Additional custom instruction: '+custom+'.');
    if(!lines.length)lines.push('- Use balanced defaults.');
    return lines.join('\n');
  }

  function buildCollage(st){
    const ps=st.panels;
    const s=st.source,adv=st.adv,custom=st.custom;
    const parts=[
      '[INPUT]\n\nSOURCE MOBILE SUIT: ['+s.mech+']\n\nThis name is identity-provenance metadata only, used for lore, personality, and occupation context. It must not be used to reconstruct, restore, or invent mobile-suit armor, weapons, shields, backpacks, mechanical limbs, or other canonical equipment.\n\nUse the attached clearly adult anthropomorphized character as the absolute identity and equipment reference for this image.',
      '[IDENTITY LOCK]\n\nUse the SAME clearly adult '+GW(st.gender)+' in all six panels. Preserve the same character identity, apparent adult age, ethnicity, recognizable eye shape, nose shape, mouth shape, jawline, skin tone, hair color, hairstyle, length, height, physique, shoulders, '+GCHEST(st.gender)+', waist, hips, and leg proportions. The facial identity must remain recognizable, but the facial rendering and facial proportions may be translated into a more refined anime-inspired visual language. The photorealism level of the reference image is not identity information and must not be copied. No identity drift, age drift, hairstyle redesign, or body redesign. Only identity repeats. Facial expression is not identity. The brows, eyelids, eye openness, mouth shape and lip parting must follow the expression specified elsewhere in this prompt \u2014 "preserve mouth shape" refers to the resting structure and proportion of the lips, not to holding a neutral mouth. A specified expression must be clearly readable on the face.',
      lifestyleReferenceLock(st.gender),
      carryBlock(st.carryFace,st.carryBody,st.record,st.gender),
      '[OUTPUT]\n\nCreate ONE SINGLE 3:2 LANDSCAPE image as a clean 3-column × 2-row collage:\n1 | 2 | 3\n4 | 5 | 6\nExactly six equal, approximately square panels. Only small numerals 1–6 in the upper-left corners. No captions, titles, labels, subtitles, logos-as-text, or other words. Exactly one '+GW(st.gender)+' per panel.',
      lifestyleStyleBlock(st.style),
      structureBlock(ps),
      diversityBlock(ps,adv,st.gender),
      directionBlocks(ps,st.record,st.gender),
      '[ADDITIONAL SETTINGS]\n\n'+additionalSettings(adv,custom,st.suppressed||[],st.globals||{},ps)
    ];
    /* 예전에는 여기서 [ALREADY USED FOR THIS CHARACTER] 를 붙여, 이 기체로 이미
       뽑은 카테고리·예시를 늘어놓고 "이것들과 다르게 하라" 고 시켰다. 그런데 목록에
       들어가던 것이 내부 열쇠를 밑줄만 바꾼 것이었다 — open_shirt_lingerie 가
       "open shirt lingerie" 로 실렸다. 사람이 읽으라고 만든 말도 아니고 화면에
       뜨는 이름도 아닌, 코드 안에서 쓰는 이름이 그대로 나간 셈이다.
       회피는 이미 뽑기 쪽에서 한다 — "이미 쓴 카테고리는 빼고 뽑기" 를 켜면
       freshPool 이 후보에서 빼므로, 프롬프트에 이력을 적지 않아도 겹치지 않는다.
       쓴 컷 목록은 화면에 그대로 있다. */
    const ovs=panelOverrideBlocks(ps);
    if(ovs.length)parts.push('[PANEL OVERRIDES]\n\n'+ovs.join('\n\n'));
    parts.push('[NON-EXPLICIT LIMITS]\n\nThe character must clearly read as an adult. The garments are securely fitted and fully opaque, and the styling is suitable for a mainstream fashion or lifestyle editorial. Allowed: sensual modern fashion, adult roleplay-inspired fashion, modern occupation styling, everyday fashion, swimwear, active fashion, source-inspired editorial fashion, lingerie-inspired fashion, exposed shoulders, back, waist, abdomen, thighs, high slits, secure cutouts, and semi-sheer outer layers over opaque inner garments. Do NOT depict exposed nipples, visible areolae, exposed genitals, transparent intimate exposure, wet-fabric nipple reveal, sexual activity, or sexual contact.');
    parts.push(finalCheckBlock(ps,st.gender));
    const full=parts.filter(Boolean).join('\n\n==================================================\n\n');
    AP.audit(S.MODE.LIFESTYLE,full);
    return full;
  }

  root.AtelierLifestyle = {
    GCHEST: GCHEST, GPOSS: GPOSS, GW: GW, catTable: catTable,
    exampleRecord: exampleRecord, exampleText: exampleText,
    carryValues: carryValues, ethnicityOf: ethnicityOf, carryBlock: carryBlock,
    lifestyleReferenceLock: lifestyleReferenceLock, lifestyleStyleBlock: lifestyleStyleBlock,
    heritageLine: heritageLine, buildSingle: buildSingle,
    buildCollage: buildCollage,
    /* 화면 쪽에서 미리보기·요약을 그릴 때 쓰는 것들 */
    pairForPanel: pairForPanel, pairUsed: pairUsed, getPair: getPair,
    panelCat: panelCat, panelCatCustom: panelCatCustom, panelLabel: panelLabel,
    pairLabel: pairLabel
  };
})(window);
