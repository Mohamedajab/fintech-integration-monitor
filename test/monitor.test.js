import assert from 'node:assert/strict';
import test from 'node:test';
import { checkIntegration, classifyResult, createHistory, sanitiseError } from '../src/monitor.js';

test('classifies successful checks using the integration latency threshold', () => {
  assert.equal(classifyResult({ ok: true, latencyMs: 99, degradedAfterMs: 100 }), 'healthy');
  assert.equal(classifyResult({ ok: true, latencyMs: 101, degradedAfterMs: 100 }), 'degraded');
  assert.equal(classifyResult({ ok: false, latencyMs: 1, degradedAfterMs: 100 }), 'down');
});

test('maps an upstream HTTP failure to down', async () => {
  const result = await checkIntegration(
    { id: 'bank', name: 'Bank', url: 'https://example.test', degradedAfterMs: 100 },
    { fetchImpl: async () => ({ ok: false, status: 503 }) },
  );
  assert.equal(result.status, 'down');
  assert.equal(result.statusCode, 503);
  assert.match(result.error, /503/);
});

test('does not expose URL credentials in errors', () => {
  const safe = sanitiseError(new Error('Request failed for https://user:secret@example.test/health'));
  assert.doesNotMatch(safe, /user:secret/);
  assert.match(safe, /credentials-removed/);
});

test('history retains only the configured number of newest results', () => {
  const history = createHistory(2);
  history.add({ id: 'one', latencyMs: 1 });
  history.add({ id: 'one', latencyMs: 2 });
  history.add({ id: 'one', latencyMs: 3 });
  assert.deepEqual(history.list().one.map((item) => item.latencyMs), [3, 2]);
});

