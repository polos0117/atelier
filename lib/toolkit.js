/* 툴킷 기록 공통 계층 — prompt.html 이 남긴 설정을 다른 화면이 읽는다.
   lib/img.js 와 같은 방식으로 window.AtelierToolkit 하나만 붙인다. 빌드 없음.

   자료가 세 겹이다. 뒤엣것이 앞엣것을 덮는다.
     1) toolkit-data.json   저장소에 커밋해 두는 기반 기록
     2) generation/m-<해시>/ 기체별 기록 (PerMechRecords 가 읽어 넘겨준다)
     3) localStorage        같은 브라우저에서 방금 만진 설정
   1 과 2 중에서는 2 가, 그 결과와 3 중에서는 시각(t)이 나중인 쪽이 이긴다.

   여기서는 읽기만 한다. 쓰는 곳은 prompt.html 하나뿐이어야 기록이 엉키지 않는다. */
(function (root) {
  'use strict';

  var STORE_KEY = 'atelier_toolkit_v1';
  var DATA_URL = 'toolkit-data.json';
  var GEN_URL = 'data/generation.json';

  var TK = { base: {}, local: {}, baseUsed: {}, localUsed: {} };
  var GEN = {};
  /* 기체별 기록 — 화면이 PerMechRecords 로 받아 와서 넣어 준다 */
  var cardSettings = Object.create(null);
  var cardGeneration = Object.create(null);

  /* 콜라주로 어떤 카테고리를 뽑아봤는지. 채택이 아니라 복사 기록이다 */
  var CAT = {
    adult_roleplay: '성인 역할극', occupation_basic: '직업(기본)', occupation_sensual: '직업(섹시)',
    everyday_basic: '일상(기본)', everyday_sensual: '일상(섹시)', swimwear: '수영복', active: '액티브',
    source_editorial: 'SOURCE 에디토리얼', homewear: '홈웨어', private_evening: '프라이빗 이브닝',
    lingerie: '란제리', everyday: '일상', wildcard: '와일드카드', auto_random: '자동/랜덤'
  };
  /* 요약에 넣을 설정 항목과 이름표. 여기 있는 것만, 이 차례로 찍는다 */
  var LABEL = {
    'facial ethnicity': '계통', 'apparent age': '나이', 'body type': '체형',
    'hair color': '머리색', 'hair length': '머리길이', 'hairstyle': '헤어', 'eye color': '눈색',
    'facial hair': '수염', 'face shape': '얼굴형', 'facial character': '인상', 'skin tone': '피부'
  };

  function load() {
    try {
      var o = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (o && o.anthro) TK.local = o.anthro;
      if (o && o.used) TK.localUsed = o.used;
    } catch (e) {}
    return fetch(DATA_URL, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (j) { if (j.mechs) TK.base = j.mechs; if (j.used) TK.baseUsed = j.used; }
        return TK;
      })
      .catch(function () { return TK; });
  }

  function loadGeneration() {
    return fetch(GEN_URL, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (j) { GEN = j || {}; return GEN; })
      .catch(function () { return GEN; });
  }

  /* 화면이 PerMechRecords.load(name) 으로 받은 것을 넘겨 준다 */
  function putCardRecords(name, data) {
    if (!data) return;
    if (data.settings) cardSettings[name] = data.settings;
    if (data.images) for (var k in data.images) cardGeneration[k] = data.images[k];
  }

  function recordOf(name) {
    var a = TK.local[name];
    var b = cardSettings[name] ? cardSettings[name].record : TK.base[name];
    if (!a) return b || null;
    if (!b) return a;
    return (a.t || 0) >= (b.t || 0) ? a : b;
  }

  function usedOf(name) {
    var m = {};
    function add(arr) {
      (arr || []).forEach(function (r) { if (r.cat) m[r.cat] = (m[r.cat] || 0) + (r.n || 1); });
    }
    add(cardSettings[name] ? cardSettings[name].used : (TK.baseUsed || {})[name]);
    add((TK.localUsed || {})[name]);
    return Object.keys(m).map(function (k) {
      return (CAT[k] || k) + (m[k] > 1 ? ' ' + m[k] + '회' : '');
    });
  }

  /* "여 · 계통 동아시아 / 나이 20대 / 체형 글래머" 꼴. 성별마다 한 줄 */
  function summaryOf(name) {
    var r = recordOf(name);
    if (!r) return '';
    var out = [];
    ['female', 'male'].forEach(function (g) {
      if (!r[g]) return;
      var sel = r[g].sel || {}, cus = r[g].cus || {}, bits = [];
      for (var k in LABEL) if (cus[k] || sel[k]) bits.push(LABEL[k] + ' ' + (cus[k] || sel[k]));
      if (r[g].ub) bits.push('언더부스트');
      if (r[g].sp) bits.push('추가 지시 있음');
      if (bits.length) out.push((g === 'female' ? '여' : '남') + ' · ' + bits.join(' / '));
    });
    return out.join('\n');
  }

  /* 추가 지시 원문 — [{ gender:'female'|'male', label:'여'|'남', text }] */
  function notesOf(name) {
    var r = recordOf(name) || {}, out = [];
    ['female', 'male'].forEach(function (g) {
      if (r[g] && r[g].sp) out.push({ gender: g, label: g === 'female' ? '여' : '남', text: r[g].sp });
    });
    return out;
  }

  /* 이 그림을 뽑을 때 실제로 제출한 프롬프트 원문의 경로. 없거나 꼴이 어긋나면 null.
     경로를 그대로 링크로 걸기 때문에 모양을 검사한다 */
  var OK_PATH = /^(?:docs\/generation\/[a-z0-9-]+|generation\/m-[a-f0-9]{16}\/runs\/[a-z0-9-]+)\/[a-z0-9-]+\.txt$/;
  function promptPathOf(file) {
    var r = cardGeneration[file] || GEN[file], p = r && r.prompt;
    return (p && OK_PATH.test(p)) ? p : null;
  }


  /* ══ 보관함 ══
     툴킷이 브라우저에 남기는 기록(atelier_toolkit_v1)을 여는 자리.
     읽기는 위쪽 recordOf/usedOf 가 하고, 쓰기는 prompt.html 하나뿐이다.
     그래도 열쇠 이름과 저장 방식은 한 곳에 둔다 — 양쪽이 서로 다른 규칙으로
     같은 자리를 만지면 기록이 엉킨다.

     open() 이 돌려주는 것:
       data   읽어 온 객체 (기본값 위에 덮어씌운 것). 이 객체를 그대로 고쳐 쓰면 된다
       ok     저장이 가능한가. localStorage 가 막혀 있으면 false
       save() 250ms 모아서 적는다. 연달아 고쳐도 한 번만 쓴다
       flush()기다리지 않고 지금 적는다

     화면이 숨겨질 때는 스스로 flush 한다. 250ms 를 기다리는 사이에 탭이 닫히거나
     뒤로 밀리면 마지막 손질이 사라지는데, 폰에서는 앱을 내리는 순간 브라우저가
     페이지를 통째로 버리기도 해서 그 창이 생각보다 자주 열린다. */
  function open(key, defaults, onBlocked) {
    var data = defaults || {}, ok = true, timer = null;
    try {
      var raw = localStorage.getItem(key);
      if (raw) {
        var o = JSON.parse(raw);
        if (o && typeof o === 'object') data = Object.assign(data, o);
      }
    } catch (e) { ok = false; }

    function write() {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {
        ok = false;
        if (onBlocked) onBlocked(e);
      }
    }
    function save() {
      if (!ok) return;
      clearTimeout(timer);
      timer = setTimeout(write, 250);
    }
    function flush() {
      if (!ok) return;
      clearTimeout(timer);
      write();
    }

    addEventListener('pagehide', flush);
    addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') flush();
    });

    return {
      key: key, data: data, save: save, flush: flush,
      get ok() { return ok; }
    };
  }

  root.AtelierToolkit = {
    STORE_KEY: STORE_KEY, open: open,
    CAT: CAT, LABEL: LABEL,
    load: load, loadGeneration: loadGeneration, putCardRecords: putCardRecords,
    recordOf: recordOf, usedOf: usedOf, summaryOf: summaryOf, notesOf: notesOf,
    promptPathOf: promptPathOf
  };
})(window);
