---
name: execution-skill
description: HyperExecute YAML generator and remote execution manager for the v4 regression suite. Overlays cloud settings onto the local Playwright config and runs tests with story/domain/full grep filtering.
---

# Execution Skill

HyperExecute YAML Generator and Remote Execution Manager for the Regression Suite.

Generate a HyperExecute YAML that overlays cloud-specific settings onto the local Playwright configuration, execute tests remotely with grep-based filtering, and write `execution_result.json`.

## Inputs

| What | Where |
|---|---|
| Automation Manifest | `qe-pipeline/output/{KEY}/automation/automation-manifest.json` |
| Regression Suite | per-app `{suiteDir}/` (e.g. `qe-pipeline/output/regression-suite-BREW/`) — resolved from `apps[appKey]`, see qe-shared-rules Multi-App Resolution |
| Local Playwright Config | `{suiteDir}/playwright.config.ts` |
| Credentials | `qe-pipeline/.env` (LT_USERNAME, LT_ACCESS_KEY) |
| Env config | per-app `{envConfig}` (e.g. `env_config.BREW.json`, for BASE_URL/apiBaseUrl) |

**Contract-First:** Read `automation-manifest.json` FIRST to discover spec file paths and determine execution scope.

## Outputs

| File | Path |
|---|---|
| HyperExecute YAML | `qe-pipeline/output/{KEY}/execution/hyperexecute.yaml` |
| Execution Result | `qe-pipeline/output/{KEY}/execution/execution_result.json` |

Validate result against [execution.schema.json](assets/execution.schema.json).

---

## Procedure

### Step 0: MCPs + Load References

This skill needs no MCP (it uses `hyperexecute.exe` + `.env`). As a clean slate, edit `.kiro/settings/mcp.json` and set `disabled: true` for `jira`, `playwright`, and `power-figma-figma` so none linger from a prior skill.

### Step 1: Determine Execution Mode

Story is NOT a tag — story mode runs a resolved file list, not a `--grep`. Pick the mode from the invocation context:

| Mode | Trigger | Selection |
|---|---|---|
| **Story** (default) | Pipeline run for a story key | Resolve the spec file list for the story (Step 2) and run those paths — no grep |
| **Domain** | Domain-scoped regression request | `--grep "@domain:{TAG}"` |
| **Full** | Full regression run requested | No filter — runs everything |

Story mode is the default when triggered from a per-story pipeline.

### Step 2: Discover Test Files

