---
inclusion: auto
description: Routes pipeline trigger commands to the correct skill sequence
---

# Pipeline Orchestrator

## Step 0: Resolve the App (multi-app, do this FIRST)

Every story belongs to exactly one application. Resolve it before anything else:

1. `appKey = storyKey.split('-')[0]` (e.g. `BREW-101` → `BREW`, `TCOE-330` → `TCOE`).
2. Look up `pipeline-config.json → apps[appKey]`. If **no entry** → HALT and ask the user to register the app (repo + suiteDir + envConfig). Never guess a repo or URL.
3. From the entry, bind these for the whole run:
   - **suiteDir** = `apps[appKey].suiteDir` (e.g. `qe-pipeline/output/regression-suite-BREW`) — the app's ISOLATED suite (own `project/`, `registry/`, `playwright.config.ts`, `core/`, and the layers `components/ pages/ services/ flows/ journeys/ fixtures/ tests/`). App A and App B never share any of these (pages/services/flows/journeys/core/selectors/capabilities).
   - **envConfig** = `apps[appKey].envConfig` (e.g. `env_config.BREW.json`).
   - **repo** = `apps[appKey].git` (for the Automation git push).

Wherever this document (or a skill) says `regression-suite/` or `env_config.json`, read it as the **resolved per-app** `{suiteDir}/` and `{envConfig}`. The per-story artifact folders under `qe-pipeline/output/{STORY-KEY}/` stay app-agnostic in path.

## Story Output Structure

When a pipeline starts for a story, create the output directory structure before invoking any skills:

```
qe-pipeline/output/{STORY-KEY}/
├── planner/
├── tester/
├── automation/
├── execution/
├── reporter/
├── defect/
└── retest/
```

### createStoryOutputStructure

```typescript
function createStoryOutputStructure(storyKey: string): string[] {
  const base = `qe-pipeline/output/${storyKey}`;
  const directories = [
    base,
    `${base}/planner`,
    `${base}/tester`,
    `${base}/automation`,
    `${base}/execution`,
    `${base}/reporter`,
    `${base}/defect`,
    `${base}/retest`,
  ];

  // Create all directories (idempotent — no error if exists)
  for (const dir of directories) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return directories;
}
```

## Documentation Pipeline (runs before the QE pipeline)

The **Product Knowledge Skill** (`/product-knowledge-skill`) is the FIRST agent overall. It discovers and maintains the app's **isolated Product Knowledge Base (PKB)** at the resolved `{pkbDir}` (= `apps[appKey].pkbDir`, e.g. `qe-pipeline/knowledge/product-TCOE/`) from the live app. Like every other skill it resolves the app first (Step 0 above) so the PKB stays isolated per app — one app's PKB never mixes with another's. It is not part of the fixed per-story QE sequence below — it is run on demand (e.g. "Run Product Knowledge for TCOE", "document this app") to build the business context. The Planner reads its own app's `{pkbDir}` as primary business context before analysing a story. It requires only the `playwright` MCP and never writes to JIRA.

## Fixed Skill Invocation Sequence

Skills are invoked in this exact order. Each skill depends on the output of its predecessor:

| Step | Skill | Input | Output | Artifact |
|------|-------|-------|--------|----------|
| 1 | `/planner-skill` | JIRA story | `planner/` | `scenario-inventory.json` |
| 2 | `/tester-skill` | `planner/scenario-inventory.json` | `tester/` | `test-cases.json` |
| 3 | `/automation-skill` | `tester/test-cases.json` | `automation/` + `{suiteDir}/` (per-app) + git branch/PR | `automation-manifest.json` |
| 4 | `/execution-skill` | `automation/automation-manifest.json` | `execution/` | `execution_result.json` |
| 5 | `/reporter-skill` | `execution/execution_result.json` | `reporter/` | `quality-gate.json` |
| 6 | `/defect-skill` | `reporter/quality-gate.json` | `defect/` | `defect-summary.json` |
| 7 | `/retest-skill` | `defect/defect-summary.json` | `retest/` | `retest-summary.json` |

## Pipeline Commands

When the user issues a pipeline command, activate the correct skills in sequence:

| Command | Skills | What Happens |
|---|---|---|
| "Run Product Knowledge for {APP}" / "Document this app" | `/product-knowledge-skill` | Live-app discovery → per-app PKB update (resolved `{pkbDir}`, e.g. `qe-pipeline/knowledge/product-TCOE/`) |
| "Run Planning for {KEY}" | `/planner-skill` then `/tester-skill` | Scenario extraction → Test case generation |
| "Run Scripting for {KEY}" | `/automation-skill` | Layered code generation into per-app `{suiteDir}/` + git commit/push + PR |
| "Run Execution for {KEY}" | `/execution-skill` then `/reporter-skill` | HyperExecute run → Quality gate evaluation |
| "Run Closure for {KEY}" | `/defect-skill` then `/retest-skill` | Bug filing → Fix verification |
| "Run Full Pipeline for {KEY}" | All skills in sequence | Complete pipeline: planner → tester → automation → execution → reporter → defect → retest |

## Pre-Check: Existing Outputs

Before creating folders or activating skills, check for existing outputs:
- If outputs exist for the requested phase → ask user: regenerate or skip?
- Never silently overwrite existing outputs.

## Prerequisites Between Phases

| Phase | Must Exist Before Starting |
|---|---|
| Planning | JIRA story key |
| Tester | `planner/scenario-inventory.json` |
| Scripting | `tester/test-cases.json` + valid `{envConfig} → appUrl` (or `apiBaseUrl` for API-only stories) — where `{envConfig}` is the resolved per-app file |
| Execution | `{suiteDir}/tests/*.spec.ts` + `automation/automation-manifest.json` (per-app suite) |
| Reporter | `execution/execution_result.json` |
| Closure | `reporter/quality-gate.json` |
| Retest | `defect/defect-summary.json` with linked defects |

## URL Gate

Before Scripting: check the resolved per-app `{envConfig} → appUrl` (the file named by `pipeline-config.json → apps[appKey].envConfig`, e.g. `env_config.BREW.json`). The Planner writes the story URL there in its Step 8; it is NOT a field on `scenario-inventory.json`. If `appUrl` is empty → HALT with instructions to get the URL from the dev team.

> For API-only stories that have no browser URL, the gate is satisfied by `{envConfig} → apiBaseUrl` instead. HALT only when neither `appUrl` nor `apiBaseUrl` is set.

## Test Selection Strategy

When invoking the execution skill (story is NOT a tag):
- **Story mode** (default from pipeline): resolve the story's spec files from `automation-manifest.json → artifacts.tests[].file` (or `registry/domain-index.json` entries whose `stories[]` contains the key) and run those file paths — no grep.
- **Domain mode** (when user specifies domain): `--grep "@domain:{TAG}"`
- **Full regression** (when user says "Run Regression"): no filter — runs all tests in the app's `{suiteDir}/` (full regression is per-app; it never spans apps).
