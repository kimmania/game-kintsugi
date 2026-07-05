#!/usr/bin/env python3
"""Generate static level banks for Kintsugi reverse-scramble color-sort puzzle."""
import argparse
import heapq
import json
import math
import os
import random
import sys
from copy import deepcopy
from typing import Optional

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "puzzles")

PALETTE = [
    {"id": "celadon", "name": "Celadon Jade", "hex": "#7fb069"},
    {"id": "cobalt", "name": "Cobalt Indigo", "hex": "#3b5ba6"},
    {"id": "rust", "name": "Iron Rust", "hex": "#b85c38"},
    {"id": "rice", "name": "Creamy Rice", "hex": "#e8dcc5"},
    {"id": "tenmoku", "name": "Tenmoku Black", "hex": "#2d2a26"},
    {"id": "sakura", "name": "Sakura Pink", "hex": "#d68c9f"},
    {"id": "gold", "name": "Gold Lacquer", "hex": "#d4af37"},
]

TIER_SEASONS = {
    "spring": "Spring Awakening",
    "summer": "Summer Firing",
    "autumn": "Autumn Ash",
    "winter": "Winter Stillness",
    "golden": "Golden Age",
}

TIER_PARAMS = {
    "spring": {"colors": 3, "bowls": 5, "capacity": 4, "gold": 3, "count": 15},
    "summer": {"colors": 4, "bowls": 7, "capacity": 4, "gold": 2, "count": 15},
    "autumn": {"colors": 5, "bowls": 9, "capacity": 5, "gold": 2, "count": 15},
    "winter": {"colors": 6, "bowls": 11, "capacity": 5, "gold": 1, "count": 10},
    "golden": {"colors": 7, "bowls": 13, "capacity": 6, "gold": 0, "count": 5},
}

GOLD_COLOR = "gold"


def top_block(tube: list[str]) -> tuple[str, int]:
    if not tube:
        return ("", 0)
    color = tube[-1]
    n = 0
    for i in range(len(tube) - 1, -1, -1):
        if tube[i] == color:
            n += 1
        else:
            break
    return color, n


def reverse_moves(tubes: list[list[str]], height: int):
    moves = []
    for a in range(len(tubes)):
        color, blocklen = top_block(tubes[a])
        if blocklen == 0:
            continue
        for k in range(1, blocklen + 1):
            if not (k < blocklen or k == len(tubes[a])):
                continue
            for b in range(len(tubes)):
                if b == a:
                    continue
                if len(tubes[b]) + k > height:
                    continue
                b_color, _ = top_block(tubes[b])
                if b_color == color:
                    continue
                moves.append((a, b, k))
    return moves


def mix_score(tubes: list[list[str]]) -> int:
    """Count internal color transitions; 0 means solved."""
    return sum(1 for t in tubes for i in range(1, len(t)) if t[i] != t[i - 1])


def state_tuple(tubes: list[list[str]]) -> tuple[tuple[str, ...], ...]:
    return tuple(tuple(t) for t in tubes)


def a_star(
    tubes: list[list[str]], capacity: int, max_iter: int = 40_000
) -> tuple[Optional[int], bool]:
    """Return (estimated min moves, solved boolean)."""
    start = state_tuple(tubes)
    heap = [(0, 0, start)]
    visited: dict[tuple, int] = {start: 0}
    iterations = 0
    while heap and iterations < max_iter:
        iterations += 1
        _, g, st = heapq.heappop(heap)
        if visited.get(st, math.inf) < g:
            continue
        cur = [list(t) for t in st]
        if mix_score(cur) == 0:
            return g, True
        for a in range(len(cur)):
            color, blocklen = top_block(cur[a])
            if blocklen == 0:
                continue
            mv = blocklen
            for b in range(len(cur)):
                if b == a:
                    continue
                if len(cur[b]) >= capacity:
                    continue
                dest_color, _ = top_block(cur[b])
                if dest_color != "" and dest_color != color:
                    continue
                dst_room = capacity - len(cur[b])
                take = min(mv, dst_room)
                new_tubes = deepcopy(cur)
                frag = new_tubes[a][-take:]
                new_tubes[a] = new_tubes[a][:-take]
                new_tubes[b].extend(frag)
                new_state = state_tuple(new_tubes)
                ng = g + 1
                if ng < visited.get(new_state, math.inf):
                    h = mix_score(new_tubes)
                    visited[new_state] = ng
                    heapq.heappush(heap, (ng + h, ng, new_state))
    return (None, False)


def is_trivially_solved(tubes: list[list[str]], capacity: int) -> bool:
    if mix_score(tubes) == 0:
        return True
    for t in tubes:
        if len(t) == capacity and len(set(t)) == 1:
            return True
    return False


