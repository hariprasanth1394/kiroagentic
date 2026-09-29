---
inclusion: auto
description: Shared rules across skills
---

# QE Shared Rules

## Multi-App Resolution (every skill, before doing anything)

The pipeline supports multiple applications, each fully isolated (Option B). Every story belongs to exactly one app, resolved by its key prefix:

- `appKey = storyKey.split('-')[0]` (e.g. `BREW-101` → `BREW`). A valid story key matches `^[A-Z]+-\d+$` (letters, dash, digits). Non-conforming keys (e.g. the legacy `API-TEST` demo output) are NOT valid v4 story keys — do not run the pipeline against them.
- Look up `pipeline-config.json → apps[appKey]`. No entry → if running the **planner skill**, it will prompt the user for 4 values and write the entry (Step 0b in planner SKILL.md). For all OTHER skills → **HALT**, tell the user to manually add the entry using `pipeline-config.template.json` as the shape. Never guess a repo, suite path, or URL.
- Bind for the whole run: **suiteDir** = `apps[appKey].suiteDir`, **envConfig** = `apps[appKey].envConfig`, **repo** = `apps[appKey].git`, **pkbDir** = `apps[appKey].pkbDir` (the app's isolated Product Knowledge Base, e.g. `qe-pipeline/knowledge/product-BREW`; if the entry has no `pkbDir`, default to `qe-pipeline/knowledge/product-{appKey}`).

Wherever a skill says `regression-suite/` or `env_config.json`, it means the **resolved per-app** `{suiteDir}/` and `{envConfig}`. Suites are isolated: one app's `core/`, `components/`, `pages/`, `services/`, `flows/`, `journeys/`, `registry/`, `project/`, and selectors NEVER mix with another app's. Per-story artifact folders (`qe-pipeline/output/{STORY-KEY}/...`) stay app-agnostic in path. This is the single source of the rule — the orchestrator's Step 0 and each skill defer to it.

## Architecture: Policy-Driven

Behavioural rules live in policy JSON files inside each skill's own `assets/` folder (`.kiro/skills/{skill}/assets/*-policy.json`). Skills are isolated — a skill CANNOT read another skill's folder. Preferred approach: give each skill ONLY the rules it owns (e.g. `naming-policy.json` is split so each skill holds just its own ID/file conventions — no duplication). Where several skills genuinely need identical rules and there is no per-skill slice to split (`jira-policy.json`), the file is duplicated into each consumer's `assets/` and the copies are kept identical. Agents read the policy JSON from their own `assets/` at runtime — do NOT hardcode rules in prompts.

## Policy Files (owned by / duplicated into)

| Policy | Governs | In these skills' `assets/` |
|---|---|---|
| `naming-policy.json` | ID/file naming — **split by owner, NOT shared**: planner=scenario/risk IDs, tester=test-case IDs, automation=layer/registry files + git branch, execution=pipeline run ID | planner, tester, automation, execution (each holds only its own slice) |
| `jira-policy.json` | Labels, linking, resilience — identical content used by 3 skills | tester, defect, retest (duplicated copies — keep in sync) |
| `selector-policy.json` | Element location strategy, banned selectors | automation |
| `playwright-policy.json` | Test generation rules, banned methods | automation |
| `playwright-standard.json` | Layered flat architecture (core, components, pages, services, flows, journeys, fixtures, tests), import constraints, tag format | automation |
| `assertion-policy.json` | Assertion strategy | automation |
| `validation-policy.json` | Contract validation rules (read by the pipeline-checkpoint hook) | automation |
| `hyperexecute-policy.json` | YAML generation, execution config (read by the pre-hyperexecute hook) | execution |
| `retry-policy.json` | Retry behaviour for tests, JIRA, git | execution |
| `quality-gate-policy.json` | Thresholds, pass/fail calculation | reporter |
| `reporting-policy.json` | Report format, knowledge updates | reporter |
| `defect-policy.json` | Failure classification, JIRA actions | defect |

> `naming-policy.json` is split by owner (no duplication). Only `jira-policy.json` is duplicated — when you change it, update all three copies (tester, defect, retest) so they stay identical.

## Core Principles (Non-Negotiable)

1. **Contract-First** — JSON contracts are the inter-agent communication. Markdown is for humans. Never parse markdown if JSON exists.
2. **Evidence-First** — No selector without proof. No risk score without evidence. No result without parsed output.
3. **Traceability** — Full chain: Story → Scenario → Test Case → Script → Result → Defect. Verify at every stage.
4. **Policy over Prompt** — To change behaviour, edit a policy file. Agent prompts should rarely change.
5. **Capability Reuse (app-agnostic)** — Business operations are named capabilities (`{APP}-{DOMAIN}-{VERB}`) with exactly one implementation `{file, method}` in the per-app registry. Before writing a new flow/service method, resolve the operation to a capability id and REUSE it; create a new id only when none exists. Cross-feature paths are composed as **journeys** of existing flows, never inlined/duplicated. The app's `project/domain-map.yaml` is the business view; the registry catalogs are the implementation view; they share capability ids. Nothing here is app-specific — `{APP}`/`{DOMAIN}`/`{VERB}` resolve at runtime.

## MCP Availability Gate (Non-Negotiable)

> **Server names & tool names are configuration, not contract.** The tables/skills below refer to the **GitLab MCP** by the role "GitLab MCP" — the actual server key in `.kiro/settings/mcp.json` and its individual tool names depend on whichever GitLab MCP is configured, and WILL differ between servers. When a skill needs a git operation (create branch, commit files, open/annotate a merge request), resolve it to the matching tool exposed by the currently configured GitLab MCP server — never assume a fixed server key or tool identifier. The custom `gitlab-mcp/index.js` server is not assumed; any compliant GitLab MCP works.

A skill MUST NOT silently proceed when an MCP server it depends on is disabled or unreachable. Fabricating the work the MCP would have done (inventing JIRA keys, DOM selectors, Figma values, execution results) is a hard violation.

Required MCP per skill:

| Skill | Requires MCP | If unavailable |
|---|---|---|
| planner | jira (story fetch), playwright (app inspection), figma (optional) | jira down → HALT. playwright down → continue, mark app "not inspected", set every DOM-derived item `confidence: low`. figma down → skip Figma only. |
| tester | jira (upload/link) | HALT before Step 5 (JIRA upload). Still write `test-cases.json` locally, report "JIRA upload skipped — MCP disabled". |
| automation | playwright (DOM inspection), GitLab MCP (commit/push/PR) | playwright down → HALT generation of pages/components needing new selectors; never guess selectors. gitlab down → still generate + validate + write manifest, SKIP git push (Step 8b), note "git push skipped — GitLab MCP unavailable". Never fabricate a branch/MR URL. |
| execution | none (uses hyperexecute.exe + .env) | n/a |
| reporter | jira (comment), GitLab MCP (annotate the automation MR with the gate result) | jira down → write `quality_gate.json` locally, note "JIRA pending", do NOT fail the gate. gitlab down → skip the MR note, do NOT fail the gate. |
| defect | jira (create/link) | Write `defect-summary.json` with `status: "JIRA pending"`. Do NOT fabricate created keys. |
| retest | jira (transition) | Write `retest-summary.json`, note "JIRA pending". Do NOT claim transitions happened. |

**Enablement (handled inside each skill — no hooks, no scripts):** MCP servers stay disabled unless a skill turns them on. Each skill's **Step 0** enables ONLY the servers it needs by editing `.kiro/settings/mcp.json` (set `disabled: false` for its servers, leave every other server `disabled: true`), and the skill's **final step** disables them again. So a server is enabled only for the duration of a skill that needs it. Which servers each skill enables:

| Skill | Enables |
|---|---|
| planner | jira, playwright (+ figma if the story has a Figma link) |
| tester | jira |
| automation | playwright, GitLab MCP (the configured GitLab server key) |
| execution | none (disables all) |
| reporter | jira, GitLab MCP (the configured GitLab server key) |
| defect | jira |
| retest | jira |

**Detection:** Before the first MCP call, confirm the tool is actually available. If a call fails with a "server disabled / not connected / tool not found" style error, treat the MCP as unavailable and apply the row above — do not retry in a loop and do not simulate the result. Record the unavailability in the skill's output (e.g., `environmentLimitations[]`, summary "JIRA pending").

> Note: toggling `disabled` in `mcp.json` takes effect on the next MCP reconnect. If a just-enabled server is not yet connected on the first call, wait briefly and retry once before treating it as unavailable.

## Skill Reference Loading

Every skill MUST load its own `references/*.md` and `assets/*` at the step where they are needed (as listed in each SKILL.md). A reference file that exists but is never loaded is treated as authoritative anyway — if its guidance conflicts with SKILL.md prose, SKILL.md wins and the reference should be corrected. Do not act on stale reference content that contradicts the current SKILL.md.

## Knowledge Layer

Persistent memory lives in `qe-pipeline/knowledge/`. v4 retains:
- `pipeline-health.json` — per-run durations, pass rates, gate status (appended by the reporter skill)
- `product-{APP}/` — the **per-app Product Knowledge Base (PKB)**: live-app documentation (screens, workflows, business rules, navigation map, product overview) owned and maintained by the `product-knowledge-skill`. **Isolated per app** just like `suiteDir`/`envConfig` — resolved from `pipeline-config.json → apps[appKey].pkbDir` (e.g. `qe-pipeline/knowledge/product-TCOE/`). The Planner reads its own app's `{pkbDir}` as primary business context; other skills treat it as read-only. One app's PKB never mixes with another's.

> Deprecated and removed in v4: `test-catalog.json`, `traceability-index.json`, `flaky-tests.json`, `failure-history.json`, `coverage-history.json`. Do not read or write these.
