const DEFAULT_TIMEOUT_MS = 3_000;

export function classifyResult({ ok, latencyMs, degradedAfterMs }) {
  if (!ok) return 'down';
  return latencyMs > degradedAfterMs ? 'degraded' : 'healthy';
}

export function sanitiseError(value) {
  const message = value instanceof Error ? value.message : String(value);
  return message
    .replace(/(https?:\/\/)([^/@\s]+)@/gi, '$1[credentials-removed]@')
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, 180);
}

export async function checkIntegration(integration, options = {}) {
  const fetchImpl = options.fetchImpl || fetch;
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;
  const startedAt = Date.now();

  try {
    const response = await fetchImpl(integration.url, {
      method: 'GET',
      signal: AbortSignal.timeout(timeoutMs),
      headers: { Accept: 'application/json', 'User-Agent': 'FinTech-Integration-Monitor/1.0' },
    });
    const latencyMs = Date.now() - startedAt;
    return {
      id: integration.id,
      name: integration.name,
      status: classifyResult({ ok: response.ok, latencyMs, degradedAfterMs: integration.degradedAfterMs }),
      statusCode: response.status,
      latencyMs,
      checkedAt: new Date().toISOString(),
      error: response.ok ? null : `Upstream returned HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      id: integration.id,
      name: integration.name,
      status: 'down',
      statusCode: null,
      latencyMs: Date.now() - startedAt,
      checkedAt: new Date().toISOString(),
      error: sanitiseError(error),
    };
  }
}

export function createHistory(limit = 12) {
  const results = new Map();

  return {
    add(result) {
      const current = results.get(result.id) || [];
      results.set(result.id, [result, ...current].slice(0, limit));
    },
    list() {
      return Object.fromEntries(results);
    },
  };
}

