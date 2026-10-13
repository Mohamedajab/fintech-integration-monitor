# Integration Monitor

A zero-dependency Node.js service and browser dashboard for checking the availability and latency of configured third-party services. It models the kind of operational tooling a FinTech team might use around APIs and data integrations.

## Features

- Concurrent HTTP health checks with timeouts
- Clear `healthy`, `degraded` and `down` states
- Small rolling history for regression spotting
- Accessible responsive dashboard in vanilla JavaScript
- Targets are configured server-side, avoiding an open proxy/SSRF endpoint
- Sensitive URL credentials are removed from displayed errors
- Unit and API regression tests using Node's built-in test runner

## Run locally

Requirements: Node.js 20+.

```bash
npm start
```

Open `http://localhost:3000`. If the Ledger API is running on port 8080, the default configuration checks its public health endpoint. Override it with `LEDGER_HEALTH_URL` when needed.

```powershell
$env:LEDGER_HEALTH_URL = "http://localhost:8080/health"
npm start
```

## Test

```bash
npm test
```

The regression test launches the HTTP application on an ephemeral port, calls its API and checks the response contract—not just an isolated helper function.

## Design choices

For all environment variables, refresh behaviour, API status interpretation and
troubleshooting, see the [local operations guide](docs/OPERATIONS.md).

- Dependencies are deliberately avoided so the project can be reviewed and run quickly.
- Integrations are an allowlist in `src/integrations.js`; users cannot submit arbitrary URLs.
- The last 12 results per service are held in memory. That is appropriate for a demonstration, not an audit record.
- The browser renders with DOM APIs and `textContent`; service data is never interpolated as HTML.

## Production next steps

Store history in Azure Table Storage or PostgreSQL, schedule checks in a background worker, publish metrics to Application Insights, add authenticated administration, implement alert deduplication, and deploy multiple instances behind Azure App Service health checks.

## Connect it to the Ledger API

Run the ledger on port 8080 and this app on port 3000. The dashboard will monitor `GET /health`; no ledger API key is required because the endpoint returns liveness metadata only.

