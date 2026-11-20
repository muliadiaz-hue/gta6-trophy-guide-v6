// Dev-only static server for the guide: `node serve.ts [--port N]` serves
// app/ on 127.0.0.1:8080 by default. Serves files, nothing else — no logging,
// no directory listings, no paths outside app/.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const portArg = process.argv.indexOf('--port');
const port = portArg === -1 ? 8080 : Number(process.argv[portArg + 1]) || 8080;

const TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
]);

createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://127.0.0.1').pathname);
  const rel = path === '/' ? 'index.html' : path.replace(/^\/+/, '');
  const file = resolve(join(appDir, rel));
  if (!file.startsWith(appDir + '/') && file !== appDir) {
    res.writeHead(403).end('forbidden');
    return;
  }
  if (!existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES.get(extname(file)) ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(port, '127.0.0.1', () => console.log('guide on http://127.0.0.1:' + port));
