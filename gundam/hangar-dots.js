/* 도트 데크 — data/sprites.json 의 도트 기체가 메인 메뉴(launchpad) 위 강판 데크(index.html 의 .hangar-dots, 배경 backgrounds/hangar.webp)를 거닌다(lib/sprite-actor.js, 공방 모음의 공용 재생기).
   데크는 이동 스틱 자리를 비우고(휴대폰 왼쪽·PC 오른쪽), 누름을 지나 보내며 인물만 받는다. 인물을 누르면 그 기체의 도감.
   좁으면 하나·보통 둘·넓으면 셋, 날마다 차례가 돈다. 도트가 없거나 그림을 못 받으면 데크째 없다 — 격납고는 그대로.
   발은 데크 앞선에서 10px 위. 화소 배율이 정수가 아닌 화면(폴드)에서는 grow 로 데크가 도트 키만큼 조금 자란다. */
(function () {
  'use strict';
  function start() {
    var SP = window.AtelierSprite, host = document.getElementById('hangarDots');
    if (!SP || !host) return;
    SP.load('data/sprites.json').then(function (d) {
      if (!d || !d.actors || !Object.keys(d.actors).length) return;
      var F = SP.floor(host, d, {
        floor: 10, grow: true, count: function (w) { return w < 210 ? 1 : w < 640 ? 2 : 3; },
        labelOf: function (k) { return k + ' 도트 — 눌러서 도감 열기'; },
        onSelect: function (k) { location.href = 'dex.html?mech=' + encodeURIComponent(k); }
      });
      F.ready().then(function () { host.hidden = !F.list().some(function (x) { return !x.actor.failed; }); });
    }, function () {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
