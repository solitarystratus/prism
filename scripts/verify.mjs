import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const required = [
  'package.json', 'package-lock.json', 'vercel.json', '.nvmrc', 'server.mjs',
  'src/index.html', 'src/game.js', 'src/styles.css',
  'api/health.js', 'scripts/build.mjs', 'public/favicon.svg', 'public/manifest.webmanifest',
  'dist/index.html', 'dist/game.js', 'dist/styles.css'
];

for (const file of required) await access(resolve(root, file));

const html = await readFile(resolve(root, 'dist/index.html'), 'utf8');
for (const ref of ['./styles.css', './game.js', '/favicon.svg', '/manifest.webmanifest']) {
  if (!html.includes(ref)) throw new Error(`Missing HTML reference: ${ref}`);
}

const game = await readFile(resolve(root, 'dist/game.js'), 'utf8');
if (!game.includes('const LEVELS = [')) throw new Error('Game level data missing');
if (!game.includes('requestAnimationFrame')) throw new Error('Game loop missing');

console.log('Verification passed. Required files and game references are present.');
