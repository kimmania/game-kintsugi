export interface ColorData {
  id: string;
  name: string;
  hex: string;
}

export interface LevelData {
  id: string;
  tier: string;
  index: number;
  name: string;
  bowls: string[][];
  capacity: number;
  goldDrops: number;
  targetMoves: number;
  optimalMoves: number;
  palette: ColorData[];
}

export interface TierData {
  tier: string;
  season: string;
  levels: LevelData[];
}

export type GameMode = 'intro' | 'map' | 'level' | 'victory' | 'settings';

export interface LevelProgress {
  completed: boolean;
  stars: number;
  bestMoves?: number;
}

export interface SaveData {
  version: number;
  unlocked: string[];
  progress: Record<string, LevelProgress>;
  settings: Settings;
  hasSeenIntro: boolean;
  hasSeenHelp: boolean;
  lastLevelId?: string;
}

export interface Settings {
  sound: boolean;
  reducedMotion: boolean;
  colorBlind: boolean;
  highContrast: boolean;
}

export const SAVE_VERSION = 1;
export const SAVE_KEY = 'catalyst-save';

export const TIERS = ['spring', 'summer', 'autumn', 'winter', 'golden'];

export const FIRST_LEVEL_ID = 'spr-1';

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  reducedMotion: false,
  colorBlind: false,
  highContrast: false,
};

export interface GameState {
  level: LevelData;
  bowls: string[][];
  initialBowls: string[][];
  capacity: number;
  goldDropsRemaining: number;
  goldDropsTotal: number;
  moves: number;
  history: Snapshot[];
  selectedBowl: number | null;
  goldMode: boolean;
}

export interface Snapshot {
  bowls: string[][];
  goldDropsRemaining: number;
  moves: number;
}

export interface ScoreBreakdown {
  base: number;
  efficiencyBonus: number;
  goldBonus: number;
  perfectBonus: number;
  total: number;
  stars: number;
}
