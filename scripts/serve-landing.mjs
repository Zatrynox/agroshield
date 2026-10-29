#!/usr/bin/env node
/**
 * Serve the built Astro landing locally with the same `/api` proxy used in
 * development. This is for QA (Lighthouse, link checks) and smoke tests; the
 * production deployment uses Caddy instead.
 *
 * Usage: node scripts/serve-landing.mjs [port]
 */
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer, request as httpRequest } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = join(root, 'landing', 'dist');
const port = Number(process.argv[2] ?? process.env.LANDING_PORT ?? 4321);
const apiTarget = new URL(process.env.API_PROXY_TARGET ?? 'http://127.0.0.1:3000');

if (!existsSync(join(dist, 'index.html'))) {
  console.error('landing/dist is missing. Run `pnpm --filter @agroshield/landing build` first.');
  process.exit(1);
}

const types = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
  ['.woff2', 'font/woff2'],
  ['.xml', 'application/xml; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.ico', 'image/x-icon'],
]);

function proxy(request, response) {
  const target = new URL(request.url ?? '/', apiTarget);
  target.pathname = target.pathname.replace(/^\/api/, '') || '/';
  const headers = {
    ...request.headers,
    host: apiTarget.host,
    'x-forwarded-host': request.headers.host ?? `localhost:${port}`,
    'x-forwarded-proto': 'http',
  };
  const upstream = httpRequest(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port,
      method: request.method,
      path: target.pathname + target.search,
      headers,
    },
    (upstreamResponse) => {
      response.writeHead(upstreamResponse.statusCode ?? 502, upstreamResponse.headers);
      upstreamResponse.pipe(response);
    },
  );
  upstream.on('error', (error) => {
    if (!response.headersSent) {
      response.writeHead(502, { 'content-type': 'application/problem+json' });
    }
    response.end(
      JSON.stringify({
        type: 'about:blank',
        title: 'Bad gateway',
        status: 502,
        detail: `The API is unavailable: ${error.message}`,
      }),
    );
  });
  request.pipe(upstream);
}

function sendFile(request, response, filePath, status = 200) {
  const type = types.get(extname(filePath).toLowerCase()) ?? 'application/octet-stream';
  const stat = statSync(filePath);
  response.writeHead(status, {
    'content-type': type,
    'content-length': stat.size,
    'x-content-type-options': 'nosniff',
    'cache-control': filePath.includes(`${sep}_astro${sep}`)
      ? 'public, max-age=31536000, immutable'
      : 'no-cache',
  });
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(filePath).pipe(response);
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? '/', `http://localhost:${port}`);
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    proxy(request, response);
    return;
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { allow: 'GET, HEAD' });
    response.end('Method not allowed');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    response.writeHead(400);
    response.end('Bad request');
    return;
  }

  const relative = normalize(pathname).replace(/^([/\\])+/, '');
  const candidate = resolve(dist, relative);
  if (candidate !== dist && !candidate.startsWith(dist + sep)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  let filePath = candidate;
  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    filePath = join(candidate, 'index.html');
  } else if (!existsSync(candidate) && !extname(candidate)) {
    const index = join(candidate, 'index.html');
    if (existsSync(index)) filePath = index;
  }

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    sendFile(request, response, filePath);
    return;
  }

  const notFound = join(dist, '404.html');
  if (existsSync(notFound)) {
    sendFile(request, response, notFound, 404);
  } else {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.info(`landing preview: http://localhost:${port} (api -> ${apiTarget.href})`);
});
