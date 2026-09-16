const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const window = {
  devicePixelRatio: 2,
  getComputedStyle: () => ({ getPropertyValue: () => '' })
};
vm.runInNewContext(fs.readFileSync('lib/toolkit-spec.js', 'utf8'), { window });
vm.runInNewContext(fs.readFileSync('lib/figures.js', 'utf8'), { window });

function context() {
  const gradient = { addColorStop() {} };
  return {
    setTransform() {}, clearRect() {}, createLinearGradient: () => gradient,
    save() {}, restore() {}, beginPath() {}, closePath() {}, moveTo() {}, lineTo() {},
    bezierCurveTo() {}, quadraticCurveTo() {}, arc() {}, ellipse() {}, fill() {}, stroke() {},
    setLineDash() {},
    lineCap: '', lineJoin: '', fillStyle: '', strokeStyle: '', lineWidth: 0,
    globalAlpha: 1, shadowColor: '', shadowBlur: 0, shadowOffsetY: 0
  };
}
function canvas() {
  return { width: 0, height: 0, dataset: {}, getContext: () => context() };
}

const FIG = window.AtelierFigures;
for (const value of Object.keys(window.AtelierSpec.BODY_FIG)) {
  assert(FIG.has('body type', value));
  assert(FIG.description('body type', value));
  const female = canvas(), male = canvas();
  assert(FIG.drawForKey('body type', value, 'female', female), value);
  assert(FIG.drawForKey('body type', value, 'male', male), value);
  assert.equal(female.dataset.figureReady, 'body');
  assert.equal(male.dataset.figureReady, 'body');
  assert.equal(female.dataset.figureGender, 'female');
  assert.equal(male.dataset.figureGender, 'male');
  assert.equal(female.dataset.figureStyle, 'single-croquis');
  assert.equal(male.dataset.figureStyle, 'mannequin');
}
for (const value of Object.keys(window.AtelierSpec.HAIR_FIG)) {
  assert(FIG.has('hairstyle', value));
  assert(FIG.description('hairstyle', value));
  const image = canvas();
  assert(FIG.drawForKey('hairstyle', value, 'female', image), value);
  assert.equal(image.dataset.figureReady, 'hair');
}
assert(!FIG.has('body type', 'not-an-option'));
assert(!FIG.drawForKey('unknown', 'bob', 'female', canvas()));

const prompt = fs.readFileSync('prompt.html', 'utf8');
assert.match(prompt, /<canvas ref=\$\{canvas\}/);
const femalePng = {
  slender: 'ba669e9a45', athletic: '296437f650', curvy: '7f7c1cdfb8',
  glamorous: '019109ba96', muscular: 'a8861aa31e', 'heavy-built': '3e66e03b8a',
  'tall-and-lean': '76fb20ff49', petite: 'eb983632d1', hourglass: '742710bd85',
  voluptuous: '637864e06b', toned: '67ad784276', wiry: 'f3081d6378',
  'soft-figured': '64d6490f6a', 'pear-shaped': 'cfa5424c39',
  'inverted-triangle': 'ce2ef25b05', stocky: '53d0c52f91', statuesque: '0dfb840494'
};
for (const [name, hash] of Object.entries(femalePng)) {
  const file = `assets/figures/body-female-${name}.png`;
  assert.match(prompt, new RegExp(`${name}\\.png\\?v=${hash}`), name);
  assert(fs.existsSync(file), file);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 10), hash, name);
}
assert.equal(Object.keys(femalePng).length, 17);
assert.match(prompt, /onclick=\$\{\(\) => onValue\(f\.k\)\}/);
assert.doesNotMatch(prompt, /f\.svg \+ '<b>'/);

console.log(`PASS: ${Object.keys(window.AtelierSpec.BODY_FIG).length} body, ${Object.keys(window.AtelierSpec.HAIR_FIG).length} hair Canvas pickers, and ${Object.keys(femalePng).length} female body PNGs`);
