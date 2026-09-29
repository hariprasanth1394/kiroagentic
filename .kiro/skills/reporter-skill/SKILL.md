---
name: reporter-skill
description: Analyze execution results, evaluate quality gate, generate Allure report, and post to JIRA. Use when user says "Run Execution" (phase 2), "evaluate results", or "generate report for {KEY}".
---

# Reporter Skill

Analyze execution results, categorize failures, evaluate the quality gate, generate Allure report, post to JIRA, and update pipeline health. This skill runs regardless of whether execution was on HyperExecute or local fallback.

## Inputs

| What | Where |
|---|---|
| Execution results | `qe-pipeline/output/{KEY}/execution/execution_result.json` |
| Quality gate thresholds | `qe-pipeline/config/quality-gate-thresholds.json` |
| Tester upload summary | `qe-pipeline/output/{KEY}/tester/jira-upload-summary.md` |

## Outputs

| File | Path |
|---|---|
| Quality Gate | `qe-pipeline/output/{KEY}/reporter/quality_gate.json` |
| Allure Report | `qe-pipeline/output/{KEY}/reporter/allure-report/index.html` |

Validate `quality_gate.json` against [quality-gate.schema.json](assets/quality-gate.schema.json).

---

## Procedure

### Step 0: Enable Required MCPs

Edit `.kiro/settings/mcp.json` (use file tools): set `disabled: false` for `jira` (story comment) and the configured **GitLab MCP** server (update the automation MR with the gate result, Step 8b — use whatever key that server has in `mcp.json`); leave all other servers `disabled: true`.

If jira cannot be enabled, still write `quality_gate.json` locally and note "JIRA pending" — do NOT fail the gate for a missing MCP. If gitlab cannot be enabled, skip the MR update (Step 8b) and note it — never fail the gate for it.

> Disable `jira` and the GitLab MCP server again in the final step so nothing stays enabled after the skill finishes.

### Step 1: Read Execution Result

Read `execution_result.json`. `NOT_EVALUATED` is reserved for the single case where there is genuinely nothing to judge. Decide status by this table — do NOT let an `error` string alone downgrade a run that produced results:

| Condition | Gate status |
|---|---|
| File missing | `NOT_EVALUATED` — STOP |
| `results[]` empty AND every entry would be `not_executed` (nothing ran at all) | `NOT_EVALUATED` — STOP |
| `results[]` has ≥1 test with status `passed`/`failed`/`broken` | **EVALUATE** — even if `error` is set (infra hiccup mid-run). A populated `error` never forces `NOT_EVALUATED` when real results exist. |
| `results[]` present but ALL `not_executed`/`skipped` | `NOT_EVALUATED` — STOP (nothing actually executed) |

**Rationale:** A HyperExecute/CDP/tunnel error that still yielded test outcomes is a real run. Flipping it to `NOT_EVALUATED` wrongly suppresses the defect skill (which skips on `NOT_EVALUATED`). Preserve the executed results and evaluate them.

Record any `error` value in `quality_gate.json → executionError` (new field) so downstream skills see the infra note without losing the verdict.

### Step 2: Categorize Each Failure

Read [failure-categories.md](references/failure-categories.md) before classifying any result.

Apply in PRIORITY ORDER (first match wins):
1. **Flaky** — `retriedAndPassed: true` → excluded from pass rate
2. **Environment Issue** — `TimeoutError` on navigation/network, `ECONNREFUSED`, `net::ERR_`, 503/502
3. **Test Script Error** — `locator resolved to 0 elements`, `strict mode violation`, `TypeError`/`ReferenceError`
4. **Product Defect** (default) — assertion failures, everything else

**Edge case:** `TimeoutError` on `expect(locator).toBeVisible()` AFTER a user action = Product Defect, NOT environment.

### Step 3: Calculate Quality Gate

Read `qe-pipeline/config/quality-gate-thresholds.json` for threshold values.

```
passRate = passed / (passed + failed) × 100
```

Denominator: passed + failed ONLY. Excludes: skipped, not_executed, flaky.
Environment issues COUNT as failures (the app didn't respond — that's a real problem).

Default thresholds (from `quality-gate-thresholds.json`):
- Pass rate ≥ 85% (`minPassRate`)
- Critical failures ≤ 2 (`maxCriticalFailures`)
- Critical-TC pass rate = 100% (`criticalTcPassRate`)
- Max test duration ≤ 60s (`maxTestDuration_ms`)

