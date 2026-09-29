---
name: defect-skill
description: Create JIRA bugs for product defects and maintenance tasks for script errors. Use when user says "Run Closure" (phase 1), "file defects", or "create bugs for {KEY}".
---

# Defect Skill

Create JIRA bugs for genuine product defects and maintenance tasks for broken test scripts. ONLY create issues for real failures — never for environment problems or flaky tests.

## Inputs

| What | Where |
|---|---|
| Quality gate | `qe-pipeline/output/{KEY}/reporter/quality_gate.json` |
| Execution results | `qe-pipeline/output/{KEY}/execution/execution_result.json` |
| Test cases | `qe-pipeline/output/{KEY}/tester/test-cases.json` |
| Tester upload summary | `qe-pipeline/output/{KEY}/tester/jira-upload-summary.md` |

## Output

| File | Path |
|---|---|
| Defect Summary | `qe-pipeline/output/{KEY}/defect/defect-summary.json` |

---

## Procedure

### Step 0: Enable Required MCPs

Edit `.kiro/settings/mcp.json` (use file tools): set `disabled: false` for `jira` only (for bug/task creation and linking); leave all other servers `disabled: true`.

If jira cannot be enabled, write `defect-summary.json` with `status: "JIRA pending"` and do NOT fabricate created issue keys.

> Disable `jira` again in the final step so nothing stays enabled after the skill finishes.

### Step 1: Check If Defects Should Be Created

Read `quality_gate.json → failureCategories` AND cross-check `execution_result.json → results[]`:

| Condition | Action |
|---|---|
| `status: "NOT_EVALUATED"` AND `execution_result.json` has zero `failed`/`broken` results | Write summary: "Execution didn't complete — no defects." STOP. |
| `status: "NOT_EVALUATED"` BUT `execution_result.json` contains `failed`/`broken` tests | **Proceed** — a late infra error must not suppress real defects. Classify from `results[]` directly. |
| `productDefect == 0 AND testScriptError == 0` (and no failed/broken results) | Write summary: "No actionable failures." STOP. |
| `productDefect > 0 OR testScriptError > 0` | Proceed |

> The defect skill classifies from `execution_result.json → results[]` as the source of truth. `quality_gate.json` counts are a summary; if they disagree with the raw results (e.g., gate was NOT_EVALUATED on an infra error), trust the raw results.

### Step 2: Identify Actionable Failures

From `execution_result.json`, get tests with `status: "failed"`. Classify using the same rules reporter used:

| Category | Action |
|---|---|
| Product Defect (assertion failure) | Create Bug |
| Test Script Error (selector/code issue) | Create Task with `test-maintenance` label |
| Environment Issue | Skip — no JIRA issue |
| Flaky Test | Skip — not actionable |

### Step 3: Deduplicate

Read [jira-defect-create.md](references/jira-defect-create.md) before searching JIRA.

For EACH actionable failure, search JIRA before creating:
- If bug exists on THIS story → add evidence comment, skip creation
- If bug exists on DIFFERENT story → cross-link, skip creation
- If no match → create new issue

### Step 4: Create Issues & Link

Read [jira-defect-create.md](references/jira-defect-create.md) for Bug/Task payloads, priority mapping, and linking.

For each new issue:
1. Create Bug or Task
2. **Immediately** link to story
3. **Immediately** link to Test issue (if key exists in jira-upload-summary.md)

Get steps to reproduce from `test-cases.json → testCases[].steps[]` (match by TC ID).

**Priority mapping:** Critical→Highest, High→High, Medium→Medium, Low→Low

### Step 5: Write defect-summary.json

Write structured JSON output to `qe-pipeline/output/{KEY}/defect/defect-summary.json`, then validate it against [defect-summary.schema.json](assets/defect-summary.schema.json):

```json
{
  "storyKey": "{KEY}",
  "storyUrl": "{browseUrl}/{KEY}",
  "qualityGateStatus": "{status}",
  "date": "{ISO-8601}",
  "bugsCreated": [
    {
      "jiraKey": "{key}",
      "jiraUrl": "{browseUrl}/{key}",
      "testCaseId": "TC-UI-012",
      "summary": "[TC-UI-012] Description",
      "priority": "High"
    }
  ],
  "tasksCreated": [
    {
      "jiraKey": "{key}",
      "jiraUrl": "{browseUrl}/{key}",
      "testCaseId": "TC-UI-022",
      "summary": "[TC-UI-022] selector not found"
    }
  ],
  "duplicatesFound": [
    {
      "testCaseId": "TC-UI-005",
      "existingIssue": "{key}",
      "existingIssueUrl": "{browseUrl}/{key}",
      "action": "Added evidence comment"
    }
  ],
  "notActionable": [
    {
      "testCaseId": "TC-UI-003",
      "category": "Environment Issue",
      "reason": "TimeoutError on page.goto"
    }
  ]
}
```

### Step 6: Disable MCPs

Edit `.kiro/settings/mcp.json` and set `disabled: true` for `jira`, so nothing stays enabled after the skill finishes.

---

## Decision Logic

| Condition | Action |
|---|---|
| Quality gate NOT_EVALUATED **AND** `execution_result.json` has zero failed/broken results | No defects. STOP. |
| Quality gate NOT_EVALUATED **BUT** `execution_result.json` has failed/broken results | PROCEED — classify from `results[]` (a late infra error must not suppress real defects). See Step 1. |
| No product defects or script errors (and no failed/broken results) | No defects. STOP. |
| Dedup finds match on same story | Add evidence comment only. |
| Dedup finds match on different story | Cross-link only. |
| test-cases.json missing | Create bug with error message only (no steps). Note. |
| JIRA unavailable | Write `defect-summary.json` with "JIRA pending" status. |

## Anti-Hallucination

> The universal rules in `.kiro/steering/anti-hallucination.md` ALWAYS apply. The bullets below are this skill's specifics.

- NEVER create a Bug for an environment issue or flaky test
- NEVER create a duplicate — always search first
- NEVER invent steps to reproduce — copy from test-cases.json
- NEVER guess error cause — use actual errorMessage from execution_result.json
- NEVER assign priority without mapping from TC priority
