/* 움직임 — lib/scene-motion.js(공방 넷이 그대로 나눠 쓰는 파일), 카드마다 입자를 고르는 lib/dex-motion.js,
   도감 상세 시트에 붙인 자리. book-atelier tests/scene-motion.cjs 에서 옮겼다(0번은 모듈, 6번부터 이 저장소).
   모듈 동작(1~5번 — 입자 · 켄 번스 · 열리기 · 스위치 · 동작 줄이기)은 2026-11-12 뺐다 — 같은 파일을
   book-atelier tests/scene-motion.cjs 가 그대로 본다. 여기서는 0번이 판 · 글자 대조로 그 파일과 같은지만 본다.
   그림은 체크아웃의 실제 그림(건담 르브리스: 초상·일상 둘·특별 하나, 여성).
   ESM_DIR=<node_modules> CHROMIUM_PATH=<chrome> node tests/scene-motion.cjs */
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { start, FOLD } = require('./browser-harness.cjs');
const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const DM = require('../lib/dex-motion.js');
const VIEWPORTS = [FOLD.cover, { width: 1280, height: 900 }];   /* 가장 좁은 휴대폰 · 넓은 PC (다섯 → 둘, 2026-11-12) */
const MECH = '건담 르브리스', SHEET = 'dex.html?mech=' + encodeURIComponent(MECH) + '&gender=f';
const thumb = n => `.gal .art-thumb[aria-label="${MECH} · ${n}"]`;   /* 1 초상 · 2·3 일상 · 4 특별 */
const noOverflow = p => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1
  && [...document.querySelectorAll('.sheet, .sheet .body')].every(e => e.scrollWidth <= e.clientWidth + 1));
async function sheet(h, viewport, extra) {
  const s = await h.open(SHEET, { viewport, ...extra });
  await s.page.waitForSelector('.sheet .art img', { timeout: 30000 });
  await s.page.evaluate(() => document.querySelector('.sheet .art img').decode().catch(() => {}));
  return s;
}

