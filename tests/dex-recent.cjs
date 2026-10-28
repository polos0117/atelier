/* 도감 최근 추가 · 「새」 표시 검사.
   data/img.json 의 added(등록한 날)를 오늘 기준으로 바꿔 끼워 날짜와 무관하게 돈다.
   - 최근 추가 줄: 지난 7일 안의 그림만, 새것부터, 24장까지. 줄 안에서만 옆으로 밀리고
     문서는 옆으로 넘치지 않는다. 누르면 그 그림에 맞춰 시트가 열린다.
   - 「새」: 첫 방문엔 없음, 떠날 때 본 것을 남김, 다음 방문에 그 뒤 그림이 든 카드에만.
   - 필터의 「새 그림만」.
   Run: node tests/dex-recent.cjs   (ESM_DIR·CHROMIUM_PATH·BASE_URL 은 browser-harness.cjs 설명 참고) */
const fs = require('node:fs'), path = require('node:path');
const H = require('./browser-harness.cjs');
const ROOT = path.resolve(__dirname, '..');
const KEY = 'atelier_dex_seen_v1';

const day = n => { const z = new Date(Date.now() - n * 864e5);
  return z.getFullYear() + '-' + String(z.getMonth() + 1).padStart(2, '0') + '-' + String(z.getDate()).padStart(2, '0'); };

/* 기체 카드에서 그림을 여럿 가진 것을 골라 날짜를 나눠 준다 */
const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/img.json'), 'utf8'));
const mechs = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/mech.json'), 'utf8')).cards.map(c => c.name));
function filesOf(e) {
  const out = [], take = b => { if (!b) return; ['m', 'f'].forEach(g => b[g] && out.push(b[g]));
    ['casual', 'extra'].forEach(s => { const x = b[s]; if (Array.isArray(x)) out.push(...x); else if (x) Object.values(x).forEach(l => out.push(...l)); }); };
  take(e); Object.values(e.byStyle || {}).forEach(take);
  return out;
}
const pool = Object.keys(doc.img).filter(n => mechs.has(n) && filesOf(doc.img[n]).length >= 3).sort();
const [A, B, C] = pool, D = pool.slice(3, 15);
const OLD = day(40);
function dated(fresh) {
  const added = {};
  Object.keys(doc.added || {}).forEach(f => { added[f] = OLD; });
  if (fresh) {
    /* A 의 남성 초상·여성 초상·일상컷 하나가 오늘 (기체 이름 차례로 첫 카드는 일상컷이 있다) */
    filesOf(doc.img[A]).slice(0, 3).forEach(f => { added[f] = day(0); });
    filesOf(doc.img[B]).slice(0, 2).forEach(f => { added[f] = day(3); });
    filesOf(doc.img[C]).slice(0, 1).forEach(f => { added[f] = day(10); });   /* 7일 밖 */
    D.forEach(n => filesOf(doc.img[n]).slice(0, 3).forEach(f => { added[f] = day(5); }));
  }
  return JSON.stringify({ ...doc, added });
}
const inWindow = 3 + 2 + D.reduce((n, x) => n + Math.min(3, filesOf(doc.img[x]).length), 0);

