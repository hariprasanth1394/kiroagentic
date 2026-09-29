---
name: automation-skill
description: Layered code generator for the regression suite. Reads test-cases.json, generates layered Playwright code into regression-suite/, validates locally, and outputs automation-manifest.json. Use when user says "Run Scripting", "generate scripts", or "automate tests for {KEY}".
---

# Automation Skill — Layered Code Generator

Generate Playwright test code into the unified regression suite using a six-layer architecture. Every generation run discovers existing artifacts first, creates only what's missing, validates constraints, and runs locally before committing.

## Role

Layered Code Generator for the Regression Suite. You generate components, pages, flows, fixtures, and tests — bottom-up — into the **per-app** suite `{suiteDir}/` (resolved in Step 0 from `apps[appKey].suiteDir`, e.g. `qe-pipeline/output/regression-suite-BREW/`). Each app's suite is isolated — never mix apps. You never generate per-story throwaway scripts. Below, every `regression-suite/` path means the resolved `{suiteDir}/`.

---

## Inputs

| What | Where |
|---|---|
| Test Cases | `qe-pipeline/output/{KEY}/tester/test-cases.json` |
| Project model (app-level) | `{suiteDir}/project/domain-map.yaml`, `project.yaml`, `dependency-map.yaml` (if present — read before generating; see `references/project-model.md`) |
| Registry Catalogs | `{suiteDir}/registry/flow-catalog.json` |
| | `{suiteDir}/registry/journey-catalog.json` |
| | `{suiteDir}/registry/service-catalog.json` |
| | `{suiteDir}/registry/page-catalog.json` |
| | `{suiteDir}/registry/component-catalog.json` |
| | `{suiteDir}/registry/fixture-catalog.json` |
| | `{suiteDir}/registry/scenario-catalog.json` |
| | `{suiteDir}/registry/domain-index.json` |
| Live Application | Playwright MCP tools (DOM inspection) |
| Policies | `assets/playwright-standard.json` |
| | `assets/selector-policy.json` |
| | `assets/playwright-policy.json`, `assets/assertion-policy.json`, `assets/validation-policy.json`, `assets/naming-policy.json` |

## Outputs

| What | Where |
|---|---|
| Generated code | per-app `{suiteDir}/` (e.g. `qe-pipeline/output/regression-suite-BREW/`, layered structure) |
| Git branch + PR | `feature/{STORY-KEY}` in the app repo (`apps[appKey].git`), MR opened not merged |
| Manifest | `qe-pipeline/output/{KEY}/automation/automation-manifest.json` (incl. `git` result) |

---

## Procedure

### Step 0: Resolve App, Enable Required MCPs + Load References

First resolve the app (per qe-shared-rules → Multi-App Resolution): `appKey = storyKey.split('-')[0]`, look up `pipeline-config.json → apps[appKey]`, and bind `{suiteDir}`, `{envConfig}`, and `repo = apps[appKey].git`. No entry → HALT. All code in this skill goes into the app's `{suiteDir}/` (isolated per app), never a shared `regression-suite/`.

Edit `.kiro/settings/mcp.json` (use file tools): set `disabled: false` for `playwright` (live DOM inspection) and the configured **GitLab MCP** server (Step 8b commit/push/PR — use whatever key that server has in `mcp.json`); leave all other servers `disabled: true`.

If playwright cannot be enabled, apply the MCP Availability Gate: HALT generation of any page/component needing new selectors and report the connectivity error — never guess selectors. If the GitLab MCP cannot be enabled, still complete generation + local validation + manifest, but SKIP the git push (Step 8b) and note "git push skipped — GitLab MCP unavailable" in the manifest. Never fabricate a branch/PR URL.

> Disable `playwright` and the GitLab MCP server again in the final step so nothing stays enabled after the skill finishes.

Load only what is needed now to resolve the app and confirm MCPs:
- Read `pipeline-config.json` to bind `suiteDir`, `envConfig`, `repo`

### Step 1: Read Project Model + Registry Discovery (capability-first reuse)

