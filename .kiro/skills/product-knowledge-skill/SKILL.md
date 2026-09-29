---
name: product-knowledge-skill
description: Discover and maintain the Product Knowledge Base (PKB) for an application from the live app. Use when user says "Run Product Knowledge", "Discover product knowledge", "document this app", "build the PKB", or "capture pages and workflows for {APP}".
---

# Product Knowledge Skill

Discover, document, and maintain the **Product Knowledge Base (PKB)** for an application by inspecting the live Playwright browser. This is the **FIRST agent in the documentation pipeline** — its output is the primary business context the Planner reads before it analyses any JIRA story.

You **only** document what is directly observable in the live browser. You NEVER generate test cases, generate automation scripts, modify JIRA, or assume undocumented behaviour.

## Inputs (read ONLY these)

| What | Where |
|---|---|
| Live application | Playwright MCP: `browser_navigate`, `browser_snapshot`, `browser_evaluate`, `browser_take_screenshot` |
| Current browser URL / title | Playwright MCP snapshot |
| User navigation performed during this run | The transitions you observe while the user (or you) click through the app |
| Existing Product Knowledge Base | resolved per-app `{pkbDir}/**` (for merge) |
| Env config (app URL) | resolved per-app `{envConfig}` from `pipeline-config.json → apps[appKey].envConfig` |
| Policy | `assets/product-knowledge-policy.json` (read at runtime — do not hardcode rules) |

**Forbidden inputs:** JIRA stories, backend/source-code internals, assumed or undocumented behaviour.

> `{pkbDir}` is the app's **isolated** Product Knowledge Base directory, resolved from `pipeline-config.json → apps[appKey].pkbDir` (e.g. `qe-pipeline/knowledge/product-TCOE`). It mirrors the isolation of `suiteDir`/`envConfig` — one app's PKB never mixes with another's. See Step 0b.

## Outputs (write ONLY these)

| File | Path |
|---|---|
| Product overview | `{pkbDir}/product-overview.md` (only when required) |
| Screen doc | `{pkbDir}/screens/{page}.md` |
| Workflow doc | `{pkbDir}/workflows/{workflow}.md` |
| Business rules | `{pkbDir}/business-rules.md` |
| Navigation map | `{pkbDir}/navigation-map.md` |

**No JIRA writes. No test cases. No automation code.** The PKB is markdown for humans and business context for the Planner. Never create documentation outside the resolved `{pkbDir}`.

> `{page}` and `{workflow}` file names are kebab-case (see `assets/product-knowledge-policy.json → naming`). Screen files derive from the route or page name (e.g. `wizard-test-location.md`); workflow files describe the end-to-end flow (e.g. `offline-booking-flow.md`).

---

## Procedure

### Step 0: Enable Required MCP

Edit `.kiro/settings/mcp.json` (use file tools — read it, change the flags, write it back): set `disabled: false` for `playwright` only. Leave every other server `disabled: true`. This skill never needs `jira`, `figma`, or the GitLab MCP.

After enabling, confirm `playwright` is connected per the MCP Availability Gate in `qe-shared-rules`. If it cannot be enabled or the browser is unreachable, apply the gate: **HALT and report the dependency** — never fabricate DOM, URLs, or navigation.

> Disable `playwright` again in the final step (Step 10).

### Step 0b: Resolve the App and PKB Directory (multi-app)

Follow **Multi-App Resolution** in `qe-shared-rules`. Resolve the app first, then bind its isolated PKB directory:

1. Determine `appKey`. If the user named an app key or a story key, use its prefix (`storyKey.split('-')[0]`). Otherwise ask the user which app this discovery is for — never assume.
2. Look up `pipeline-config.json → apps[appKey]`. If **no entry exists** → HALT and ask the user to register the app (per `pipeline-config.template.json`); never guess a repo, URL, or PKB path.
3. Bind for the whole run:
   - **{pkbDir}** = `apps[appKey].pkbDir` (e.g. `qe-pipeline/knowledge/product-TCOE`). If the entry predates this field and has no `pkbDir`, default it to `qe-pipeline/knowledge/product-{appKey}` and write that value back into the app entry so it is explicit going forward.
   - **{envConfig}** = `apps[appKey].envConfig`; read `{envConfig} → appUrl` as the starting URL.
4. If `{pkbDir}` does not exist yet, create it in Step 8 when first writing — this is a brand-new PKB for the app.

If no app URL is configured, ask the user which URL to open, or use the browser's current page. Everything this skill writes goes under the resolved `{pkbDir}` — never the bare `qe-pipeline/knowledge/product/`.

### Step 1: Load Existing Product Knowledge

Read the existing PKB under the resolved `{pkbDir}/` (overview, screens, workflows, business-rules, navigation-map). Build an understanding of what is already documented. If `{pkbDir}` does not exist yet, treat this as a fresh PKB for the app. **Never modify anything in this step** — this is read-only context so you can merge, not overwrite, later.

