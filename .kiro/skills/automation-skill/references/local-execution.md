# Local Execution Guide

## Purpose

Validate that generated tests actually work against the live app locally, BEFORE the code is committed to the regression suite. This catches selector issues, navigation problems, and timing errors early. Remote execution (HyperExecute) is owned by the execution skill — the automation skill never generates HyperExecute config.

## Prerequisites

Tests import from fixtures only (never a cloud-setup module). The regression-suite `playwright.config.ts` is the source of truth for local runs:
```typescript
import { test, expect } from '@fixtures/{domain}.fixture';
```

## Run Command

Run the spec files just generated/modified for this story by path (story is not a tag). Get the paths from the manifest `artifacts.tests[].file`:

```powershell
cd {suiteDir}   # per-app, e.g. qe-pipeline/output/regression-suite-BREW
npx playwright test {space-separated spec file paths} --project=chromium --reporter=list --workers=1
```

(To validate a whole business domain instead: `--grep "@domain:{tag}"`.)

**Workers=1** — sequential execution for predictable debugging.

## Fix Cycle

Run tests → inspect failures → fix → re-run. Maximum **3 rounds**.

### Round 1: Fix Selector Issues

If test fails with:
- `locator resolved to 0 elements` → selector is wrong
- `strict mode violation` → selector matches multiple elements

Fix procedure:
1. Navigate to the failing page via Playwright MCP (`browser_navigate`)
2. Run discovery script to find the correct selector
3. Update the Page Object with the new selector
4. Re-run the single failing test: `npx playwright test --grep "TC-UI-003"`

### Round 2: Fix Navigation Issues

If test fails with:
- `Timeout exceeded` on `page.goto()` → URL wrong or page doesn't exist
- `waiting for navigation` timeout → click didn't trigger navigation

Fix procedure:
1. Navigate manually in browser to verify the URL exists
2. Check if the navigation requires a prior step (login, clicking a menu first)
3. Update the test precondition/flow
4. Re-run

### Round 3: Fix Timing Issues

If test fails with:
- `expect(locator).toBeVisible()` timeout → element appears late
- `expect(page).toHaveURL()` timeout → redirect is slow

Fix procedure:
1. Add explicit `waitFor()` before the assertion
2. Increase the specific step timeout if needed
3. Re-run

### After 3 Rounds

If the SAME test still fails after 3 fix rounds:
1. Commit the test to the regression suite (do not delete it)
2. Record it in the automation manifest under `validation.localExecution.needsReview[]` with a specific reason and classification
3. Continue with remaining tests

## Interpreting Results

| Result | Meaning | Action |
|---|---|---|
| All pass ✅ | Tests work against live app | Commit to regression suite + update registry. Remote run is handled later by the execution skill. |
| Selector failures | Wrong selectors | Fix in Page Object (Round 1) |
| Navigation timeouts | URL or flow issue | Fix test flow (Round 2) |
| Assertion failures | Expected ≠ actual | **Potential product defect** — KEEP the test as-is |
| Auth/403 errors | Need credentials | Mark as non-automatable or add auth fixture |

**IMPORTANT:** Assertion failures (expected text doesn't match actual) are NOT script errors. They might be real defects. Keep these tests — they'll show up as failures in execution results and feed into the defect skill.

## When to Skip Local Execution

ONLY if:
- App is behind VPN/WAF not accessible from this machine
- App requires hardware token authentication that can't be automated

In these cases, mark affected tests as `needs-review` in the automation manifest with the reason:
```
Local execution skipped: app not accessible from local machine. Selectors unvalidated — the first remote run (execution skill) may surface selector issues.
```
