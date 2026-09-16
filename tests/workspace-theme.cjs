const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const source = fs.readFileSync('lib/workspace-theme.js', 'utf8');
const ui = fs.readFileSync('lib/workspace-ui.js', 'utf8');
const css = fs.readFileSync('lib/workspace.css', 'utf8');
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

window.AtelierAppearance.set('theme', 'unknown');
assert.equal(root.dataset.theme, 'midnight');
assert.equal(meta.content, '#101925');

assert.match(ui, /<option value="archangel">아크엔젤<\/option>/);
assert.match(ui, /<option value="musai">무사이<\/option>/);
/* 테마마다 제 문장이 있어야 한다. 하나라도 빠지면 조용히 미드나이트 것이 나온다 */
const marks = ui.slice(ui.indexOf('const FLEET_MARK'), ui.indexOf('export function WorkspaceHeading'));
for (const key of ['midnight', "'white-base'", 'archangel', 'musai'])
  assert(marks.includes('\n  ' + key + ': html`'), key + ' 문장이 없다');
/* 색을 박으면 테마를 바꿔도 안 따라온다 */
assert(!/(stroke|fill|circle[^>]*fill)="#/.test(marks), '문장에 색을 박았다');
/* 넷이 서로 달라야 한다 — 베껴 두고 안 고친 것을 잡는다 */
const shapes = [...marks.matchAll(/ d="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(shapes).size, shapes.length, '문장에 같은 도형이 두 번 있다');
assert(ui.includes('FLEET_MARK[theme] || FLEET_MARK.midnight'), '모르는 테마의 되돌림이 없다');
assert.match(css, /:root\[data-theme="musai"\]/);
assert.match(css, /MUSAI \/ 03/);
assert.match(css, /:root\[data-theme="archangel"\]/);
assert.match(css, /ARCHANGEL \/ 02/);
assert.match(css, /\.prompt-page \.controls \{position:static/);
assert.match(css, /\.prompt-page \.prompt-dock \{position:static/);
assert.match(draftCss, /\.setup-bottom\{position:static/);
assert(viewportEvents.has('resize'));
assert(events.has('storage'));

console.log('PASS: four shared themes, theme colors, storage normalization and visible viewport sizing');
