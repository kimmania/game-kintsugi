import { saveData, updateLevelProgress } from './storage.ts';
import type { SaveData, LevelData, TierData } from './types.ts';
import { FIRST_LEVEL_ID } from './types.ts';

const cache: Record<string, TierData> = {};

export async function fetchTier(tier: string): Promise<TierData> {
  if (cache[tier]) return cache[tier];
  const base = import.meta.env.BASE_URL ?? '/game-kintsugi/';
  const res = await fetch(`${base}puzzles/${tier}.json`);
  const data = (await res.json()) as TierData;
  cache[tier] = data;
  return data;
}

export async function fetchAllLevels(): Promise<LevelData[]> {
  const tiers = ['spring', 'summer', 'autumn', 'winter', 'golden'];
  const list: LevelData[] = [];
  for (const tier of tiers) {
    const data = await fetchTier(tier);
    list.push(...data.levels);
  }
  return list;
}

export function nextLevelId(levels: LevelData[], currentId: string): string | null {
  const idx = levels.findIndex((l) => l.id === currentId);
  if (idx >= 0 && idx < levels.length - 1) return levels[idx + 1].id;
  return null;
}

export function unlockNext(data: SaveData, levels: LevelData[], levelId: string): SaveData {
  const next = nextLevelId(levels, levelId);
  if (next) {
    const set = new Set(data.unlocked);
    set.add(next);
    data.unlocked = Array.from(set);
  }
  return data;
}

export function isUnlocked(data: SaveData, levelId: string): boolean {
  if (levelId === FIRST_LEVEL_ID) return true;
  return data.unlocked.includes(levelId);
}

export function saveLevelResult(
  data: SaveData,
  levels: LevelData[],
  levelId: string,
  stars: number,
  moves: number
): SaveData {
  updateLevelProgress(data, levelId, stars, moves);
  unlockNext(data, levels, levelId);
  data.lastLevelId = levelId;
  saveData(data);
  return data;
}
