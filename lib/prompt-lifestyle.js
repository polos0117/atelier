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

  root.AtelierLifestyle = {
    GCHEST: GCHEST, GPOSS: GPOSS, GW: GW, catTable: catTable,
    exampleRecord: exampleRecord, exampleText: exampleText,
    carryValues: carryValues, ethnicityOf: ethnicityOf, carryBlock: carryBlock,
    lifestyleReferenceLock: lifestyleReferenceLock, lifestyleStyleBlock: lifestyleStyleBlock,
    heritageLine: heritageLine, buildSingle: buildSingle
  };
})(window);
