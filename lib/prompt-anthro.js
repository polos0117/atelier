/* 의인화 프롬프트 만들기 — 화면 없이 도는 부분.

   prompt.html 안에 있을 때는 함수들이 스스로 화면을 뒤졌다. 그래서 같은 글을
   다른 화면에서 뽑을 수 없었고, 확인하려면 화면을 띄워야 했다.
   여기서는 값을 인자로 받는다. 화면에서 값을 걷는 일은 부르는 쪽 몫이다.

   자료 표는 lib/toolkit-spec.js(window.AtelierSpec)에서 가져온다. */
(function (root) {
  'use strict';

  var S = root.AtelierSpec;

  function andList(a){
    return a.length<2?(a[0]||''):a.slice(0,-1).join(', ')+', and '+a[a.length-1];
  }

  /* 민족은 정해 둔 얼굴 항목을 덮어쓰지 않는다 — 이미 적은 것은 그대로 두고
     나머지 이목구비로만 드러나게 한다 */
  function ethnicLock(e,pinned){
    var free=S.ETHNIC_PART.filter(function(x){
      return !x[1].some(function(k){return pinned.indexOf(k)>=0});
    }).map(function(x){return x[0]});
    free.push('skin undertone');   /* 피부 언더톤은 기하 항목이 없어 늘 민족 몫이다 */
    return andList(free)+' must clearly read as '+e+
      '; do not default to generic Western or Caucasian features'+
      (free.length<6
        ? '. The facial features specified explicitly in this list are already decided — '+
          'render them as written and let '+e+' show through the remaining features, '+
          'colouring rather than reshaping what is specified'
        : '')+
      '; keep the ethnicity consistent across every cut';
  }

  /* 두 눈 색이 다르면 좌우를 못 박고, 같으면 같음을 못 박는다 */
  function eyeNote(out){
    var e2=out.find(function(p){return p[0]==='second eye color'}); if(!e2)return;
    var e1=out.find(function(p){return p[0]==='eye color'});
    var right=e1?e1[1]:'the primary eye color', left=e2[1];
    if(e1&&right===left){
      out.push(['eye color consistency',
        'both eyes are '+right+'; keep the same eye colour consistently in both eyes']);
    }else{
      out.push(['heterochromia',
        'the character has heterochromia: the right eye is '+right+
        ' and the left eye is '+left+
        '; keep the two eye colours clearly distinct and preserve the same side assignment in every image — '+
        'do not swap the sides and do not blend the colours']);
    }
  }

  function styleRow(key){
    return S.ART_STYLES.find(function(x){return x[0]===key})||S.ART_STYLES[0];
  }
  function styleBlock(key){
    var r=styleRow(key);
    return '[ART STYLE]\n\n'+S.STYLE_PROFILES[r[0]].core+
      '\n\nThis art style governs all rendering, facial stylization, lighting, and material treatment throughout this prompt.';
  }
  function anthroStyleBlock(key){
    var profile=S.STYLE_PROFILES[key];
    return styleBlock(key)+'\n\n[ANTHRO STYLE EXTENSION]\n\n'+profile.anthro+'\n\n'+S.ANTHRO_STYLE_LOCK;
  }
  function translationProfileBlock(key){
    return '[TRANSLATION PROFILE]\n\n'+S.TRANSLATION_PROFILES[key];
  }
  function morphologyAdapterBlock(key){
    return '[SOURCE MORPHOLOGY ADAPTER]\n\n'+S.MORPHOLOGY_PROFILES[key];
  }

  /* 의인화 글에 일상 블록이, 일상 글에 의인화 블록이 섞이는 실수를 잡는다 */
  function audit(mode,prompt){
    var errors=[];
    if(mode===S.MODE.LIFESTYLE){
      ['[ANTHRO STYLE EXTENSION]','[TRANSLATION PROFILE]','[SOURCE MORPHOLOGY ADAPTER]'].forEach(function(tok){
        if(prompt.indexOf(tok)>=0)errors.push('Lifestyle prompt contains anthro block: '+tok);
      });
    }
    if(mode===S.MODE.ANTHRO){
      if(prompt.indexOf('[LIFESTYLE STYLE EXTENSION]')>=0)errors.push('Anthro prompt contains lifestyle block');
    }
    if(errors.length)console.warn('[promptAudit]',errors);
    return errors;
  }

  /* st = {mech, series, gender, style, morph, translation, params:[[열쇠,값],…]} */
  function buildAnthro(st){
    var lines=['gender: '+st.gender,'mobile suit name: '+st.mech,'series: '+st.series];
    st.params.forEach(function(p){lines.push(p[0]+': '+p[1])});
    var block='PARAMETERS = [\n'+lines.join(',\n')+'\n]';
    /* 화풍은 27개 파라미터 중 하나로 묻히면 힘이 약하다.
       콜라주·단일과 같이 독립 블록으로 올려 앞에 세운다. */
    var out2=S.templateC.replace('PARAMETERS = [\ngender,\nmobile suit name,\nseries\n]',block);
    /* 숫자를 넣으면 모델이 그것만 보고 특정 부위를 부풀리거나, 반대로 평균
       체형으로 되돌아간다. 숫자를 어떻게 읽어야 하는지 한 번 못 박아 둔다.
       비워 두면 이 블록 자체가 없다 — 기존 프롬프트가 그대로여야 하므로. */
    var bwh=lines.some(function(l){return l.indexOf('body measurements (B/W/H): ')===0})
      ? '\n\n[BODY MEASUREMENT NOTE]\n\n'+
        'The body measurements listed in PARAMETERS are approximate visual proportion and '+
        'relative body-balance guidance, not literal CAD-like dimensions. Read them together '+
        'with the descriptive body parameters, which define how the measurements should look. '+
        'Preserve believable adult human anatomy and do not exaggerate the bust, waist, hips, '+
        'thighs, or leg length solely because a numeric value is present.'
      : '';
    var full=anthroStyleBlock(st.style)+'\n\n'+morphologyAdapterBlock(st.morph)+'\n\n'+
      translationProfileBlock(st.translation)+
      '\n\n==================================================\n\n'+out2+bwh;
    audit(S.MODE.ANTHRO,full);
    return full;
  }

  root.AtelierPrompt = {
    andList: andList, ethnicLock: ethnicLock, eyeNote: eyeNote,
    styleRow: styleRow, styleBlock: styleBlock, anthroStyleBlock: anthroStyleBlock,
    translationProfileBlock: translationProfileBlock,
    morphologyAdapterBlock: morphologyAdapterBlock,
    audit: audit, buildAnthro: buildAnthro
  };
})(window);
