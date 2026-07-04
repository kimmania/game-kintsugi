import { el, removeModal, escapeHtml } from './ui.ts';
import type { GameState } from './types.ts';
import { canApplyGold } from './engine.ts';

export function renderBowls(state: GameState, onTap: (idx: number) => void): void {
  const area = el<HTMLDivElement>('bowl-area');
  if (!area) return;
  area.innerHTML = '';
  const capacity = state.capacity;

  // set a sensible bowl height once before building fragments
  const maxCapacity = Math.max(...state.bowls.map(() => state.capacity));
  const areaHeight = Math.min(window.innerHeight * 0.42, 120 * maxCapacity);
  document.documentElement.style.setProperty('--bowl-height', `${areaHeight}px`);

  state.bowls.forEach((bowl, idx) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'bowl-wrapper';
    wrapper.style.setProperty('--bowl-shape', String(idx % 4));

    const div = document.createElement('div');
    div.className = 'bowl';
    if (state.selectedBowl === idx) div.classList.add('selected');
    if (state.goldMode && canApplyGold(state, idx)) div.classList.add('gold-ready');
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', `Bowl ${idx + 1}`);
    div.addEventListener('click', () => onTap(idx));

    const rim = document.createElement('div');
    rim.className = 'bowl-rim';
    div.appendChild(rim);

    bowl.forEach((color, fragmentIndex) => {
      const frag = document.createElement('div');
      frag.className = 'fragment';
      if (color === 'gold') frag.classList.add('fragment-gold');
      frag.dataset.color = color;
      // shards become slightly narrower toward the top of the bowl
      const inset = (capacity - fragmentIndex - 1) * 1.5;
      frag.style.setProperty('--fragment-inset', `${inset}px`);
      const fraction = 1 / capacity;
      frag.style.setProperty('--fragment-height-fraction', `${fraction}`);
      div.appendChild(frag);
    });

    const foot = document.createElement('div');
    foot.className = 'bowl-foot';
    wrapper.appendChild(foot);
    wrapper.appendChild(div);
    area.appendChild(wrapper);
  });
}

export function updateHeader(state: GameState): void {
  const mc = el<HTMLDivElement>('move-count');
  const gd = el<HTMLDivElement>('gold-display');
  if (mc) mc.textContent = `Moves: ${state.moves} / ${state.level.targetMoves}`;
  if (gd) gd.textContent = `Gold: ${state.goldDropsRemaining} / ${state.goldDropsTotal}`;
  const gb = el<HTMLButtonElement>('gold-btn');
  if (gb) {
    gb.classList.toggle('active', state.goldMode);
    gb.setAttribute('aria-pressed', state.goldMode ? 'true' : 'false');
    gb.disabled = state.goldDropsRemaining <= 0 && !state.goldMode;
    /* Update display text to say "Gold: remaining / total" */
    const label = gb.querySelector('span.gold-label');
    if (label) label.textContent = `Gold ${state.goldDropsRemaining}`;
  }
}

export function bindLevelControls(
  onUndo: () => void,
  onReset: () => void,
  onGoldToggle: () => void,
  onHelp: () => void,
  onBack: () => void
): void {
  el<HTMLButtonElement>('undo-btn').addEventListener('click', onUndo);
  el<HTMLButtonElement>('reset-btn').addEventListener('click', onReset);
  el<HTMLButtonElement>('gold-btn').addEventListener('click', onGoldToggle);
  el<HTMLButtonElement>('help-btn').addEventListener('click', onHelp);
  el<HTMLButtonElement>('level-back').addEventListener('click', onBack);
}

export function showVictoryModal(
  title: string,
  stars: number,
  moves: number,
  target: number,
  onNext: (() => void) | null,
  onReplay: () => void,
  onMap: () => void
): void {
  const existing = document.getElementById('victory-modal');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'victory-modal';
  overlay.className = 'modal-overlay';
  const starText = '★'.repeat(stars) + '<span class="star-empty">★</span>'.repeat(3 - stars);
  overlay.innerHTML = `
    <div class="modal-inner">
      <h2>${escapeHtml(title)}</h2>
      <div id="victory-stars">${starText}</div>
      <p style="text-align:center;color:var(--muted)">
        Moves: ${moves} / target ${target}
      </p>
      <div id="victory-actions">
        ${onNext ? `<button id="vic-next" class="btn btn-primary" type="button">Next</button>` : ''}
        <button id="vic-replay" type="button">Replay</button>
        <button id="vic-map" type="button">Map</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  const withClose = (fn: () => void) => () => {
    removeModal('victory-modal');
    fn();
  };
  if (onNext) el<HTMLButtonElement>('vic-next').addEventListener('click', withClose(onNext));
  el<HTMLButtonElement>('vic-replay').addEventListener('click', withClose(onReplay));
  el<HTMLButtonElement>('vic-map').addEventListener('click', withClose(onMap));
}

export function showHelpModal(): void {
  const existing = document.getElementById('help-modal');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'help-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-inner" id="help-content">
      <h2>How to Restore</h2>
      <p>
        Tap a <strong>source bowl</strong>, then tap a <strong>destination bowl</strong>.
        Fragments slide across when colours match or the bowl is empty.
      </p>
      <div class="help-bowl-row">
        <div class="mini-bowl">
          <div class="mini-fragment" data-color="cobalt"></div>
          <div class="mini-fragment" data-color="cobalt"></div>
        </div>
        <div style="align-self:center;color:var(--muted)">→</div>
        <div class="mini-bowl">
          <div class="mini-fragment" data-color="cobalt"></div>
        </div>
      </div>
      <p>
        <strong>Gold lacquer</strong> turns the top fragment into a wildcard.
        Any colour may be poured onto gold, and after one matching layer lands
        the gold <em>absorbs</em> it into a single perfect seam.
      </p>
      <div class="help-bowl-row">
        <div class="mini-bowl">
          <div class="mini-fragment" data-color="rust"></div>
          <div class="mini-fragment" data-color="gold"></div>
        </div>
        <div style="align-self:center;color:var(--muted)">+ cobalt</div>
        <div class="mini-bowl">
          <div class="mini-fragment" data-color="rust"></div>
          <div class="mini-fragment" data-color="cobalt"></div>
        </div>
      </div>
      <p style="text-align:center;font-size:0.9rem;color:var(--gold)">
        Unused gold earns bonus points and the third star.
      </p>
      <button id="close-help" class="btn btn-primary" type="button" style="width:100%">Got it</button>
    </div>
  `;
  document.body.appendChild(overlay);
  el<HTMLButtonElement>('close-help').addEventListener('click', () => removeModal('help-modal'));
}
