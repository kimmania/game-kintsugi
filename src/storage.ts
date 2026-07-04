import type { SaveData, Settings, LevelProgress } from './types.ts';
import { SAVE_KEY, SAVE_VERSION, DEFAULT_SETTINGS, FIRST_LEVEL_ID } from './types.ts';

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return { ...DEFAULT_SETTINGS, ...parsed.settings };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function loadSave(): SaveData {
  const empty: SaveData = {
    version: SAVE_VERSION,
    unlocked: [FIRST_LEVEL_ID],
    progress: {},
    settings: DEFAULT_SETTINGS,
    hasSeenIntro: false,
    hasSeenHelp: false,
  };
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    if ((parsed.version ?? 1) !== SAVE_VERSION) {
      return { ...empty, settings: { ...DEFAULT_SETTINGS, ...parsed.settings } };
    }
    const unlocked = new Set(parsed.unlocked ?? [FIRST_LEVEL_ID]);
    unlocked.add(FIRST_LEVEL_ID);
    return {
      version: SAVE_VERSION,
      unlocked: Array.from(unlocked),
      progress: typeof parsed.progress === 'object' ? parsed.progress : {},
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      hasSeenIntro: !!parsed.hasSeenIntro,
      hasSeenHelp: !!parsed.hasSeenHelp,
      lastLevelId: parsed.lastLevelId,
    };
  } catch {
    return empty;
  }
}

export function saveData(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // ignore if storage is full
  }
}

export function updateLevelProgress(
  data: SaveData,
  levelId: string,
  stars: number,
  moves: number
): SaveData {
  const current = data.progress[levelId] ?? { completed: false, stars: 0 };
  const next: LevelProgress = {
    completed: true,
    stars: Math.max(current.stars, stars),
    bestMoves: current.bestMoves === undefined ? moves : Math.min(current.bestMoves, moves),
  };
  data.progress[levelId] = next;
  return data;
}

export function clearSave(): void {
  localStorage.removeItem(SAVE_KEY);
}