**Definition of a "critical failure" / "critical TC"** (so `criticalFailures` and `criticalTcPassRate` are computed the same way every run): a TC is *critical* if its priority is `Critical` (from `test-cases.json → priority`) OR its source scenario/risk priority is `high` with risk `score ≥ 9` OR its JIRA priority is `Highest`/`Critical`. `criticalFailures` = count of critical TCs whose status is `failed`/`broken`. `criticalTcPassRate` = passed-critical / (passed-critical + failed-critical) × 100.

Gate status:
- All enforced thresholds met → `PASSED`
- Any enforced threshold breached (incl. a single critical TC failing → `criticalTcPassRate < 100`) → `FAILED`. A critical TC failing fails the gate specifically, not only via the generic `maxCriticalFailures` count.
- No results to evaluate → `NOT_EVALUATED`

> `maxOpenP1Defects` / `maxOpenP2Defects` are DEFERRED (not enforced by the reporter — they need JIRA open-defect counts). Do not include them in the gate math.

### Step 4: Generate Allure Report (MANDATORY)

Read [allure-generation.md](references/allure-generation.md) before generating the report.

This MUST complete before writing quality_gate.json. The Allure report is the primary evidence artifact.

Sources:
- HyperExecute run → `automation/artifacts/Allure Results/{taskId}/allure-results/`
- Local run → `automation/allure-results/` or `automation/test-results/`

If no allure-results available from either source → still write quality_gate.json but note `"allureReport": null`.

### Step 5: Self-Check (MANDATORY before writing outputs)

> `broken` results (allure "broken" = a thrown exception) are counted as `failed` in ALL reporter metrics and categories. Fold `broken` into `failed` before the checks below — there is no separate `broken` metric.

- [ ] `passed + failed + skipped + flaky == totalTests`  (broken already folded into failed)
- [ ] `productDefect + environmentIssue + testScriptError + flakyTest == failed + flaky`
- [ ] Pass rate math is correct (verify division)
- [ ] Allure report generation attempted

### Step 6: Write quality_gate.json

Structure:
```json
{
  "status": "PASSED | FAILED | NOT_EVALUATED",
  "evaluatedAt": "ISO-8601",
  "pipelineRunId": "from execution_result",
  "platform": "HyperExecute | Local",
  "baseUrl": "from execution_result",
  "dashboardUrl": "from execution_result (null if local)",
  "executionError": "infra/error string from execution_result, or null — informational only, does NOT force NOT_EVALUATED when results exist",
  "metrics": {
    "totalTests": N,
    "passed": N,
    "failed": N,
    "skipped": N,
    "flaky": N,
    "passRate": N.N,
    "criticalFailures": N,
    "totalDuration_ms": N,
    "avgTestDuration_ms": N.N
  },
  "thresholds": {
    "minPassRate": 85,
    "maxCriticalFailures": 2,
    "maxTestDuration_ms": 60000,
    "criticalTcPassRate": 100
  },
  "thresholdChecks": {
    "passRate": { "required": 85, "actual": N.N, "met": true },
    "criticalFailures": { "required": 2, "actual": N, "met": true },
    "criticalTcPassRate": { "required": 100, "actual": N.N, "met": true },
    "maxTestDuration": { "required": 60000, "actual": N, "met": true }
  },
  "failureCategories": {
    "productDefect": N,
    "environmentIssue": N,
    "testScriptError": N,
    "flakyTest": N
  },
  "recommendations": ["..."]
}
```

### Step 7: Write Supporting Files

No separate output files. Flaky test data lives in `quality_gate.json → failureCategories.flakyTest` count only. No external knowledge files are updated for flaky or failure tracking.

### Step 8: Post JIRA Comment

**Single source of truth:** every number in the JIRA comment MUST come from `quality_gate.json → metrics` (which were parsed from `execution_result.json`). Do NOT copy pass/fail/total counts from the HyperExecute dashboard summary — the dashboard counts raw browser sessions/retries and routinely differs from the deduplicated, TC-level metrics. Use the dashboard URL as a link only.

Before posting, run one reconciliation check: `metrics.totalTests == execution_result.results.length` (excluding `not_executed`). If they differ, re-derive metrics from `results[]` and note the discrepancy in `recommendations[]` rather than posting mismatched numbers.

Post a compact summary to the story (< 2000 chars):

```
addCommentToJiraIssue:
  cloudId: {cloudId from pipeline-config.json}
  issueIdOrKey: {KEY}
  contentFormat: markdown
  commentBody: |
    **QE Execution Complete — {KEY}**

    | Metric | Value |
    |---|---|
    | Gate | {PASSED/FAILED/NOT_EVALUATED} |
    | Pass Rate | {N}% ({passed}/{passed+failed}) |
    | Duration | {N}s |

    **Failures:** {productDefect} defects, {testScriptError} script errors, {environmentIssue} env issues, {flakyTest} flaky
    **Dashboard:** [{dashboardUrl}]({dashboardUrl})
    **Next:** {if FAILED: "Defect skill will file bugs" | if PASSED: "Pipeline complete"}
```

