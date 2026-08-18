import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const required = [
  'package.json', 'package-lock.json', 'vercel.json', '.nvmrc', 'server.mjs', 'README.md', 'CHANGELOG.md', '.github/workflows/ci.yml',
  'src/index.html', 'src/boot.js', 'src/game.js', 'src/styles.css',
  'src/core/audio.js', 'src/core/storage.js',
  'src/gameplay/checkpoints.js', 'src/gameplay/platforms.js', 'src/gameplay/obstacles.js', 'src/gameplay/rainbow-rings.js',
  'src/levels/archetypes.js', 'src/levels/generator.js', 'src/levels/regions.js', 'src/levels/special-levels.js',
  'src/progression/objectives.js', 'src/progression/shop.js',
  'src/visuals/region-effects.js',
  'api/health.js', 'scripts/build.mjs', 'scripts/smoke.mjs',
  'public/favicon.svg', 'public/icon-192.png', 'public/icon-512.png', 'public/apple-touch-icon.png', 'public/manifest.webmanifest', 'public/robots.txt',
  'dist/index.html', 'dist/boot.js', 'dist/game.js', 'dist/styles.css',
  'dist/core/audio.js', 'dist/core/storage.js', 'dist/levels/generator.js', 'dist/gameplay/checkpoints.js', 'dist/gameplay/obstacles.js', 'dist/gameplay/rainbow-rings.js',
  'dist/icon-192.png', 'dist/icon-512.png', 'dist/apple-touch-icon.png', 'dist/manifest.webmanifest', 'dist/robots.txt'
];

for (const file of required) await access(resolve(root, file));

const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
if (pkg.version !== '2.3.0') throw new Error(`Unexpected release version: ${pkg.version}`);

const html = await readFile(resolve(root, 'dist/index.html'), 'utf8');
for (const ref of ['./styles.css', './boot.js', '/favicon.svg', '/manifest.webmanifest', '/apple-touch-icon.png']) {
  if (!html.includes(ref)) throw new Error(`Missing HTML reference: ${ref}`);
}
for (const id of ['settingsOverlay', 'exportSaveBtn', 'importSaveBtn', 'resetSaveBtn', 'errorOverlay', 'reloadGameBtn']) {
  if (!html.includes(`id="${id}"`)) throw new Error(`Release UI missing: ${id}`);
}
if (!html.includes('type="module"')) throw new Error('Game entry must load as an ES module');

const boot = await readFile(resolve(root, 'dist/boot.js'), 'utf8');
if (!boot.includes("await import('./game.js')")) throw new Error('Boot recovery loader missing');
if (!boot.includes('unhandledrejection')) throw new Error('Unhandled rejection recovery missing');

const game = await readFile(resolve(root, 'dist/game.js'), 'utf8');
for (const feature of [
  'const LEVELS = [', 'requestAnimationFrame', './levels/generator.js', 'drawCheckpoints', 'drawObstacles',
  'awardRarePrism', 'PRISM GUARD', 'registerPrismChain', 'drawRainbowRings', 'RAINBOW SURGE', 'STORM SPARK',
  'downloadSaveBackup', 'importSaveBackup', 'pauseForInterruption', 'reducedMotion'
]) {
  if (!game.includes(feature)) throw new Error(`Game feature missing: ${feature}`);
}

const storage = await readFile(resolve(root, 'dist/core/storage.js'), 'utf8');
for (const feature of ['SAVE_SCHEMA', 'exportSaveText', 'importSaveText', 'clearSave']) {
  if (!storage.includes(feature)) throw new Error(`Save hardening missing: ${feature}`);
}

const generator = await readFile(resolve(root, 'dist/levels/generator.js'), 'utf8');
for (const feature of ['getRegionForLevel', 'getSpecialForLevel', 'buildCheckpoints', 'choosePlatformType', 'generateObstacles', 'generateRainbowRings']) {
  if (!generator.includes(feature)) throw new Error(`Generator feature missing: ${feature}`);
}

const manifest = JSON.parse(await readFile(resolve(root, 'dist/manifest.webmanifest'), 'utf8'));
if (manifest.name !== 'Prismfall' || !Array.isArray(manifest.icons) || manifest.icons.length < 3) throw new Error('PWA manifest is incomplete');

async function collectJs(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...await collectJs(path));
    else if (entry.isFile() && extname(path) === '.js') out.push(path);
  }
  return out;
}

for (const file of await collectJs(resolve(root, 'dist'))) {
  const source = await readFile(file, 'utf8');
  const importPattern = /(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    if (!specifier.startsWith('.')) continue;
    await access(resolve(dirname(file), specifier));
  }
}

const ci = await readFile(resolve(root, '.github/workflows/ci.yml'), 'utf8');
if (!ci.includes('actions/checkout@v7') || !ci.includes('actions/setup-node@v7') || !ci.includes('npm test')) throw new Error('GitHub QA workflow is incomplete');

console.log('Verification passed. Release UI, save portability, recovery boot, mobile/accessibility hardening, import graph, CI and gameplay systems are present.');
