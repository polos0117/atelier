import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
const html = htm.bind(h);

/* 지금 외형(테마·밀도)을 읽고, 바뀌면 다시 그린다. 고르개와 문장이 같이 쓴다 */
function useAppearance() {
  const [appearance, setAppearance] = useState(() => window.AtelierAppearance.get());
  useEffect(() => {
    const sync = () => setAppearance(window.AtelierAppearance.get());
    addEventListener('atelier-appearance', sync);
    sync();
    return () => removeEventListener('atelier-appearance', sync);
  }, []);
  return appearance;
}

export function AppearanceControls() {
  const appearance = useAppearance();
  return html`<div class="appearance-controls">
    <label><span class="theme-dot" aria-hidden="true"></span>테마
      <select aria-label="테마" value=${appearance.theme}
        onchange=${e => window.AtelierAppearance.set('theme', e.target.value)}>
        <option value="midnight">미드나이트 · 함교</option>
        <option value="white-base">화이트 베이스</option>
        <option value="archangel">아크엔젤</option>
        <option value="musai">무사이</option>
      </select>
    </label>
    <label>화면 밀도
      <select aria-label="화면 밀도" value=${appearance.density}
        onchange=${e => window.AtelierAppearance.set('density', e.target.value)}>
        <option value="compact">촘촘하게</option><option value="relaxed">여유롭게</option>
      </select>
    </label>
  </div>`;
}

/* 테마마다 그 함선이 속한 곳의 문장을 단다. 실제 마크를 베끼지 않고 형태만
   암시한다 — 색은 안 박고 currentColor 와 --signal 을 써서 네 테마 어디서든 맞는다.
   아래 띠(.fleet-name)가 이미 함선 이름을 찍고 있으니 그 짝이다. */
const FLEET_MARK = {
  /* 중립 · 함교 — 원래 쓰던 별 모양을 기본으로 둔다 */
  midnight: html`
    <path d="M24 3 30 19 45 13 38 33 24 44 10 33 3 13 18 19Z" stroke="currentColor" stroke-width="1.5" />
    <path d="m24 12 7 19-7 6-7-6Z" fill="currentColor" />
    <path d="M5 40h8m22 0h8" stroke="var(--signal)" stroke-width="3" />`,
  /* 지구연방 — 방패 하나에 지구의 자오선과 적도 */
  'white-base': html`
    <path d="M24 5 41 12v13c0 10-7 16-17 20C14 41 7 35 7 25V12Z" stroke="currentColor" stroke-width="1.5" />
    <path d="M24 5v40M9 21h30" stroke="currentColor" stroke-width="1.5" />
    <path d="M16 30h16" stroke="var(--signal)" stroke-width="3" />`,
  /* 지구연합 — 위로 펼친 두 날개와 가운데로 내린 날 */
  archangel: html`
    <path d="M24 14 41 6c2 11-5 18-17 21M24 14 7 6c-2 11 5 18 17 21" stroke="currentColor" stroke-width="1.5" />
    <path d="M24 16v14" stroke="currentColor" stroke-width="1.5" />
    <path d="m24 29 6 7-6 8-6-8Z" fill="currentColor" />
    <path d="M11 38h5m16 0h5" stroke="var(--signal)" stroke-width="3" />`,
  /* 지온 — 아래로 내린 방패 하나에 모노아이 하나 */
  musai: html`
    <path d="M24 4 42 11v14c0 10-8 16-18 20C14 41 6 35 6 25V11Z" stroke="currentColor" stroke-width="1.5" />
    <circle cx="24" cy="21" r="5.5" fill="var(--signal)" />
    <path d="M10 21h5m18 0h5" stroke="currentColor" stroke-width="1.5" />`,
};

export function WorkspaceHeading({ title, subtitle, code }) {
  const { theme } = useAppearance();
  return html`<div class="workspace-heading">
    <div class="workspace-title">
      <svg class="fleet-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        ${FLEET_MARK[theme] || FLEET_MARK.midnight}
      </svg>
      <div><div class="eyebrow">ATELIER <span>/ ${code}</span></div>
        <h1>${title}</h1><p>${subtitle}</p></div>
    </div>
    <div class="fleet-signature" aria-hidden="true"><span class="fleet-name"></span><i></i><b>CREATIVE DECK</b></div>
  </div>`;
}
