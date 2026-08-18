import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const dev = process.argv.includes('--dev');
const base = resolve(root, dev ? 'src' : 'dist');
const publicDir = resolve(root, 'public');
const port = Number(process.env.PORT || 3000);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function safePath(rootDir, pathname) {
  const decoded = decodeURIComponent(pathname.split('?')[0]);
  const cleaned = normalize(decoded).replace(/^([.][.][/\\])+/, '').replace(/^[/\\]+/, '');
  const full = resolve(rootDir, cleaned || 'index.html');
  return full.startsWith(rootDir) ? full : null;
}

async function tryFile(rootDir, pathname) {
  let file = safePath(rootDir, pathname);
  if (!file) return null;
  try {
    const info = await stat(file);
    if (info.isDirectory()) file = join(file, 'index.html');
    const data = await readFile(file);
    return { data, type: types[extname(file).toLowerCase()] || 'application/octet-stream' };
  } catch {
    return null;
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ ok: true, game: 'Prismfall', version: '2.3.0', runtime: `node ${process.version}` }));
    return;
  }

  let found = await tryFile(base, url.pathname);
  if (!found && dev) found = await tryFile(publicDir, url.pathname);
  if (!found && !extname(url.pathname)) found = await tryFile(base, '/index.html');

  if (!found) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  res.writeHead(200, {
    'content-type': found.type,
    'cache-control': dev ? 'no-store' : 'public, max-age=0, must-revalidate',
    'x-content-type-options': 'nosniff'
  });
  res.end(found.data);
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Prismfall ${dev ? 'dev server' : 'server'} running at http://localhost:${port}`);
});
