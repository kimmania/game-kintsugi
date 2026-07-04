import type { LevelData, SaveData } from './types.ts';
import { TIERS } from './types.ts';

export function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

export function removeModal(id: string): void {
  el(id)?.remove();
}

export function showToast(message: string, duration = 1500): void {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();
  const div = document.createElement('div');
  div.id = 'toast';
  div.className = 'toast';
  div.textContent = message;
  div.setAttribute('role', 'status');
  div.setAttribute('aria-live', 'polite');
  document.body.appendChild(div);
  setTimeout(() => div.remove(), duration);
}

export function renderIntro(onStart: () => void): void {
  const app = el<HTMLDivElement>('app');
  app.innerHTML = `
    <section id="intro-screen">
      <div>
        <h1>Kintsugi</h1>
        <div class="tagline">The Art of Repair</div>
      </div>
      <p id="intro-story">
        In a quiet Kyoto atelier, broken bowls arrive from across the centuries.
        Your craft is not to hide their cracks, but to honour them —
        reassembling the coloured glaze and sealing every seam with gold.
        A repaired bowl, the masters say, is more beautiful than the original.
      </p>
      <button id="intro-start" class="btn btn-primary" type="button">Enter the Atelier</button>
    </section>
  `;
  el<HTMLButtonElement>('intro-start').addEventListener('click', onStart);
}

export function renderMap(
  save: SaveData,
  tiers: Record<string, { season: string; levels: LevelData[] }>,
  onLevel: (id: string) => void,
  onSettings: () => void
): void {
  const app = el<HTMLDivElement>('app');
  app.innerHTML = `
    <section id="map-screen">
      <header id="map-header">
        <h1 style="margin:0;font-size:1.4rem;color:var(--gold)">Atelier</h1>
        <button id="map-settings" type="button" aria-label="Settings">⚙️</button>
      </header>
      <p style="text-align:center;color:var(--muted);font-size:0.95rem">${escapeHtml('Tap a glowing number to restore a bowl.')}</p>
      <div id="tier-list"></div>
    </section>
  `;
  const list = el<HTMLDivElement>('tier-list');
  for (const tier of TIERS) {
    const data = tiers[tier];
    if (!data) continue;
    const group = document.createElement('div');
    group.className = 'tier-group';
    const title = document.createElement('h2');
    title.className = 'tier-title';
    title.textContent = data.season;
    group.appendChild(title);
    const grid = document.createElement('div');
    grid.className = 'level-grid';
    for (const lvl of data.levels) {
      const prog = save.progress[lvl.id];
      const unlocked = save.unlocked.includes(lvl.id);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'level-node';
      if (!unlocked) btn.classList.add('locked');
      if (prog?.completed) {
        btn.classList.add('completed');
        btn.dataset.stars = String(prog.stars ?? 1);
      }
      btn.textContent = String(lvl.index + 1);
      btn.disabled = !unlocked;
      btn.addEventListener('click', () => onLevel(lvl.id));
      grid.appendChild(btn);
    }
    group.appendChild(grid);
    list.appendChild(group);
  }
  el<HTMLButtonElement>('map-settings').addEventListener('click', onSettings);
}

export function renderLevelScreen(level: LevelData, moves: number): void {
  const app = el<HTMLDivElement>('app');
  app.innerHTML = `
    <section id="level-screen">
      <header id="level-header">
        <button id="level-back" type="button" aria-label="Back to map">←</button>
        <div id="level-title">${escapeHtml(level.name)}</div>
        <div id="level-meta" style="text-align:right">
          <div id="move-count">Moves: ${moves} / ${level.targetMoves}</div>
          <div id="gold-display" style="color:var(--gold);font-size:0.85rem">Gold: ${level.goldDrops} / ${level.goldDrops}</div>
        </div>
      </header>
      <div id="bowl-area" role="grid" aria-label="Bowl fragments"></div>
      <div id="level-controls" role="toolbar" aria-label="Level controls">
        <button id="undo-btn" type="button">Undo</button>
        <button id="reset-btn" type="button">Reset</button>
        <button id="gold-btn" type="button" aria-pressed="false">
          <span role="img" aria-hidden="true">🖌</span> <span class="gold-label">Gold</span>
        </button>
        <button id="help-btn" type="button" aria-label="Help">?</button>
      </div>
    </section>
  `;
}

export function getFragmentColorStyle(colorId: string): { background: string; color: string } {
  switch (colorId) {
    case 'celadon':
      return { background: 'var(--celadon)', color: '#fff' };
    case 'cobalt':
      return { background: 'var(--cobalt)', color: '#fff' };
    case 'rust':
      return { background: 'var(--rust)', color: '#fff' };
    case 'rice':
      return { background: 'var(--rice)', color: '#1a1814' };
    case 'tenmoku':
      return { background: 'var(--tenmoku)', color: '#fff' };
    case 'sakura':
      return { background: 'var(--sakura)', color: '#fff' };
    case 'gold':
      return { background: 'var(--gold)', color: '#1a1814' };
    default:
      return { background: '#555', color: '#fff' };
  }
}

export function clearSelection(): void {
  document.querySelectorAll('.bowl.selected').forEach((b) => b.classList.remove('selected'));
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
