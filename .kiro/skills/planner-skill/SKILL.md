---
name: planner-skill
description: Generate a testable scenario inventory from a JIRA user story. Use when user says "Run Planning", "Run Planner", "generate test scenarios", or "what should we test for this story".
---

# Planner Skill

Extract testable scenarios from a JIRA user story, assess risks, and produce a scored scenario inventory. The output (`scenario-inventory.json`) is the single contract consumed by the Tester Agent downstream.

## Inputs

| What | Where |
|---|---|
| JIRA story | `getJiraIssue` MCP (cloudId from `pipeline-config.json → jira.cloudId`) |
| Historical defects | `searchJiraIssuesUsingJql` — `project = {projectKey} AND issuetype = Bug AND created >= -90d` |
| Live application | Playwright MCP: `browser_navigate`, `browser_snapshot`, `browser_evaluate` |
| Figma design | Figma MCP: `figma_get_screenshot` (if URL in story) |
| Product Knowledge Base (business context) | resolved per-app `{pkbDir}/**` (= `apps[appKey].pkbDir`, e.g. `qe-pipeline/knowledge/product-TCOE/`) — read-only, if it exists |
| Env config | `qe-pipeline/config/env_config.json` |

## Outputs

| File | Path |
|---|---|
| Scenario Inventory | `qe-pipeline/output/{KEY}/planner/scenario-inventory.json` |
| Env config update | per-app `{envConfig}` from `pipeline-config.json → apps[appKey].envConfig` (e.g. `env_config.BREW.json`) — update `appUrl` / `apiBaseUrl` |

**Single output. No markdown artifacts. No JIRA writes.** The planner produces `scenario-inventory.json` and updates the per-app env config only. It does NOT post JIRA comments or upload scenarios — JIRA writes are the Tester skill's job.

### Contract: scenario-inventory.json

This file conforms to `assets/scenario-inventory.schema.json`. See that schema for the authoritative field list and enums (scenario fields, `dimension` = UI|API|NF, `category` = positive|negative|boundary|error-handling (assigned in Step 6), `risks[]` with `RISK-NNN` + `riskIds`, `scope` = estimatedScenarios/acceptanceCriteria/businessDomain).

**Domain alignment (read-only, optional):** if the app has a project model (`{suiteDir}/project/domain-map.yaml`, resolved per qe-shared-rules Multi-App Resolution), you MAY read it to set `scope.businessDomain` to an EXISTING domain name rather than inventing a near-duplicate (e.g. reuse `checkout` instead of coining `check-out`). This keeps the downstream `@domain` tag and capability reuse consistent. The planner never writes the project model — read-only awareness only; if no domain map exists, derive the domain from story content as before.

**Cross-story data dependencies (Item 10):** when a scenario needs data produced by another story/feature (e.g., an account created in BREW-90, an order id from a checkout story), declare it in the scenario's `dataDependencies[]` instead of dropping the scenario as "not executable". Each entry: `{ needs, fromStory, source, howToObtain }` where `source` is one of `api | fixture | manual | prior-test` and `howToObtain` describes the concrete way to get it (endpoint to call, fixture to reuse, or the producing TC/story). This context flows to the Tester (preconditions) and Automation (data factory/fixture) so the scenario becomes executable.

---

## Procedure

### Step 0: Enable Required MCPs

Edit `.kiro/settings/mcp.json` (use file tools — read it, change the flags, write it back): set `disabled: false` for `jira` and `playwright` (and `power-figma-figma` only if the story carries a Figma link). Leave every other server `disabled: true`. This is how the skill turns on only what it needs; a server is never enabled unless a skill that needs it does so here.

After enabling, confirm the required servers are connected per the MCP Availability Gate in `qe-shared-rules`. If a required MCP cannot be enabled, apply that gate — do not fabricate its output.

> Disable these again in the final step (Step 9) so nothing stays enabled after the skill finishes.

### Step 0b: App Registration Gate

Resolve `appKey = storyKey.split('-')[0]` and look up `pipeline-config.json → apps[appKey]`.

**If the entry EXISTS** — bind `suiteDir`, `envConfig`, `repo` and continue to Step 1.