Read [project-model.md](references/project-model.md) and [registry-schema.md](references/registry-schema.md) before touching any file.

First read the app's **project model** if present (`{suiteDir}/project/domain-map.yaml`, `dependency-map.yaml` — see `references/project-model.md`) to resolve the story's domain(s) and the capabilities it touches. Then read all registry catalogs and build a reuse map:

1. **Capability-first:** for each operation a test case needs, resolve it to a capability id by domain + verb (from `domain-map.yaml` / `flow-catalog` / `service-catalog`). If the capability id EXISTS → reuse its registered method; do NOT write a second implementation.
2. Identify existing pages that match URLs in test cases
3. Identify existing services (API) whose capabilities cover the API operations in test cases
4. Identify existing flows (single-domain) and journeys (cross-feature) that cover the paths in test cases
5. Identify existing components that can be composed into new pages
6. Identify existing fixtures that already expose needed flows/journeys
7. Identify existing `data/` files — reuse/extend a dataset file for new variations rather than adding a new file or (worse) a per-variant method
8. Mark artifacts as `reused` — do NOT regenerate them

| A cross-feature test case (a path spanning multiple domains) resolves to a **journey** that composes existing single-domain flows — never a duplicated end-to-end block inside a spec.

A journey is the integration-test layer of this framework. Any scenario that crosses a domain/feature boundary — or crosses into a different application or external system — goes into a journey. The journey validates that the seams between features work correctly; each individual flow stays focused on one domain.

### Step 2: DOM Inspection

Read [dom-exploration.md](references/dom-exploration.md) and [selector-policy.json](assets/selector-policy.json) before inspecting any page.

For pages/components that need creation or updating, follow `references/dom-exploration.md` in full — all four phases. Below is a summary of what that means:

**Phase 1 — Build navigation plan:** extract every unique URL from test case preconditions and navigation steps. Visit all of them; do not skip "simple" pages.

**Phase 2 — Systematic per-page discovery:**
1. `browser_navigate` → `browser_snapshot` (accessibility-tree preview)
2. Run the full element inventory `browser_evaluate` query (see `dom-exploration.md § 2b`) — returns tag, id, testid, name, ariaLabel, placeholder, role, text, href per element
3. **Generate selector candidates** per priority: `data-testid` → `getByRole` → `getByLabel` → `getByPlaceholder` → `getByText(exact)` → `locator('#id')` → `locator('[name=]')` → narrowed CSS. Never use class-only, wildcard-class, positional, or comma-separated selectors.
4. **Count-verify EVERY candidate** — run `document.querySelectorAll(...).length` (or equivalent) via `browser_evaluate` and read the returned integer. Record only what the tool returned; never type a count you did not measure. Accept only `count === 1`.
5. **Reveal hidden UI** — dropdowns, modals, tabs, accordions, confirmation dialogs, toast messages, inline-edit fields, pagination (see `dom-exploration.md § 2e`). Trigger each, then re-run discovery on the revealed content.
6. **Form deep dive** — run the form-specific `browser_evaluate` query (`dom-exploration.md § 2f`) to capture field-label associations and validation error containers.
7. **Nav/header discovery** — run nav query (`dom-exploration.md § 2g`) to get breadcrumbs, page titles, menu links.

**Phase 3 — Interaction-trace discovery:** walk through the actual test flow step-by-step in the browser. Discover elements that only exist in a specific application state (post-submit success, post-error, wizard step 2, etc.).

**Phase 4 — Selector map:** before writing a Page Object, produce a selector map (primary + fallback per element, each with evidence).

For EACH interactive element, discover 2–3 selectors — a primary plus fallbacks — and record evidence for **every one of them** (selector, `source`, measured `count`, `verifiedBy`). **Each selector (primary AND every fallback) must be EXECUTED against the live DOM and RETURN exactly ONE element (`count === 1`)** — measure it with `browser_evaluate` (`.length`) or `locator.count()`, never assume it. A fallback without its own measured `count === 1` evidence is a banned guess — do not add it (see `selector-policy.json → evidenceForEveryLink`). Chain the top two with `.or()` in the Page Object; keep the third as an evidence-tagged comment.

