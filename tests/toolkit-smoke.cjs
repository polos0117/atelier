/* 툴킷(prompt.html) 브라우저 검사 — 코드만 읽어서는 안 보이는 자리만 본다.
   탭을 컴포넌트로 갈아끼우는 것, 아래 띠(독)가 탭을 넘어 사는 것,
   밀도가 그려지기 전에 정해지는 것, 도감이 걸어 오는 ?mech= 딥링크.
   Run: node tests/toolkit-smoke.cjs   (ESM_DIR·CHROMIUM_PATH 는 browser-harness.cjs 설명 참고) */
const H = require('./browser-harness.cjs');
const WIDE = { width: 1200, height: 1000 };
const STORE = 'atelier_toolkit_v1';

/* 복사는 OS 클립보드 권한에 매달리지 않게 가로챈다 */
function stubClipboard() {
  Object.defineProperty(navigator, 'clipboard', { configurable: true,
    value: { writeText: async t => { window.__copied = t; } } });
  /* 첫 그리기 직전 밀도를 붙잡아 둔다 — 나중에 정하면 한 번 깜빡인다 */
  requestAnimationFrame(() => { window.__firstPaintDensity = document.documentElement.dataset.density; });
}
const fire = ([label, value]) => {
  const el = document.querySelector('[aria-label="' + label + '"]');
  if (!el) return false;
  el.value = value; el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
};
const clickText = text => {
  const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === text);
  if (b) b.click();
  return !!b;
};

