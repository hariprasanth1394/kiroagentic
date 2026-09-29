# Knowledge Layer Update

## Single File: `qe-pipeline/knowledge/pipeline-health.json`

Read → modify in memory → write back. Never overwrite entire file — only append to `runs[]`.

If file is malformed JSON → recreate with empty `runs[]` and append.

---

## pipeline-health.json

Append a PipelineRun entry to `runs[]`:

```json
{
  "runId": "run_20250728_143000",
  "date": "2025-07-28T14:30:00.000Z",
  "type": "story",
  "storyKey": "BREW-101",
  "domain": "checkout",
  "environment": "sit",
  "jobId": "hyperexecute-job-id",
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

### Field Derivation

| Field | Source |
|---|---|
| `runId` | Generate: `run_{YYYYMMDD}_{HHmmss}` from current timestamp |
| `date` | ISO-8601 timestamp of the run |
| `type` | `"story"` for single-story, `"domain"` for domain regression, `"full"` for full regression |
| `storyKey` | JIRA key (e.g., `BREW-101`), null for full regression |
| `domain` | Domain tag from automation manifest (e.g., `"checkout"`), null if not applicable |
| `environment` | Derived from `baseUrl` in execution_result.json |
| `jobId` | HyperExecute job ID from execution_result, null for local runs |
| `totalTests` | `passed + failed + skipped + flaky` from quality gate |
| `passed` | Count of passed tests |
| `failed` | Count of failed tests |
| `skipped` | Count of skipped tests |
| `flaky` | Count of flaky tests (retried and passed) |
| `passRate` | `passed / (passed + failed) × 100` |
| `durationMs` | Total execution duration in milliseconds |
| `gateStatus` | `"PASSED"`, `"FAILED"`, or `"NOT_EVALUATED"` |

### Notes

- This is the ONLY knowledge file updated by the reporter skill
- `failure-history.json`, `flaky-tests.json`, `test-catalog.json`, `traceability-index.json`, and `coverage-history.json` are deprecated and no longer exist
- The `domain` field is new in v4 — sourced from the automation manifest's domain tag
