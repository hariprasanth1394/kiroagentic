# Result Parsing Guide

## Source Priority

1. **Primary:** `allure-results/` folder (downloaded via `--download-artifacts`)
2. **Fallback:** `artifacts/reports/` or `artifacts/Allure Results/{taskId}/allure-results/`

If both empty → write `execution_result.json` with error: "No test results found after execution".

## Parsing allure-results/

Each `*-result.json` file contains one test result:

```powershell
Get-ChildItem allure-results -Filter "*-result.json" | ForEach-Object {
  Get-Content $_.FullName | ConvertFrom-Json
}
```

Each gives:
- `name` — test title (extract TC ID from here)
- `status` — `passed`, `failed`, `broken`, `skipped`
- `start` — epoch ms
- `stop` — epoch ms
- `statusDetails.message` — error message (if failed/broken)

## TC ID Extraction

Pattern: `TC-UI-NNN` or `TC-API-NNN` or `TC-NF-NNN`

```
Regex: TC-(UI|API|NF)-\d{3}
```

Extract from `name` field. If multiple TCs in one describe block, each `test()` should have its own TC ID.

## Duration Calculation

```
duration_ms = stop - start
```

Both are epoch milliseconds from allure.

## Flaky Detection

If the SAME test (same TC ID) appears multiple times in results:
- First run: `status: "failed"`
- Retry run: `status: "passed"`

→ Set `retriedAndPassed: true` for that test. This signals a flaky test to the reporter.

Only set true when you have BOTH:
1. A failed result file for this TC
2. A passed result file for the SAME TC (from retry)

## Status Mapping

| Allure status | execution_result status |
|---|---|
| `passed` | `passed` |
| `failed` | `failed` |
| `broken` | `failed` (script error — broken = exception thrown) |
| `skipped` | `skipped` |
| Not in results but in spec | `not_executed` |

## Accounting for ALL Tests

After parsing, compare against `automation-manifest.json → artifacts.tests[].testCaseIds[]`:
- Every TC ID in the manifest MUST have an entry in `results[]`
- If a TC exists in spec but NOT in allure-results → add with:
  ```json
  {
    "testCaseId": "TC-UI-005",
    "status": "not_executed",
    "skipReason": "{SPECIFIC reason — see below}"
  }
  ```

## Skip Reason Rules

Valid:
- "Test depends on TC-UI-003 which failed — precondition not met"
- "HyperExecute task timed out before reaching this test"
- "test.skip() applied — see non-automatable-report.md"
- "Endpoint {URL} not available in test environment"

BANNED:
- "" (empty)
- null without explanation
- "Unknown"
- Generic "test not run"

## Artifacts from HyperExecute

Downloaded artifacts land in:
```
automation/artifacts/Allure Results/{taskId}/allure-results/
```

If multiple tasks (parallel execution), merge results from ALL task folders:
```powershell
Get-ChildItem -Recurse -Path "artifacts" -Directory -Filter "allure-results" |
  ForEach-Object { Get-ChildItem "$($_.FullName)" -Filter "*-result.json" }
```

## Summary Calculation

```
total = results.length
passed = results.filter(r => r.status === "passed").length
failed = results.filter(r => r.status === "failed").length
skipped = results.filter(r => r.status === "skipped").length
duration_ms = sum of all results[].duration_ms
```

`not_executed` tests are NOT counted in total for pass rate. They're tracked separately.
