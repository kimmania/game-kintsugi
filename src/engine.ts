import type { GameState, LevelData, ScoreBreakdown } from './types.ts';

export function cloneBowls(bowls: string[][]): string[][] {
  return bowls.map((b) => [...b]);
}

export function createState(level: LevelData): GameState {
  const bowls = cloneBowls(level.bowls);
  return {
    level,
    bowls,
    initialBowls: cloneBowls(bowls),
    capacity: level.capacity,
    goldDropsRemaining: level.goldDrops,
    goldDropsTotal: level.goldDrops,
    moves: 0,
    history: [],
    selectedBowl: null,
    goldMode: false,
  };
}

export function topBlock(bowl: string[]): { color: string; count: number } {
  if (bowl.length === 0) return { color: '', count: 0 };
  const color = bowl[bowl.length - 1];
  let count = 0;
  for (let i = bowl.length - 1; i >= 0; i--) {
    if (bowl[i] === color) count++;
    else break;
  }
  return { color, count };
}

export function canTransfer(
  state: GameState,
  fromIdx: number,
  toIdx: number
): { allowed: boolean; count: number } {
  if (fromIdx === toIdx) return { allowed: false, count: 0 };
  const src = state.bowls[fromIdx];
  const dst = state.bowls[toIdx];
  if (src.length === 0) return { allowed: false, count: 0 };
  const block = topBlock(src);
  const dstColor = dst.length === 0 ? '' : dst[dst.length - 1];
  const room = state.capacity - dst.length;
  if (room <= 0) return { allowed: false, count: 0 };
  if (dstColor === '') {
    return { allowed: true, count: Math.min(block.count, room) };
  }
  if (dstColor === block.color || dstColor === 'gold') {
    return { allowed: true, count: Math.min(block.count, room) };
  }
  return { allowed: false, count: 0 };
}

export function applyTransfer(
  state: GameState,
  fromIdx: number,
  toIdx: number
): { moved: number; absorbed: boolean } {
  const chk = canTransfer(state, fromIdx, toIdx);
  if (!chk.allowed) return { moved: 0, absorbed: false };

  const src = state.bowls[fromIdx];
  const dst = state.bowls[toIdx];
  const dstColor = dst.length === 0 ? '' : dst[dst.length - 1];
  const count = chk.count;

  // Snapshot before mutation for undo (no infinite undo stack here; caller snapshots)
  const fragments = src.splice(src.length - count, count);
  dst.push(...fragments);

  let absorbed = false;
  if (dstColor === 'gold' && fragments[fragments.length - 1] !== 'gold') {
    // Gold absorbs the matching color: collapse all gold + absorbed color into one absorbed-color block.
    // In our array model: find contiguous gold + the color on top; merge to one layer.
    const color = fragments[fragments.length - 1];
    // remove the original gold layer and absorbed color layers at the top of dst, replace with a single layer.
    let remove = 1; // the gold
    for (let i = dst.length - 2; i >= 0 && dst[i] === color; i--) {
      remove++;
    }
    for (let i = 0; i < remove; i++) dst.pop();
    dst.push(color);
    absorbed = true;
  }

  return { moved: count, absorbed };
}

export function canApplyGold(state: GameState, bowlIdx: number): boolean {
  return (
    state.goldMode &&
    state.goldDropsRemaining > 0 &&
    state.bowls[bowlIdx].length > 0 &&
    state.bowls[bowlIdx][state.bowls[bowlIdx].length - 1] !== 'gold'
  );
}

export function applyGold(state: GameState, bowlIdx: number): void {
  if (!canApplyGold(state, bowlIdx)) return;
  state.bowls[bowlIdx].push('gold');
  state.goldDropsRemaining--;
}

export function pushSnapshot(state: GameState): void {
  if (state.history.length > 40) state.history.shift();
  state.history.push({
    bowls: cloneBowls(state.bowls),
    goldDropsRemaining: state.goldDropsRemaining,
    moves: state.moves,
  });
}

export function undo(state: GameState): boolean {
  const snap = state.history.pop();
  if (!snap) return false;
  state.bowls = cloneBowls(snap.bowls);
  state.goldDropsRemaining = snap.goldDropsRemaining;
  state.moves = snap.moves;
  state.selectedBowl = null;
  state.goldMode = false;
  return true;
}

export function resetState(state: GameState): void {
  state.bowls = cloneBowls(state.initialBowls);
  state.goldDropsRemaining = state.goldDropsTotal;
  state.moves = 0;
  state.history = [];
  state.selectedBowl = null;
  state.goldMode = false;
}

export function isWin(state: GameState): boolean {
  for (const bowl of state.bowls) {
    if (bowl.length === 0) continue;
    const color = bowl[0];
    if (color === 'gold') return false;
    if (bowl.some((c) => c !== color)) return false;
  }
  return true;
}

export function scoreBreakdown(state: GameState): ScoreBreakdown {
  const target = state.level.targetMoves;
  const base = state.moves * 10;
  const efficiencyBonus = state.moves <= target ? 100 : state.moves <= target * 1.5 ? 50 : 0;
  const goldBonus = state.goldDropsRemaining * 50;
  const perfectBonus =
    state.moves <= target && state.goldDropsRemaining >= 1 ? 250 : 0;
  const total = base + efficiencyBonus + goldBonus + perfectBonus;

  let stars = 1;
  if (state.moves <= target) stars = 2;
  if (state.moves <= target && state.goldDropsRemaining >= 1) stars = 3;

  return {
    base,
    efficiencyBonus,
    goldBonus,
    perfectBonus,
    total,
    stars,
  };
}
