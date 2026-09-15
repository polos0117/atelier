import { h } from 'https://esm.sh/preact@10.24.3';
import { useState, useEffect } from 'https://esm.sh/preact@10.24.3/hooks';
import htm from 'https://esm.sh/htm@3.1.1';
const html = htm.bind(h);

export function AppearanceControls() {
  const [appearance, setAppearance] = useState(() => window.AtelierAppearance.get());
  useEffect(() => {
    const sync = () => setAppearance(window.AtelierAppearance.get());
    addEventListener('atelier-appearance', sync);
    sync();
    return () => removeEventListener('atelier-appearance', sync);
  }, []);
  return html`<div class="appearance-controls">
    <label><span class="theme-dot" aria-hidden="true"></span>테마
      <select aria-label="테마" value=${appearance.theme}
        onchange=${e => window.AtelierAppearance.set('theme', e.target.value)}>
        <option value="midnight">미드나이트 · 함교</option>
        <option value="white-base">화이트 베이스</option>
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

export function WorkspaceHeading({ title, subtitle, code }) {
  return html`<div class="workspace-heading">
    <div class="workspace-title">
      <svg class="fleet-mark" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <path d="M24 3 30 19 45 13 38 33 24 44 10 33 3 13 18 19Z" stroke="currentColor" stroke-width="1.5" />
        <path d="m24 12 7 19-7 6-7-6Z" fill="currentColor" />
        <path d="M5 40h8m22 0h8" stroke="var(--signal)" stroke-width="3" />
      </svg>
      <div><div class="eyebrow">ATELIER <span>/ ${code}</span></div>
        <h1>${title}</h1><p>${subtitle}</p></div>
    </div>
    <div class="fleet-signature" aria-hidden="true"><span class="fleet-name"></span><i></i><b>CREATIVE DECK</b></div>
  </div>`;
}
