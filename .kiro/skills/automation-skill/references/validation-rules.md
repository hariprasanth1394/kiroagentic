# Validation Rules

Concise reference for the checks the Automation skill runs on every generated file **before committing**. The machine-readable source of truth is the policy JSON in `assets/` — this file explains *what* each check does and *in what order*. Where they differ, `playwright-standard.json` / `selector-policy.json` / `validation-policy.json` win.

## Validation Order (a file passes only when ALL apply)

```
1. Import layering    → wrong-layer import        → reject
2. Locator isolation  → locator in tests/flows     → reject
3. Selector evidence  → missing evidence / count≠1 → reject, re-inspect DOM
4. Tag completeness    → missing @domain / @suite:*  → reject
```

---

## 1. Import Layering

Layer levels (low→high): `core(0) → data(1) / components(1) → pages(2) / services(2) → flows(3) → journeys(4) → fixtures(5) → tests(6)`. **A layer may import only from lower layers** (peers pages↔services and data↔components never import each other), per this exact allow-list (authoritative copy in `playwright-standard.json`):

| Layer | May import from |
|-------|-----------------|
| core | (nothing in-suite) |
| data | core |
| components | core |
| pages | components, core |
| services | data, core |
| flows | pages, services, data, core |
| journeys | flows, data, core |
| fixtures | flows, journeys, data, core |
| tests | fixtures only |

**How:** parse each `import ... from '<path>'`; resolve `<path>` to a layer by prefix (`@core/`/`../core/`/`../../core/` → core, etc.; external packages like `@playwright/test` → skip). If the target layer is not in the source layer's allow-list → **reject the file** (never commit). Prefer the `@`-aliases in imports; the resolver also accepts relative `../` forms.

## 2. Locator Isolation

Locators belong ONLY in `pages/` and `components/`. **Reject** any `tests/`, `flows/`, `journeys/`, or `services/` file containing a locator: `page.getByTestId(`, `page.getByRole(`, `page.getByLabel(`, `page.getByText(`, `page.getByPlaceholder(`, `page.locator(`, `[data-testid=`, `[aria-label=`, or a bare CSS `#id` selector. Services are API-only; journeys orchestrate flows; flows call pages/services — none own locators. Fixtures/pages/components/core are not subject to this check (pages/components legitimately own locators; fixtures/core don't carry UI locators by construction). (Banned-pattern list also lives in `playwright-standard.json` and `validation-policy.json`.)

## 3. Selector Evidence & Uniqueness (what makes selectors "solid")

Every locator in a Page Object or Component — **the primary AND every `.or()` fallback** — must be discovered from the live DOM and resolve to exactly ONE element. Checked against the manifest `LocatorEntry` evidence (see `automation-manifest.schema.json` + `selector-policy.json → evidenceForEveryLink`).

| Rule | Requirement |
|------|-------------|
| Evidence present | Each selector (primary + each fallback) has `evidence` with a valid `source` (`playwright-mcp` / `browser-devtools` / `page-snapshot`), a `verifiedBy`, and `discoveredAt`. |
| **Measured, not assumed** | `evidence.count` MUST be the integer the tool RETURNED when the locator was actually executed against the live DOM (`browser_evaluate` `.length` or `locator.count()`), recorded in `evidence.verifiedBy`. A count written without running the locator is self-reported and is rejected. |
| Uniqueness | measured `evidence.count === 1` for every selector. `0` = not found (invented/stale); `>1` = ambiguous (would need `.first()`, banned). |
| No unverified fallbacks | A selector in an `.or()` chain without its own measured `count === 1` evidence (and a real `verifiedBy`) is rejected — "from memory" / "common pattern" fallbacks are banned. |

**On failure:**
- Any locator failing → **reject the file**, re-inspect the live DOM with Playwright MCP, regenerate with fresh `count === 1` evidence. Never commit a selector without proof.
- Primary fails but a fallback resolves during local run → mark the `LocatorEntry` `unstable: true` and add a `needsReview` note ("primary failed; passed on fallback — re-inspect"). A fallback-carried pass is a yellow, never a clean green (`selector-policy.json → instabilitySurfacing`).
- Mass selector failure (large fraction of `locator resolved to 0 elements`) → full re-inspection + Page Object regeneration; NOT one-by-one patching, NOT grid autoHeal (`selector-policy.json → massSelectorFailureRecovery`).

## 4. Tag Completeness

Every `test.describe` title MUST contain `@domain:{value}` and at least one of `@suite:smoke` / `@suite:regression`. A test in both suites carries both: `@suite:smoke @suite:regression`. **Story keys are NOT tags** — they live in the registry `stories[]` arrays (many-to-many). Do not require or emit an `@story` tag. Missing `@domain` or missing all `@suite:*` tags → reject.

---

## Fix-and-Retry (local execution)

After import/isolation/evidence/tag checks pass, run the spec locally. Classify each failure and act:

| Failure type | Signal (examples) | Action |
|---|---|---|
| **Script error** | `SyntaxError`, `Cannot find module`, `is not defined`, `TypeError ... is not a function`, `locator resolved to 0 elements`, `has no exported member`, `ENOENT` | Auto-fix → re-run. **Max 3 attempts.** After 3 → `needs-review`, commit with flag. |
| **Product defect** | assertion failures: `expect(...).toBe/toEqual/toHaveText/...`, `AssertionError`, `Expected ... but received` | Do NOT fix. Mark `needs-review`, keep + commit the test, record in manifest. |

**Ambiguity rule:** check script-error signals first; if neither matches, default to `script-error` (give the fix loop a chance); if both match (e.g. a `TypeError` inside an assertion), treat as `script-error` (fixable takes priority). Selector-specific handling is in §3 above and `selector-policy.json`.

State flow: `generating → validate(imports→isolation→evidence→tags) → executing-local → [all pass ⇒ commit] | [script-error ⇒ fix→retry ≤3] | [product-defect or 3 exhausted ⇒ needs-review + commit-with-flag]`.

## Manifest Reporting

Record classified failures under `validation.localExecution.needsReview[]` (each: `testCaseId`, `file`, `reason`, `classification`) and any intentionally non-automated TCs under `validation.notAutomatable[]`. Schema: `assets/automation-manifest.schema.json`.
