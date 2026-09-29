# Cloud Overlay Strategy

## Concept

The regression suite uses a **local + cloud overlay** approach for execution. The local `playwright.config.ts` is the source of truth for test structure; the HyperExecute YAML adds cloud-specific settings on top.

## What Stays in Local Config (`playwright.config.ts`)

These settings are owned by the regression suite and never overridden:

| Setting | Value | Why |
|---|---|---|
| `testDir` | `./tests` | Directory structure is local concern |
| `timeout` | `60000` | Per-test timeout (canonical base — see Timeout Synchronization) |
| `expect.timeout` | `10000` | Assertion timeout (canonical base) |
| `retries` | `0` | Local runs don't retry |
| `workers` | `1` | Sequential for local debugging |
| `reporter` | `list` + `allure-playwright` | Report generation |
| `projects` | `chromium` | Browser target |
| `use.baseURL` | From `BASE_URL` env | Environment target |
| `use.headless` | `true` | Default headless |
| `use.screenshot` | `only-on-failure` | Evidence capture |

## What the Cloud Overlay Adds

The HyperExecute YAML and cloud config layer on these cloud-specific settings:

| Setting | Source | Purpose |
|---|---|---|
| Browser endpoint (CDP) | `playwright-cloud-config.ts` | Routes browsers to LambdaTest grid |
| Credentials | YAML `env` block | `LT_USERNAME`, `LT_ACCESS_KEY` |
| Parallelism | YAML `concurrency` | Parallel spec execution |
| Tunnel | YAML `tunnel` + `tunnelNames` | Access to non-public environments |
| Artifact upload | YAML `uploadArtefacts` | Push allure-results to cloud |
| Timeouts (extended) | YAML `testSuiteTimeout`, `taskTimeout` | Cloud browsers are slower |
| Retry on failure | YAML `retryOnFailure` + `maxRetries` | Infrastructure flakiness mitigation |
| Grep filter | YAML `testRunnerCommand` | `--grep` for story/domain scoping |

## Overlay Diagram

```
+----------------------------------+
|   playwright.config.ts (LOCAL)   |
|  - testDir, timeout, reporter    |
|  - projects, baseURL, headless   |
|  - screenshot policy             |
+----------------------------------+
              |
              | merged at runtime
              v
+----------------------------------+
|   HyperExecute YAML (CLOUD)     |
|  - concurrency, tunnel           |
|  - env credentials               |
|  - artifact upload               |
|  - extended timeouts             |
|  - testRunnerCommand + grep      |
+----------------------------------+
              |
              | browser connection
              v
+----------------------------------+
|  playwright-cloud-config.ts      |
|  - CDP endpoint to LambdaTest    |
|  - Browser capabilities          |
|  - Tunnel binding                |
+----------------------------------+
              |
              v
+----------------------------------+
|   FINAL EXECUTION ENVIRONMENT    |
|  Local structure + Cloud infra   |
|  Tests run on remote browsers    |
|  Results flow back via artifacts |
+----------------------------------+
```

## How It Works at Runtime

1. HyperExecute clones the repo / receives the code package
2. Runs `npm install` (from YAML `pre` block)
3. Executes `testRunnerCommand` which invokes Playwright with grep filters
4. Playwright resolves `connectOptions.wsEndpoint` from cloud config
5. Tests execute against remote browsers on LambdaTest grid
6. Results write to `allure-results/` locally on the HyperExecute VM
7. YAML `uploadArtefacts` pushes results back for download

## Timeout Synchronization (local ⇄ cloud)

Local and cloud timeouts MUST be derived from the same base values so a test that passes locally does not time out remotely (and vice versa). The cloud overlay scales the local values by a fixed factor — it never invents unrelated numbers.

Canonical base (owned by the regression suite `playwright.config.ts`):

| Setting | Local base | Cloud (HyperExecute) | Rule |
|---|---|---|---|
| `test` timeout | 60000 ms | 60000 ms | Same. Per-test budget is a test-design concern, identical everywhere. |
| `expect` timeout | 10000 ms | 10000 ms | Same. |
| `use.actionTimeout` | 15000 ms | 15000 ms | Same. |
| `use.navigationTimeout` | 30000 ms | 45000 ms | Cloud ×1.5 (remote browser + tunnel latency). Only navigation/connection scales. |
| YAML `taskTimeout` | n/a | ≥ (sum of per-test timeouts in the largest spec) + 300 s | Job-level ceiling, not a per-test value. |
| YAML `testSuiteTimeout` | n/a | ≥ `taskTimeout` | Must not be smaller than taskTimeout. |

Rules:
1. The local `test`/`expect`/`action` timeouts are the source of truth and are copied unchanged into the cloud run. Do NOT shrink them in the YAML.
2. Only transport-latency timeouts (navigation/connection) are scaled up for cloud (×1.5), because remote browsers + tunnel add real latency.
3. `taskTimeout`/`testSuiteTimeout` are job-level ceilings; compute them from the test timeouts, never below them (a common cause of remote-only `ERR::TIME::OUT`).
4. When a spec times out only on cloud, raise `navigationTimeout` (and `taskTimeout`) — never the per-`test` timeout — so local and cloud stay in sync.

If the local config and this table disagree, fix the local config to match this base, then regenerate the overlay.

## Key Principle

> The local config defines WHAT runs. The cloud overlay defines WHERE and HOW it runs.

This separation means:
- Developers can run locally with `npx playwright test` (no cloud needed)
- CI/CD adds the cloud layer without modifying test structure
- Grep filters scope execution without changing test files