(async () => {
  const h = await H.start();
  const T = [];
  const add = (n, ok, got) => T.push([n, !!ok, String(got === undefined ? '' : got)]);
  /* 다른 화면을 먼저 열어 두고 img.json 을 바꿔 끼운 뒤 도감으로 간다 — 진짜 자료로 먼저
     도감을 열면 떠날 때 그 자료의 「본 것」이 남아 첫 방문 검사가 흐려진다 */
  async function dex(opt, body) {
    const s = await h.open('robots.txt', opt);
    await s.ctx.route(/\/data\/img\.json(\?.*)?$/, r => r.fulfill({ contentType: 'application/json', body }));
    await s.page.goto(h.base + '/dex.html' + (opt.qs || ''), { waitUntil: 'domcontentloaded' });
    await s.page.locator('.grid>.cell').first().waitFor({ timeout: 30000 });
    await s.page.waitForTimeout(300);
    return s;
  }
  try {
    const body = dated(true);
    for (const vp of [[344, 882], [390, 844], [844, 390], [690, 829], [1280, 900]]) {
      const [w, ht] = vp, tag = w + '×' + ht;
      const s = await dex({ viewport: { width: w, height: ht }, mobile: w < 1000 }, body), p = s.page;
      const strip = await p.evaluate(() => {
        const list = document.querySelector('.recent-list'), sc = document.querySelector('.collection-scroll');
        const shots = [...document.querySelectorAll('.recent-shot')];
        return list && {
          n: shots.length, dates: shots.map(b => b.dataset.date), files: shots.map(b => b.dataset.file),
          scrolls: list.scrollWidth > list.clientWidth,
          page: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) <= innerWidth,
          inner: sc.scrollWidth <= sc.clientWidth + 1,
          stripFits: list.getBoundingClientRect().right <= innerWidth + 0.5,
          small: shots.filter(b => { const r = b.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).length,
          head: document.querySelector('.recent-head h2').textContent,
          beforeGrid: !!(list.compareDocumentPosition(document.querySelector('.grid')) & Node.DOCUMENT_POSITION_FOLLOWING),
        };
      });
      add(tag + ' 최근 추가 줄이 목록 위에 뜬다', strip && strip.head === '최근 추가' && strip.beforeGrid, JSON.stringify(strip && strip.head));
      if (!strip) { await s.close(); continue; }
      add(tag + ' 24장까지만', strip.n === Math.min(24, inWindow), strip.n + ' / ' + inWindow);
      add(tag + ' 새것부터', strip.dates.every((d, i) => !i || strip.dates[i - 1] >= d) && strip.dates[0] === day(0), strip.dates.slice(0, 5).join(','));
      add(tag + ' 7일 밖은 안 뜬다', !strip.files.includes(filesOf(doc.img[C])[0]) && strip.dates.every(d => d >= day(6)), strip.dates.slice(-3).join(','));
      add(tag + ' 문서가 옆으로 넘치지 않는다', strip.page && strip.inner && strip.stripFits, JSON.stringify(strip));
      add(tag + ' 줄 안에서 옆으로 민다', strip.scrolls);
      add(tag + ' 누르는 자리 44px 이상', strip.small === 0, strip.small);
      if (w === 344 || w === 1280) {
        /* 키보드로 닿으면 초점 테가 보인다 */
        await p.keyboard.press('Tab');
        const ring = await p.evaluate(() => { const b = document.querySelector('.recent-shot'); b.focus();
          const cs = getComputedStyle(b); return b.matches(':focus-visible') && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2; });
        add(tag + ' 초점 테(focus-visible)', ring);
        /* A 의 남성 초상(목록은 여성으로 연다)과 일상컷 하나 — 누르면 그 그림·성별로 시트가 열린다 */
        for (const target of [filesOf(doc.img[A])[0], filesOf(doc.img[A])[2]]) {
          await p.locator(`.recent-shot[data-file="${target}"]`).click();
          await p.locator('.sheet').waitFor({ timeout: 10000 });
          const sheet = await p.evaluate(() => ({ t: document.querySelector('#sheet-title').textContent,
            src: decodeURIComponent(document.querySelector('.sheet .art img').getAttribute('src')),
            g: document.querySelector('.sheet .sw button.on').textContent.trim()[0],
            mech: new URLSearchParams(location.search).get('mech') }));
          const g = /_m(_|\.)/.test(target) ? '남' : '여';
          add(tag + ' 누르면 그 기체 시트가 그 그림으로 열린다 · ' + target.split('_').pop(),
              sheet.t === A && sheet.mech === A && sheet.src.endsWith('/' + target) && sheet.g === g, JSON.stringify(sheet) + ' ← ' + target);
          await p.locator('.sheet [data-dialog-close]').click();
          await p.waitForTimeout(300);
          add(tag + ' 닫으면 누른 그림으로 초점이 돌아온다 · ' + target.split('_').pop(),
              await p.evaluate(f => document.activeElement && document.activeElement.dataset.file === f, target));
        }
        /* 찾는 중에는 접는다 */
        await p.evaluate(() => { document.querySelector('.collection-scroll').scrollTop = 0; });
        await p.fill('[aria-label="기체 이름 검색"]', A.slice(0, 2));
        await p.waitForTimeout(300);
        add(tag + ' 검색 중에는 접힌다', (await p.locator('.recent-strip').count()) === 0);
      }
      add(tag + ' JS 오류 없음', s.errors.length === 0, s.errors.join(' | '));
      await s.close();
    }

    /* 7일 안에 든 것이 없으면 줄 자체가 없다 */
    {
      const s = await dex({ viewport: { width: 390, height: 844 }, mobile: true }, dated(false));
      add('7일 안에 없으면 숨는다', (await s.page.locator('.recent-strip').count()) === 0);
      add('날짜가 다 오래되면 첫 방문 「새」도 없다', (await s.page.locator('.new-badge').count()) === 0);
      await s.close();
    }

    /* 첫 방문 — 「새」 없음. 떠날 때 본 것을 남긴다 */
    {
      const s = await dex({ viewport: { width: 390, height: 844 }, mobile: true }, body), p = s.page;
      add('첫 방문에는 「새」가 없다', (await p.locator('.new-badge').count()) === 0);
      add('보는 동안에는 아직 남기지 않는다', await p.evaluate(k => localStorage.getItem(k) === null, KEY));
      await p.evaluate(() => dispatchEvent(new PageTransitionEvent('pagehide')));
      const mark = await p.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), KEY);
      add('떠날 때 본 날짜를 남긴다', mark && mark.d === day(0) && filesOf(doc.img[A]).slice(0, 3).every(f => mark.f.includes(f)) && mark.f.length === 3, JSON.stringify(mark));
      await p.reload({ waitUntil: 'domcontentloaded' });
      await p.locator('.grid>.cell').first().waitFor({ timeout: 30000 });
      await p.waitForTimeout(300);
      add('다시 와도 그 뒤 새 그림이 없으면 「새」가 없다', (await p.locator('.new-badge').count()) === 0);
      add('첫 방문 JS 오류 없음', s.errors.length === 0, s.errors.join(' | '));
      await s.close();
    }

    /* 지난번(8일 전)에 본 뒤 들어온 그림이 든 카드에만 「새」 */
    {
      const prev = JSON.stringify({ d: day(8), f: [] });
      const s = await dex({ viewport: { width: 390, height: 844 }, mobile: true, store: [KEY, prev] }, body), p = s.page;
      const badged = await p.evaluate(() => [...document.querySelectorAll('.grid>.cell')]
        .filter(c => c.querySelector('.new-badge')).map(c => c.querySelector('.cell-open').textContent.trim()));
      const want = [A, B, ...D].sort();
      add('지난번 뒤 그림이 든 카드에만 「새」', JSON.stringify(badged.slice().sort()) === JSON.stringify(want), badged.length + ' / ' + want.length);
      add('7일 밖이어도 지난번 뒤가 아니면 「새」가 아니다', !badged.includes(C));
      add('「새」 카드는 장수를 글로도 알린다', await p.evaluate(a => {
        const c = [...document.querySelectorAll('.grid>.cell')].find(x => x.querySelector('.cell-open').textContent.trim() === a);
        return /새 그림 3장/.test(c.querySelector('.cap i').textContent);
      }, A));
      /* 같은 날 본 파일 목록에 없는 것만 새로 친다 */
      await s.close();
      const same = JSON.stringify({ d: day(0), f: filesOf(doc.img[A]).slice(0, 2) });
      const s2 = await dex({ viewport: { width: 390, height: 844 }, mobile: true, store: [KEY, same] }, body), p2 = s2.page;
      const one = await p2.evaluate(() => [...document.querySelectorAll('.grid>.cell')]
        .filter(c => c.querySelector('.new-badge')).map(c => c.querySelector('.cap i').textContent));
      add('같은 날 뒤에 들어온 그림만 「새」', one.length === 1 && /새 그림 1장/.test(one[0]), JSON.stringify(one));
      await s2.close();

      const s3 = await dex({ viewport: { width: 390, height: 844 }, mobile: true, store: [KEY, prev] }, body), p3 = s3.page;
      await p3.locator('.filter-toggle', { hasText: '필터' }).click();
      const btn = p3.locator('button', { hasText: '새 그림만' });
      add('필터에 「새 그림만」이 카드 수와 함께 있다', (await btn.count()) === 1 && (await btn.textContent()).includes(String(want.length)), await btn.count());
      const bh = await btn.boundingBox();
      add('「새 그림만」 44px 이상', bh && bh.height >= 44, bh && bh.height);
      await btn.click();
      await p3.waitForTimeout(300);
      const cells = await p3.evaluate(() => [...document.querySelectorAll('.grid>.cell')].map(c => !!c.querySelector('.new-badge')));
      add('「새 그림만」은 「새」 카드만 남긴다', cells.length === want.length && cells.every(Boolean), cells.length);
      add('「새 그림만」은 눌림 상태를 알린다', (await btn.getAttribute('aria-pressed')) === 'true');
      add('조건이 걸리면 최근 추가는 접힌다', (await p3.locator('.recent-strip').count()) === 0);
      add('필터 단추가 걸린 조건 수를 센다', /필터 1/.test(await p3.locator('.filter-toggle', { hasText: '필터' }).textContent()));
      await p3.locator('.view-tools button', { hasText: '조건 초기화' }).click();
      await p3.waitForTimeout(300);
      add('조건 초기화가 「새 그림만」도 푼다', (await btn.getAttribute('aria-pressed')) === 'false'
        && (await p3.locator('.grid>.cell').count()) > want.length);
      add('「새」 JS 오류 없음', s.errors.concat(s2.errors, s3.errors).length === 0, s.errors.concat(s2.errors, s3.errors).join(' | '));
      await s3.close();
    }
    H.report(T, '도감 최근 추가');
  } finally { await h.stop(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
