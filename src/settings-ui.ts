import type { Settings } from './types.ts';
import { el, removeModal } from './ui.ts';

export function showSettingsModal(
  settings: Settings,
  onChange: (next: Settings) => void,
  onResetSave: () => void
): void {
  const existing = document.getElementById('settings-modal');
  if (existing) existing.remove();
  const overlay = document.createElement('div');
  overlay.id = 'settings-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-inner" id="settings-content">
      <h2>Settings</h2>
      <label>
        <span>Sound</span>
        <input type="checkbox" id="set-sound" ${settings.sound ? 'checked' : ''}>
      </label>
      <label>
        <span>Reduced motion</span>
        <input type="checkbox" id="set-reduced" ${settings.reducedMotion ? 'checked' : ''}>
      </label>
      <label>
        <span>Colour-blind patterns</span>
        <input type="checkbox" id="set-colorblind" ${settings.colorBlind ? 'checked' : ''}>
      </label>
      <label>
        <span>High contrast</span>
        <input type="checkbox" id="set-contrast" ${settings.highContrast ? 'checked' : ''}>
      </label>
      <button id="reset-save-btn" type="button" style="margin-top:1rem;width:100%;background:var(--error)">Reset all progress</button>
      <button id="close-settings" class="btn btn-primary" type="button" style="margin-top:0.75rem;width:100%">Close</button>
    </div>
  `;
  document.body.appendChild(overlay);

  const read = (): Settings => ({
    sound: el<HTMLInputElement>('set-sound').checked,
    reducedMotion: el<HTMLInputElement>('set-reduced').checked,
    colorBlind: el<HTMLInputElement>('set-colorblind').checked,
    highContrast: el<HTMLInputElement>('set-contrast').checked,
  });

  ['set-sound', 'set-reduced', 'set-colorblind', 'set-contrast'].forEach((id) => {
    el<HTMLInputElement>(id).addEventListener('change', () => onChange(read()));
  });

  el<HTMLButtonElement>('reset-save-btn').addEventListener('click', () => {
    if (confirm('Erase all saved progress, settings, and unlocked levels?')) {
      onResetSave();
      removeModal('settings-modal');
    }
  });
  el<HTMLButtonElement>('close-settings').addEventListener('click', () => removeModal('settings-modal'));
}
