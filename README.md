# Prismfall — Vercel + Node.js package

Prismfall is a no-login browser game themed around rainfall, clouds, storms, and rainbows. It includes physics-based movement, collectibles, level progression, rewards, keyboard controls, mobile touch controls, procedural effects, and generated Web Audio sound effects.

## What this package fixes

This is a complete Node/Vercel project rather than a loose static bundle. It includes a pinned Node runtime, npm lockfile, local Node server, deterministic Node build script, Vercel build configuration, and a Node-powered `/api/health` endpoint.

## Requirements

- Node.js 24.x for the Vercel deployment target
- npm

You do **not** commit or upload the Node.js executable itself or `node_modules/`. Vercel provides the Node runtime and runs npm during deployment. This project has no third-party runtime dependencies.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Production test

```bash
npm run build
npm run verify
npm start
```

Then open http://localhost:3000

Health endpoint: http://localhost:3000/api/health

## Deploy to Vercel

1. Upload this folder to a Git repository, or import the folder into Vercel.
2. Keep the project root at this folder.
3. Vercel will run `npm run build` and serve `dist/`.
4. Node is pinned through `package.json` (`engines.node`) and `.nvmrc`.
5. `/api/health` is deployed as a Vercel Node.js Function.

No environment variables, database, authentication, or external CDN are required.

## Project structure

```text
prismfall-vercel-complete/
├── api/
│   └── health.js
├── public/
│   ├── favicon.svg
│   └── manifest.webmanifest
├── scripts/
│   ├── build.mjs
│   └── verify.mjs
├── src/
│   ├── game.js
│   ├── index.html
│   └── styles.css
├── .gitignore
├── .node-version
├── .nvmrc
├── .vercelignore
├── package.json
├── package-lock.json
├── server.mjs
├── vercel.json
└── README.md
```

## Controls

- A / D or Left / Right: move
- Space / W / Up: jump
- Shift / X: rainbow burst
- Escape: pause
- Touch controls appear on compatible mobile devices

Progress is saved in browser `localStorage`.
