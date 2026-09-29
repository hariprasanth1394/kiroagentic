---
name: tester-skill
description: Generate script-ready test cases from the scenario inventory and upload to JIRA. Use when user says "Run Planning" (phase 2), "Run Tester", "generate test cases", or "create tests for {KEY}".
---

# Tester Skill

Generate test cases precise enough that the Automation Agent can write a Playwright script with ZERO interpretation. Your output (`test-cases.json`) is the single contract consumed downstream.

## Inputs

| What | Where |
|---|---|
| Scenario Inventory (JSON) | `qe-pipeline/output/{KEY}/planner/scenario-inventory.json` **(always read this)** |
| Product Knowledge Base (business context) | resolved per-app `{pkbDir}/**` (= `apps[appKey].pkbDir`, e.g. `qe-pipeline/knowledge/product-TCOE/`) — **read-only**, only for scenarios that carry `pkbRefs`. Skip if it does not exist. |

## Outputs

| File | Path |
|---|---|
| Test Cases | `qe-pipeline/output/{KEY}/tester/test-cases.json` |
| JIRA Upload Summary | `qe-pipeline/output/{KEY}/tester/jira-upload-summary.md` |

### Contract: test-cases.json

Validate against `assets/testcase.schema.json`. Structure:
- `storyKey`, `generatedAt`, `sourceScenarioCount`
- `testCases[]` — each: `id`, `title`, `dimension`, `preconditions`, `steps[]`, `expectedResults[]`, `priority`, `linkedRequirement`, `testType`, `testSet`, `sourceScenarioId`, `executionStatus`, `tags`
- Each step: `{ stepNumber, action, target, value }`
- Each expectedResult: `{ element, state, value }`
- Each tags: `{ domain, suite, story }` — where `suite` is an array of one or more values from `["smoke", "regression"]`

Example test case with tags:
```json
{
  "testCases": [{
    "id": "TC-UI-001",
    "title": "Verify checkout completes with valid payment",
    "tags": {
      "domain": "checkout",
      "suite": ["smoke", "regression"],
      "story": "BREW-101"
    },
    "dimension": "UI",
    "preconditions": "...",
    "steps": [],
    "expectedResults": [],
    "priority": "High",
    "linkedRequirement": "AC-1",
    "testType": "Automated",
    "testSet": "...",
    "sourceScenarioId": "SC-001",
    "executionStatus": "Not Executed"
  }]
}
```

---

## Procedure

### Step 0: Enable Required MCPs

Edit `.kiro/settings/mcp.json` (use file tools): set `disabled: false` for `jira` only; leave all other servers `disabled: true`.

If jira cannot be enabled, apply the MCP Availability Gate in `qe-shared-rules`: still write `test-cases.json` locally, skip the JIRA upload (Step 5), and report "JIRA upload skipped — MCP disabled". Never fabricate JIRA keys.

> Disable `jira` again in the final step so nothing stays enabled after the skill finishes.

### Step 1: Read Inputs

1. Read `scenario-inventory.json` — extract all scenarios, categories, priorities, sources, appUrl
2. Identify risk areas with `score ≥ 6` from the `risks[]` array (these need expansion in Step 3)
3. Note scope: acCount, fieldCount, estimatedScenarios

If `scenario-inventory.json` missing → HALT: "Tester cannot proceed — no scenario inventory. Run Planner first."

### Step 2: Generate Test Cases

Read [step-patterns.md](references/step-patterns.md) before writing any step or expected result.

**Use each scenario's `pkbRefs` (if present) for precise, real-app steps.** When a scenario carries a `pkbRefs` object (added by the planner's AC+PKB fusion), resolve the referenced PKB docs under the app's `{pkbDir}` — `pkbRefs.screens[]` → `{pkbDir}/screens/{name}.md`, `pkbRefs.workflow` → `{pkbDir}/workflows/{name}.md` — and use their documented **URL, Main Components, User Actions, Entry/Exit Conditions, and Navigation Flow** to build exact `steps[]` (real navigate paths and control names, not guesses), `preconditions` (documented entry conditions), and `expectedResults` (documented exit conditions). Follow `pkbRefs.navigationPath` for the page order in end-to-end (UI) cases. This is read-only grounding — do not invent detail beyond what the PKB and scenario provide, and never write to the PKB. If a scenario has no `pkbRefs` (or `{pkbDir}` is absent), generate from the scenario alone as before.

For EACH scenario in the inventory, generate test cases. Every step MUST have `action + target + value`. Every expected result MUST have `element + state + value`.

Read each scenario's `category` field (`positive` | `negative` | `boundary` | `error-handling`) from `scenario-inventory.json`:

| Scenario `category` | Generate |
|---|---|
| positive | 1 TC validating the exact AC (Given/When/Then → steps) |
| negative | 1 TC with the specific invalid value + specific expected error |
| boundary | 1 TC at exact limit (accepted) + 1 TC over limit (rejected) |
| error-handling | 1 TC simulating the failure condition |

