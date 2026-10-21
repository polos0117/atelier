/* 도감 움직임 — 카드마다 입자 종류 하나를 고른다. lib/scene-motion.js(네 공방이 그대로 나눠 쓰는 모듈)는
   자료를 모르므로 이 저장소가 제 자료에서 이름을 골라 넘긴다. 쓰는 이름은 세 가지뿐이다
   (book-atelier docs/SCENE_MOTION.md 5절 · atelier):
     sparks  빔·전투·추진     dust  지상·사막·격납고     stars  우주

   고르는 차례 — 위에서 먼저 걸리는 것:
     1. 기체 태그 「지상용」「탱크」              → dust
     2. 지형 적성(data/mech.json terrain) 우주 > 지상 → stars,  지상 > 우주 → dust
     3. 첫 시리즈의 무대(아래 SERIES)              → stars · dust · sparks
   파일럿·지휘관·함은 지형·태그가 없어 3만 본다. 표에 없는 시리즈는 sparks.
   새 시리즈가 data/series.json 에 들어오면 tests/scene-motion.cjs 가 이 표에 적으라고 멈춘다.
   쓰는 자리: dex.html 상세 시트 — 초상 ↔ 특별 컷이 바뀔 때 reveal() 의 입자. */
(function (root) {
  'use strict';
  var KINDS = ['sparks', 'dust', 'stars'];
  /* 시리즈 → 무대. 우주에서 싸우는 이야기는 별, 땅(정글·사막·화성·폐허)은 먼지, 나머지는 빔·전투의 불꽃 */
  var SERIES = {
    '0079': 'sparks', '08MS': 'dust', '0080': 'sparks', '0083': 'stars',
    'Z': 'sparks', 'ZZ': 'sparks', 'CCA': 'stars',
    'SEED': 'sparks', 'DESTINY': 'sparks', 'FREEDOM': 'sparks', 'ASTRAY': 'sparks',
    '00': 'sparks', '00M': 'stars', 'IBO': 'dust', 'WM': 'stars',
    'W': 'sparks', 'EW': 'sparks', 'UNICORN': 'stars', 'NT': 'stars', 'HATHAWAY': 'dust',
    'G': 'sparks', 'X': 'dust', 'AGE': 'sparks', 'F91': 'stars', 'V': 'sparks',
    'TB': 'stars', 'TA': 'dust', 'GQ': 'stars'
  };
  var GROUND_TAGS = ['지상용', '탱크'];

  function firstSeries(card) {
    var s = card && card.series;
    return Array.isArray(s) ? s[0] : s;
  }
  /* 카드 하나 → 입자 종류 이름 */
  function kindOf(card) {
    if (!card) return 'sparks';
    var tags = card.tags || [];
    for (var i = 0; i < GROUND_TAGS.length; i++) if (tags.indexOf(GROUND_TAGS[i]) >= 0) return 'dust';
    var t = card.terrain;
    if (t && typeof t['우주'] === 'number' && typeof t['지상'] === 'number') {
      if (t['우주'] > t['지상']) return 'stars';
      if (t['지상'] > t['우주']) return 'dust';
    }
    return SERIES[firstSeries(card)] || 'sparks';
  }

  var api = { KINDS: KINDS, SERIES: SERIES, kindOf: kindOf };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AtelierDexMotion = api;
})(typeof window !== 'undefined' ? window : this);
