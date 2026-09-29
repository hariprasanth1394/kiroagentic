---
name: retest-skill
description: Validate bug fixes by re-executing linked tests and updating JIRA status. Use when user says "Run Closure" (phase 2), "retest bugs", or "verify fixes for {KEY}".
---

# Retest Skill

Validate fixes by re-executing ONLY the specific tests linked to bugs marked "Ready for Retest". Update JIRA status based on results. This is the FINAL skill in the pipeline.

## Inputs

| What | Where |
|---|---|
| JIRA bugs ready for retest | `searchJiraIssuesUsingJql` (query below) |
| Regression suite tests | per-app `{suiteDir}/tests/` (resolved in Step 0 from `pipeline-config.json → apps[appKey].suiteDir`, e.g. `qe-pipeline/output/regression-suite-BREW/tests/`) |
| Credentials | `qe-pipeline/.env` (LT_USERNAME, LT_ACCESS_KEY) |
| Env config | per-app `{envConfig}` (e.g. `env_config.BREW.json`) for BASE_URL/apiBaseUrl |

## Output

| File | Path |
|---|---|
| Retest Summary | `qe-pipeline/output/{KEY}/retest/retest-summary.json` |

---

## Procedure

### Step 0: Resolve App + Enable Required MCPs

First resolve the app (per qe-shared-rules → Multi-App Resolution): `appKey = storyKey.split('-')[0]`, look up `pipeline-config.json → apps[appKey]`, and bind `{suiteDir}`, `{envConfig}`, `repo`. No entry → HALT. All re-execution in this skill runs the app's `{suiteDir}/` suite, never a shared `regression-suite/`.

Edit `.kiro/settings/mcp.json` (use file tools): set `disabled: false` for `jira` only (for bug search and transitions); leave all other servers `disabled: true`.

If jira cannot be enabled, write `retest-summary.json`, note "JIRA pending", and do NOT claim transitions happened.

> Disable `jira` again in the final step so nothing stays enabled after the skill finishes.

### Step 1: Find Bugs Ready for Retest

```
searchJiraIssuesUsingJql:
  cloudId: {cloudId from pipeline-config.json}
  jql: "project = {projectKey} AND status = 'Ready for Retest' AND labels = 'automated-regression'"
```

If NO bugs found → write "No bugs ready for retest." Post final JIRA comment. STOP.

### Step 2: Extract TC IDs

For each bug:
1. Parse summary for `[TC-UI-NNN]` or `[TC-API-NNN]` pattern
2. If not in summary → check description
3. If no TC ID found → skip, log as "Cannot retest — no linked test case"

### Step 3: Health Check

Probe the actual target the retested tests hit (BASE_URL for UI, apiBaseUrl + the specific endpoint for API), not just the bare domain:

```powershell
try { $r = Invoke-WebRequest -Uri "{actual target URL}" -Method Head -TimeoutSec 15 -UseBasicParsing -ErrorAction Stop; $r.StatusCode }
catch { "UNREACHABLE: $($_.Exception.Message)" }
```

- Reachable (2xx/3xx, or 401/403 = up but auth-gated) → proceed.
- Unreachable → DO NOT update JIRA. Write "Retest deferred — {full failing URL} unavailable ({reason})." (report the specific URL, not "domain not accessible"). STOP.

### Step 4: Re-Execute Linked Tests (same remote routing as the execution skill)

Run ONLY the matching tests from the app's per-app suite, on the LambdaTest remote browser — NOT a local browser. Reusing the execution skill's Option B routing keeps retest and the original run consistent and avoids a false green from a local-only pass.

1. Build `LT_CDP_URL` via `execution-skill/assets/playwright-cloud-config.ts → buildLtCdpUrl()` (reads `LT_USERNAME`/`LT_ACCESS_KEY` from `.env` — never hardcode) and export it into the environment so the suite's `playwright.config.ts` reads it into `use.connectOptions.wsEndpoint`.
2. Grep by the bugs' TC IDs (TC ID is in each test title, so `--grep` works):

