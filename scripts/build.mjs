import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const src = resolve(root, 'src');
const publicDir = resolve(root, 'public');
const dist = resolve(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await cp(src, dist, { recursive: true });
try {
  await stat(publicDir);
  await cp(publicDir, dist, { recursive: true });
} catch {
  // public/ is optional.
}

console.log('Prismfall build complete: dist/');
