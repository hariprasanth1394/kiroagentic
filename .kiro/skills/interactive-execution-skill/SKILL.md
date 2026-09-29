---
name: interactive-execution-skill
description: Progressive-evidence executor for running an existing testcase interactively via Playwright MCP with MINIMUM unnecessary LLM context. Uses the testcase as the execution contract, escalates evidence only when needed (L0 direct -> L1 targeted -> L2 scoped -> L3 full -> L4 failure investigation), reuses verified evidence, and preserves full correctness + failure diagnosis. Does NOT replace HyperExecute deterministic execution.
---

# Interactive Execution Skill (Progressive Evidence)

Run an already-created testcase against the live app through Playwright MCP while consuming the **least** LLM context. The testcase is the execution contract; PLB is failure/evidence support, not a per-step dependency.

> This governs the **interactive** Kiro+MCP path (the one that produced the ~98K-token run). It does NOT touch HyperExecute deterministic execution, the tester/automation authoring skills, PLB content, or the Product Acquiring skill.

## Inputs

| What | Where |
|---|---|
| Test cases (contract) | `qe-pipeline/output/{KEY}/tester/test-cases.json` |
| MCP evidence policy | `assets/mcp-evidence-policy.json` **(read before any browser_* call)** |
| Telemetry policy | `assets/telemetry-policy.json` |
| PLB (failure support only) | resolved `{pkbDir}` — read ONLY a relevant slice, ONLY on failure/ambiguity |
| Env config | per-app `{envConfig}` (appUrl/BASE_URL) |

## Outputs

| File | Path |
|---|---|
| Interactive telemetry | `qe-pipeline/output/{KEY}/execution/interactive-telemetry.json` |
| Interactive result | `qe-pipeline/output/{KEY}/execution/interactive-execution-result.json` |

## Step 0: Enable MCP

Enable `playwright` in `.kiro/settings/mcp.json` (and `jira` only if the run must read/write JIRA). Leave others disabled. Disable again in the final step. The MCP Enablement Guard (deterministic command hook) will still check enablement cheaply per call.

## Step 1: Load the contract + policy

1. Read `test-cases.json`; select the target test case(s). Treat `preconditions`, `steps[]`, `expectedResults[]` as immutable — never edit, skip, or weaken them.
2. Read `assets/mcp-evidence-policy.json`. Initialize the compact execution context (`compactExecutionContext` shape). Initialize telemetry counters from `assets/telemetry-policy.json`.

## Step 2: Execute each step at the lowest sufficient evidence level

For every step, apply the policy's `callClassification`. Choose the **lowest-cost sufficient** category:

- **L0 DIRECT_EXECUTION (default):** If the testcase + known/cached evidence let you act, do the action directly (`browser_navigate/click/type/select`). Do **not** snapshot to reconfirm a known control.
- **L1 TARGETED_DISCOVERY:** If a known interaction can't execute or you need one fact, run a **compact** `browser_evaluate` returning only `{tag, role, name, id, testId, visible, enabled, relevantText}` for the specific element/region. Never dump the full DOM.
- **L2 SCOPED_DISCOVERY:** If L1 is insufficient, `browser_snapshot` a **scoped subtree** (via `target`/ref or `depth`) — not the whole tree.
- **L3 FULL_DISCOVERY:** Only when structure is genuinely unknown or L1–L2 failed. Full `browser_snapshot`. Exceptional.

**After-action rule:** After an action, do NOT capture new structural evidence unless the next decision needs structure you don't already have. To validate an expected result, assert the specific outcome with the narrowest check (URL contains / specific text / specific element state), not a fresh full snapshot.

**Evidence reuse:** Before discovering, check `evidenceCache` (policy). If a valid record exists (same app/env/page, hash valid, no contradiction), reuse it by `evidenceHash` — no MCP call. Invalidate + rediscover on any contradiction. Never use stale evidence blindly.

## Step 3: Assertions (never weakened)

Execute every `expectedResults[]` check. An assertion failure is a **product defect signal** — record it verbatim, never self-heal it. Prefer the narrowest evidence that proves/refutes the expected outcome.

## Step 4: On failure — L4 FAILURE_INVESTIGATION

Follow the policy `FAILURE_INVESTIGATION.sequence`:
1. Capture compact failure state (stepId, page, action, expected vs observed one-liners, error text verbatim).
2. Retrieve ONLY the relevant PLB slice (this page/component) — never the whole PKB.
3. Compare recorded expected behavior vs current evidence.
4. Smallest useful MCP investigation (start L1).
5. Escalate to L2 then L3 only if inconclusive.
6. Classify using `failureClasses`.
7. Preserve COMPLETE evidence for reporting.

Selector failures route to Automation for evidence-based regeneration (as today) — do not blind-heal here.

## Step 5: Write telemetry + result

Write `interactive-telemetry.json` per `telemetry-policy.json` (all token figures labelled `proxy` unless real provider counts exist). Write `interactive-execution-result.json` with per-step status, assertions executed, and any failure classification + evidence. Full accounting: every step and expected result is represented.

## Step 6: Disable MCP

Set `playwright` (and `jira` if enabled) back to `disabled: true`.

## Decision Logic

| Condition | Level | Action |
|---|---|---|
| Testcase + known/cached evidence sufficient | L0 | Execute directly, no snapshot |
| Element missing/disabled/ambiguous, or one fact needed | L1 | Compact `browser_evaluate` projection |
| Region structure needed | L2 | Scoped snapshot only |
| Page genuinely unknown / L1–L2 failed | L3 | Full snapshot (exceptional) |
| Any failure / unexpected state | L4 | Compact failure -> PLB slice -> compare -> targeted MCP -> escalate if needed -> classify -> preserve evidence |
| Cached evidence contradicted at use | — | Invalidate, rediscover from L1 |

## Anti-Hallucination

> Universal rules in `.kiro/steering/anti-hallucination.md` ALWAYS apply.

- NEVER weaken/skip a step, precondition, or assertion to reduce tokens.
- NEVER capture a full snapshot to reconfirm known information.
- NEVER inject whole PLB during passing steps.
- NEVER reuse cached evidence after a contradiction.
- NEVER fabricate provider token counts — record byte/count proxies, labelled `proxy`.
- NEVER hide a failure or self-heal an assertion.
