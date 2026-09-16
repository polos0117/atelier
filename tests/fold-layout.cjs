/* 폴드 레이아웃 — 하단 작업 버튼이 화면 안에 남아 있나.
   코드를 읽어서는 잡을 수 없는 부류다. 실제 크기로 그려서 재야 안다.
   Run: node tests/fold-layout.cjs   (ESM_DIR·CHROMIUM_PATH 는 browser-harness.cjs 설명 참고) */
const H = require('./browser-harness.cjs');

/* 요소가 화면 안에 온전히 들어와 있나. 반만 걸쳐 있으면 손가락이 닿지 않는다 */
function inside(sel) {
  const el = document.querySelector(sel);
  if (!el) return { ok: false, why: sel + ' 없음' };
  const r = el.getBoundingClientRect();
  if (r.height <= 0) return { ok: false, why: sel + ' 높이 0' };
  if (r.bottom > innerHeight + 1) return { ok: false, why: '아래가 ' + Math.round(r.bottom - innerHeight) + 'px 넘침' };
  if (r.top < -1) return { ok: false, why: '위가 ' + Math.round(-r.top) + 'px 잘림' };
  return { ok: true, why: Math.round(r.height) + 'px' };
}
function noWideScroll() {
  const w = document.documentElement.scrollWidth;
  return w <= innerWidth ? { ok: true, why: '' } : { ok: false, why: w + ' > ' + innerWidth };
}
function hasVh() {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--atelier-vh').trim();
  return /^\d+(\.\d+)?px$/.test(v) ? { ok: true, why: v } : { ok: false, why: '"' + v + '"' };
}

(async () => {
  const h = await H.start();
  const T = [];
  const push = (n, r) => T.push([n, !!(r && r.ok), (r && r.why) || '값 없음']);
  try {
    for (const [size, viewport] of Object.entries(h.FOLD)) {
      const tag = `${size} ${viewport.width}×${viewport.height}`;

      for (const [page, bar] of [['prompt.html', '.prompt-dock'],
                                 ['dex.html', '.collection-scroll'],
                                 ['play.html', '.setup-bottom']]) {
        const s = await h.open(page, { viewport, mobile: true });
        await s.page.waitForSelector(bar, { timeout: 20000 }).catch(() => {});
        push(`${tag} · ${page} · ${bar} 가 화면 안에`, await s.page.evaluate(inside, bar));
        /* 고정 껍데기라 문서 자체는 가로로 구르지 않아야 한다 */
        push(`${tag} · ${page} · 가로로 넘치지 않는다`, await s.page.evaluate(noWideScroll));
        /* 폴드에서 주소창·시스템 내비가 가시 영역을 바꾼다 — 그 높이를 쓴다 */
        push(`${tag} · ${page} · --atelier-vh 가 정해진다`, await s.page.evaluate(hasVh));
        /* 도감에는 초상이 500장 넘게 있다. 그림 주소가 어긋나면 여기서 드러난다.
           썸네일만 깨진 것은 잡히지 않는다 — 도감은 onerror 로 원본으로 되돌아간다.
           일부러 깨서 확인했다: thumbURL 만 깨면 통과하고(그게 맞다), 원본까지
           닿지 않게 하면 실패한다 */
        if (page === 'dex.html') {
          await s.page.waitForTimeout(1200);
          push(`${tag} · ${page} · 눈에 보이는 썸네일이 다 받아진다`, await s.page.evaluate(() => {
            /* 목록 썸네일은 loading="lazy" 라 화면 밖의 것은 아예 받지 않는다.
               그러니 "전부" 를 요구하면 안 되고, "하나라도" 로 두면 주소 규칙이
               깨져도 다른 경로로 뜬 그림 하나가 덮어 버린다. 화면 안의 것만 본다 */
            const seen = [...document.querySelectorAll('.cell img')].filter(i => {
              const r = i.getBoundingClientRect();
              return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
            });
            if (seen.length < 3) return { ok: false, why: '화면에 썸네일이 ' + seen.length + '개뿐 — 목록을 못 그렸다' };
            const bad = seen.filter(i => !(i.complete && i.naturalWidth > 0));
            return bad.length === 0
              ? { ok: true, why: seen.length + '장' }
              : { ok: false, why: '보이는 ' + seen.length + '개 중 못 받은 것 ' + bad.length
                    + ' (' + (bad[0].getAttribute('src') || '').slice(-46) + ')' };
          }));
        }
        T.push([`${tag} · ${page} · JS 오류 없음`, s.errors.length === 0, s.errors.join(' | ')]);
        await s.close();
      }

      /* 판이 돌기 시작하면 아래 띠가 바뀐다 — 폴드에서 이 띠가 밀려 나간 적이 있다 */
      const g = await h.open('play.html', { viewport, mobile: true });
      await g.page.waitForSelector('.setup-bottom button.launch', { timeout: 20000 }).catch(() => {});
      await g.page.click('.setup-bottom button.launch', { timeout: 10000 }).catch(() => {});
      await g.page.waitForSelector('.draft-bottom-nav', { timeout: 20000 }).catch(() => {});
      push(`${tag} · play.html(출격 후) · .draft-bottom-nav 가 화면 안에`,
           await g.page.evaluate(inside, '.draft-bottom-nav'));
      push(`${tag} · play.html(출격 후) · 가로로 넘치지 않는다`, await g.page.evaluate(noWideScroll));
      /* 뽑힌 카드마다 그림 자리가 채워져 있나 — 초상이 있으면 <img>, 없으면 대체 도형.
         둘 다 없으면 빈 칸이 남는다 */
      push(`${tag} · play.html(출격 후) · 카드마다 그림 자리가 찬다`, await g.page.evaluate(() => {
        const cards = [...document.querySelectorAll('.draft-card')];
        const empty = cards.filter(c => !c.querySelector('.candidate-image img, .candidate-image svg'));
        return cards.length && !empty.length
          ? { ok: true, why: cards.length + '장' }
          : { ok: false, why: '카드 ' + cards.length + '장 중 빈 것 ' + empty.length };
      }));
      T.push([`${tag} · play.html(출격 후) · JS 오류 없음`, g.errors.length === 0, g.errors.join(' | ')]);
      await g.close();
    }
    H.report(T, '폴드 레이아웃');
  } finally {
    await h.stop();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
