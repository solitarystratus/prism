# Prismfall 2.0 — Infinite Sky Worlds

A no-login browser platformer built for Vercel. Prismfall combines rainfall, clouds, rainbows, physics movement, endless deterministic levels, rotating objectives, rare prisms, stars, Rainbow Drops, a cosmetic shop, world regions, special milestone levels, new cloud behaviors, and forgiving checkpoints.

## What changed in this package

This is the first modular Prismfall package. The game is no longer dependent on one giant source file for every system.

### New gameplay systems

- **World regions:** levels move through Sunshower Meadows, Moonlit Rain, Thunder Gardens, Aurora Sea, Golden Sky, and Cloud Kingdom. Regions cycle indefinitely.
- **Special skies every 5 levels:** Rainbow Rush, Golden Shower, Cloud Festival, Aurora Night, and Prism Rain.
- **More cloud types:** standard, spring, drifting, rainbow recharge, and golden clouds.
- **Checkpoints:** longer levels contain rainbow checkpoints. Falling returns the player to the latest checkpoint instead of forcing a long replay.
- **Difficulty stays capped:** platform gaps, jump physics, storm counts, and contact-only storm knockback remain in the existing comfortable range.

### Existing systems retained

- Infinite deterministic levels after Level 3
- Automatic rainbow-gate completion
- Multiple primary objectives
- Optional bonus objectives
- Three-star scoring
- Rainbow Drops
- Rainbow Shop with persistent aura/trail purchases
- Golden and Aurora Prisms
- Vercel/Node deployment support
- Keyboard and touch controls
- No login or backend database required

## Source layout

```text
src/
├── index.html
├── styles.css
├── game.js
├── core/
│   ├── audio.js
│   └── storage.js
├── gameplay/
│   ├── checkpoints.js
│   └── platforms.js
├── levels/
│   ├── archetypes.js
│   ├── generator.js
│   ├── regions.js
│   └── special-levels.js
├── progression/
│   ├── objectives.js
│   └── shop.js
└── visuals/
    └── region-effects.js
```

`game.js` is still the runtime coordinator/render loop, but generation, saves, audio, cloud behavior, objectives, shop data, regions, special levels, and checkpoints are separated into modules.

## Run locally

Requires Node.js 24.x.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Production test:

```bash
npm run build
npm run verify
npm start
```

## Deploy to Vercel from GitHub

Upload the **contents of this extracted folder** to the root of your GitHub `main` branch. Preserve all folders.

Vercel settings:

```text
Framework Preset: Other
Root Directory: ./
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

`vercel.json` already contains the project build/output configuration.

Do not upload only the ZIP into the GitHub repository. Extract it first and commit the project files/folders.

## Save data

Progress is stored in the same `prismfall-save-v1` localStorage key used by earlier builds, so existing browser progress, Drops, stars, purchases, auras and trails remain compatible.