**TC ID format:** `TC-{DIM}-{SEQ}` where DIM = `UI`, `API`, or `NF`. Sequential per dimension starting at 001.

**Title:** Start with action verb + specific behavior (e.g., "Verify POST score returns 401 without auth token")

**Preconditions:** Exact starting state including URL, page state, and any prior data. Never use vague preconditions like "Application is accessible" or "System is ready".

**Dimension assignment:**
- `UI` → tests that interact with browser elements (clicks, typing, navigation)
- `API` → tests that send HTTP requests and validate responses
- `NF` (Non-Functional) → performance, load, accessibility, security tests

The `dimension` field value is `UI` | `API` | `NF` (matches the planner scenario dimension and the TC-ID DIM segment).

**UI test cases require step-level granularity (Item: detailed UI steps).** For every `dimension: "UI"` test case, do NOT collapse a journey into one coarse step. Break it into atomic, ordered steps where each step is a single user action or a single verification, so the Automation skill can map each step 1:1 to a page/flow method:
- One `Navigate` step to reach the starting URL (explicit path).
- One step per field interaction (`Type`/`Select`/`Check`) — never "fill the form"; list each field + exact value.
- One explicit step for each state-revealing interaction (open dropdown, expand section, switch tab) before interacting with what it reveals.
- A `Wait for` step before asserting on content that loads after an action (avoids the "element not found because it hadn't rendered" class of failures).
- One `Verify` step per distinct observable outcome (URL change, element visible, text content, error message) — separate expected results, not a bundled "works".
- Preconditions must name the exact page state and any auth/session needed.

API and NF cases stay request/response oriented and do not need this UI step expansion. Follow [step-patterns.md](references/step-patterns.md) for the approved action/state vocabulary.

### Step 3: Derive Tag Metadata

For EACH generated test case, compute and attach a `tags` object with three fields. Note: `domain` becomes the `@domain` describe-title tag; `suite` becomes one or both `@suite:*` describe-title tags; `story` does NOT become a tag — it is metadata the automation skill uses to populate the registry `stories[]` arrays (which are many-to-many, so a test reused by several stories is linked to each).

**Story (metadata, not a tag)** — Derive from the originating JIRA story key:
- Source: `storyKey` field from `scenario-inventory.json`
- Format: key exactly as it appears (e.g., `BREW-101`)
- Result: `tags.story = "BREW-101"` — carried to automation, which appends it to the relevant registry `stories[]` arrays. It is **never** emitted as a Playwright describe tag (no `@story:` in the spec).

**Domain_Tag** — Derive from the business context of the scenario:
- Source: `scope.businessDomain` field in `scenario-inventory.json`
- Format: lowercase, hyphenated if multi-word (e.g., `checkout`, `order-management`)
- The domain emerges organically from story content — do NOT constrain to a predefined list
- Result: `tags.domain = "checkout"`

**Suite_Tag** — Derive from risk/criticality indicators in the scenario inventory:
- Source: scenario `priority` field and associated risk `score` from `risks[]`
- A test case may carry **one or both** suite tags — some critical paths belong to both smoke AND regression.
- Mapping:
  - Critical priority OR risk score ≥ 9 → `tags.suite = ["smoke", "regression"]` (critical paths run in both)
  - High priority OR risk score 6–8 → `tags.suite = ["smoke", "regression"]` (important paths run in both)
  - Medium priority OR risk score 3–5 → `tags.suite = ["regression"]`
  - Low priority OR risk score < 3 → `tags.suite = ["regression"]`
- Result: `tags.suite = ["smoke", "regression"]` (array; single-item arrays like `["regression"]` are valid)
- The automation skill emits EACH suite tag as a separate Playwright tag: `@suite:smoke @suite:regression`

**Apply to every test case before proceeding to the next step.**

### Step 4: Apply High-Risk Expansion

Read [risk-expansion.md](references/risk-expansion.md) before expanding any scenario.

For each risk area from `risks[]` with `score ≥ 6`:

| Risk Score | Extra Tests |
|---|---|
| 6-8 (High) | +2 boundary + 2 negative minimum |
| 9-12 (Critical) | +3 boundary + 3 negative minimum |

These extra TCs target the specific `featureArea` flagged in the risk. Use the `evidence` field to understand what to test.

### Step 5: Upload to JIRA

Read [jira-upload.md](references/jira-upload.md) before making any MCP call.