def make_solved(params: dict) -> list[list[str]]:
    colors = [c["id"] for c in PALETTE[: params["colors"]]]
    height = params["capacity"]
    bowls = params["bowls"]
    tubes: list[list[str]] = [[] for _ in range(bowls)]

    # Each color has height tiles in a uniform solved tube; extra bowls stay empty.
    for i, color in enumerate(colors):
        tubes[i] = [color] * height

    # Because we don't always have same number of bowls and colors, remaining bowls stay empty.
    return tubes


def scramble(params: dict, seed: int, max_retries: int = 40) -> Optional[tuple[list[list[str]], int]]:
    rng = random.Random(seed)
    height = params["capacity"]
    steps = max(20, params.get("count", 10) + params["colors"] * 3)
    colors = params["colors"]
    for _ in range(max_retries):
        tubes = deepcopy(make_solved(params))
        applied = 0
        for _ in range(steps):
            moves = reverse_moves(tubes, height)
            if not moves:
                break
            mixing = [m for m in moves if len(tubes[m[1]]) > 0]
            if mixing and rng.random() < 0.85:
                a, b, k = rng.choice(mixing)
            else:
                a, b, k = rng.choice(moves)
            block = tubes[a][-k:]
            tubes[a] = tubes[a][:-k]
            tubes[b].extend(block)
            applied += 1
        nonempty = sum(1 for t in tubes if t)
        if nonempty == colors and not is_trivially_solved(tubes, height) and mix_score(tubes) > 0:
            return tubes, applied
    return None


def assign_level_ids(levels: list[dict]) -> list[dict]:
    # Add human-readable level names and index fields if missing.
    for i, lvl in enumerate(levels):
        lvl["index"] = i
        if not lvl.get("id"):
            lvl["id"] = f"{lvl['tier']}-{i + 1}"
        if not lvl.get("name"):
            lvl["name"] = f"Restoration {i + 1}"
    return levels


def generate_tier(tier: str, params: dict) -> list[dict]:
    levels = []
    ids_seen = set()
    for idx in range(params["count"]):
        seed = hash((tier, idx, "kintsugi2026")) & 0xFFFFFFFF
        result = None
        for attempt in range(8):
            result = scramble(params, seed + attempt)
            if result:
                break
        if result is None:
            print(f"WARN: could not generate {tier} level {idx + 1}", file=sys.stderr)
            continue
        tubes, applied = result
        level_id = f"{tier[:3]}-{idx + 1}"
        while level_id in ids_seen:
            level_id += "x"
        ids_seen.add(level_id)
        levels.append({
            "id": level_id,
            "tier": tier,
            "index": idx,
            "name": f"{TIER_SEASONS[tier]} — {idx + 1}",
            "bowls": [[c for c in t] for t in tubes],
            "capacity": params["capacity"],
            "goldDrops": params["gold"],
            "targetMoves": applied + max(1, params["gold"]),
            "optimalMoves": applied,
            "palette": tier_palette(params["colors"]),
        })
    return levels


def tier_palette(color_count: int) -> list[dict]:
    return [PALETTE[i] for i in range(color_count)]


def verify_level(level: dict) -> bool:
    if mix_score(level["bowls"]) == 0:
        return False
    if any(len(b) == level["capacity"] and len(set(b)) == 1 for b in level["bowls"]):
        return False
    return True


def main():
    parser = argparse.ArgumentParser(description="Generate Kintsugi puzzle banks")
    parser.add_argument("--only", help="Comma-separated tier names to generate", default="")
    args = parser.parse_args()

    os.makedirs(OUT_DIR, exist_ok=True)
    only = set(args.only.split(",")) if args.only else set()

    all_levels = []
    for tier, params in TIER_PARAMS.items():
        if only and tier not in only:
            continue
        print(f"Generating {tier} ({params['count']} levels)...", file=sys.stderr)
        levels = generate_tier(tier, params)
        ok = [lvl for lvl in levels if verify_level(lvl)]
        print(f"  generated {len(levels)}, verified {len(ok)}", file=sys.stderr)
        if not ok:
            continue
        with open(os.path.join(OUT_DIR, f"{tier}.json"), "w") as f:
            json.dump({"tier": tier, "season": TIER_SEASONS[tier], "levels": ok}, f, indent=2)
        all_levels.extend(ok)

    with open(os.path.join(OUT_DIR, "all.json"), "w") as f:
        json.dump({"levels": all_levels}, f, indent=2)

    print(f"Done. Total levels: {len(all_levels)}", file=sys.stderr)


if __name__ == "__main__":
    main()
