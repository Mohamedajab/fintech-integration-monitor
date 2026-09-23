import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkIntegration, createHistory } from './monitor.js';
import { integrations as defaultIntegrations } from './integrations.js';

const publicDirectory = fileURLToPath(new URL('../public/', import.meta.url));
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
}

export function createRequestHandler({ integrations = defaultIntegrations, checker = checkIntegration } = {}) {
  const history = createHistory();

  return async function requestHandler(request, response) {
    const url = new URL(request.url, 'http://localhost');

    if (request.method === 'GET' && url.pathname === '/api/status') {
      const checks = await Promise.all(integrations.map((item) => checker(item)));
      checks.forEach((result) => history.add(result));
      return sendJson(response, 200, { data: checks, history: history.list() });
    }

    if (request.method !== 'GET') {
      return sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET is supported.' } });
    }

    const requestedPath = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const safePath = normalize(requestedPath).replace(/^(\.\.(\/|\\|$))+/, '');
    const filePath = join(publicDirectory, safePath);
    if (!filePath.startsWith(publicDirectory)) {
      return sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Resource not found.' } });
    }

    try {
      const file = await readFile(filePath);
      response.writeHead(200, {
        'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'",
      });
      response.end(file);
    } catch {
      sendJson(response, 404, { error: { code: 'NOT_FOUND', message: 'Resource not found.' } });
    }
  };
}