This step creates Test Set + Test issues in JIRA and links them using the "Test" link type (Xray's native test-story relationship).

**Project key:** Derived from story key at runtime (e.g., BREW-94 → BREW). Never hardcoded.

**Execution order (MANDATORY — do not reorder):**

1. **Reconcile (create / update / skip)** — search for existing tests with this story's label, map by TC-ID. On a re-run: CREATE new TCs, UPDATE existing TCs whose content changed (via `editJiraIssue` — never duplicate), SKIP unchanged ones. See [jira-upload.md](references/jira-upload.md).
2. **Create Test Set** — one per dimension (e.g., "Test Set: Scoring - API (BREW-94)"). Reuse the existing Test Set if one already exists for this dimension+story.
3. **For EACH Test issue (created OR updated):**
   - Create the Test issue (steps formatted as table in description), or update it in place if it already exists
   - Link Test → Story using the correct Xray "Tests" link type (immediately) — verify it attached
   - Link Test → Test Set (immediately) — verify it attached
   - **Only then move to next TC**
4. **Link Test Set → Story** — after all Tests are done
5. **Verify links** — fetch the story, confirm `issuelinks` contains all created keys. Log any missing as ❌.

**CRITICAL: Link IMMEDIATELY after each creation.** Do not batch. Create → Link → Link → Next.

### Step 6: Write jira-upload-summary.md + surface Test Set link(s) in chat

See [jira-upload.md](references/jira-upload.md) for the summary format with clickable links.

1. Write the upload summary with **clickable JIRA links** (URL format from `pipeline-config.json → jira.storyUrlFormat`). This file is the user's verification checklist and MUST include, per dimension, the created **Test Set** clickable link.
2. **Also surface each created Test Set's clickable link directly in the chat response** after upload (not only in the file), e.g. `Test Set (API): https://{site}/browse/{TestSetKey}`. Build the URL from `jira.storyUrlFormat`. If a Test Set was reused (not newly created), still print its link and mark it "(reused)". If JIRA upload was skipped/failed, say so and print no fabricated link.

### Step 7: Validate

Validate output against [testcase.schema.json](assets/testcase.schema.json).

- [ ] Every scenario has at least one test case
- [ ] TC count ≥ sourceScenarioCount
- [ ] All TC IDs follow `TC-{DIM}-{SEQ}` format, sequential, no gaps
- [ ] No duplicate TC IDs
- [ ] Every step has action + target + value (no vague language)
- [ ] Every expected result has element + state + value (no vague outcomes)
- [ ] Preconditions specify exact starting state including URL
- [ ] High-risk scenarios (score ≥ 6) have extra boundary + negative TCs
- [ ] Priority matches source scenario priority
- [ ] Every test case has `tags.domain`, `tags.suite`, and `tags.story` fields
- [ ] `tags.story` matches the story key from `scenario-inventory.json`
- [ ] `tags.suite` is a non-empty array containing only `"smoke"` and/or `"regression"`
- [ ] `tags.domain` matches `scope.businessDomain` from `scenario-inventory.json`
- ZERO banned language found (check against [step-patterns.md](references/step-patterns.md))
- [ ] All JIRA issues linked (check summary for ❌)

### Step 8: Disable MCPs

Edit `.kiro/settings/mcp.json` and set `disabled: true` for `jira`, so nothing stays enabled after the skill finishes.

---

## Decision Logic

| Condition | Action |
|---|---|
| Scenario inventory missing | HALT: "No scenario inventory — run Planner first" |
| Risk register (risks[]) empty | Continue without expansion (use inherited priorities) |
| Scenario has `confidence: "low"` | Generate TC but note in title: "[Low Confidence]" |
| TC count < scenario count after generation | Identify missing, generate before finishing |
| A step needs data not in the story | Use placeholder: `{unique_email}`, `{existing_email}`, `"A" repeated N times` |
| Scenario has `dataDependencies[]` (cross-story data — Item 10) | Turn each into a concrete precondition, e.g., "Given a registered user obtained via {howToObtain} (from {fromStory})". Do NOT mark the TC non-automatable for missing cross-story data — the dependency IS the context. Pass `source`/`howToObtain` through so Automation can wire a data factory/fixture. |
| JIRA upload fails mid-batch | Log what succeeded, continue remaining, write partial summary |
| JIRA linking fails | Retry ONCE. If still fails, log ❌ in summary. Do NOT skip silently. |
| Test Set issue type unavailable | STOP. Report: "Test Set issue type not found in project. Check Xray plugin." |
| Test issue type unavailable | STOP. Report: "Test issue type not found in project. Check Xray plugin." |

## Anti-Hallucination

> The universal rules in `.kiro/steering/anti-hallucination.md` (placeholder-format standard, confidence tagging, stop signals, evidence-before-generating) ALWAYS apply. The bullets below are this skill's specifics.

- NEVER invent error message text — use exact text from ACs, or `{error_message_for_X}` placeholder
- NEVER invent character limits — only from explicit Fields & Validation table in scenario inventory
- NEVER invent API endpoint URLs or response schemas — use what's in the scenario description
- NEVER use vague language in steps or expected results (see banned lists in [step-patterns.md](references/step-patterns.md))
- NEVER claim a link was created without confirming the MCP call succeeded
