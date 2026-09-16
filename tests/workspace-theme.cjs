const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('lib/workspace-theme.js', 'utf8');
const ui = fs.readFileSync('lib/workspace-ui.js', 'utf8');
const css = fs.readFileSync('lib/workspace.css', 'utf8');
const prompt = fs.readFileSync('prompt.html', 'utf8');
const draftCss = fs.readFileSync('gundam/draft.css', 'utf8');
const stored = new Map();
const events = new Map();
const viewportEvents = new Map();
const properties = new Map();
const frames = [];
const meta = { content: '' };
const root = {
  dataset: {},
  style: { setProperty: (key, value) => properties.set(key, value) }
};
const window = {
  innerHeight: 800,
  visualViewport: {
    height: 704,
    addEventListener: (type, fn) => viewportEvents.set(type, fn)
  },
  addEventListener: (type, fn) => events.set(type, fn),
  dispatchEvent: () => {}
};

vm.runInNewContext(source, {
  window,
  document: {
    documentElement: root,
    querySelector: selector => selector === 'meta[name="theme-color"]' ? meta : null
  },
  localStorage: {
    getItem: key => stored.has(key) ? stored.get(key) : null,
    setItem: (key, value) => stored.set(key, value)
  },
  requestAnimationFrame: fn => { frames.push(fn); return frames.length; },
  cancelAnimationFrame: () => {},
  Event: function Event(type) { this.type = type; }
});

while (frames.length) frames.shift()();
assert.equal(root.dataset.theme, 'midnight');
assert.equal(meta.content, '#101925');
assert.equal(properties.get('--atelier-vh'), '704px');

window.AtelierAppearance.set('theme', 'archangel');
assert.equal(root.dataset.theme, 'archangel');
assert.equal(stored.get('atelier_theme_v1'), 'archangel');
assert.equal(meta.content, '#f7f8fa');

window.AtelierAppearance.set('theme', 'white-base');
assert.equal(root.dataset.theme, 'white-base');
assert.equal(meta.content, '#edf1f5');

window.AtelierAppearance.set('theme', 'musai');
assert.equal(root.dataset.theme, 'musai');
assert.equal(stored.get('atelier_theme_v1'), 'musai');
assert.equal(meta.content, '#121a14');

window.AtelierAppearance.set('theme', 'rewloola');
assert.equal(root.dataset.theme, 'rewloola');
assert.equal(meta.content, '#1c141b');

for (const [name, color] of [['agama', '#f3efe4'], ['ptolemaios', '#0d1d25'], ['isaribi', '#1d1710'], ['spartan', '#12171b']]) {
  window.AtelierAppearance.set('theme', name);
  assert.equal(root.dataset.theme, name);
  assert.equal(stored.get('atelier_theme_v1'), name);
  assert.equal(meta.content, color, name + ' 의 theme-color');
}

window.AtelierAppearance.set('theme', 'unknown');
assert.equal(root.dataset.theme, 'midnight');
assert.equal(meta.content, '#101925');

assert.match(ui, /<option value="archangel">아크엔젤<\/option>/);
assert.match(ui, /<option value="musai">무사이<\/option>/);
/* 고르개·토큰·함선 이름이 테마마다 다 있어야 한다 */
const THEMES = [['midnight', '미드나이트 · 함교', 'MIDNIGHT / 01'],
  ['white-base', '화이트 베이스', 'WHITE BASE / 01'], ['archangel', '아크엔젤', 'ARCHANGEL / 02'],
  ['musai', '무사이', 'MUSAI / 03'], ['rewloola', '레우르라', 'REWLOOLA / 05'],
  ['agama', '아가마', 'AGAMA / 06'], ['ptolemaios', '프톨레마이오스', 'PTOLEMAIOS / 07'],
  ['isaribi', '이사리비', 'ISARIBI / 08'], ['spartan', '스파르탄', 'SPARTAN / 09']];
for (const [key, ko, sign] of THEMES) {
  assert(ui.includes('<option value="' + key + '">' + ko + '</option>'), key + ' 고르개 항목이 없다');
  if (key !== 'midnight') assert(css.includes(':root[data-theme="' + key + '"] {'), key + ' 토큰이 없다');
  assert(css.includes("content:'" + sign + "'"), sign + ' 이 없다');
}
/* 결은 body 에만 깐다 — 카드나 글자 위에 깔면 읽기가 나빠진다 */
for (const key of ['rewloola', 'ptolemaios', 'isaribi', 'spartan'])
  assert(css.includes('[data-theme="' + key + '"] body {background-color:var(--bg);background-image:'),
    key + ' 의 결이 body 에 걸려 있지 않다');
/* 테마마다 제 문장이 있어야 한다. 하나라도 빠지면 조용히 미드나이트 것이 나온다 */
const marks = ui.slice(ui.indexOf('const FLEET_MARK'), ui.indexOf('const MARK_STYLE'));
for (const key of ['midnight', "'white-base'", 'archangel', 'musai', 'rewloola', 'agama', 'ptolemaios', 'isaribi', 'spartan'])
  assert(marks.includes('\n  ' + key + ': ['), key + ' 문장이 없다');
/* 색을 박으면 테마를 바꿔도 안 따라온다 */
assert(!/#[0-9a-f]{3,6}/i.test(marks), '문장에 색을 박았다');
/* 넷이 서로 달라야 한다 — 베껴 두고 안 고친 것을 잡는다 */
const shapes = [...marks.matchAll(/\['([Mm][^']+)'/g)].map(m => m[1]);
assert(shapes.length >= 31, '문장 도형이 너무 적다 — ' + shapes.length);
assert.equal(new Set(shapes).size, shapes.length, '문장에 같은 도형이 두 번 있다');
assert(ui.includes('FLEET_MARK[theme] || FLEET_MARK.midnight'), '모르는 테마의 되돌림이 없다');
/* 도형을 모듈 자리에 담아 둔 VNode 로 두면 다시 그릴 때 내용이 빠질 수 있다.
   자료로 두고 그릴 때마다 새로 만드는지 본다 */
assert(!/:\s*html`/.test(marks), '문장을 VNode 로 담아 두었다 — 자료로 두고 그릴 때 만든다');
assert(/FLEET_MARK\[theme\][^;]*\.map\(/.test(ui.replace(/\n/g, ' ')), '문장을 그릴 때 만들지 않는다');
assert.match(css, /:root\[data-theme="musai"\]/);
assert.match(css, /MUSAI \/ 03/);
assert.match(css, /:root\[data-theme="archangel"\]/);
assert.match(css, /ARCHANGEL \/ 02/);
assert.match(css, /\.prompt-page \.controls \{position:static/);
assert.match(css, /\.prompt-page \.prompt-dock \{position:static/);
assert.match(css, /\.prompt-page \.param-actions \{display:flex;flex-wrap:nowrap/);
assert.match(css, /\.prompt-page \.ko-sum \{display:flex;/);
assert.match(css, /\.prompt-page \.select-row \{display:grid;grid-template-columns:minmax\(0,1fr\)/);
assert.equal((prompt.match(/class="param-grid select-row"/g) || []).length, 3,
  '단일·Pair·Panel 선택 묶음이 모두 항목당 한 줄 표시 대상이어야 한다');
assert.match(draftCss, /\.setup-bottom\{position:static/);
assert(viewportEvents.has('resize'));
assert(events.has('storage'));

console.log('PASS: nine shared themes, theme colors, storage normalization and visible viewport sizing');