**If the entry is MISSING** — do NOT halt silently. Prompt the user for exactly these 4 values:

```
App "{appKey}" is not registered yet. I need 4 things to register it (takes 30 seconds):

1. Display name   — e.g. "Checkout Portal"
2. GitLab repo path — e.g. "my-group/my-subgroup/my-repo"
3. Default branch  — develop | main | master
4. LambdaTest tunnel name — e.g. "ECS-Shared-Tunnel-NonProd" (or leave blank if no tunnel)
```

Once the user provides these values, write the new app entry into `pipeline-config.json → apps[appKey]` using the template shape from `pipeline-config.template.json`:

```json
"{appKey}": {
  "displayName": "<user-provided>",
  "suiteDir": "qe-pipeline/output/regression-suite-{appKey}",
  "envConfig": "qe-pipeline/config/env_config.{appKey}.json",
  "git": {
    "provider": "gitlab",
    "projectPath": "<user-provided>",
    "defaultBranch": "<user-provided>",
    "branchPrefix": "feature/"
  }
}
```

Then create `qe-pipeline/config/env_config.{appKey}.json` by copying `env_config.template.json` with `"app": "{appKey}"` and `"tunnel.name": "<user-provided or empty>"` filled in. Leave `appUrl` and `apiBaseUrl` as `""` — those get filled in Step 8 after live inspection.

After writing both files, bind `suiteDir`, `envConfig`, `repo` from the new entry and continue to Step 1 without stopping.

### Step 1: Fetch and Parse Story

Call `getJiraIssue` with:
- `issueIdOrKey: "{KEY}"`
- `responseContentFormat: "markdown"`
- `fields: ["summary", "description", "status", "issuetype", "priority", "labels", "components", "created", "updated", "resolution", "project", "comment"]`

**MUST include "comment" in fields** — comments often contain validated URLs, confirmed endpoints, and implementation gaps that override the description.

Parse ALL comments BEFORE generating scenarios. Treat a later comment as authoritative only when it clearly refines, confirms, or replaces a requirement. Do not treat unrelated comments as requirement changes.

Extract from description + comments:
- **Acceptance Criteria** — primary scenario source (Given/When/Then)
- **Fields & Validation Rules** — table with names, types, limits, errors
- **Navigation Flows** — page-to-page transitions
- **Business Rules** — IF/THEN logic
- **API Endpoints** — methods, paths, responses
- **Application URL** — also scan comments if not in description
- **Out of Scope** — NEVER generate scenarios for these

For every extracted item, distinguish:
- Explicit: directly stated in the description or comments.
- Inferred: logically derived but not explicitly stated.

Do not use inferred information to invent endpoints, limits, error messages, or business rules.

Note story priority (P1-P4) for risk severity mapping.

Set `storyKey`, `storyTitle`, and `storyUrl` on the inventory now: build `storyUrl` from `pipeline-config.json → jira.storyUrlFormat` with the story key (e.g. `https://{site}/browse/{KEY}`). These are required fields of `scenario-inventory.json`.

If no acceptance criteria are found:
- Do not generate an inventory.
- HALT and report to the user: the story has no ACs and cannot be planned; recommend adding a `QE-Blocker` label and clarifying the ACs with the story owner.
- Do NOT write to JIRA (the planner is read-only). The user/Tester applies any label if needed.

### Step 2: Inspect Live Application

