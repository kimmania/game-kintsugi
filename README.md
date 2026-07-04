# Kintsugi — The Art of Repair

A ceramic-restoration color-sort puzzle PWA for iPad and mobile.

Play live at: **https://kimmania.github.io/game-kintsugi/**

---

## About

You are a master restoration artist in a quiet Kyoto atelier. Broken bowls arrive from across the centuries. Reassemble their coloured glaze fragments and seal each seam with precious gold lacquer — a repaired bowl, the masters say, is more beautiful than the original.

Tap a source bowl, then a destination bowl, to transfer matching fragments. Use **Gold Lacquer** to turn a top fragment into a wildcard: any colour can be poured onto gold, then the gold absorbs that colour into a single perfect seam.

---

## Tech stack

- **Build:** Vite 5
- **Language:** TypeScript (ES modules, strict mode)
- **PWA:** `vite-plugin-pwa` + Workbox
- **Styling:** CSS variables, mobile-first responsive layout
- **Audio:** Web Audio API (synthetic, no external assets)
- **Levels:** Pre-generated static JSON, produced by Python scripts
- **Deploy:** GitHub Actions → GitHub Pages (`base: /game-kintsugi/`)

---

## Local development

```bash
npm install
npm run dev
```

Open the dev server URL (usually `http://localhost:5173/game-kintsugi/`). The service worker is only generated in production builds.

---

## Build & preview

```bash
npm run build      # generate icons + puzzles, typecheck, Vite build
npm run preview    # serve dist locally for production verification
```

---

## PWA icons & puzzles

```bash
npm run generate-icons    # writes public/icons/* via Pillow
npm run generate-puzzles  # writes public/puzzles/{tier}.json
```

Level banks are committed static assets — regenerate only when you want new puzzles.

---

## Project structure

```
.
├── .github/workflows/deploy.yml   # GitHub Pages deployment
├── index.html                     # app shell
├── package.json
├── tsconfig.json
├── vite.config.ts                 # Vite + PWA manifest + base path
├── public/
│   ├── icons/                     # PWA icons (generated)
│   └── puzzles/                   # level banks (generated)
├── scripts/
│   ├── generate_icons.py
│   └── generate_puzzles.py
└── src/
    ├── engine.ts                  # game logic, moves, undo, scoring
    ├── level-data.ts              # tier loading + progress unlocking
    ├── level-ui.ts                # bowl renderer + victory/help modals
    ├── main.ts                    # app orchestration
    ├── settings-ui.ts
    ├── sound.ts                   # Web Audio SFX
    ├── storage.ts                 # localStorage persistence
    ├── style.css                  # theming, layout, mobile polish
    ├── types.ts
    ├── ui.ts                      # intro, map, toasts
    └── vite-env.d.ts
```

---

## Deploy

Pushes to `main` trigger `.github/workflows/deploy.yml`, which:

1. Checks out the repository
2. Installs Node + Python dependencies
3. Runs `npm run build`
4. Uploads `dist/` as a GitHub Pages artifact
5. Deploys to `https://kimmania.github.io/game-kintsugi/`

Manual dispatch is also enabled in the Actions tab.

---

## License

© 2026 Kimmania. All rights reserved.
