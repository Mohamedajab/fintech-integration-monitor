export const integrations = Object.freeze([
  Object.freeze({
    id: 'ledger-api',
    name: 'Ledger API',
    url: process.env.LEDGER_HEALTH_URL || 'http://localhost:8080/health',
    degradedAfterMs: 500,
  }),
  Object.freeze({
    id: 'open-banking-sandbox',
    name: 'Open Banking Sandbox',
    url: process.env.SANDBOX_HEALTH_URL || 'https://httpbin.org/status/200',
    degradedAfterMs: 900,
  }),
]);

