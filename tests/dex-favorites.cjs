/* 도감 즐겨찾기 — 상세 시트의 하트가 지금 보이는 그림 한 장을 담고 뺀다(lib/favorites.js, 열쇠 atelier_favorites_v1).
   - 담으면 aria-pressed·하트가 차고, 알림이 뜨고, 칸에 a·key·file·title·sub·thumb·full·link·at 이 맞게 적힌다
   - 그림마다 따로다(같은 카드의 다른 그림은 안 담긴 상태), 새것이 앞
   - 새로고침해도 남고, 칸의 link(?mech=&pic=)로 오면 그 그림으로 열린다
   - 「즐겨찾기 n」 이 공방 모음의 /favorites.html 로 간다
   - 저장이 막힌 브라우저에서는 던지지 않고 "못 담았다" 를 알린다
   - 344×882 · 390×844 · 844×390 · 690×829 · 1280×900 에서 누르는 자리 44px, 옆으로 안 넘친다
   lib/favorites.js 는 polos0117.github.io/favorites.js 와 글자 하나 다르지 않아야 한다(옆에 받아 두었으면 견준다).
   Run: node tests/dex-favorites.cjs   (ESM_DIR·CHROMIUM_PATH·BASE_URL 은 browser-harness.cjs 설명 참고) */
const fs = require('node:fs'), path = require('node:path');
const H = require('./browser-harness.cjs');
const ROOT = path.resolve(__dirname, '..');
const KEY = 'atelier_favorites_v1';

/* 그림이 셋 이상인 기체 하나 — 갤러리(.gal)가 뜬다 */
const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/img.json'), 'utf8'));
const mechs = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'data/mech.json'), 'utf8')).cards.map(c => c.name));
function femaleShots(e) {
  const out = [], take = b => { if (!b) return; if (b.f) out.push(b.f);
    ['casual', 'extra'].forEach(s => { const x = b[s]; if (Array.isArray(x)) return; if (x && x.f) out.push(...x.f); }); };
  take(e); Object.values(e.byStyle || {}).forEach(take);
  return out;
}
const A = Object.keys(doc.img).filter(n => mechs.has(n) && femaleShots(doc.img[n]).length >= 3).sort()[0];