If live app is unreachable → HALT and report connectivity error

### Step 3: Generate Layers Bottom-Up

Read [layer-contracts.md](references/layer-contracts.md), [code-rules.md](references/code-rules.md), [playwright-standard.json](assets/playwright-standard.json), [playwright-policy.json](assets/playwright-policy.json), [assertion-policy.json](assets/assertion-policy.json), and [naming-policy.json](assets/naming-policy.json) before generating any file. As each layer is generated, also read the corresponding template: [data-template.ts](assets/data-template.ts), [component-template.ts](assets/component-template.ts), [page-template.ts](assets/page-template.ts), [service-template.ts](assets/service-template.ts), [flow-template.ts](assets/flow-template.ts), [journey-template.ts](assets/journey-template.ts), [fixture-template.ts](assets/fixture-template.ts), [test-template.ts](assets/test-template.ts).

Generate in strict order: **data → components → pages → services → flows → journeys → fixtures → tests**

For each layer:
- Check registry for existing artifact before creating (capability-first for flows/services)
- Use code templates from `assets/` directory (`data-template.ts`, `page-template.ts`, `component-template.ts`, `service-template.ts`, `flow-template.ts`, `journey-template.ts`, `fixture-template.ts`, `test-template.ts`)
- Apply naming conventions from `assets/naming-policy.json`
- Apply tags from test-cases.json metadata: `@domain:{value} @suite:{smoke|regression}` — a test that belongs to both suites gets both tags: `@suite:smoke @suite:regression`. Two tag types only — story is NOT a tag; record the story key in the registry `stories[]` arrays instead, which support many-to-many for tests reused across stories
- Reuse existing artifacts found in Step 1

**When to generate which layer:**
- **Data** — when test cases carry variations (e.g. per-region/per-type datasets) or reusable inputs. Put the variations in a `data/{name}.data.ts` file as typed constants and pass them into flow/service methods as parameters. NEVER create one method per variation. Reuse an existing `data/` file/entry before adding a new one.
- **Services** — for each API operation not already covered by an existing service capability. A service exposes API methods on the core `ApiClient`; register each as a capability id (`kind: api`).
- **Flows** — one per single-domain capability. A flow composes a page (UI) and/or a service (API): **hybrid** = create/seed via service, act/verify via page, re-check via service. Register each business operation as a capability id (`kind: ui|api|hybrid`).
- **Journeys** — only when a test case spans MULTIPLE domains/features. A journey composes existing flows in order (respecting `dependency-map.yaml`); it has no pages/services/locators.

**Layer constraints (enforced at generation time):**
- Data imports from `core/` only — pure typed constants, NO logic/locators/API calls
- Components import from `core/` only
- Pages import from `components/` and `core/` only
- Services import from `data/` and `core/` only (ApiClient) — NO locators
- Flows import from `pages/`, `services/`, `data/`, and `core/` only — NO locators
- Journeys import from `flows/`, `data/`, and `core/` only — NO pages/services/locators
- Fixtures import from `flows/`, `journeys/`, `data/`, and `core/` only
- Tests import from `fixtures/` only — NO locators, NO direct page imports

### Step 4: Validate Imports

Read [validation-rules.md](references/validation-rules.md) and [validation-policy.json](assets/validation-policy.json) before running any validation.

Run static import analysis per `references/validation-rules.md`:

1. Parse all import statements in generated files
2. Resolve each import to its target layer
3. Reject any file with an upward import (dependency violation)
4. If violations found → fix the generated code and re-validate

### Step 5: Validate Locator Isolation

Ensure locator isolation:

1. Scan `tests/` files — reject if any contain locator strings or page.getBy* calls
2. Scan `flows/`, `journeys/`, `services/`, and `data/` files — reject if any contain locator strings (flows call pages/services; journeys call flows; services are API-only; data is pure constants)
3. Locators belong ONLY in `pages/` and `components/`

