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
const malePng = {
  slender: 'f60ed12ac8', athletic: 'eed740f75d', muscular: 'fbc5f9763d',
  'heavy-built': 'fb6e877787', 'tall-and-lean': '2a7447727c', toned: 'adebc865a0',
  wiry: '53656ae489', 'inverted-triangle': '0d258ee640', stocky: '706e2d5f66',
  statuesque: '78f51333b8', 'broad-shouldered': 'e1b0e0ee80', burly: '437673d9aa',
  lanky: 'ec905f07cd', 'barrel-chested': 'e7eec9b929', rangy: '0741c9abb5'
};
const femaleHairPng = {
  bob: '6550456156', 'pixie-cut': '1518adca53', layered: 'b588a99897',
  ponytail: '0deb81891e', 'twin-tail': '9ee9469827', 'wolf-cut': '3bc115743e',
  'slicked-back': '066940adf5', wavy: '6d5ebfe326', straight: 'e3a3f1a99e',
  'side-ponytail': '5ad6069b99', 'high-ponytail': 'd63b2c784c', braid: 'a972b89667',
  'twin-braids': '2b37a0a4d1', 'crown-braid': 'dcf0c6b61b', chignon: 'f170dff070',
  'messy-bun': 'ac5b25d45f', 'top-knot': '682b767a0e', 'low-bun': 'd9be965973',
  'half-up': '2e2c4040f0', 'space-buns': '0ff8617dd1', 'hime-cut': '94b4e7d2a3',
  'asymmetric-cut': '7b1dd3a84f', undercut: 'a6c615766c',
  'side-shaved-long-hair': '209ab12265', curly: '4b786d44ea',
  'tight-curls': '6facf025df', locs: '9eb4224a80', 'ringlet-curls': 'eacae5882d',
  'finger-waves': '0e4c531e3f', feathered: '361677c06c', 'blunt-cut': '30ced68f7b',
  'wet-look-slick': 'ab7de912b5', windswept: '84c505c89a'
};
const maleHairPng = {
  'buzz-cut': 'e87d560d3c', 'crew-cut': '4d5358f776', 'side-part': 'ea54198063',
  fade: 'e63e63332f', 'man-bun': '81485a4ff4', 'swept-back': 'f3d90c0df1',
  shaggy: 'a80903cae6', mullet: 'ac450fb4c1'
};
for (const [gender, figures] of Object.entries({ female: femalePng, male: malePng })) {
  for (const [name, hash] of Object.entries(figures)) {
    const file = `assets/figures/body-${gender}-${name}.png`;
    assert.match(prompt, new RegExp(`${name}\\.png\\?v=${hash}`), `${gender} ${name}`);
    assert(fs.existsSync(file), file);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 10), hash, `${gender} ${name}`);
  }
}
for (const [gender, figures] of Object.entries({ female: femaleHairPng, male: maleHairPng })) {
  for (const [name, hash] of Object.entries(figures)) {
    const file = `assets/figures/hair-${gender}-${name}.png`;
    assert.match(prompt, new RegExp(`${name}\\.png\\?v=${hash}`), `${gender} hair ${name}`);
    assert(fs.existsSync(file), file);
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 10), hash, `${gender} hair ${name}`);
  }
}
/* 남성·여성 화면에 실제 노출되는 PNG 수를 고정해 새 Canvas 회귀를 막는다. */
assert.equal(Object.keys(femalePng).length, 17);
assert.equal(Object.keys(malePng).length, 15);
assert.equal(Object.keys(femaleHairPng).length, 33);
assert.equal(Object.keys(maleHairPng).length, 8);
assert.match(prompt, /onclick=\$\{\(\) => onValue\(f\.k\)\}/);
assert.match(prompt, /<span class="figimg"><\$\{FigureImage\}/);
assert.match(prompt, /height:140px/);
assert.match(prompt, /-webkit-line-clamp:2/);
assert.doesNotMatch(prompt, /f\.svg \+ '<b>'/);

console.log(`PASS: ${Object.keys(window.AtelierSpec.BODY_FIG).length} body and ${Object.keys(window.AtelierSpec.HAIR_FIG).length} hair pickers; ${Object.keys(femalePng).length} female body, ${Object.keys(malePng).length} male body, ${Object.keys(femaleHairPng).length} female hair, ${Object.keys(maleHairPng).length} male hair PNGs`);
