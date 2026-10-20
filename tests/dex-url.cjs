/* 도감 주소 검사 — 상세 시트와 뒤로 가기, 목록 조건이 주소에 남는지.
   카드는 상호작용 요소를 겹쳐 담지 않는다 (이름 단추 하나 + 다음 그림 단추).
   Run: node tests/dex-url.cjs   (ESM_DIR·CHROMIUM_PATH 는 browser-harness.cjs 설명 참고) */
const H = require('./browser-harness.cjs');
(async () => {
  const h = await H.start();
  const T = [];
  const add = (n, ok, got) => T.push([n, !!ok, String(got === undefined ? '' : got)]);
  try {
    const s = await h.open('dex.html', { viewport: { width: 1280, height: 900 } });
    const p = s.page;
    await p.locator('.grid>.cell').first().waitFor({ timeout: 30000 });
    const search = () => p.evaluate(() => location.search);
    const nested = await p.evaluate(() => [...document.querySelectorAll('.grid>.cell')].filter(c =>
      c.matches('[role=button],[tabindex]') || [...c.querySelectorAll('button,a[href],[role=button]')]
        .some(b => b.parentElement.closest('button,a[href],[role=button]'))).length);
    add('카드 안에 단추가 겹치지 않는다', nested === 0, nested + '장');
    add('카드 이름 단추가 이름을 읽는다', await p.evaluate(() => {
      const b = document.querySelector('.grid .cell-open'), c = b.closest('.cell');
      return b.textContent.trim() && !c.querySelector('img[alt]:not([alt=""])');
    }));
    const len0 = await p.evaluate(() => history.length);
    const name = await p.locator('.grid .cell-open').first().textContent();
    await p.locator('.grid>.cell').first().click();
    await p.locator('.sheet').waitFor();
    add('카드를 누르면 시트가 열리고 ?mech= 가 붙는다',
        new URLSearchParams(await search()).get('mech') === name.trim(), await search());
    add('시트를 열면 기록이 한 칸 쌓인다', await p.evaluate(n => history.length === n + 1, len0));
    await p.goBack();
    await p.waitForFunction(() => !document.querySelector('.sheet'), null, { timeout: 5000 }).catch(() => {});
    add('뒤로 가기는 시트를 닫는다 (도감에 머문다)',
        (await p.locator('.sheet').count()) === 0 && /dex\.html/.test(p.url()) && !(await search()).includes('mech='), p.url());
    add('시트가 닫히면 연 카드로 초점이 돌아온다',
        await p.evaluate(() => !!document.activeElement.closest('.grid>.cell')));
    await p.goForward();
    await p.locator('.sheet').waitFor({ timeout: 5000 }).catch(() => {});
    add('앞으로 가기는 시트를 다시 연다', (await p.locator('.sheet').count()) === 1);
    await p.locator('.sheet [data-dialog-close]').click();
    await p.waitForTimeout(300);
    add('닫기 단추로 닫으면 ?mech= 가 지워진다',
        (await p.locator('.sheet').count()) === 0 && !(await search()).includes('mech='), await search());
    /* 목록 조건은 replaceState — 기록이 늘지 않고 주소만 바뀐다 */
    const len1 = await p.evaluate(() => history.length);
    /* 시트에서 돌아오며 목록이 내려가 있으면 머리말이 접혀 탭이 숨는다 */
    await p.evaluate(() => { document.querySelector('.collection-scroll').scrollTop = 0; });
    await p.waitForTimeout(200);
    await p.locator('.tabs .tab', { hasText: '파일럿' }).click();
    await p.locator('.ctl .sw button', { hasText: '남' }).click();
    await p.fill('[aria-label="기체 이름 검색"]', '아');
    await p.waitForTimeout(300);
    const qs = new URLSearchParams(await search());
    add('탭·성별·검색이 주소에 남는다', qs.get('tab') === '파일럿' && qs.get('gender') === 'm' && qs.get('q') === '아', await search());
    add('목록 조건은 기록을 쌓지 않는다', await p.evaluate(n => history.length === n, len1));
    await p.reload({ waitUntil: 'domcontentloaded' });
    await p.locator('.tabs .tab.on').waitFor({ timeout: 30000 });
    await p.waitForTimeout(600);
    const back = await p.evaluate(() => ({ tab: document.querySelector('.tabs .tab.on').textContent.replace(/\d+/g, '').trim(),
      q: document.querySelector('[aria-label="기체 이름 검색"]').value }));
    add('새로고침해도 같은 조건으로 연다', back.tab === '파일럿' && back.q === '아', JSON.stringify(back));
    /* 격납고 딥링크: 기록 칸 없이 열렸으니 닫으면 주소만 고친다 */
    await p.goto(h.base + '/dex.html?mech=' + encodeURIComponent(name.trim()) + '&gender=f', { waitUntil: 'domcontentloaded' });
    await p.locator('.sheet').waitFor({ timeout: 30000 });
    await p.locator('.sheet [data-dialog-close]').click();
    await p.waitForTimeout(300);
    add('딥링크 시트를 닫으면 ?mech= 가 지워지고 도감에 머문다',
        (await p.locator('.sheet').count()) === 0 && /dex\.html/.test(p.url()) && !(await search()).includes('mech='), p.url());
    add('JS 오류 없음', s.errors.length === 0, s.errors.join(' | '));
    await s.close();
    H.report(T, '도감 주소');
  } finally { await h.stop(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
