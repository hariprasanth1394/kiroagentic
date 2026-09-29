# QE Framework V3 — Knowledge Layer

The knowledge layer is **long-term memory** for the pipeline. It persists across runs and gets smarter over time.

## Knowledge Files

| File | Purpose | Updated By |
|---|---|---|
| `test-catalog.json` | All known test cases across all stories | Tester Agent (after each run) |
| `traceability-index.json` | Full Story→Scenario→TC→Script→Result→Defect chain | Reporter Agent (after each run) |
| `flaky-tests.json` | Tests that flip between pass/fail | Reporter Agent (when retry passes) |
| `failure-history.json` | Failure patterns by component/selector/error | Defect Agent (after classification) |
| `coverage-history.json` | Coverage trend per run | Reporter Agent (after each run) |
| `pipeline-health.json` | Run durations, pass rates, infra reliability | Reporter Agent (after each run) |

## How Agents Use Knowledge

- **Planner** reads `failure-history.json` to inform risk scoring
- **Automation** reads `test-catalog.json` to avoid generating duplicate tests
- **Execution** reads `flaky-tests.json` to exclude known flaky from gate calculation
- **Reporter** writes to ALL knowledge files after each run
- **Regression** reads `test-catalog.json` + `traceability-index.json` to select tests

## Philosophy

> Discover first. Reuse second. Generate last.

The knowledge layer enables this by remembering what already exists.
