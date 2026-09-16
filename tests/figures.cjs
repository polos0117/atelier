const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

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
  assert.equal(female.dataset.figureStyle, 'croquis');
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
assert.match(prompt, /onclick=\$\{\(\) => onValue\(f\.k\)\}/);
assert.doesNotMatch(prompt, /f\.svg \+ '<b>'/);

console.log(`PASS: ${Object.keys(window.AtelierSpec.BODY_FIG).length} body and ${Object.keys(window.AtelierSpec.HAIR_FIG).length} hair Canvas pickers`);