### Step 5b: Validate Selector Evidence & Uniqueness (MANDATORY)

Per `references/validation-rules.md → §3 Selector Evidence & Uniqueness`, prove every locator is real and unambiguous BEFORE committing:

1. For every locator in every Page Object / Component — the **primary AND each `.or()` fallback** — confirm it has `evidence` with a valid `source`, a `verifiedBy`, and a **measured** `count === 1`.
2. **Measured, never assumed:** the `count` you record MUST be the integer the tool RETURNED when you actually executed the locator against the live DOM — `browser_evaluate` running `document.querySelectorAll(...).length` (or the getBy* DOM equivalent), or `locator.count()` in a local dry-run. Record which in `evidence.verifiedBy`. A `count` typed without running the locator is self-reported evidence and is a hard violation.
3. `count === 0` (not found / invented) or `count > 1` (ambiguous) → reject the file, re-inspect the DOM with Playwright MCP, regenerate the selector, and re-measure until it returns `1`.
4. No unverified fallbacks: a selector in an `.or()` chain without its own measured `count === 1` evidence (and a real `verifiedBy`) is banned.
5. Record each locator's primary + `fallbacks[]` (with evidence incl. `verifiedBy`) in the manifest `LocatorEntry`.

### Step 6: Local Execution

Read [local-execution.md](references/local-execution.md) before running tests.

Run generated tests locally:

Run exactly the spec files generated/modified for this story (story is not a tag, so pass the file paths — from `artifacts.tests[].file` — not a `@story` grep):

```powershell
cd {suiteDir}   # e.g. qe-pipeline/output/regression-suite-BREW (resolved per app in Step 0)
npx playwright test {space-separated spec file paths for this story} --project=chromium --reporter=list --workers=1
```

(To run by business domain instead, use `--grep "@domain:{tag}"`.)

Classify failures:
- **Script error** (SyntaxError, missing import, timeout on selector) → fix and retry (max 3 rounds)
- **Product defect** (assertion failure on expected behavior) → mark as `needs-review`, keep the test

**Selector failures — evidence-first repair (per `selector-policy.json`):**
- If the primary selector fails but an **evidence-backed fallback** in the `.or()` chain resolves → the run can pass on the fallback (cheap, no MCP call), BUT the primary is now **unstable**: set `unstable: true` on that `LocatorEntry` and add a `needs-review` note "primary failed; passed on fallback — re-inspect". A fallback-carried pass is a yellow, never a clean green.
- If the **entire** evidence-backed chain fails for an element → re-inspect that element's DOM with Playwright MCP and regenerate the selector(s) with fresh `count === 1` evidence.
- **Mass selector failure** (a large fraction of tests failing on `locator resolved to 0 elements` / `strict mode violation` = the page changed wholesale) → do NOT patch one-by-one and do NOT rely on any grid autoHeal. Re-inspect the affected pages and **regenerate the Page Objects** with fresh evidence (this writes persistent, evidence-backed fixes to disk). See `selector-policy.json → massSelectorFailureRecovery`.

After 3 fix rounds for the same failure → mark as `needs-review`.

### Step 7: Registry Update

Read [registry-schema.md](references/registry-schema.md) (re-read if Step 1 context has been compacted).

Atomically update all affected registry catalogs (per `references/registry-schema.md` — atomic upsert, never remove, dedupe `stories[]`, `.lock`):

1. Add/update entries in `flow-catalog.json`, `journey-catalog.json`, `service-catalog.json`, `page-catalog.json`, `component-catalog.json`, `fixture-catalog.json`
2. **Capabilities:** for every new flow/service method, record its capability id (`{APP}-{DOMAIN}-{VERB}`) + `method` in that artifact's `capabilities[]` — reuse existing ids, never duplicate an implementation
3. **Scenario catalog:** upsert `scenario-catalog.json` entries mapping business scenario ids to the capability ids they compose (capability ids MUST resolve to a flow/service implementation)
4. **Project model:** upsert new capabilities into `{suiteDir}/project/domain-map.yaml` under their domain; record any cross-story data dependency in `dependency-map.yaml`. Create `project/` for a brand-new app suite
5. Update `domain-index.json` with new domain tags, test paths, flow AND journey references, stories
6. Set `lastUpdated` timestamps on modified catalogs
7. If registry update fails → roll back associated code file creation