### Step 2: Inspect the Current Browser

Read [app-discovery.md](references/app-discovery.md) before inspecting.

Snapshot the active Playwright browser and identify:
- Current page, URL, page title
- Visible controls / main components
- Current navigation state
- Visible validations
- Observable behaviour

If the browser is unavailable → STOP and report the dependency. If the current page cannot be identified → STOP and request the user navigate to a known page.

### Step 3: Discover the Current Screen

Determine whether the current screen already exists in the PKB (match by route/page name).

- **Exists** → merge new information into the existing screen doc.
- **Does not exist** → create a new screen doc.

Every screen doc MUST contain the sections listed in `assets/product-knowledge-policy.json → requiredSections.screen` (Purpose, Page Details, Entry/Exit Conditions, Main Components, User Actions, Business Rules, Dependencies, Navigation, Validation Rules, Known Limitations, Regression Impact, Confidence). Follow the shape of the existing screen docs already in `screens/` so new pages match.

### Step 4: Discover the Workflow

Identify whether the current screen belongs to an existing workflow.

- **Belongs to an existing workflow** → update that workflow doc.
- **New workflow** → create a new workflow doc.

Every workflow doc MUST contain the sections in `product-knowledge-policy.json → requiredSections.workflow` (Purpose, Start Page, End Page, Navigation Flow, Business Rules, Dependencies, Failure Points, Regression Impact).

### Step 5: Discover Business Rules

Document ONLY directly observable rules — mandatory selections, conditional visibility, enabled/disabled controls, navigation conditions, validation behaviour, state changes. **Do not infer backend logic, API contracts, DB tables, or status codes.** Append to `{pkbDir}/business-rules.md`, never duplicate an already-documented rule.

### Step 6: Update Navigation

Record newly discovered navigation paths in `{pkbDir}/navigation-map.md`. Do not duplicate existing paths. Mark inferred routes explicitly (e.g. "Unknown (inferred from URL pattern)"). Update the "Last Updated" stamp when routes change.

### Step 7: Merge Documentation

Before writing ANY file: read the existing document, compare with newly discovered information, append only what's new, remove duplicate entries, and never overwrite manually maintained content. Never regenerate the complete PKB.

### Step 8: Persist Changes

Create the resolved `{pkbDir}` (and its `screens/` and `workflows/` subfolders) if missing; update only modified files. Persist directly into `{pkbDir}/` — never the bare `qe-pipeline/knowledge/product/`.

### Step 9: Validate

Confirm before completing:
- [ ] Current page documented with all required screen sections
- [ ] Workflow created/updated
- [ ] Navigation map updated (with Last Updated stamp)
- [ ] Business rules updated, no duplicates
- [ ] Every screen and workflow doc ends with a **Confidence** section
- [ ] Inferred content tagged (e.g. "inferred from URL pattern")
- [ ] All writes went to the resolved per-app `{pkbDir}` — nothing written to the bare `qe-pipeline/knowledge/product/` or another app's PKB
- [ ] Output follows `product-knowledge-policy.json`

### Step 10: Disable MCP

Edit `.kiro/settings/mcp.json` and set `disabled: true` for `playwright` so nothing stays enabled after the skill finishes.

### Step 11: Summary

Return ONLY (per `product-knowledge-policy.json → summaryFormat`):
- Pages Analysed
- Files Created
- Files Updated
- Workflow Updated
- Business Rules Added
- Navigation Changes
- Warnings
- Confidence

Do not print the complete documentation in chat unless the user requests it.

---

## Decision Logic

| Condition | Action |
|---|---|
| Screen already exists | Merge new information |
| Screen does not exist | Create new screen doc |
| Workflow exists | Update workflow |
| Workflow does not exist | Create workflow |
| Business rule already documented | Do not duplicate |
| Navigation path already exists | Ignore duplicate |
| App not registered in pipeline-config.json | HALT and ask the user to register it — never guess repo/URL/PKB path |
| App entry has no `pkbDir` field | Default to `qe-pipeline/knowledge/product-{appKey}` and write it back into the entry |
| Playwright MCP / browser unavailable | HALT and report dependency — never fabricate |
| Current page cannot be identified | STOP and request user navigation |
| Information cannot be verified | Mark as **Unknown** — never guess |

## Anti-Hallucination

> The universal rules in `.kiro/steering/anti-hallucination.md` (evidence-before-generating, placeholder-format standard, confidence tagging, stop signals) ALWAYS apply. The bullets below are this skill's specifics.

- NEVER document a component not present in the DOM snapshot or screenshot.
- NEVER record a URL without confirming it via the browser address bar.
- NEVER record a navigation path without observing the transition.
- NEVER infer backend logic, API endpoints, HTTP methods/status codes, or DB tables.
- Every screen and workflow doc ends with a **Confidence** section (High / Medium / Low / Unknown); tag inferred content explicitly.
- If a behaviour cannot be verified → mark it **Unknown**, do not invent it.
