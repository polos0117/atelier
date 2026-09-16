/* 그물 — 툴킷 화면을 실제 브라우저에서 몰아 보고 프롬프트를 통째로 받아 둔다.
   화면을 고친 뒤 같은 씨앗으로 다시 받아 fuzz-diff.mjs 로 글자 단위로 견준다.

     PFILE=prompt.html OUT=a.json node fuzz.mjs
     MECHS='자쿠Ⅱ,시난주' STYLES='anime_illust,ink_wash' SEED=7 node fuzz.mjs

   씨앗이 같으면 같은 조합을 밟는다. 값은 화면의 셀렉트를 실제로 바꿔 넣으므로
   "화면이 무엇을 모듈에 넘기는가" 까지 함께 걸린다 — 모듈만 따로 부르면 그 자리가 빈다.

   이 저장소가 도는 곳에서는 esm.sh 가 막혀 있어 preact·htm 을 npm 사본으로
   가로챈다. CDN 이 열린 곳에서는 CDN_DIR 없이 그냥 돌아간다. */
import { chromium } from 'playwright';
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';

const PFILE = process.env.PFILE || 'prompt.html';
const OUT   = process.env.OUT   || 'fuzz.json';
const SEED  = Number(process.env.SEED || 1);
const ROOT  = resolve(process.env.ROOT || '.');
const CDN   = process.env.CDN_DIR || '';
const MECHS  = (process.env.MECHS  || '건담 엑시아,자쿠Ⅱ,시난주').split(',').map(s => s.trim());
const STYLES = (process.env.STYLES || 'cinematic_semi_real,anime_illust').split(',').map(s => s.trim());
const GENDERS = (process.env.GENDERS || 'female,male').split(',').map(s => s.trim());
const ROUNDS = Number(process.env.ROUNDS || 3);

/* 씨앗 고정 난수 — 같은 씨앗이면 같은 조합을 밟는다 */
function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.mjs': 'application/javascript',
  '.json': 'application/json', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png' };

function serve(root) {
  return new Promise(ok => {
    const s = createServer((req, res) => {
      const p = join(root, decodeURIComponent(req.url.split('?')[0]));
      if (!existsSync(p) || p.indexOf(root) !== 0) { res.writeHead(404); return res.end('no'); }
      res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
      res.end(readFileSync(p));
    });
    s.listen(0, '127.0.0.1', () => ok(s));
  });
}

/* esm.sh 를 npm 사본으로 갈아 끼운다 (막힌 환경용) */
async function shimCDN(ctx, dir) {
  const map = {
    'https://esm.sh/preact@10.24.3': join(dir, 'preact/dist/preact.mjs'),
    'https://esm.sh/preact@10.24.3/hooks': join(dir, 'preact/hooks/dist/hooks.mjs'),
    'https://esm.sh/htm@3.1.1': join(dir, 'htm/dist/htm.mjs'),
  };
  await ctx.route('https://esm.sh/**', async route => {
    const u = route.request().url().split('?')[0];
    if (!map[u] || !existsSync(map[u])) return route.fulfill({ status: 404, body: 'no map ' + u });
    const src = readFileSync(map[u], 'utf8').replace(/from"preact"/g, 'from"https://esm.sh/preact@10.24.3"');
    await route.fulfill({ status: 200, contentType: 'application/javascript', body: src });
  });
}

const srv = await serve(ROOT);
const base = 'http://127.0.0.1:' + srv.address().port;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const ctx = await browser.newContext({ viewport: { width: 1200, height: 1000 } });
if (CDN) await shimCDN(ctx, CDN);
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(String(e)));

await page.goto(base + '/' + PFILE, { waitUntil: 'networkidle' });
await page.waitForSelector('[aria-label=기체]', { timeout: 20000 });
await page.waitForTimeout(800);
/* 프롬프트 칸은 "텍스트 보기" 를 눌러야 그려진다 */
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === '텍스트 보기');
  if (b) b.click();
});
await page.waitForTimeout(400);

const rand = rng(SEED);
const out = {};
let n = 0;

for (const mech of MECHS) {
  for (const style of STYLES) {
    for (const gender of GENDERS) {
      for (let r = 0; r < ROUNDS; r++) {
        /* 값 고르기는 여기서(씨앗 고정), 넣기는 화면에서 */
        const picks = await page.evaluate(([mech, style, gender, dice]) => {
          const S = window.AtelierSpec;
          const fire = (el, v) => { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); };
          const byLabel = l => document.querySelector('[aria-label="' + l + '"]');
          fire(byLabel('기체'), mech);
          fire(byLabel('화풍'), style);
          const gb = [...document.querySelectorAll('.gender-tabs button')]
            .find(b => b.textContent.indexOf(gender === 'female' ? '여성' : '남성') === 0);
          if (gb && !gb.classList.contains('on')) gb.click();
          return { mech, style, gender, dice };
        }, [mech, style, gender, r]);
        await page.waitForTimeout(220);

        /* 파라미터를 무작위로 흔든다 — 고를 값은 바깥(씨앗)에서 정한다 */
        const defs = await page.evaluate(g => window.AtelierSpec.PARAM_DEFS
          .filter(d => !d.sex || d.sex === g)
          .map(d => ({ key: d.key, label: d.ko || d.label,
                       opts: d.options.map(o => o[0]).filter(v => v && v !== '__custom__') })), gender);
        const chosen = {};
        defs.forEach(d => {
          if (rand() < 0.45 && d.opts.length)
            chosen[d.key] = { label: d.label, v: d.opts[Math.floor(rand() * d.opts.length)] };
        });

        /* 접힌 갈래 안의 셀렉트도 잡히도록 details 를 모두 펼친다 */
        await page.evaluate(() => document.querySelectorAll('details.grp').forEach(d => { d.open = true; }));
        await page.waitForTimeout(120);
        await page.evaluate(ch => {
          const fire = (el, v) => { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); };
          Object.keys(ch).forEach(k => {
            const el = document.querySelector('[aria-label="' + ch[k].label.replace(/"/g, '\\"') + '"]');
            if (el) fire(el, ch[k].v);
          });
        }, chosen);
        await page.waitForTimeout(260);

        const text = await page.evaluate(() => {
          const t = document.querySelector('.prompt-view textarea');
          return t ? t.value : '';
        });
        const flat = {}; Object.keys(chosen).forEach(k => { flat[k] = chosen[k].v; });
        out[[mech, style, gender, r].join('|')] = { picks: flat, prompt: text };
        n++;
      }
    }
  }
}

writeFileSync(OUT, JSON.stringify(out, null, 1));
const chars = Object.values(out).reduce((a, v) => a + v.prompt.length, 0);
console.log(PFILE + ' → ' + OUT + '  조합 ' + n + '개 · ' + chars.toLocaleString() + '자');
if (errs.length) { console.error('JS 오류 ' + errs.length + '개:\n  ' + errs.slice(0, 5).join('\n  ')); process.exitCode = 1; }
if (!chars) { console.error('프롬프트가 한 글자도 안 나왔다 — 화면을 못 몰았다'); process.exitCode = 1; }

await browser.close();
srv.close();
