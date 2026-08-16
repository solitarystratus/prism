import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const required = [
  'package.json', 'package-lock.json', 'vercel.json', '.nvmrc', 'server.mjs',
  'src/index.html', 'src/game.js', 'src/styles.css',
  'src/core/audio.js', 'src/core/storage.js',
  'src/gameplay/checkpoints.js', 'src/gameplay/platforms.js',
  'src/levels/archetypes.js', 'src/levels/generator.js', 'src/levels/regions.js', 'src/levels/special-levels.js',
  'src/progression/objectives.js', 'src/progression/shop.js',
  'src/visuals/region-effects.js',
  'api/health.js', 'scripts/build.mjs', 'public/favicon.svg', 'public/manifest.webmanifest',
  'dist/index.html', 'dist/game.js', 'dist/styles.css',
  'dist/core/audio.js', 'dist/levels/generator.js', 'dist/gameplay/checkpoints.js'
];

for (const file of required) await access(resolve(root, file));

const html = await readFile(resolve(root, 'dist/index.html'), 'utf8');
for (const ref of ['./styles.css', './game.js', '/favicon.svg', '/manifest.webmanifest']) {
  if (!html.includes(ref)) throw new Error(`Missing HTML reference: ${ref}`);
}
if (!html.includes('type="module"')) throw new Error('Game entry must load as an ES module');

const game = await readFile(resolve(root, 'dist/game.js'), 'utf8');
if (!game.includes('const LEVELS = [')) throw new Error('Story level data missing');
if (!game.includes('requestAnimationFrame')) throw new Error('Game loop missing');
if (!game.includes("./levels/generator.js")) throw new Error('Endless level generator import missing');
if (!game.includes('drawCheckpoints')) throw new Error('Checkpoint rendering missing');

const generator = await readFile(resolve(root, 'dist/levels/generator.js'), 'utf8');
for (const feature of ['getRegionForLevel', 'getSpecialForLevel', 'buildCheckpoints', 'choosePlatformType']) {
  if (!generator.includes(feature)) throw new Error(`Generator feature missing: ${feature}`);
}

console.log('Verification passed. Modular source, regions, cloud types, special levels and checkpoints are present.');
