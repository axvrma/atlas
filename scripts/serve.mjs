import http from 'node:http';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const root = path.resolve('dist');
const port = Number(process.env.PORT ?? 4173);
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.map': 'application/json',
};
http
  .createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://127.0.0.1:${port}`);
      if (url.pathname === '/storybook') {
        res.writeHead(301, { Location: '/storybook/' });
        res.end();
        return;
      }
      const decoded = decodeURIComponent(url.pathname);
      let file = path.resolve(root, `.${decoded}`);
      if (!file.startsWith(root + path.sep) && file !== root) {
        res.writeHead(403);
        res.end();
        return;
      }
      try {
        const info = await stat(file);
        if (info.isDirectory()) file = path.join(file, 'index.html');
      } catch {
        if (decoded.startsWith('/storybook/') || path.extname(decoded)) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Asset not found');
          return;
        }
        file = path.join(root, 'index.html');
      }
      const rawBody = await readFile(file);
      const gzip =
        /\bgzip\b/.test(req.headers['accept-encoding'] ?? '') &&
        /\.(html|js|css|json|svg|xml|txt|map)$/.test(file);
      const body = gzip ? gzipSync(rawBody) : rawBody;
      res.writeHead(200, {
        ...(gzip ? { 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' } : {}),
        'Content-Type': types[path.extname(file)] ?? 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Cache-Control': 'no-cache',
        'X-Frame-Options': 'SAMEORIGIN',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'Content-Security-Policy': `default-src 'self'; script-src 'self'${decoded.startsWith('/storybook/') ? " 'unsafe-inline'" : ''}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'self'`,
      });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  })
  .listen(port, '127.0.0.1', () => console.log(`Atlas Studio preview: http://127.0.0.1:${port}`));
