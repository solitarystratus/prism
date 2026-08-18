# Prismfall 2.3.0 — Public Release

Prismfall is an infinite browser-based physics platformer built around rainfall, living clouds, rainbows, rare prisms, procedural regions, optional circuits, obstacles, rewards and cosmetic progression. No login or backend is required.

## Public-release additions

- Save export/import so no-login progress can be backed up or moved manually between devices.
- Reset-progress control with confirmation.
- Persistent sound and reduced-motion preferences.
- Automatic pause when the tab/app loses focus so players are not punished while away.
- Reduced-motion mode that removes camera shake/parallax and lowers particle bursts without changing physics.
- Startup recovery screen for unexpected module/runtime loading failures.
- Particle caps for more stable long sessions on lower-powered devices.
- Audio-context resume handling for mobile/Safari tab interruptions.
- App icons for 192px, 512px and Apple touch icon, plus an installable web manifest.
- Social metadata, crawler policy and hardened Vercel response headers.
- Automated verification plus a 250-level procedural smoke test.

All previous gameplay remains: infinite deterministic levels, regions, special skies, platform archetypes, cloud types, checkpoints, rare Golden/Aurora Prism perks, Prism Guard, four obstacle types, prism chains, Rainbow Surge, Rainbow Rings/Sky Circuit, Rainbow Drops, shop cosmetics, stars and automatic gate progression.

## Repository structure

```text
api/
public/
scripts/
src/
dist/
package.json
package-lock.json
server.mjs
vercel.json
```

## Local development

Requires Node.js 24.x.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production QA

```bash
npm test
```

This rebuilds `dist/`, validates the release files/import graph, and procedurally samples 250 endless levels for impossible objectives, excessive platform gaps, obstacle caps and ring reachability.

For a production-like local server:

```bash
npm run build
npm start
```

## Vercel

The repository root should contain `package.json`, `vercel.json`, `scripts/`, `src/` and the other top-level folders directly. Vercel uses:

```text
Build command: npm run build
Output directory: dist
```

The settings are also declared in `vercel.json`.

## Save behavior

Progress is stored under the existing `prismfall-save-v1` localStorage key, so upgrades remain compatible with earlier Prismfall builds. The save schema is normalized on load and the Settings & Save screen can export/import a JSON backup.

No analytics, tracking, accounts, database or external game CDN are included.

## GitHub QA

`.github/workflows/ci.yml` runs the same `npm test` suite on pushes to `main`, pull requests, or manual workflow runs. This gives you a build/QA signal in GitHub before relying on a Vercel deployment for diagnosis.