- **Story mode:** get the exact spec files for the story from `automation-manifest.json → artifacts.tests[].file`. If running across the whole suite (not just the fresh run), also include tests from `registry/domain-index.json → domains[].tests` whose `stories[]` contains the key. Build the file path list.
- **Domain mode:** discover files by the `@domain` grep (no explicit list needed).
- **Full mode:** discover all `*.spec.ts` files in `{suiteDir}/tests/` (the app's suite only — full regression never spans apps).

### Step 3: Generate HyperExecute YAML

Read [cloud-overlay.md](references/cloud-overlay.md), [grep-patterns.md](references/grep-patterns.md), and [hyperexecute-reference.yaml](assets/hyperexecute-reference.yaml) before generating the YAML.

Overlay cloud settings onto the local Playwright config:

1. Read [hyperexecute-reference.yaml](assets/hyperexecute-reference.yaml) as the base template
2. Set `testRunnerCommand`: for story mode, run the resolved file paths (no grep); for domain mode, add `--grep "@domain:{TAG}"`; for full, no filter
3. Set `testDiscovery.command` / spec list from Step 2
4. Inject environment variables: BASE_URL, LT_USERNAME, LT_ACCESS_KEY, **and `LT_CDP_URL`**
5. Configure concurrency based on spec file count
6. Write YAML to `qe-pipeline/output/{KEY}/execution/hyperexecute.yaml`

**Remote-browser routing (Option B — MANDATORY, do not skip).** Tests must run on the LambdaTest remote browser, not a local browser on the HyperExecute VM. This is wired at config level so specs stay cloud-agnostic (they import from `fixtures/` only — never `@playwright/test`, never a `lambdatest-setup.ts`):
- Build the CDP wsEndpoint via `assets/playwright-cloud-config.ts → buildLtCdpUrl()` (single authoritative source; reads `LT_USERNAME`/`LT_ACCESS_KEY` from env — never hardcode).
- Inject it into the YAML `env` block as `LT_CDP_URL`.
- The regression-suite `playwright.config.ts` reads `process.env.LT_CDP_URL` into `use.connectOptions.wsEndpoint` when present. Local dev (no `LT_CDP_URL`) uses a local browser.
- There is **NO** `lambdatest-setup.ts`. Do not create one and do not change any spec import.
- **False-green guard:** before submitting the run, assert `LT_CDP_URL` is set in the YAML env. If it is missing, STOP — tests would silently run on a local browser and report a meaningless pass.

The local `playwright.config.ts` remains the source of truth for test structure. The YAML only adds:
- Cloud browser endpoint routing (via `LT_CDP_URL` → `connectOptions.wsEndpoint`)
- Credentials and tunnel config
- Parallelism and timeout overrides
- Artifact upload paths (allure-results)

### Step 4: Health Check (MANDATORY — probe the ACTUAL target, report the SPECIFIC URL)

Do not health-check only the bare domain. A domain can be up while the specific API endpoint the tests hit is down — report the precise URL that failed, never a blanket "domain not accessible".

1. Determine the real targets from the manifest/test cases:
   - UI story → `BASE_URL` (from env_config)
   - API story → `apiBaseUrl` + each distinct endpoint path referenced by the tests (from `env_config.endpoints` and test-case targets)
2. Probe each distinct target:

```powershell
$targets = @("{BASE_URL or apiBaseUrl}", "{apiBaseUrl}{/specific/endpoint/path}")
foreach ($t in $targets) {
  try { $r = Invoke-WebRequest -Uri $t -Method Head -TimeoutSec 15 -UseBasicParsing -ErrorAction Stop; "$t -> $($r.StatusCode)" }
  catch { "$t -> UNREACHABLE: $($_.Exception.Message)" }
}
```
(If HEAD is rejected with 405, retry that URL with GET before declaring it unreachable — some endpoints don't allow HEAD.)

| Result | Action |
|---|---|
| All targets reachable (200/2xx/3xx, or 401/403 which means "up but auth-gated") | Proceed |
| Domain reachable but a SPECIFIC endpoint unreachable | Write `execution_result.json` with `error: "Endpoint unreachable: {full URL} ({reason})"`. Mark ONLY the tests that hit that endpoint as `not_executed` with that exact URL in `skipReason`. Proceed with tests whose targets are reachable. |
| Base domain itself unreachable | Write `execution_result.json` with `error: "Base unreachable: {full URL} ({reason})"`, all tests `not_executed`. STOP. |

Always put the full failing URL (scheme + host + path) in the error/skipReason. Never write just the host or "domain not accessible".

### Step 5: Run HyperExecute

Read [hyperexecute-run.md](references/hyperexecute-run.md) before executing.

Key points:
- Run from the `regression-suite/` directory (the test codebase lives here)
- Pass the generated YAML path via `--config` flag
- Run as background process — poll every 60s for completion
- Capture dashboard URL from output
- DO NOT echo credentials in output

**Troubleshooting (max 3 retry attempts):**

| Error | Fix | Then |
|---|---|---|
| 401 Unauthorized | Verify credentials in `.env`. Ask user if wrong. | Retry |
| Binary not found | Download hyperexecute.exe | Retry |
| Tunnel not connected | Check tunnelName in YAML. Try removing tunnel if app is public. | Retry |
| CDP / remote-browser connection error (`wsEndpoint`, `cdp.lambdatest.com`, `WebSocket closed`, `Target closed` before tests run) | Infra, not test code. Verify LT credentials + tunnel + `LT_CDP_URL`. Do NOT self-heal selectors. | Retry (max 3) |
| npm install fails | Check package.json for issues. Fix. | Retry |
| YAML parse error | Validate YAML syntax. Fix. | Retry |
| Timeout (ERR::TIME::OUT) | Increase `taskTimeout` and `globalTimeout`. | Retry |

After 3 failed attempts → write error result and STOP.

### Step 6: Parse Results

Read [result-parsing.md](references/result-parsing.md) before parsing any file.

Parse from `allure-results/` (primary) or `artifacts/` (fallback). For each test:
- Extract TC ID from title
- Map status (passed/failed/broken/skipped)
- Calculate duration
- Detect flaky: same test failed then passed → `retriedAndPassed: true`

### Step 7: Write execution_result.json

Write the contract with evidence-backed status for every test. Format: `run_YYYYMMDD_HHmmss` for pipelineRunId.

**Mandatory rules:**
- Only write results from PARSED files — never infer outcomes
- **Full accounting (no silent drops):** every TC ID in `automation-manifest.json → artifacts.tests[].testCaseIds` MUST have exactly one entry in `results[]`. TCs listed in `validation.notAutomatable[]` are recorded with `status: "not_executed"` and the reason from the manifest. After writing, assert `results.length == (all manifest testCaseIds ∪ notAutomatable)` — if any TC is missing, add it as `not_executed` with a specific `skipReason`; never omit it.
- A TC that was expected but produced no allure result → `not_executed` with a concrete reason (e.g., grep filter excluded it, spec failed to compile, task timed out before reaching it) — not silently dropped.
- `retriedAndPassed` requires evidence of both failure and subsequent pass

---

## Test Selection Logic

Story mode selects by file list (resolved from the registry/manifest); domain and full modes use `@domain` tag annotations in the describe titles.

### Story Mode (default for pipeline) — file list, not grep

```
npx playwright test {resolved spec file paths} --project=chromium
```

Runs the exact spec files that belong to the story. Resolve them from `automation-manifest.json → artifacts.tests[].file` (this run) or `registry/domain-index.json → domains[].tests` filtered by `stories[]` containing the key (whole suite, incl. reused tests). Story is not a tag — do NOT `--grep "@story:..."`.

### Domain Mode

```
--grep "@domain:{TAG}"
```

Runs all tests in a business domain. Used for domain-scoped regression runs (e.g., run all checkout tests after a checkout-related change).

### Full Regression

No filter applied. Runs everything in the regression suite. Used for scheduled full-regression runs or release validation.

---

## Selector Failures — Classify and Route (this skill does NOT self-heal)

This skill enables **no** Playwright MCP (Step 0 keeps it disabled) and grid `autoHeal` is disabled, so it does **not** re-inspect the DOM or rewrite selectors. Evidence-based selector repair is the Automation skill's job — self-healing here would mean editing selectors without live-DOM evidence, which violates the evidence-first policy and can produce false green.

If results show `strict mode violation` or `locator resolved to 0 elements` (a script error, not a product defect):

1. Record the failure verbatim in `execution_result.json → results[]` with the exact `errorMessage`.
2. Do NOT edit Page Objects/Components and do NOT re-run to "fix" it.
3. The Reporter classifies it as a **Test Script Error**; the Defect skill files a `test-maintenance` Task.
4. Repair happens by re-running "Run Scripting for {KEY}" (Automation re-inspects the live DOM with Playwright MCP and regenerates the selector with evidence), then re-executing.

**Mass selector failure** (a large fraction of tests failing on `locator resolved to 0 elements` / `strict mode violation` = the page changed wholesale, not one broken selector): still write the failures verbatim, then route the whole set back to "Run Scripting for {KEY}" so Automation re-inspects the affected pages and **regenerates the Page Objects** with fresh `count === 1` evidence. Never rely on grid autoHeal — it stays disabled and produces no persistent, evidenced fix (see `automation-skill/assets/selector-policy.json → massSelectorFailureRecovery`).

Leave `selfHealAttempts: 0` and `selfHealFixes: []` in the result. (These schema fields are retained only for an explicit, user-initiated re-run where Playwright MCP is deliberately enabled — not part of the default pipeline.)

**NEVER self-heal assertion failures** — those are product defects. **NEVER self-heal selector failures here** — route them to Automation with evidence.

**CDP / remote-browser connection errors** (`wsEndpoint`, `cdp.lambdatest.com`, `WebSocket closed`, `Target closed` before tests run) are infrastructure, not selectors — verify LT credentials + tunnel + `LT_CDP_URL`, retry per Step 5, and never touch selectors.

---

## Decision Logic

| Condition | Action |
|---|---|
| Health check fails | Write error result. STOP. |
| HyperExecute error (401, binary, tunnel, YAML) | Diagnose, fix, retry (max 3). |
| Pre-step fails (npm install) | Fix package.json + retry. |
| All tests pass | Write results. Done. |
| Some tests fail (assertion) | Normal. Write results with failures. |
| Timeout (ERR::TIME::OUT) | Increase timeouts, retry. |
| allure-results/ empty | Check `artifacts/` fallback. If also empty, write error result. |
| 3 retries exhausted | Write error result with fixes documented. STOP. |

---

## Anti-Hallucination

> The universal rules in `.kiro/steering/anti-hallucination.md` ALWAYS apply. The bullets below are this skill's specifics.

- NEVER write test results you haven't parsed from actual files
- NEVER assume a test passed because it didn't appear in failures
- NEVER set `retriedAndPassed: true` without evidence of both failure and pass
- NEVER fabricate a dashboard URL — use actual output from hyperexecute.exe
- NEVER guess spec file paths — read them from automation-manifest.json
- NEVER hardcode grep filters — derive from execution mode and input parameters
