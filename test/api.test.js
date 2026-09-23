import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { createRequestHandler } from '../src/app.js';

test('GET /api/status preserves the public response contract', async (context) => {
  const fakeResult = {
    id: 'payments', name: 'Payments', status: 'healthy', statusCode: 200,
    latencyMs: 18, checkedAt: '2026-09-23T10:00:00.000Z', error: null,
  };
  const server = createServer(createRequestHandler({
    integrations: [{ id: 'payments', name: 'Payments', url: 'https://example.test', degradedAfterMs: 100 }],
    checker: async () => fakeResult,
  }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => server.close());

  const address = server.address();
  const response = await fetch(`http://127.0.0.1:${address.port}/api/status`);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(payload.data, [fakeResult]);
  assert.deepEqual(payload.history.payments, [fakeResult]);
  assert.match(response.headers.get('content-type'), /application\/json/);
});

test('rejects unsupported API methods', async (context) => {
  const server = createServer(createRequestHandler({ integrations: [] }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => server.close());
  const address = server.address();

  const response = await fetch(`http://127.0.0.1:${address.port}/api/status`, { method: 'POST' });
  assert.equal(response.status, 405);
});

