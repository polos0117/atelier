/* 움직임 — lib/scene-motion.js(공방 넷이 그대로 나눠 쓰는 파일), 카드마다 입자를 고르는 lib/dex-motion.js,
   도감 상세 시트에 붙인 자리. book-atelier tests/scene-motion.cjs 에서 옮겼다(0~5번은 모듈, 6번부터 이 저장소).
   그림은 체크아웃의 실제 그림(건담 르브리스: 초상·일상 둘·특별 하나, 여성).
   ESM_DIR=<node_modules> CHROMIUM_PATH=<chrome> node tests/scene-motion.cjs */
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { start, FOLD } = require('./browser-harness.cjs');
const ROOT = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const DM = require('../lib/dex-motion.js');
const VIEWPORTS = [FOLD.cover, { width: 390, height: 844 }, { width: 844, height: 390 }, FOLD.inner, { width: 1280, height: 900 }];
const MECH = '건담 르브리스', SHEET = 'dex.html?mech=' + encodeURIComponent(MECH) + '&gender=f';
const thumb = n => `.gal .art-thumb[aria-label="${MECH} · ${n}"]`;   /* 1 초상 · 2·3 일상 · 4 특별 */
/* 모듈만 따로 보는 빈 화면 — 검사 때만 있는 주소다(경로를 가로채 내준다) */
const LAB = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<link rel="stylesheet" href="lib/scene-motion.css?v=1"><script src="lib/scene-motion.js?v=1"></script>
<style>body{margin:0;background:#111}#box,#stage{position:relative;width:320px;height:320px;background:#0b0d12}
#stage>div{position:absolute;inset:0}#a{background:#a04030}#b{background:#3060a0}#far{height:3000px}</style></head>
<body><div id="box"></div><div id="stage"><div id="a"></div><div id="b"></div></div><img id="pic" width="200" height="300" alt=""><div id="far"></div></body></html>`;
const noOverflow = p => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1
  && [...document.querySelectorAll('.sheet, .sheet .body')].every(e => e.scrollWidth <= e.clientWidth + 1));
const frameHash = p => p.evaluate(() => { const c = document.querySelector('#box canvas'); return c ? c.toDataURL() : null; });
async function lab(h, viewport) {
  const a = await h.open('robots.txt', { viewport });
  await a.ctx.route(/\/motion-lab\.html$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: LAB }));
  await a.page.goto(h.base + '/motion-lab.html'); await a.page.waitForFunction(() => window.AtelierMotion);
  return a;
}
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
    /* 1. 입자 — 캔버스가 생기고, 프레임마다 화소가 바뀌고, 숨으면 멈추고, destroy 로 다 걷힌다 */
    const a = await lab(h, { width: 390, height: 844 }), p = a.page;
    await p.evaluate(() => { window.pc = AtelierMotion.particles(document.getElementById('box'), 'sparks', { seed: 'lab' }); });
    await p.waitForFunction(() => window.pc.frames > 5);
    assert.equal(await p.locator('#box canvas.am-particles').count(), 1, '캔버스 하나');
    assert.equal(await p.evaluate(() => { const c = document.querySelector('#box canvas'); return c.width === Math.round(320 * Math.min(devicePixelRatio, 2)); }), true, '캔버스 크기 = 칸 × 화소비');
    const f1 = await frameHash(p); await p.waitForTimeout(250); const f2 = await frameHash(p);
    assert.notEqual(f1, f2, '프레임 사이 화소가 바뀐다');
    for (const kind of await p.evaluate(() => AtelierMotion.KINDS)) {
      const n = await p.evaluate(k => new Promise(ok => { const c = AtelierMotion.particles(document.getElementById('stage'), k, { seed: k });
        setTimeout(() => { const f = c.frames; c.destroy(); ok(f); }, 200); }), kind);
      assert(n > 3, kind + ' 이 돈다(' + n + ')');
    }
    assert.equal(await p.locator('#stage canvas').count(), 0, '종류마다 destroy 로 걷혔다');
    await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
    const hidden0 = await p.evaluate(() => window.pc.frames); await p.waitForTimeout(250);
    assert.equal(await p.evaluate(() => window.pc.running), false, '탭이 숨으면 멈춘다');
    assert(await p.evaluate(() => window.pc.frames) - hidden0 <= 1, '숨은 동안 프레임이 안 돈다');
    await p.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    await p.waitForFunction(f => window.pc.frames > f + 3, hidden0);
    await p.evaluate(() => { document.getElementById('box').style.marginTop = '4000px'; });
    await p.waitForFunction(() => !window.pc.running);
    const off0 = await p.evaluate(() => window.pc.frames); await p.waitForTimeout(250);
    assert(await p.evaluate(() => window.pc.frames) - off0 <= 1, '화면 밖이면 프레임이 안 돈다');
    await p.evaluate(() => { document.getElementById('box').style.marginTop = '0'; });
    await p.waitForFunction(() => window.pc.running);
    await p.evaluate(() => window.pc.destroy());
    assert.equal(await p.locator('#box canvas').count(), 0, 'destroy — 캔버스가 없다');
    const d0 = await p.evaluate(() => window.pc.frames); await p.waitForTimeout(200);
    assert.equal(await p.evaluate(() => window.pc.frames), d0, 'destroy 뒤 프레임이 안 돈다');

    /* 2. 켄 번스 — 한 그림에 애니메이션 하나, 같은 씨앗은 같은 방향, 다른 씨앗은 다르다, 12~20초 */
    const kb = await p.evaluate(() => { const el = document.getElementById('pic'), k = s => { const c = AtelierMotion.kenBurns(el, { seed: s }); const a = el.getAnimations(); const r = { n: a.length, frames: JSON.stringify(a[0].effect.getKeyframes().map(f => f.transform)), d: a[0].effect.getTiming().duration }; c.stop(); return r; };
      const x = k('건담_르브리스_f.webp'), y = k('건담_르브리스_f.webp'), z = k('건담_샌드록_EW_extra1.webp'); return { x, y, z, after: el.getAnimations().length }; });
    assert.equal(kb.x.n, 1, '켄 번스 애니메이션 하나');
    assert.equal(kb.x.frames, kb.y.frames, '같은 씨앗은 같은 움직임');
    assert.notEqual(kb.x.frames, kb.z.frames, '다른 씨앗은 다른 움직임');
    assert(kb.x.d >= 12000 && kb.x.d <= 20000 && kb.z.d >= 12000 && kb.z.d <= 20000, '12~20초: ' + kb.x.d + ' ' + kb.z.d);
    assert(/scale/.test(kb.x.frames) && !/rotate|left|top/.test(kb.x.frames), 'transform 만');
    assert.equal(kb.after, 0, 'stop 하면 걷힌다');

    /* 3. 열리기 — 1초 남짓에 끝나고 새 그림이 다 보인다. 입자가 한 번 터지고, 옛 그림은 걷힌다 */
    const rv = await p.evaluate(async () => { const a = document.getElementById('a'), b = document.getElementById('b'), t = performance.now();
      const run = AtelierMotion.reveal(a, b, { kind: 'stars', removeFrom: true, key: 'lab' });
      await new Promise(r => setTimeout(r, 380));
      const mid = { burst: document.querySelectorAll('#stage .am-burst').length, flash: document.querySelectorAll('#stage .am-flash').length, anim: b.getAnimations().length };
      const r = await run, cs = getComputedStyle(b);
      return { r, ms: performance.now() - t, mid, opacity: cs.opacity, clip: cs.clipPath, transform: cs.transform, fromGone: !a.isConnected, anims: b.getAnimations().length, style: b.getAttribute('style') || '' }; });
    assert.equal(rv.r.cancelled, false);
    assert(rv.ms >= 900 && rv.ms <= 1700, '열리기 900~1200ms(그림 기다림 포함): ' + rv.ms);
    assert(rv.mid.burst === 1 && rv.mid.flash === 1 && rv.mid.anim >= 1, '도중 — 입자 터짐·빛·조리개: ' + JSON.stringify(rv.mid));
    assert(rv.opacity === '1' && rv.clip === 'none' && rv.transform === 'none' && rv.anims === 0, '끝 — 새 그림이 다 보인다: ' + JSON.stringify(rv));
    assert(rv.fromGone, 'removeFrom — 옛 그림이 걷혔다');
    assert(!/clip-path|opacity/.test(rv.style), '안에 남긴 스타일 없음: ' + rv.style);
    await p.waitForFunction(() => !document.querySelector('#stage .am-overlay'), null, { timeout: 4000 });
    /* 끊기 — 같은 열쇠로 새로 부르면 앞의 것은 cancelled 로 끝나고 남는 것이 없다 */
    const cut = await p.evaluate(async () => { const st = document.getElementById('stage'); st.innerHTML = '<div id="a"></div><div id="b"></div><div id="c"></div>';
      const [a, b, c] = ['a', 'b', 'c'].map(id => document.getElementById(id)); c.style.background = '#40a060';
      const first = AtelierMotion.reveal(a, b, { kind: 'dust', key: 'lab' }); await new Promise(r => setTimeout(r, 150));
      const second = AtelierMotion.turn(b, c, { key: 'lab', direction: 'next' }); const r1 = await first, t = performance.now(), r2 = await second;
      return { r1, r2, turnMs: performance.now() - t, bClip: getComputedStyle(b).clipPath, left: st.querySelectorAll('.am-flash,.am-ghost').length, cOpacity: getComputedStyle(c).opacity }; });
    assert.equal(cut.r1.cancelled, true, '앞의 열리기는 끊긴다'); assert.equal(cut.r2.cancelled, false);
    assert.equal(cut.bClip, 'none', '끊긴 그림의 조리개가 풀린다');
    assert(cut.turnMs < 700, '넘기기는 짧다: ' + cut.turnMs); assert.equal(cut.left, 0); assert.equal(cut.cOpacity, '1');
    const gh = await p.evaluate(() => { const b = document.getElementById('b'), g = AtelierMotion.ghost(b, 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', { fit: 'cover' });
      const x = g.getBoundingClientRect(), y = b.getBoundingClientRect(); g.remove(); return [x.left - y.left, x.top - y.top, x.width - y.width, x.height - y.height].every(v => Math.abs(v) < 1); });
    assert(gh, 'ghost 가 새 그림 자리에 맞는다');

    /* 4. 스위치 — atelier_motion_v1 에 on/off, 끄면 켄 번스·떠도는 입자가 걷히고, 새로고침해도 남는다 */
    const sw = await p.evaluate(() => { const box = document.getElementById('box'), el = document.getElementById('pic');
      const pc = AtelierMotion.particles(box, 'stars', {}), k = AtelierMotion.kenBurns(el, { seed: 'x' }); const seen = [];
      AtelierMotion.subscribe(v => seen.push(v));
      AtelierMotion.setEnabled(false);
      const off = { store: localStorage.getItem('atelier_motion_v1'), canvas: box.querySelectorAll('canvas').length, kb: el.getAnimations().length, on: AtelierMotion.enabled() };
      AtelierMotion.setEnabled(true);
      const on = { store: localStorage.getItem('atelier_motion_v1'), canvas: box.querySelectorAll('canvas').length, kb: el.getAnimations().length };
      pc.destroy(); k.stop(); AtelierMotion.setEnabled(false); return { off, on, seen }; });
    assert.deepEqual(sw.off, { store: 'off', canvas: 0, kb: 0, on: false }, '끄면 걷힌다');
    assert.deepEqual(sw.on, { store: 'on', canvas: 1, kb: 1 }, '켜면 되살아난다');
    assert.deepEqual(sw.seen, [false, true, false], '구독자에게 알린다');
    await p.reload(); await p.waitForFunction(() => window.AtelierMotion);
    assert.equal(await p.evaluate(() => AtelierMotion.enabled()), false, '새로고침해도 꺼짐');
    const offRun = await p.evaluate(async () => { const t = performance.now(); await AtelierMotion.reveal(document.getElementById('a'), document.getElementById('b'), { kind: 'sparks' }); return performance.now() - t; });
    assert(offRun < 400, '꺼짐이면 열리기는 빠른 사라짐: ' + offRun);
    assert.deepEqual(a.errors, []); await a.close();

    /* 5. 동작 줄이기 — 켄 번스 없음, 떠도는 캔버스 없음, 열리기는 거의 바로 */
    const r = await lab(h, { width: 390, height: 844 }), rp = r.page;
    await rp.emulateMedia({ reducedMotion: 'reduce' });
    const red = await rp.evaluate(async () => { const el = document.getElementById('pic'), box = document.getElementById('box');
      AtelierMotion.kenBurns(el, { seed: 'r' }); const pc = AtelierMotion.particles(box, 'sparks', {});
      const t = performance.now(); await AtelierMotion.reveal(document.getElementById('a'), document.getElementById('b'), { kind: 'sparks', removeFrom: true });
      return { kb: el.getAnimations().length, canvas: box.querySelectorAll('canvas').length, running: pc.running, ms: performance.now() - t, burst: document.querySelectorAll('.am-burst').length, enabled: AtelierMotion.enabled() }; });
    assert.deepEqual({ kb: red.kb, canvas: red.canvas, running: red.running, burst: red.burst, enabled: red.enabled }, { kb: 0, canvas: 0, running: false, burst: 0, enabled: false }, JSON.stringify(red));
    assert(red.ms < 250, '열리기가 거의 바로: ' + red.ms);
    await r.close();

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

    /* 7. 다섯 크기 — 움직임을 켠 채 시트에서 열리기, 가로 넘침·화면 오류 없음 */
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
    console.log('PASS 움직임: 같은 파일(판·바깥 없음·book 과 같음)·카드 입자 ' + JSON.stringify(seen) + ' · 입자(화소 변화·숨김·화면 밖·destroy·종류마다) · 켄 번스(씨앗·12~20초) · 열리기·끊기·넘기기·ghost · 스위치(저장·구독·새로고침) · 동작 줄이기 · 도감 시트(초상↔특별 열리기·일상 넘기기)·크게 보기 · 다섯 크기 넘침·오류 없음');
  } finally { await h.stop(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