(async () => {
  /* 0. 같은 파일을 넷이 나눠 쓴다 — 판 머리줄, 주제 말 없음, 바깥에서 받는 것 없음. 카드 입자 = 모듈의 종류 */
  const src = read('lib/scene-motion.js'), css = read('lib/scene-motion.css');
  assert.match(src.split('\n')[0], /^\/\* scene-motion\.js — version \d+ /, 'js 첫 줄에 판');
  assert.match(css.split('\n')[0], /^\/\* scene-motion\.css — version \d+ /, 'css 첫 줄에 판');
  assert.equal(src.match(/version (\d+)/)[1], css.match(/version (\d+)/)[1], 'js·css 판이 같다');
  assert(!/import |require\(|fetch\(|https?:\/\//.test(src.replace(/\/\*[\s\S]*?\*\//g, '')), '바깥에서 받는 것이 없다');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const w of ['book', 'pokemon', 'gundam', 'myth', 'dracula']) assert(!code.toLowerCase().includes(w), '모듈에 ' + w + ' 가 없다');
  assert(!/\bW\(|localStorage\.getItem\('(?!atelier_motion_v1)/.test(code.replace(/KEY/g, "'atelier_motion_v1'")), '모듈은 낱말 표를 안 부르고 제 열쇠만 쓴다');
  /* 옆에 book-atelier 체크아웃이 있으면 글자 하나 다르지 않은지도 본다(없으면 건너뛴다) */
  const book = path.resolve(ROOT, '..', 'book-atelier', 'lib');
  if (fs.existsSync(path.join(book, 'scene-motion.js'))) {
    assert.equal(src, fs.readFileSync(path.join(book, 'scene-motion.js'), 'utf8'), 'book-atelier 와 같은 scene-motion.js');
    assert.equal(css, fs.readFileSync(path.join(book, 'scene-motion.css'), 'utf8'), 'book-atelier 와 같은 scene-motion.css');
  }
  const box = { window: {} }; vm.createContext(box); vm.runInContext(src, box);
  const M0 = box.window.AtelierMotion;
  assert.equal(M0.KEY, 'atelier_motion_v1');
  for (const k of ['petals', 'snow', 'embers', 'ash', 'bats', 'dust', 'sparks', 'bubbles', 'leaves', 'pages', 'stars', 'rain', 'mist', 'gold']) assert(M0.KINDS.includes(k), '종류 ' + k);
  /* 건담은 세 가지만(빔·전투 sparks, 지상 dust, 우주 stars). 모든 시리즈가 표에 있고 모든 카드가 그 셋 가운데 하나 */
  assert.deepEqual([...DM.KINDS].sort(), ['dust', 'sparks', 'stars']);
  for (const k of DM.KINDS) assert(M0.KINDS.includes(k), 'dex-motion 종류 ' + k + ' 가 모듈에 있다');
  const series = JSON.parse(read('data/series.json')).name;
  for (const s of Object.keys(series)) assert(DM.KINDS.includes(DM.SERIES[s]), '시리즈 ' + s + ' 의 무대를 lib/dex-motion.js SERIES 에 적는다');
  const seen = {};
  for (const f of ['mech', 'pilot', 'crew', 'ship']) for (const c of JSON.parse(read('data/' + f + '.json')).cards) {
    const k = DM.kindOf(c); assert(DM.KINDS.includes(k), c.name + ' → ' + k); seen[k] = (seen[k] || 0) + 1;
  }
  assert(DM.KINDS.every(k => seen[k] > 20), '세 종류가 다 쓰인다: ' + JSON.stringify(seen));
  const mech = n => JSON.parse(read('data/mech.json')).cards.find(c => c.name === n);
  assert.equal(DM.kindOf(mech(MECH)), 'stars', '수성의 마녀(우주 학교) — 별');
  assert.equal(DM.kindOf(mech('건담 샌드록 EW')), 'sparks', 'W 계열 — 불꽃');
  assert.equal(DM.kindOf({ tags: ['지상용'], terrain: { '우주': 3, '지상': 3 }, series: ['0083'] }), 'dust', '지상용 태그가 먼저');
  assert.equal(DM.kindOf({ terrain: { '우주': 3, '지상': 1 }, series: ['08MS'] }), 'stars', '지형 — 우주 쪽');
  assert.equal(DM.kindOf({ terrain: { '우주': 1, '지상': 3 }, series: ['0083'] }), 'dust', '지형 — 지상 쪽');
  assert.equal(DM.kindOf({ series: ['ZZ', 'CCA'] }), 'sparks', '첫 시리즈로');
  assert.equal(DM.kindOf({ series: 'NOPE' }), 'sparks', '표에 없으면 불꽃');

  const h = await start();
  try {
    /* 6. 도감 상세 시트 — 큰 그림에 켄 번스, 초상 ↔ 특별 컷은 열리기(이 카드의 입자가 터진다), 일상 컷은 넘기기 */
    const x = await sheet(h, { width: 1280, height: 900 }), xp = x.page;
    const bigAnims = () => xp.evaluate(() => document.querySelector('.sheet .art img').getAnimations().length);
    const settle = () => xp.waitForFunction(() => !document.querySelector('.sheet .am-ghost, .sheet .am-flash, .sheet .am-overlay'), null, { timeout: 5000 });
    await xp.waitForFunction(() => document.querySelector('.sheet .art img').getAnimations().length === 1);
    assert.equal(await xp.locator('.sheet .art').getAttribute('data-particles'), 'stars', '르브리스(수성의 마녀) — 별');
    assert.equal(await xp.locator('#dex-motion').textContent(), '움직임 끄기');
    assert.equal(await xp.evaluate(() => document.activeElement.matches('.sheet [data-dialog-close]')), true, '포커스는 그대로 닫기에서 시작');
    await xp.click(thumb(2));
    assert.equal(await xp.locator('.sheet .art .am-ghost').count(), 1, '초상 → 일상: 넘기기(사본)');
    await xp.waitForTimeout(80);
    assert.equal(await xp.locator('.sheet .am-burst').count(), 0, '넘기기에는 입자가 없다');
    await settle(); assert.equal(await bigAnims(), 1, '넘긴 뒤 켄 번스가 이어진다');
    assert.match(await xp.locator('.sheet .art img').getAttribute('src'), /casual1/);
    await xp.click(thumb(1)); await settle();
    await xp.click(thumb(4));
    await xp.waitForSelector('.sheet .art .am-burst[data-kind="stars"]');
    assert.equal(await xp.locator('.sheet .art .am-ghost').count(), 1, '초상 → 특별: 열리기');
    await settle();
    await xp.waitForFunction(() => !document.querySelector('.sheet .am-burst'), null, { timeout: 5000 });
    assert.equal(await xp.evaluate(() => getComputedStyle(document.querySelector('.sheet .art img')).clipPath), 'none', '끝나면 특별 컷이 다 보인다');
    assert.match(await xp.locator('.sheet .art img').getAttribute('src'), /extra1/);
    assert.equal(await bigAnims(), 1, '열린 뒤 켄 번스가 이어받는다');
    await xp.click(thumb(1));
    await xp.waitForSelector('.sheet .art .am-burst[data-kind="stars"]');
    assert.equal(await xp.locator('.sheet .art .am-ghost').count(), 1, '특별 → 초상도 열리기');
    await settle();
    await xp.click(thumb(3)); await xp.click(thumb(4));
    await xp.waitForTimeout(80);
    assert.equal(await xp.locator('.sheet .am-burst').count(), 0, '일상 → 특별은 넘기기');
    assert(await xp.locator('.sheet .art .am-ghost').count() <= 1, '끊긴 전환의 사본은 남지 않는다');
    await settle();
    /* 크게 보기 — 켄 번스·입자 없음, 닫으면 큰 그림으로 포커스 */
    await xp.click('.sheet .art'); await xp.waitForSelector('.zoom-layer img'); await xp.waitForTimeout(300);
    assert.equal(await xp.evaluate(() => document.querySelector('.zoom-layer img').getAnimations().length), 0, '크게 보기 — 켄 번스 없음');
    assert.equal(await xp.locator('.zoom-layer canvas, .zoom-layer .am-ghost').count(), 0, '크게 보기 — 입자·사본 없음');
    await xp.keyboard.press('ArrowRight'); await xp.waitForTimeout(200);
    assert.equal(await xp.locator('.zoom-layer canvas, .zoom-layer .am-ghost').count(), 0, '크게 보기에서 넘겨도 그대로');
    await xp.keyboard.press('Escape');
    assert.equal(await xp.evaluate(() => document.activeElement.className), 'art', '크게 보기를 닫으면 큰 그림으로');
    /* 스위치 — 끄면 걷히고, 새로고침해도 꺼짐, 다시 켜면 돌아온다. 주소는 그대로 */
    await xp.click('#dex-motion'); assert.equal(await xp.locator('#dex-motion').textContent(), '움직임 켜기');
    assert.equal(await bigAnims(), 0, '끄면 켄 번스가 걷힌다');
    assert.equal(await xp.evaluate(() => localStorage.getItem('atelier_motion_v1')), 'off');
    await xp.click(thumb(1)); await xp.waitForTimeout(60);
    assert.equal(await xp.locator('.sheet .am-burst').count(), 0, '꺼짐 — 입자 없음');
    await settle();
    await xp.reload(); await xp.waitForSelector('#dex-motion', { timeout: 30000 });
    assert.equal(await xp.locator('#dex-motion').textContent(), '움직임 켜기', '새로고침해도 꺼짐');
    assert.equal(new URL(xp.url()).searchParams.get('mech'), MECH, '주소의 ?mech= 그대로');
    await xp.click('#dex-motion');
    await xp.waitForFunction(() => document.querySelector('.sheet .art img').getAnimations().length === 1);
    assert.equal(await xp.evaluate(() => localStorage.getItem('atelier_motion_v1')), 'on');
    await xp.click('.sheet [data-dialog-close]'); await xp.waitForSelector('.sheet', { state: 'detached' });
    assert.equal(await xp.evaluate(() => !!document.querySelector('.am-ghost, .am-overlay, .am-flash')), false, '시트를 닫으면 층이 남지 않는다');
    assert.deepEqual(x.errors, []); await x.close();

    /* 동작 줄이기 — 시트 단추는 잠기고 켄 번스·입자 없음 */
    const rr = await h.open(SHEET, { viewport: { width: 390, height: 844 } }); await rr.page.emulateMedia({ reducedMotion: 'reduce' });
    await rr.page.reload(); await rr.page.waitForSelector('.sheet .art img', { timeout: 30000 });
    assert.equal(await rr.page.locator('#dex-motion').isDisabled(), true, '동작 줄이기 — 단추 잠김');
    await rr.page.click(thumb(4)); await rr.page.waitForTimeout(120);
    assert.equal(await rr.page.locator('.sheet .am-burst').count(), 0);
    assert.equal(await rr.page.evaluate(() => document.querySelector('.sheet .art img').getAnimations().filter(a => a.effect.getTiming().iterations === Infinity).length), 0, '켄 번스 없음');
    assert.deepEqual(rr.errors, []); await rr.close();

    /* 7. 두 크기(344 · 1280) — 움직임을 켠 채 시트에서 열리기, 가로 넘침·화면 오류 없음 */
    for (const viewport of VIEWPORTS) {
      const g = await sheet(h, viewport), gp = g.page;
      await gp.click(thumb(4)); await gp.waitForSelector('.sheet .art .am-burst');
      assert(await noOverflow(gp), 'dex overflow (열리는 중) ' + JSON.stringify(viewport));
      const inside = await gp.evaluate(() => { const c = document.querySelector('.sheet .art .am-burst').getBoundingClientRect(), a = document.querySelector('.sheet .art').getBoundingClientRect();
        return c.left >= a.left - 1 && c.right <= a.right + 1 && c.top >= a.top - 1 && c.bottom <= a.bottom + 1; });
      assert(inside, '입자는 그림 칸 안 ' + JSON.stringify(viewport));
      await gp.waitForFunction(() => !document.querySelector('.sheet .am-ghost'), null, { timeout: 5000 });
      assert(await noOverflow(gp), 'dex overflow (열린 뒤) ' + JSON.stringify(viewport));
      await gp.locator('#dex-motion').scrollIntoViewIfNeeded();
      const tap = await gp.locator('#dex-motion').boundingBox(); assert(tap && tap.height >= 40 && tap.x >= 0 && tap.x + tap.width <= viewport.width + 1, '#dex-motion 누르는 자리 ' + JSON.stringify(viewport));
      assert.deepEqual(g.errors, [], 'dex ' + JSON.stringify(viewport)); await g.close();
    }
    console.log('PASS 움직임: 같은 파일(판·바깥 없음·book 과 같음)·카드 입자 ' + JSON.stringify(seen) + ' · 도감 시트(초상↔특별 열리기·일상 넘기기)·크게 보기·스위치·동작 줄이기 · 두 크기 넘침·오류 없음');
  } finally { await h.stop(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
