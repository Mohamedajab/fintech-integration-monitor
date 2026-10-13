# Local operations guide

## Start and configure

Use Node.js 20 or newer, from the repository root. The app has no runtime
dependencies and needs no build step:

```bash
npm start
```

The server binds to `127.0.0.1`, not every network interface. Open
`http://localhost:3000` on the same computer. Stop it with Ctrl+C.

Set configuration before starting the process:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | Local dashboard server port |
| `LEDGER_HEALTH_URL` | `http://localhost:8080/health` | Ledger health-check target |
| `SANDBOX_HEALTH_URL` | `https://httpbin.org/status/200` | Demonstration sandbox target |

Windows PowerShell example:

```powershell
$env:PORT = "3001"
$env:LEDGER_HEALTH_URL = "http://localhost:8080/health"
$env:SANDBOX_HEALTH_URL = "http://localhost:8080/health"
npm start
```

macOS/Linux example:

```bash
PORT=3001 LEDGER_HEALTH_URL=http://localhost:8080/health SANDBOX_HEALTH_URL=http://localhost:8080/health npm start
```

Open `http://localhost:3001` for either example. Both cards intentionally check
the same local endpoint here, avoiding the default external sandbox request.
Restart after changing environment variables: target values are read when the
module loads. Do not put credentials in public URLs or commit them to the repo.

## When checks happen

The browser requests `/api/status` once when the page loads and again when you
click Refresh. There is no periodic polling or background scheduler. Each API
request starts a fresh concurrent check of every configured integration; multiple
tabs or API clients therefore create additional upstream requests.

The last 12 results for each service are stored in memory, newest first. History
is shared by requests handled by that process, is lost on restart, and is not
shared between separate server instances.

## Interpreting results

- `healthy`: the upstream returned a successful HTTP response and its latency
  did not exceed the service threshold.
- `degraded`: successful HTTP response, but latency exceeded the threshold
  (500 ms for Ledger API, 900 ms for the sandbox).
- `down`: unsuccessful HTTP response, network failure or timeout. Checks use
  a 3,000 ms timeout by default.

Latency measures time until the HTTP response is returned; this is not a
business transaction test, a response-body validation or a full download benchmark.

Inspect JSON directly with:

```bash
curl http://localhost:3000/api/status
```

PowerShell can use `Invoke-RestMethod http://localhost:3000/api/status` instead.
The response contains `data` (current checks) and `history` (results by service ID).
**An HTTP 200 from `/api/status` does not mean every integration is healthy.**
Read each entry's `status`, `statusCode` and `error`. A failed network request has
`statusCode: null`; an upstream HTTP failure retains its status code.

## Troubleshooting

- **Ledger card is down:** start the ledger separately and verify its health URL.
  A running monitor does not start the ledger for you.
- **Sandbox card is down:** the default requires external network access. For an
  offline demo, point both target variables at a local health endpoint.
- **Address already in use:** choose an unused `PORT` and restart. Update the
  browser address as well.
- **Old results remain visible:** click Refresh. The dashboard does not poll.
- **History disappeared:** restart resets the in-memory history by design.

## Verification and deployment boundary

```bash
npm test
```

Tests use Node's built-in test runner, mocked check results and ephemeral local
HTTP servers; they do not require live banking services or the public sandbox.
They verify API shape, method rejection, classification, history and URL-credential
redaction. They do not validate production upstream availability.

This remains a local demonstration. Target configuration is server-side, but
there is no authentication, persistent audit history or alert delivery. Do not
expose it publicly by changing the bind address without designing those controls.
