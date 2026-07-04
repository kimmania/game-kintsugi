import './style.css';
import * as sound from './sound.ts';
import { loadSave, saveData, clearSave } from './storage.ts';
import { fetchAllLevels, saveLevelResult, isUnlocked } from './level-data.ts';
import type { GameState, SaveData, LevelData, Settings } from './types.ts';
import { createState, pushSnapshot, applyTransfer, applyGold, undo, resetState, isWin, scoreBreakdown } from './engine.ts';
import { renderIntro, renderMap, renderLevelScreen, showToast, showConfirmModal } from './ui.ts';
import { renderBowls, updateHeader, bindLevelControls, showVictoryModal, showHelpModal } from './level-ui.ts';
import { showSettingsModal } from './settings-ui.ts';

let save: SaveData;
let levels: LevelData[] = [];
let state: GameState | null = null;
let pendingWin = false;

function applySettingsCss(settings: Settings): void {
  sound.setMuted(!settings.sound);
  document.body.classList.toggle('reduced-motion', settings.reducedMotion);
  document.body.classList.toggle('color-blind', settings.colorBlind);
  document.body.classList.toggle('high-contrast', settings.highContrast);
}

function persistSettings(): void {
  saveData(save);
  applySettingsCss(save.settings);
}

async function init(): Promise<void> {
  save = loadSave();
  applySettingsCss(save.settings);
  document.addEventListener('pointerdown', () => sound.unlockAudio(), { once: true });
  document.addEventListener('keydown', () => sound.unlockAudio(), { once: true });

  const all = await fetchAllLevels();
  levels = all;

  if (!save.hasSeenIntro) {
    renderIntro(() => {
      save.hasSeenIntro = true;
      saveData(save);
      if (!save.hasSeenHelp) {
        showHelpModal();
        save.hasSeenHelp = true;
        saveData(save);
      }
      showMap();
    });
  } else {
    showMap();
  }
}

function showMap(): void {
  const tiers: Record<string, { season: string; levels: LevelData[] }> = {};
  for (const lvl of levels) {
    if (!tiers[lvl.tier]) tiers[lvl.tier] = { season: getTierSeason(lvl.tier), levels: [] };
    tiers[lvl.tier].levels.push(lvl);
  }
  renderMap(save, tiers, startLevel, showSettings);
}

function getTierSeason(tier: string): string {
  return tier === 'spring'
    ? 'Spring Awakening'
    : tier === 'summer'
    ? 'Summer Firing'
    : tier === 'autumn'
    ? 'Autumn Ash'
    : tier === 'winter'
    ? 'Winter Stillness'
    : 'Golden Age';
}

async function startLevel(levelId: string): Promise<void> {
  const level = levels.find((l) => l.id === levelId);
  if (!level || !isUnlocked(save, levelId)) return;
  state = createState(level);
  save.lastLevelId = levelId;
  saveData(save);
  renderLevelScreen(level, 0);
  refreshLevel();
}

function refreshLevel(): void {
  if (!state) return;
  renderBowls(state, handleBowlTap);
  updateHeader(state);
  bindLevelControls(handleUndo, handleReset, toggleGoldMode, () => showHelpModal(), backToMap);
}

function handleBowlTap(idx: number): void {
  if (!state || pendingWin) return;
  sound.unlockAudio();

  if (state.goldMode) {
    const can = state.bowls[idx].length > 0 && state.bowls[idx][state.bowls[idx].length - 1] !== 'gold' && state.goldDropsRemaining > 0;
    if (can) {
      pushSnapshot(state);
      applyGold(state, idx);
      state.goldMode = false;
      state.moves++;
      renderBowls(state, handleBowlTap);
      updateHeader(state);
      sound.playGoldApply();
    } else {
      state.goldMode = false;
      sound.playInvalid();
      updateHeader(state);
    }
    return;
  }

  if (state.selectedBowl === null) {
    if (state.bowls[idx].length === 0) {
      sound.playInvalid();
      return;
    }
    state.selectedBowl = idx;
    renderBowls(state, handleBowlTap);
    sound.playButton();
    return;
  }

  // same bowl cancel
  if (state.selectedBowl === idx) {
    state.selectedBowl = null;
    renderBowls(state, handleBowlTap);
    return;
  }

  pushSnapshot(state);
  const moved = applyTransfer(state, state.selectedBowl!, idx);
  if (moved.moved > 0) {
    if (moved.absorbed) sound.playGoldAbsorb();
    else sound.playTransfer();
    state.moves++;
  } else {
    sound.playInvalid();
  }
  state.selectedBowl = null;
  renderBowls(state, handleBowlTap);
  updateHeader(state);
  if (isWin(state)) {
    pendingWin = true;
    setTimeout(() => handleWin(state!), 600);
  }
}

function handleWin(state: GameState): void {
  sound.playWinBowl();
  const score = scoreBreakdown(state);
  saveLevelResult(save, levels, state.level.id, score.stars, state.moves);
  const nextId = levels[levels.findIndex((l) => l.id === state.level.id) + 1]?.id ?? null;

  showVictoryModal(
    'Bowl Restored',
    score.stars,
    state.moves,
    state.level.targetMoves,
    nextId ? () => startLevel(nextId) : null,
    () => startLevel(state.level.id),
    backToMap
  );
}

function handleUndo(): void {
  if (!state) return;
  if (undo(state)) {
    renderBowls(state, handleBowlTap);
    updateHeader(state);
    sound.playUndo();
  }
}

function handleReset(): void {
  if (!state) return;
  showConfirmModal(
    'Reset Bowl',
    'Restore this bowl to its original, broken state?',
    'Reset',
    'Cancel',
    () => {
      resetState(state!);
      renderBowls(state!, handleBowlTap);
      updateHeader(state!);
      sound.playReset();
    }
  );
}

function toggleGoldMode(): void {
  if (!state) return;
  if (state.goldDropsRemaining <= 0) {
    sound.playInvalid();
    return;
  }
  state.goldMode = !state.goldMode;
  state.selectedBowl = null;
  updateHeader(state);
  renderBowls(state, handleBowlTap);
  sound.playButton();
}

function backToMap(): void {
  pendingWin = false;
  showMap();
}

function showSettings(): void {
  showSettingsModal(
    save.settings,
    (next) => {
      save.settings = next;
      persistSettings();
    },
    () => {
      clearSave();
      save = loadSave();
      applySettingsCss(save.settings);
      showMap();
      showToast('Progress reset.');
    }
  );
}

init().catch((err) => {
  console.error(err);
  document.body.innerHTML = '<p style="padding:20px;color:#fff">Failed to load game.</p>';
});
