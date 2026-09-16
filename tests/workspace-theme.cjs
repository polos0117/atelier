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

window.AtelierAppearance.set('theme', 'unknown');
assert.equal(root.dataset.theme, 'midnight');
assert.equal(meta.content, '#101925');

assert.match(ui, /<option value="archangel">아크엔젤<\/option>/);
assert.match(css, /:root\[data-theme="archangel"\]/);
assert.match(css, /ARCHANGEL \/ 02/);
assert.match(css, /\.prompt-page \.controls \{position:static/);
assert.match(css, /\.prompt-page \.prompt-dock \{position:static/);
assert.match(draftCss, /\.setup-bottom\{position:static/);
assert(viewportEvents.has('resize'));
assert(events.has('storage'));

console.log('PASS: three shared themes, theme colors, storage normalization and visible viewport sizing');
