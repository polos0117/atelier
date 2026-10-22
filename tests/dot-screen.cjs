/* 도트 기체 — 격납고 바닥(gundam/hangar-dots.js) · 도감 상세 시트의 도트 줄 · 목록의 「도트」 표 (data/sprites.json · lib/sprite-actor.js).
   도트 자료는 시험 자료(RX-78-2 건담 · GN-X · GN 아처)를 opt.files 로 주고, 그림은 tests/fixtures/make-sprites.py 가 임시 자리에 그린다.
   3D(Babylon)는 받지 않는다 — 바닥 띠는 3D 와 따로 선다.
   - 격납고: 메인 메뉴 위 띠에 서서 거닌다 · 이동 스틱·메뉴와 겹치지 않는다 · 띠는 누름을 지나 보낸다 · 누르면 그 기체의 도감(?mech=)
     좁으면 둘(휴대폰)·넓으면 셋(PC) · 도트 자료가 비면 띠째 없다
   - 도감: 도트 있는 기체의 상세 시트에 작은 무대(누르면 반응), 없는 기체는 없다 · 목록 칸에 「도트」 표
   CHROMIUM_PATH=<chrome> NODE_PATH=<playwright 가 있는 node_modules> ESM_DIR=<node_modules> node tests/dot-screen.cjs */
const assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { start } = require('./browser-harness.cjs');
const actor = (card, id) => ({ card, id, form: 'base', cell: [96, 128], foot: [48, 126], scale: 1, flip: true, facing: 'right', states: {
  still: { file: id + '/' + id + '_base_still.png', frames: 1 },
  idle: { file: id + '/' + id + '_base_idle.png', frames: 4, order: [0, 1, 2, 3], ms: [300, 200, 140, 200] },
  walk: { file: id + '/' + id + '_base_walk.png', frames: 6, order: [0, 1, 2, 3, 4, 5], ms: [120, 120, 120, 120, 120, 120], speed: 60, dy: [0, 1, -1, 0, 1, -1] },
  react: { file: id + '/' + id + '_base_react.png', frames: 4, order: [0, 1, 2, 3], ms: [100, 120, 160, 120] } } });
const SPRITES = { base: 'https://polos0117.github.io/atelier/sprites/', actors: { rx78: actor('RX-78-2 건담', 'rx78'), gnx: actor('GN-X', 'gnx'), archer: actor('GN 아처', 'archer') } };
const art = fs.mkdtempSync(path.join(os.tmpdir(), 'gundam-dot-'));
fs.writeFileSync(path.join(art, 'sprites.json'), JSON.stringify(SPRITES));
execFileSync('python3', [path.join(__dirname, 'fixtures', 'make-sprites.py'), path.join(art, 'sprites.json'), art]);
const opt = (extra = {}) => ({ viewport: { width: 390, height: 844 }, mobile: true, imgRoot: art, files: { 'data/sprites.json': SPRITES }, ...extra });
const wait = ms => new Promise(ok => setTimeout(ok, ms));
const overlap = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
const OTHER = '105 슬로터 대거';

(async () => {
  const h = await start();
  let n = 0;
  try {
    /* ── 격납고 — 휴대폰 세로·PC ── */
    for (const [w, ht, want] of [[390, 844, 2], [1280, 900, 3]]) {
      const s = await h.open('index.html', opt({ viewport: { width: w, height: ht }, mobile: w < 600 })), p = s.page;
      await p.waitForSelector('#hangarDots:not([hidden]) .sprite-actor:not([hidden])', { timeout: 10000 });
      await p.waitForFunction(n => document.querySelectorAll('#hangarDots .sprite-actor').length === n, want);
      const g = await p.evaluate(() => {
        const r = s => document.querySelector(s).getBoundingClientRect(), box = o => ({ left: o.left, right: o.right, top: o.top, bottom: o.bottom });
        return { dots: box(r('#hangarDots')), pad: box(r('.launchpad')), stick: box(r('#stick')), pe: getComputedStyle(document.querySelector('#hangarDots')).pointerEvents };
      });
      assert(!overlap(g.dots, g.pad), w + ' 메뉴와 겹치지 않는다 ' + JSON.stringify(g));
      assert(!overlap(g.dots, g.stick), w + ' 이동 스틱과 겹치지 않는다 ' + JSON.stringify(g));
      assert.equal(g.pe, 'none', '띠는 누름을 지나 보낸다');
      await p.waitForFunction(() => [...document.querySelectorAll('#hangarDots .sprite-actor')].some(a => a.sprite.debug().state === 'walk'), null, { timeout: 10000 });
      if (w < 600) {
        const a = p.locator('#hangarDots .sprite-actor').first(), who = await a.getAttribute('data-who');
        assert.match(await a.getAttribute('aria-label'), /도트 — 눌러서 도감 열기/);
        await Promise.all([p.waitForURL(/dex\.html\?mech=/), a.click({ force: true })]);
        assert.equal(new URL(p.url()).searchParams.get('mech'), who, '누르면 그 기체의 도감');
      }
      await s.close();
      n += 2;
    }
    let s = await h.open('index.html', opt({ files: { 'data/sprites.json': { base: SPRITES.base, actors: {} } } })), p = s.page;
    await wait(1200);
    assert.equal(await p.locator('#hangarDots').isHidden(), true, '도트 자료가 비면 띠째 없다');
    await s.close();
    n++;

    /* ── 도감 ── */
    s = await h.open('dex.html?mech=' + encodeURIComponent('RX-78-2 건담'), opt()); p = s.page;
    await p.waitForSelector('.sheet .dex-dot:not([hidden]) .sprite-actor:not([hidden])', { timeout: 30000 });
    assert.match(await p.locator('.dex-dot .sprite-actor').getAttribute('aria-label'), /RX-78-2 건담 도트/);
    await p.locator('.dex-dot-stage').scrollIntoViewIfNeeded(); await wait(200);
    await p.locator('.dex-dot .sprite-actor').click();
    await p.waitForFunction(() => document.querySelector('.dex-dot .sprite-actor').dataset.state === 'react', null, { timeout: 3000 });
    assert.deepEqual(s.errors, []);
    await s.close();
    s = await h.open('dex.html?mech=' + encodeURIComponent(OTHER), opt()); p = s.page;
    await p.locator('#dex-fav').waitFor({ timeout: 30000 }); await wait(1000);
    assert.equal(await p.locator('.dex-dot').isHidden(), true, '도트 없는 기체는 줄이 없다');
    await s.close();
    s = await h.open('dex.html', opt({ viewport: { width: 1280, height: 900 }, mobile: false })); p = s.page;
    await p.waitForSelector('.cell[data-card="GN-X"] .dot-badge', { timeout: 30000 });
    assert.equal(await p.locator('.cell[data-card="' + OTHER + '"] .dot-badge').count(), 0);
    await s.close();
    n += 3;
    console.log('PASS 도트 기체: ' + n + '가지 · 격납고 바닥(휴대폰 둘·PC 셋·메뉴와 이동 스틱을 비운다·띠는 누름을 지나 보낸다·누르면 도감) · 자료 없음 · 도감 상세 시트 무대(누르면 반응) · 없는 기체는 없다 · 목록 「도트」 표');
  } finally { await h.stop(); fs.rmSync(art, { recursive: true, force: true }); }
})().catch(e => { console.error(e); process.exit(1); });