(async () => {
  const h = await H.start();
  const T = [];
  const add = (n, ok, got) => T.push([n, !!ok, String(got === undefined ? '' : got)]);
  const stored = p => p.evaluate(k => { try { return JSON.parse(localStorage.getItem(k) || '[]'); } catch (e) { return 'bad'; } }, KEY);
  const bigFile = p => p.evaluate(() => { const i = document.querySelector('.sheet .art img'); return i ? decodeURIComponent(i.src.split('/').pop()) : ''; });
  try {
    const hub = path.resolve(ROOT, '../polos0117.github.io/favorites.js');
    if (fs.existsSync(hub)) add('lib/favorites.js 가 공방 모음의 원본과 같다', fs.readFileSync(hub, 'utf8') === fs.readFileSync(path.join(ROOT, 'lib/favorites.js'), 'utf8'));
    add('그림 셋 이상인 기체가 있다', !!A, A);

    const s = await h.open('dex.html?mech=' + encodeURIComponent(A), { viewport: { width: 390, height: 844 }, mobile: true });
    const p = s.page;
    await p.locator('#dex-fav').waitFor({ timeout: 30000 });
    add('처음엔 담기지 않았다', await p.locator('#dex-fav').getAttribute('aria-pressed') === 'false');
    add('하트 단추에 이름 「즐겨찾기」', /즐겨찾기/.test(await p.locator('#dex-fav').textContent()));
    add('담은 게 없으면 수 링크도 없다', await p.locator('#dex-fav-count').count() === 0);
    const f1 = await bigFile(p);
    await p.locator('#dex-fav').tap();
    await p.waitForTimeout(150);
    add('누르면 담긴다(aria-pressed)', await p.locator('#dex-fav').getAttribute('aria-pressed') === 'true');
    add('하트가 찬다', (await p.locator('#dex-fav').textContent()).includes('♥'));
    add('알림 「즐겨찾기에 담았어요」', /즐겨찾기에 담았어요/.test(await p.locator('.toast-live').textContent()));
    add('알림 자리는 aria-live', await p.locator('.toast-live').getAttribute('aria-live') === 'polite');
    let list = await stored(p);
    const e = Array.isArray(list) ? list[0] : {};
    add('한 칸이 적힌다', Array.isArray(list) && list.length === 1, JSON.stringify(list).slice(0, 200));
    add('칸 — 공방·카드·그림', e.a === 'gundam' && e.key === A && e.title === A && e.file === f1, JSON.stringify(e));
    add('칸 — 짧은 이름표', typeof e.sub === 'string' && e.sub.length > 0 && e.sub.length < 20, e.sub);
    add('칸 — 썸네일·원본은 절대 주소', /^https:\/\/polos0117\.github\.io\/atelier\/img\/thumb\//.test(e.thumb) && /^https:\/\/polos0117\.github\.io\/atelier\/img\/[^/]+$/.test(e.full), e.thumb + ' ' + e.full);
    const lk = new URL(e.link || '/', 'http://x');
    add('칸 — link 는 도감의 절대 경로 + ?mech=&pic=', /^\/(.*\/)?dex\.html$/.test(lk.pathname) && lk.searchParams.get('mech') === A && lk.searchParams.get('pic') === f1, e.link);
    add('칸 — 담은 때(ISO)', !isNaN(Date.parse(e.at)) && /T/.test(e.at), e.at);
    add('「즐겨찾기 1」 이 공방 모음으로', await p.locator('#dex-fav-count').textContent() === '즐겨찾기 1' && await p.locator('#dex-fav-count').getAttribute('href') === '/favorites.html');

    /* 같은 카드의 다른 그림 — 따로다 */
    await p.locator('.gal .art-thumb').nth(2).tap();
    await p.waitForTimeout(250);
    const f2 = await bigFile(p);
    add('다른 그림으로 바꾸면 담기지 않은 상태', f2 !== f1 && await p.locator('#dex-fav').getAttribute('aria-pressed') === 'false', f2);
    await p.locator('#dex-fav').tap();
    await p.waitForTimeout(150);
    list = await stored(p);
    add('둘째 그림 — 새것이 앞', list.length === 2 && list[0].file === f2 && list[1].file === f1, list.map(x => x.file).join(','));

    /* 새로고침해도 남는다 */
    await p.reload({ waitUntil: 'domcontentloaded' });
    await p.locator('#dex-fav').waitFor({ timeout: 30000 });
    await p.waitForTimeout(200);
    add('새로고침해도 남는다', (await stored(p)).length === 2 && await p.locator('#dex-fav-count').textContent() === '즐겨찾기 2');
    /* 칸의 link 로 오면 그 그림으로 연다 */
    const link2 = (await stored(p))[0].link;
    await p.goto(new URL(link2, h.base).href, { waitUntil: 'domcontentloaded' });
    await p.locator('#dex-fav').waitFor({ timeout: 30000 });
    await p.waitForTimeout(250);
    add('link 로 오면 그 그림이 크게 뜨고 하트가 차 있다', await bigFile(p) === f2 && await p.locator('#dex-fav').getAttribute('aria-pressed') === 'true', await bigFile(p));
    await p.locator('#dex-fav').tap();
    await p.waitForTimeout(150);
    add('다시 누르면 빠진다', (await stored(p)).length === 1 && await p.locator('#dex-fav').getAttribute('aria-pressed') === 'false');
    add('알림 「즐겨찾기에서 뺐어요」', /즐겨찾기에서 뺐어요/.test(await p.locator('.toast-live').textContent()));
    add('오류 없음', !s.errors.length, s.errors.join(' | '));
    await s.close();

    /* 저장이 막힌 브라우저 */
    const b = await h.open('dex.html?mech=' + encodeURIComponent(A), { viewport: { width: 1280, height: 900 },
      init: () => { const no = () => { throw new DOMException('blocked', 'SecurityError'); }; Storage.prototype.setItem = no; Storage.prototype.getItem = no; } });
    await b.page.locator('#dex-fav').waitFor({ timeout: 30000 });
    await b.page.locator('#dex-fav').click();
    await b.page.waitForTimeout(150);
    add('저장이 막히면 담긴 척하지 않는다', await b.page.locator('#dex-fav').getAttribute('aria-pressed') === 'false');
    add('저장이 막히면 못 담았다고 알린다', /저장을 막아/.test(await b.page.locator('.toast-live').textContent()));
    add('저장이 막혀도 오류 없음', !b.errors.length, b.errors.join(' | '));
    await b.close();

    /* 다섯 크기 — 누르는 자리·넘침·초점 고리 */
    for (const vp of [[344, 882], [390, 844], [844, 390], [690, 829], [1280, 900]]) {
      const v = await h.open('dex.html?mech=' + encodeURIComponent(A), { viewport: { width: vp[0], height: vp[1] }, mobile: vp[0] < 1000,
        store: [KEY, JSON.stringify([{ a: 'book', key: 'x', file: 'x.webp', title: 'x', sub: '', thumb: '', full: '', link: '/', at: new Date().toISOString() }])] });
      await v.page.locator('#dex-fav').waitFor({ timeout: 30000 });
      await v.page.locator('#dex-fav').scrollIntoViewIfNeeded();
      const r = await v.page.evaluate(() => {
        const box = el => { const b = el.getBoundingClientRect(); return { x: b.x, w: b.width, h: b.height }; };
        return { heart: box(document.querySelector('#dex-fav')), count: box(document.querySelector('#dex-fav-count')),
          over: document.documentElement.scrollWidth - innerWidth, sheet: document.querySelector('.sheet').scrollWidth - document.querySelector('.sheet').clientWidth };
      });
      add(vp.join('×') + ' 하트·수 링크 44px', r.heart.h >= 44 && r.count.h >= 44, JSON.stringify(r));
      add(vp.join('×') + ' 화면 안', r.heart.x >= 0 && r.heart.x + r.heart.w <= vp[0] + 1 && r.count.x + r.count.w <= vp[0] + 1, JSON.stringify(r));
      add(vp.join('×') + ' 옆으로 안 넘친다', r.over <= 1 && r.sheet <= 1, JSON.stringify(r));
      await v.page.focus('#dex-fav');
      await v.page.keyboard.press('Shift+Tab'); await v.page.keyboard.press('Tab');
      add(vp.join('×') + ' 초점 고리', await v.page.evaluate(() => { const el = document.activeElement; return el.id === 'dex-fav' && getComputedStyle(el).outlineStyle !== 'none'; }));
      await v.close();
    }
  } catch (err) {
    add('검사가 끝까지 돌았다', false, String(err && err.stack || err).slice(0, 300));
  }
  await h.stop();
  H.report(T, '도감 즐겨찾기');
})();