```powershell
# from the resolved per-app suite, e.g. qe-pipeline/output/regression-suite-BREW
$env:LT_CDP_URL = "<built via buildLtCdpUrl()>"
$env:BASE_URL = "<appUrl or apiBaseUrl from {envConfig}>"
npx playwright test --grep "TC-UI-005|TC-UI-012" --project=chromium --reporter=json
```

> **False-green guard (same as execution):** if `LT_CDP_URL` is not set, STOP — the tests would run on a local browser and a pass would be meaningless. Only fall back to a local browser if the user explicitly requests a local retest.
> Run from the resolved `{suiteDir}` (per app), never the shared `regression-suite/`.

### Step 5: Update JIRA Per Bug

Read [jira-transitions.md](references/jira-transitions.md) before making any transition call.

For each bug:
- **Test PASSED** → transition to Done/Closed + comment "✅ Fix verified"
- **Test FAILED** → transition to Reopened + comment "❌ Fix failed" + escalate priority

### Step 6: Write retest-summary.json

Write structured JSON output to `qe-pipeline/output/{KEY}/retest/retest-summary.json`, then validate it against [retest-summary.schema.json](assets/retest-summary.schema.json):

```json
{
  "storyKey": "{KEY}",
  "storyUrl": "{browseUrl}/{KEY}",
  "date": "{ISO-8601}",
  "bugsRetested": [
    {
      "jiraKey": "{key}",
      "jiraUrl": "{browseUrl}/{key}",
      "testCaseId": "TC-UI-005",
      "result": "PASSED",
      "action": "Closed",
      "notes": "Fix verified"
    },
    {
      "jiraKey": "{key}",
      "jiraUrl": "{browseUrl}/{key}",
      "testCaseId": "TC-UI-012",
      "result": "FAILED",
      "action": "Reopened",
      "notes": "Priority escalated"
    },
    {
      "jiraKey": "{key}",
      "jiraUrl": "{browseUrl}/{key}",
      "testCaseId": null,
      "result": "SKIPPED",
      "action": null,
      "notes": "No linked TC"
    }
  ],
  "totals": {
    "retested": 2,
    "closed": 1,
    "reopened": 1,
    "skipped": 1
  }
}
```

### Step 7: Post Final JIRA Comment

```
addCommentToJiraIssue:
  cloudId: {cloudId}
  issueIdOrKey: {KEY}
  contentFormat: markdown
  commentBody: "**QE Pipeline Complete — {KEY}**\nRetested: {N} bugs | Closed: {N} | Reopened: {N}\nPipeline run complete."
```

### Step 8: Disable MCPs

Edit `.kiro/settings/mcp.json` and set `disabled: true` for `jira`, so nothing stays enabled after the skill finishes.

---

## Decision Logic

| Condition | Action |
|---|---|
| No bugs "Ready for Retest" | Write summary. Post final comment. STOP. |
| `LT_CDP_URL` not set (remote routing missing) | STOP — do NOT run on a local browser (false green). Only run locally if the user explicitly asked for a local retest. |
| App not registered in `pipeline-config.json → apps[appKey]` | HALT. Ask user to register the app. |
| Environment unreachable | DO NOT update JIRA. Write "deferred." STOP. |
| Bug has no TC ID | Skip, log in summary. |
| Test passed | Transition to Done/Closed. |
| Test failed | Transition to Reopened, escalate priority. |
| Transition not available | Log "Cannot transition." Skip. |
| JIRA unavailable | Write local summary. Note pending. |

## Anti-Hallucination

> The universal rules in `.kiro/steering/anti-hallucination.md` ALWAYS apply. The bullets below are this skill's specifics.

- NEVER update JIRA if health check failed
- NEVER close a bug without evidence the specific test PASSED
- NEVER reopen a bug without evidence the specific test FAILED
- NEVER run the full test suite — only tests linked to retest-ready bugs
- NEVER escalate priority beyond P1 — add `critical-blocker` label instead
