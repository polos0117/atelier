/* 그물로 받은 두 묶음을 글자 단위로 견준다.

     node fuzz-diff.mjs a.json b.json

   같은 씨앗으로 받았으면 조합 열쇠가 같아야 한다. 열쇠가 어긋나면 그것부터 말한다 —
   "프롬프트가 같다" 보다 "같은 조합을 밟았다" 가 먼저다. */
import { readFileSync } from 'node:fs';

const [pa, pb] = process.argv.slice(2);
if (!pa || !pb) { console.error('사용법: node fuzz-diff.mjs a.json b.json'); process.exit(2); }
const A = JSON.parse(readFileSync(pa, 'utf8'));
const B = JSON.parse(readFileSync(pb, 'utf8'));

const ka = Object.keys(A), kb = Object.keys(B);
const onlyA = ka.filter(k => !(k in B)), onlyB = kb.filter(k => !(k in A));
let bad = 0;

if (onlyA.length || onlyB.length) {
  console.error('조합이 어긋난다 — 앞에만 ' + onlyA.length + '개 · 뒤에만 ' + onlyB.length + '개');
  [...onlyA.slice(0, 5), ...onlyB.slice(0, 5)].forEach(k => console.error('   ' + k));
  bad++;
}

let same = 0, chars = 0;
for (const k of ka) {
  if (!(k in B)) continue;
  const x = A[k], y = B[k];
  chars += x.prompt.length;
  if (JSON.stringify(x.picks) !== JSON.stringify(y.picks)) {
    console.error('고른 값이 다르다 — ' + k);
    bad++; continue;
  }
  if (x.prompt === y.prompt) { same++; continue; }
  bad++;
  /* 어디서부터 갈라지는지 짚어 준다 */
  let i = 0; while (i < x.prompt.length && i < y.prompt.length && x.prompt[i] === y.prompt[i]) i++;
  console.error('프롬프트가 다르다 — ' + k + '  (' + i + '자째부터, 길이 ' + x.prompt.length + ' → ' + y.prompt.length + ')');
  console.error('   앞: …' + JSON.stringify(x.prompt.slice(Math.max(0, i - 40), i + 60)));
  console.error('   뒤: …' + JSON.stringify(y.prompt.slice(Math.max(0, i - 40), i + 60)));
}

if (bad) { console.error('\n어긋난 곳 ' + bad + '군데'); process.exit(1); }
console.log('같다 — 조합 ' + same + '개 · ' + chars.toLocaleString() + '자가 글자까지 그대로');