**First, consult the Product Knowledge Base (read-only).** If the resolved per-app `{pkbDir}` (= `apps[appKey].pkbDir`, e.g. `qe-pipeline/knowledge/product-TCOE/`) exists, read its `product-overview.md`, relevant `screens/*.md`, `workflows/*.md`, `business-rules.md`, and `navigation-map.md` as primary business context before touching the live app. Use it to ground scenarios in documented behaviour and known limitations. It is context only — never treat undocumented PKB gaps as requirements, and never write to the PKB from the planner (that is the product-knowledge-skill's job). If no `{pkbDir}` exists, continue without it.

Read [app-inspection.md](references/app-inspection.md) before navigating to the app.

If application URL found: navigate, snapshot, run element discovery, click through happy path once, document stateful elements (both states), note non-working flows as environment limitations.

If page requires auth you can't provide → note as dependency, skip deep inspection.
If URL unreachable → continue without inspection, note in `environmentLimitations` with the **specific full URL** that failed and the reason (e.g., "https://app.example.com/checkout → ERR_TIMED_OUT"), never a blanket "domain not accessible". For API stories, record the exact endpoint path that could not be reached, not just the host.

### Step 3: Inspect Figma (If Link Present)

See [app-inspection.md](references/app-inspection.md) for Figma URL parsing and cross-reference approach.

If story contains `figma.com/design/` or `figma.com/file/`: extract fileKey + nodeId, get screenshot, extract button labels and field names. Cross-reference with live app — differences become potential scenarios.

DO NOT invent pixel values, hex colors, or CSS. Only visible text and layout structure.

### Step 4: Query Historical Defects

```
searchJiraIssuesUsingJql:
  cloudId: {cloudId from pipeline-config.json}
  jql: "project = {projectKey} AND issuetype = Bug AND created >= -90d"
```

Count → Likelihood scoring:
- 5+ bugs → High (3)
- 2-4 → Medium (2)
- 0-1 → Low (1)
If the query fails:
- Record the failure in `environmentLimitations`.
- Do not claim a bug count.
- Use complexity and explicit dependency signals as fallback inputs.
- Explain the fallback in each affected risk's `evidence`.

### Step 5: Generate Scenarios

Read [naming-policy.json](assets/naming-policy.json) for SC-NNN format before assigning scenario IDs.

**Fuse ACs with the Product Knowledge Base.** Before generating, read [pkb-fusion.md](references/pkb-fusion.md) and apply it: derive scenarios from the ACs (source of truth for scope), and use the app's PKB (`{pkbDir}` read in Step 2) to make each in-scope scenario concrete (real page URLs, components, entry/exit conditions) and to cover the documented business rules, validations, failure points, and navigation branches the ACs leave implicit — **strictly within the story's scope**. Record each scenario's PKB grounding in `source` and the optional `pkbRefs` object. If no `{pkbDir}` exists, generate from ACs only.

For each Acceptance Criterion, generate scenarios:

| What to test | What to generate |
|--------------|------------------|
| Happy path (AC says "should work") | 1 positive scenario |
| Required field (must have value) | 1 negative scenario (empty/missing) |
| Field with limit (e.g., "max 50 chars") | 2 boundary scenarios (at limit + over limit) |
| Navigation flow (page A → page B) | 1 end-to-end scenario |
| Business rule with branches (IF X then Y, else Z) | 1 scenario per branch |
| API endpoint with success/error behavior | 1 success + 1 error scenario |
| PKB-documented rule/validation/failure-point/branch on an **in-scope** screen or workflow (per [pkb-fusion.md](references/pkb-fusion.md)) | 1 scenario per documented item, tagged with `source` + `pkbRefs`; confidence inherited from the PKB |
| Out of scope items (story OR PKB) | **ZERO** — never generate |

**Important:**
- One AC can produce multiple scenarios.
- Do not invent limits, endpoints, or error messages not in the story or PKB.
- If AC is vague, generate a minimal scenario and mark `confidence: "low"`.
- PKB **enriches within scope, never overrides an AC and never expands scope** (see [pkb-fusion.md](references/pkb-fusion.md) guardrails). Populate `pkbRefs` whenever a scenario is grounded in the PKB so the page/flow context survives to the Tester.
- **UI scenarios (`dimension: "UI"`) must carry granular `steps[]`** — one entry per user action (navigate, type each field, click, open dropdown, wait-for) and per verification — so the Tester skill can expand them into detailed UI test steps rather than guessing the journey. API/NF scenarios stay request/response oriented.

#### Apply Scope Cap

- Simple story (1-3 ACs): ~15 scenarios max
- Medium story (4-6 ACs): ~25 scenarios max
- Complex story (7+ ACs): ~40 scenarios max
- Never exceed 50 scenarios

If you exceed the cap, keep mandatory AC scenarios first, then prioritize by risk.

### Step 6: Categorize

Assign ONE `category` per scenario (the `category` field in the schema). Priority if multiple fit: `error-handling > boundary > negative > positive`

| Category | When |
|---|---|
| `positive` | Happy path matching an AC |
| `negative` | Invalid input, missing data |
| `boundary` | Value at exact limit from Fields table |
| `error-handling` | External dependency failure (only if story mentions external deps) |

### Step 7: Score Risks

**Severity** (from story priority): P1=Critical(4), P2=High(3), P3=Medium(2), P4=Low(1). Adjust UP for auth, payment, personal data, critical path.

**Likelihood** (from Step 4, application inspection, dependencies, and complexity): High(3) = 5+ bugs or external API deps + high AC count. Medium(2) = 2-4 bugs or 7+ ACs or recent refactoring. Low(1) = 0-1 bugs and simple UI-only.

**Score** = Severity × Likelihood (1-12). Levels: 9-12 Critical, 6-8 High, 3-4 Medium, 1-2 Low.

**Evidence is MANDATORY** — explain WHY for every score. No score without math shown.

### Step 8: Update env_config

Set `appUrl` (and `apiBaseUrl` for API stories) in the **resolved per-app** env config `{envConfig}` (the file named by `pipeline-config.json → apps[appKey].envConfig`, e.g. `env_config.BREW.json` — see Multi-App Resolution in qe-shared-rules). Write to that app's file, never the `env_config.json` template. If no URL: leave the value `""`.

> **The planner does NOT upload scenarios to JIRA and does NOT post a summary comment.** Scenarios live only in `scenario-inventory.json`. The Tester skill is the only skill that writes to JIRA (Test/Test Set issues). The planner's JIRA use is read-only (`getJiraIssue` to fetch the story, `searchJiraIssuesUsingJql` for historical defects).

### Step 9: Validate

Validate output against [scenario-inventory.schema.json](assets/scenario-inventory.schema.json).

- [ ] Every AC has at least one positive scenario
- [ ] Every required field has a negative scenario
- [ ] All fields with limits have boundary scenarios
- [ ] Source field non-empty for every scenario
- [ ] Evidence column explains every risk score
- [ ] Risk scores = Severity × Likelihood (check math)
- [ ] All scenario IDs unique and sequential (SC-001, SC-002...)
- [ ] No scenarios from "Out of Scope" items
- [ ] Per-app `{envConfig}` (e.g. `env_config.BREW.json`) updated with appUrl/apiBaseUrl

### Step 10: Disable MCPs

Edit `.kiro/settings/mcp.json` and set `disabled: true` for every server this skill enabled (`jira`, `playwright`, and `power-figma-figma` if used), so nothing stays enabled after the skill finishes.

---

## Decision Logic

| Condition | Action |
|---|---|
| App not registered in pipeline-config.json | Prompt user for 4 values (display name, GitLab repo path, default branch, tunnel name), write the entry and create env_config.{APP}.json, then continue — do NOT halt |
| Story has no ACs | HALT. Report to the user (no inventory). Planner is read-only — do NOT edit JIRA; recommend a `QE-Blocker` label to the user. |
| ACs present but no app URL | Continue with reduced confidence. Note "App not inspected." |
| "Out of Scope" section exists | Respect completely — ZERO scenarios from those items |
| AC is vague ("works correctly") | Generate scenario, tag `source: "Inferred"`, set `confidence: "low"` |
| Comment contradicts description | Later comment wins (it's a refinement) |
| Field has no character limit stated | DO NOT invent a limit. Test with extreme values without claiming a limit. |

## Anti-Hallucination

> The universal rules in `.kiro/steering/anti-hallucination.md` (placeholder-format standard, confidence tagging, stop signals, evidence-before-generating) ALWAYS apply. The bullets below are this skill's specifics.

- NEVER invent field character limits not in the story's Fields table
- NEVER invent API endpoints or HTTP methods
- NEVER invent error message text not quoted in ACs
- NEVER generate scenarios for "Out of Scope" items
- NEVER assign risk scores without showing math in evidence
- If unsure about a behavior → tag `source: "Inferred"`, `confidence: "low"`