If JIRA unreachable → skip, note "JIRA pending" in quality_gate.json.

### Step 8b: Update the Automation MR with the Gate Result

The Automation skill opened a draft MR (`feature/{STORY-KEY}`) and recorded it in `automation-manifest.json → git.mrUrl`. Read that manifest; if `git.mrUrl` is present, post the gate outcome to the MR using the configured GitLab MCP's *add-merge-request-note / comment* operation (discover the actual tool name from the configured server — do not assume a fixed identifier) so reviewers see the verdict on the code itself:

```
{Gate}: {PASSED|FAILED|NOT_EVALUATED} — Pass rate {N}% ({passed}/{passed+failed}), {failed} failed.
Product defects: {productDefect} | Script errors: {testScriptError} | Env: {environmentIssue} | Flaky: {flakyTest}
Dashboard: {dashboardUrl}
```

- Every number MUST come from `quality_gate.json` (same single-source rule as the JIRA comment).
- If `git.mrUrl` is absent (git push was skipped) or the GitLab MCP is unavailable → skip this step and note it in `quality_gate.json → recommendations[]`. Never fail the gate for a missing MR update. Do NOT merge or approve the MR — only annotate it.

### Step 9: Update Pipeline Health

Append exactly one PipelineRun entry to `qe-pipeline/knowledge/pipeline-health.json` → `runs[]`. Read the file, parse JSON, push entry, write back. Never overwrite existing entries.

Entry format:
```json
{
  "runId": "run_20250728_143000",
  "date": "2025-07-28T14:30:00.000Z",
  "type": "story",
  "storyKey": "BREW-101",
  "domain": "checkout",
  "environment": "sit",
  "jobId": "hyperexecute-job-id",
  "jobLink": "https://hyperexecute.lambdatest.com/hyperexecute/task?jobId={jobId}",
  "totalTests": 10,
  "passed": 9,
  "failed": 1,
  "skipped": 0,
  "flaky": 0,
  "passRate": 90.0,
  "durationMs": 45000,
  "gateStatus": "PASSED"
}
```

Field sources:
- `runId` — generate as `run_{YYYYMMDD}_{HHmmss}` from current timestamp
- `date` — ISO-8601 timestamp of the run
- `type` — `"story"` for single-story runs, `"domain"` for domain regression, `"full"` for full regression
- `storyKey` — the JIRA key (e.g., `BREW-101`), null for full regression
- `domain` — the domain tag from the automation manifest (e.g., `"checkout"`, `"menu"`, `"auth"`), null if not applicable
- `environment` — derived from `baseUrl` in execution_result.json
- `jobId` — HyperExecute job ID from execution_result or null for local
- `jobLink` — HyperExecute dashboard URL for the job (`dashboardUrl` from execution_result), or null for local
- `totalTests` — from quality gate metrics
- `passed`, `failed`, `skipped`, `flaky` — from quality gate metrics
- `passRate` — from quality gate metrics
- `durationMs` — from quality gate metrics `totalDuration_ms`
- `gateStatus` — `"PASSED"`, `"FAILED"`, or `"NOT_EVALUATED"`

If `pipeline-health.json` is malformed or missing → create new file with empty `runs[]` and append.

### Step 10: Disable MCPs

Edit `.kiro/settings/mcp.json` and set `disabled: true` for `jira` and the configured GitLab MCP server, so nothing stays enabled after the skill finishes.

---

## Decision Logic

| Condition | Action |
|---|---|
| `execution_result.json` missing | Write NOT_EVALUATED. |
| `error` non-null + `results[]` empty | NOT_EVALUATED. |
| `error` non-null + `results[]` has data | Evaluate from available results. |
| `results[]` empty OR every entry `not_executed`/`skipped` (nothing actually ran) | NOT_EVALUATED (matches Step 1) — nothing to judge. |
| `results[]` has ≥1 passed/failed/broken but zero passed | FAILED (0% pass rate) — tests ran and all failed. |
| productDefect > 0 | Defect skill runs next. |
| JIRA keepalive fails | Local files only. Note pending. |
| Allure generation fails | Still write quality_gate.json. Note allure unavailable. |

## Anti-Hallucination

> The universal rules in `.kiro/steering/anti-hallucination.md` ALWAYS apply. The bullets below are this skill's specifics.

- NEVER claim pass/fail without evidence from execution_result.json
- NEVER post incorrect math — self-check before writing
- NEVER attribute failure to wrong category — follow priority order