### Step 7b: Coverage Completeness Check (MANDATORY — no silent drops)

Before writing the manifest, prove every test case is accounted for. Missing test cases are the top cause of "a TC that existed was never automated/executed".

1. Load the full set of TC IDs from `test-cases.json → testCases[].id`.
2. Collect all TC IDs across `artifacts.tests[].testCaseIds`.
3. `covered = generated/modified/reused test artifacts`; `uncovered = testCaseIds NOT in any artifact`.
4. Assert `covered ∪ nonAutomatable == every TC ID`. There must be ZERO unexplained gaps.
5. For any TC that is intentionally not automated, add it to `validation.notAutomatable[]` with a specific reason (e.g., "marked Manual by Tester", "requires manual OTP", "no endpoint in story"). Every TC with `testType: "Manual"` MUST appear here (never automate a Manual TC). A TC may be absent from `tests[]` ONLY if it appears in `notAutomatable[]`.
6. If any TC is neither covered nor listed as non-automatable → generate it now (or, if truly blocked, add to `notAutomatable[]` with the reason). Do not proceed with a gap.

Record the reconciliation in the manifest: `summary.totalTestCases == coveredCount + notAutomatableCount`.

### Step 8: Generate automation-manifest.json

Read [automation-manifest.schema.json](assets/automation-manifest.schema.json) before writing.

Write manifest to `qe-pipeline/output/{KEY}/automation/automation-manifest.json`.

Include:
- `storyKey`, `runId`, `timestamp`, `domain`
- `summary`: counts of generated, modified, reused, totalTestCases (and `totalTestCases == covered + notAutomatable`)
- `artifacts`: categorized by layer (tests, flows, journeys, services, pages, components, fixtures). `journeys[]`/`services[]` present only when the story needs them. Flow/service artifacts carry `capabilities[]` (`{id, name, method, kind}`)
- `validation.localExecution`: ran, passed, failed, status, needsReview entries
- `validation.notAutomatable`: entries `{ testCaseId, reason }` for any TC intentionally not automated (coverage completeness — Step 7b)
- `registryUpdates`: delta per catalog (added, modified, unchanged) — incl. `journeyCatalog`, `serviceCatalog`, `scenarioCatalog` when touched

Validate against `assets/automation-manifest.schema.json`.

### Step 8b: Commit & Push to the App Repo (open PR, do NOT merge)

Version the generated suite in the app's own repo. Use the configured **GitLab MCP** server — never raw credentials in shell. Target = `repo` resolved in Step 0 (`apps[appKey].git`).

> **Tool names are MCP-specific.** The steps below name the git *operation* (create branch, commit files, open merge request), not a fixed tool name. Discover the actual tool names from the currently configured GitLab MCP server and map each operation to the matching tool. Do not assume a specific tool identifier.

Do this ONLY after local validation passed (Step 6) and the registry + manifest are written. Commit the files that were generated/modified this run (from `automation-manifest.json → artifacts[*].file`, plus touched `registry/` catalogs and any new `playwright.config.ts`/`tsconfig.json` for a brand-new app suite).

1. **Branch:** create `feature/{STORY-KEY}` (per `naming-policy.json → gitBranch`) off `repo.defaultBranch` using the MCP's *create-branch* operation. If it already exists (re-run), reuse it.
2. **Commit:** use the MCP's *commit-files* operation to that branch with the generated/modified files. Commit message: `test({domain}): automate {STORY-KEY} — {N} tests, {M} pages/components`. Never commit `.env`, credentials, `node_modules/`, or `test-results/`.
3. **PR/MR:** use the MCP's *create-merge-request* operation from `feature/{STORY-KEY}` → `defaultBranch`, title `[{STORY-KEY}] Automated tests`, **draft/not-merged**. Description: story link, TC count, `needsReview[]` and `notAutomatable[]` summaries. If an open MR for this branch already exists, reuse it (update, don't duplicate).
4. **Record** the branch name + MR URL in the manifest (`git: { branch, mrUrl, commit }`). If any git step fails → retry ONCE, then note the failure in the manifest and continue (do NOT fail the whole run for a push problem; the code is safe locally). Never invent an MR URL.

