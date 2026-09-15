/* 그림 자료 공통 계층 — 도감·툴킷·드래프트가 같이 쓴다.
   ES 모듈도 빌드도 쓰지 않는다. generation/loader.js 와 같은 방식으로
   window.AtelierImg 하나만 붙인다. 기존 페이지에 <script> 한 줄로 얹힌다.

   왜 모아 두는가:
   - URL 규칙(원본/썸네일), img.json 읽기, byStyle·casual·extra 구조를 읽는
     일이 페이지마다 따로 구현돼 있었다. 그래서 같은 버그를 여러 번 고쳤다.
     (2026-09: GitHub contents API 1,000개 상한 문제를 도감과 툴킷에서 따로 수정)
   - 여기 한 곳만 맞추면 세 화면이 같이 맞는다.

   img.json 구조:
     {"img": {"<카드>": {"face": {...}, "byStyle": {"<화풍>": <몫>}, ...<기본 몫>}}}
     <몫> = {"m": "파일", "f": "파일",
             "casual": {"f": [...], "m": [...]}, "extra": {...}}
     성별 표시가 없던 예전 자료는 casual/extra 가 배열 그대로일 수 있고,
     그때는 여성 몫으로 친다. */
(function (root) {
  'use strict';

  var BASE = 'https://polos0117.github.io/atelier/img/';
  var DATA = 'data/img.json';

  /* encodeURIComponent 는 작은따옴표를 그대로 둔다.
     onerror="...src='<여기>'" 처럼 속성 안에 넣을 때 깨지므로 같이 막는다 */
  function enc(f) { return encodeURIComponent(f).replace(/'/g, '%27'); }
  function imgURL(f) { return BASE + enc(f); }
  function thumbURL(f) { return BASE + 'thumb/' + enc(f); }

  /* 목록·갤러리에 쓰는 <img>. 썸네일을 먼저 걸고, 아직 없으면 원본으로 되돌아간다.
     썸네일은 register-images 워크플로가 make-thumbs.py 로 만들어 둔다 */
  function thumbTag(f, attr) {
    return '<img loading="lazy" src="' + thumbURL(f) + '" alt=""' +
      (attr ? ' ' + attr : '') +
      ' onerror="this.onerror=null;this.src=\'' + imgURL(f) + '\'">';
  }

  function isArr(x) { return Object.prototype.toString.call(x) === '[object Array]'; }

  /* 한 몫에서 일상컷·특별컷 목록 */
  function cuts(bucket, slot, v) {
    var box = bucket && bucket[slot];
    if (!box) return [];
    if (isArr(box)) return v === 'f' ? box : [];
    return box[v] || [];
  }

  /* 성별 가리지 않은 장수 */
  function cutCount(bucket, slot) {
    var box = bucket && bucket[slot], n = 0, g;
    if (!box) return 0;
    if (isArr(box)) return box.length;
    for (g in box) n += box[g].length;
    return n;
  }

  function hasPic(b) { return !!(b && (b.m || b.f)); }
  function styleMap(entry) { return (entry && entry.byStyle) || {}; }
  function styleKeys(entry) {
    var bs = styleMap(entry), out = [], k;
    for (k in bs) out.push(k);
    return out;
  }

  /* 한 몫이 내놓는 그림 전부 — 초상 → 일상 → 특별 차례 */
  function shotsOf(bucket, v) {
    if (!bucket) return [];
    return (bucket[v] ? [bucket[v]] : [])
      .concat(cuts(bucket, 'casual', v), cuts(bucket, 'extra', v));
  }

  /* 한 카드가 가진 그림 전부 (모든 화풍 · 남녀 · 화풍 미상인 기본 몫 포함) */
  function allShotsOf(entry) {
    if (!entry) return [];
    var bs = styleMap(entry), out = [], k, i;
    function add(list) {
      for (i = 0; i < list.length; i++) if (out.indexOf(list[i]) < 0) out.push(list[i]);
    }
    for (k in bs) { add(shotsOf(bs[k], 'f')); add(shotsOf(bs[k], 'm')); }
    add(shotsOf(entry, 'f')); add(shotsOf(entry, 'm'));
    return out;
  }

  /* 예시로 쓸 초상 한 장. 원하는 화풍이 있으면 그쪽을 먼저 보고,
     없으면 아무 화풍이나, 그것도 없으면 화풍 미상인 기본 몫 */
  function portraitOf(entry, v, preferStyle) {
    if (!entry) return null;
    var bs = styleMap(entry), k;
    if (preferStyle && bs[preferStyle] && bs[preferStyle][v]) return bs[preferStyle][v];
    for (k in bs) if (bs[k][v]) return bs[k][v];
    return entry[v] || null;
  }

  /* img.json 을 읽는다. GitHub API 는 쓰지 않는다 —
     contents API 는 디렉터리를 1,000개까지만 돌려주고(img/ 는 그보다 많다)
     비로그인 호출은 시간당 60회 제한도 있다. 이 파일은 등록 자동화가 갱신한다 */
  function load(url) {
    return fetch(url || DATA, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('img.json — ' + r.status);
      return r.json();
    }).then(function (j) { return (j && j.img) || {}; });
  }

  root.AtelierImg = {
    BASE: BASE, DATA: DATA,
    imgURL: imgURL, thumbURL: thumbURL, thumbTag: thumbTag,
    cuts: cuts, cutCount: cutCount, hasPic: hasPic,
    styleMap: styleMap, styleKeys: styleKeys,
    shotsOf: shotsOf, allShotsOf: allShotsOf, portraitOf: portraitOf,
    load: load
  };
})(window);