(async () => {
  const h = await H.start();
  const T = [];
  const add = (n, ok, got) => T.push([n, !!ok, String(got === undefined ? '' : got)]);
  /* 고르개는 기체를 고르면 접힌다 — 숨어 있어도 잡히게 attached 로 기다린다 */
  const boot = async opt => {
    const s = await h.open('prompt.html', Object.assign({ viewport: WIDE, init: stubClipboard }, opt));
    await s.page.waitForSelector('[aria-label=기체]', { state: 'attached', timeout: 20000 });
    await s.page.waitForTimeout(900);
    return s;
  };

  try {
    /* ── 탭·독 ─────────────────────────────────────── */
    {
      const s = await boot();
      await s.page.evaluate(fire, ['기체', '건담 엑시아']);
      await s.page.waitForTimeout(500);
      /* Preact 는 큰 덩어리를 조건부 템플릿으로 갈아끼우면 insertBefore 로 터진다.
         탭은 컴포넌트를 갈아끼워야 한다 — 여러 번 오가며 그것을 본다 */
      const tab = k => s.page.evaluate(k => {
        const b = [...document.querySelectorAll('[role=tab]')].find(x => x.textContent.trim() === k);
        if (b) b.click();
        return !!b;
      }, k);
      for (let i = 0; i < 4; i++) {
        for (const k of ['단일 컷', '콜라주', '의인화']) { await tab(k); await s.page.waitForTimeout(220); }
      }
      add('탭을 열두 번 오가도 안 터진다', s.errors.length === 0, s.errors.join(' | '));
      add('고르개는 탭 밖에 한 벌만 있다',
        await s.page.evaluate(() => document.querySelectorAll('[aria-label=기체]').length === 1));
      add('탭을 오가도 기체가 이어진다',
        await s.page.evaluate(() => document.querySelector('[aria-label=기체]').value === '건담 엑시아'));

      /* 독이 "지금 탭의" 글을 들고 있나. 탭이 독 등록에 실패해도 앞 탭의 등록이
         남아 있어 단추는 멀쩡해 보인다 — 그러면 엉뚱한 탭의 글이 복사된다.
         그래서 단추가 살아 있는지가 아니라, 넘기는 글이 이 탭이 보여 주는 글과
         같은지를 본다 */
      const seen = {};
      for (const k of ['의인화', '단일 컷', '콜라주']) {
        await tab(k); await s.page.waitForTimeout(700);
        /* 미리보기를 열어 이 탭이 보여 주는 글을 받는다 */
        const opened = await s.page.evaluate(() => {
          const b = [...document.querySelectorAll('.prompt-dock-actions button')]
            .find(x => x.textContent.trim() === '미리보기');
          if (b) b.click();
          return !!b;
        });
        await s.page.waitForTimeout(600);
        const shown = await s.page.evaluate(() => {
          const t = document.querySelector('.prompt-view textarea');
          return t ? t.value : '';
        });
        add(`${k} 탭 · 미리보기가 글을 보여 준다`, opened && shown.length > 500, shown.length + '자');
        /* 같은 상태에서 독의 복사가 그 글을 넘기나 */
        await s.page.evaluate(() => { window.__copied = ''; 
          document.querySelector('.prompt-dock-actions button.primary').click(); });
        await s.page.waitForTimeout(600);
        const copied = await s.page.evaluate(() => window.__copied || '');
        add(`${k} 탭 · 독의 복사가 그 탭의 글을 넘긴다`, copied === shown && copied.length > 500,
            `보인 글 ${shown.length}자 / 복사 ${copied.length}자`);
        seen[k] = shown;
        /* 미리보기를 닫아 다음 탭을 같은 상태에서 본다 */
        await s.page.evaluate(() => {
          const b = [...document.querySelectorAll('.prompt-dock-actions button')]
            .find(x => x.textContent.trim() === '미리보기');
          if (b) b.click();
        });
        await s.page.waitForTimeout(300);
      }
      /* 세 탭이 서로 다른 글을 만든다 — 하나라도 같으면 등록이 새고 있다 */
      const keys = Object.keys(seen);
      add('세 탭의 글이 서로 다르다',
          new Set(keys.map(k => seen[k])).size === keys.length,
          keys.map(k => k + '=' + seen[k].length + '자').join(' '));
      await s.close();
    }

    /* ── 고르개가 보여 주는 것 ───────────────────────── */
    {
      const s = await boot();
      const txt = sel => s.page.evaluate(x => (document.querySelector(x) || {}).textContent || '', sel);
      add('진행 현황이 뜬다', /초상 완료 \d+ \/ \d+기/.test(await txt('.srcbox:not(.verbox) .sb-txt')));
      add('판 날짜가 찍힌다', /판 \d\d-\d\d/.test(await txt('.bstamp')));
      add('변경 내역이 있다', await s.page.evaluate(() => /v\d+\.\d+ 변경 내역/.test(document.body.textContent)));
      await s.page.evaluate(fire, ['기체', '건담 엑시아']);
      await s.page.waitForTimeout(900);
      add('선택 정보에 기체·시리즈', /건담 엑시아\s+·/.test(await txt('.srcbox:not(.verbox) .sel-line')));
      /* 파일명 규칙은 이미지 등록과 맞아야 한다 — 어긋나면 올린 그림이 도감에 안 붙는다 */
      add('파일명 안내가 규칙대로다', await s.page.evaluate(
        () => /신규 파일명: 건담_엑시아_cinematic_semi_real_f\.webp/.test(document.body.textContent)));
      add('기체 목록에 ✓·◐ 표시', await s.page.evaluate(
        () => [...document.querySelector('[aria-label=기체]').options].some(o => /^[✓◐·] /.test(o.textContent))));
      add('화풍 견본 썸네일이 있다', await s.page.evaluate(() => document.querySelectorAll('.st-shot').length > 0));
      add('JS 오류 없음', s.errors.length === 0, s.errors.join(' | '));
      await s.close();
    }

    /* ── 밀도: 그려지기 전에 정해지나 (세 화면이 같은 열쇠를 쓴다) ── */
    for (const page of ['prompt.html', 'dex.html', 'play.html']) {
      for (const [saved, want] of [['relaxed', 'relaxed'], ['', 'compact'], ['엉뚱한값', 'compact']]) {
        const s = await h.open(page, { viewport: WIDE, init: stubClipboard,
          store: saved ? ['atelier_density_v1', saved] : null });
        await s.page.waitForTimeout(700);
        const v = await s.page.evaluate(() => ({ first: window.__firstPaintDensity,
                                                 now: document.documentElement.dataset.density }));
        add(`${page} · 저장값 "${saved || '없음'}" → 밀도 ${want}`,
            v.first === want && v.now === want, `첫그리기=${v.first} 지금=${v.now}`);
        await s.close();
      }
    }

    /* ── ?mech= 딥링크: 도감의 "툴킷에서 열기 →" 가 이 꼴로 걸어 온다 ── */
    {
      const last = JSON.stringify({ last: { series: '0079', mech: '자쿠Ⅱ' } });
      const read = s => s.page.evaluate(() => ({
        mech: document.querySelector('[aria-label=기체]').value,
        ser: document.querySelector('[aria-label=시리즈]').value,
        inList: [...document.querySelector('[aria-label=기체]').options]
          .some(o => o.value === document.querySelector('[aria-label=기체]').value) }));
      const open = async (qs, store) => {
        const s = await h.open('prompt.html' + qs, { viewport: WIDE, init: stubClipboard,
          store: store ? [STORE, store] : null });
        await s.page.waitForSelector('[aria-label=기체]', { state: 'attached', timeout: 20000 });
        await s.page.waitForTimeout(900);
        const v = await read(s); const errs = s.errors.slice(); await s.close();
        return { v, errs };
      };
      const Q = '?mech=' + encodeURIComponent('건담 엑시아');
      let r = await open(Q);
      add('딥링크 기체가 잡힌다', r.v.mech === '건담 엑시아', r.v.mech);
      add('시리즈는 전체로 둔다 (기체가 목록에서 사라지지 않게)', r.v.ser === '' && r.v.inList, r.v.ser);
      r = await open(Q + '&series=00');
      add('series 를 주면 그 시리즈로', r.v.ser === '00' && r.v.mech === '건담 엑시아', r.v.ser + '/' + r.v.mech);
      r = await open(Q + '&series=NOPE');
      add('그 기체의 것이 아닌 series 는 전체로', r.v.ser === '' && r.v.mech === '건담 엑시아', r.v.ser);
      r = await open(Q, last);
      add('저장된 마지막보다 딥링크가 이긴다', r.v.mech === '건담 엑시아', r.v.mech);
      r = await open('', last);
      add('딥링크가 없으면 저장된 마지막', r.v.mech === '자쿠Ⅱ' && r.v.ser === '0079', r.v.ser + '/' + r.v.mech);
      r = await open('?mech=' + encodeURIComponent('없는기체'), last);
      add('없는 기체를 주면 아무것도 안 고른다', r.v.mech === '', r.v.mech);
      add('딥링크에서 JS 오류 없음', r.errs.length === 0, r.errs.join(' | '));
    }

    H.report(T, '툴킷');
  } finally {
    await h.stop();
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