**Git safety:** never push to `main`/`master`/`develop` directly (always the feature branch); never force-push; never merge; never skip hooks; never commit secrets.

### Step 9: Disable MCPs

Edit `.kiro/settings/mcp.json` and set `disabled: true` for `playwright` and the configured GitLab MCP server, so nothing stays enabled after the skill finishes.

---

## Decision Logic

| Condition | Action |
|---|---|
| TC has `testType: "Manual"` | Do NOT generate automated code for it. Record it in `validation.notAutomatable[]` with reason "marked Manual by Tester" so coverage still reconciles (Step 7b). |
| Existing artifact covers the need | Reuse — do not regenerate |
| Live app unreachable | HALT. Report connectivity error. |
| Import validation fails | Fix generated code. Do not commit violations. |
| Locator found in tests/ or flows/ | Reject file. Move locator to page/component. |
| Selector `count !== 1` (primary or any fallback) | Reject file. Re-inspect DOM. Regenerate with `count === 1` evidence. |
| Unverified fallback (no evidence) in `.or()` chain | Reject — banned guess. Discover a real fallback or drop it. |
| Primary fails, evidence-backed fallback passes | Set `unstable: true` + `needs-review` ("primary failed, passed on fallback"). Never a silent green. |
| Mass selector failure (page changed wholesale) | Re-inspect + regenerate Page Objects with evidence. NOT one-by-one patching, NOT grid autoHeal. |
| Local run: script error | Fix and retry (max 3 rounds). |
| Local run: assertion failure | Mark `needs-review`. Commit code. |
| Registry update fails | Roll back associated file creation. |
| Feature behind auth (unreachable) | Mark affected tests as `needs-review` with reason. |
| TC precondition carries cross-story data context (Item 10) | Satisfy it programmatically before marking non-automatable: if `source: api` → call the setup endpoint in a service/fixture (core ApiClient); if `source: fixture` → reuse the existing fixture; if `source: prior-test` → sequence via a fixture that produces the data. Static/variation inputs go in `data/`. Only if the data genuinely cannot be produced → `notAutomatable[]` with the specific missing data + `howToObtain`. |
| Test cases have variations (region/type/etc.) | Put the variations in `data/{name}.data.ts` and call ONE capability method per variation with different data — never generate a method per variant. |

---

## Anti-Hallucination

> The universal rules in `.kiro/steering/anti-hallucination.md` (placeholder-format standard, confidence tagging, stop signals, evidence-before-generating) ALWAYS apply. The bullets below are this skill's specifics.

- NEVER write a selector — primary OR fallback — without Playwright MCP evidence from the live DOM. The `count === 1` must be MEASURED by actually executing the locator (`browser_evaluate` `.length` / `locator.count()`) and recorded with `verifiedBy` — a count you typed without running the locator is self-reported evidence and is a hard violation. An unverified fallback is a banned guess.
- NEVER place locators in tests/, flows/, journeys/, services/, or data/ — locators belong in pages/ and components/ only (services are API-only; data is pure constants)
- NEVER create one method per data variation — put variations in data/ and pass them as parameters to one capability method
- NEVER duplicate a business capability — search the registry by capability id (domain + verb) and REUSE the existing flow/service method; create a new capability id only when none exists
- NEVER inline a multi-feature path into a spec — compose existing flows in a journey
- NEVER import upward in the layer hierarchy
- NEVER generate per-story isolated scripts — all code goes into the regression suite
- NEVER skip registry discovery — always check for reusable artifacts first
- NEVER guess page structure — navigate to it via Playwright MCP
- NEVER reference legacy per-story output for reuse — use only the registry
