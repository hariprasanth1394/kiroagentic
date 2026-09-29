# Code Generation Rules

> **Templates are the source of truth for TypeScript structure.**
> The `assets/` directory has one template per layer:
> `page-template.ts`, `component-template.ts`, `data-template.ts`,
> `service-template.ts`, `flow-template.ts`, `journey-template.ts`,
> `fixture-template.ts`, `test-template.ts`.
> This file contains only the **rules and constraints** that govern generation —
> not TypeScript examples (those live in the templates).

---

## Import Pattern

- Tests import `{ test, expect }` from their domain fixture — never from `@playwright/test` directly
- Use `@`-path aliases (`@tests/`, `@fixtures/`, `@journeys/`, `@flows/`, `@services/`, `@pages/`, `@components/`, `@core/`) for ALL cross-layer imports — never relative `../` paths
- Layer allow-list (authoritative copy in `playwright-standard.json`):

| Layer | May import from |
|---|---|
| tests | fixtures only |
| fixtures | flows, journeys, data, core |
| journeys | flows, data, core |
| flows | pages, services, data, core |
| services | data, core |
| data | core only |
| pages | components, core |
| components | core only |

---

## Per-Layer Generation Rules

### Page Objects (`pages/`)
- One class per distinct page URL
- Locators are `private readonly` properties initialised in the constructor — use `.or()` to chain primary + first fallback
- Third fallback is an evidence-tagged comment only — never in an `.or()` chain without evidence
- `waitForReady()` is mandatory — waits for a key element to be visible before any interaction
- No test logic, no assertions inside a Page Object
- Read `assets/page-template.ts` for the exact class structure

### Components (`components/`)
- One class per UI widget (date picker, nav bar, data table, modal, etc.)
- Owns widget-scoped locators — all scoped to a `rootSelector` so the widget works wherever it appears
- Exposes only interaction methods; no business logic
- Read `assets/component-template.ts` for the exact class structure

### Data (`data/`)
- Exports typed constants and variation maps ONLY — no functions, no logic, no locators, no API calls
- Variations are keyed entries in a `Record<string, T>` — a caller passes the entry in; the capability method stays singular
- Never create one method or one file per variation
- Read `assets/data-template.ts` for the exact shape

### Services (`services/`)
- One class per API area (the API counterpart of a Page Object)
- Built entirely on `core/ApiClient` — no UI imports, no locators
- API paths come from the story/contract only — never invented; use `{API_ENDPOINT}` placeholder when not specified
- Return business-level results; let flows or tests assert
- Register every public business operation as a capability id in `service-catalog.json`
- Read `assets/service-template.ts` for the exact class structure

### Flows (`flows/`)
- One class per single-domain business capability
- Single public `execute()` method — takes business-level params, returns a business-level result
- May call a Page (UI), a Service (API), or both (hybrid) — never contains locators
- Hybrid pattern: seed via service → act/verify via page → re-check via service
- Read `assets/flow-template.ts` for the exact class structure

### Journeys (`journeys/`)
- One class per cross-feature path spanning multiple domains
- Single public `execute()` method — composes existing flow `execute()` calls in dependency order
- No pages, no services, no locators — orchestrates flows only
- Read `assets/journey-template.ts` for the exact class structure

### Fixtures (`fixtures/`)
- Extends Playwright's `base.extend<T>()` — injects flows, journeys, auth, data factories into tests
- Handles setup/teardown lifecycle
- Read `assets/fixture-template.ts` for the exact shape

### Tests (`tests/`)
- Declarative only — call flow/journey methods via fixture injection, assert on business outcomes
- Every `test.describe` block title must contain `@domain:{value}` and at least one `@suite:smoke` / `@suite:regression`
- Story key is a `// story: KEY` header comment only — never a tag
- `test.step()` for grouping; minimum 1 meaningful assertion per test
- No locators, no page object imports, no raw `page.*` calls
- Read `assets/test-template.ts` for the exact shape

---

## Banned Patterns

| Pattern | Why | Use instead |
|---|---|---|
| `waitForTimeout(N)` | Arbitrary wait | `element.waitFor({ state: 'visible' })` |
| `setTimeout` | Same | Locator auto-wait |
| `page.evaluate()` in tests | Bypasses real interaction | Locator methods |
| `.first()` | Fragile positional | Narrow the selector |
| `page.$` / `page.$$` | Legacy API | `page.locator()` |
| `force: true` on clicks | Hides interaction issues | Fix the selector/state |
| `{ timeout: 0 }` | Disables safety net | Use a reasonable timeout |
| Hardcoded API paths | Invented endpoints | Story/contract path or `{API_ENDPOINT}` |
| Per-variant methods | Duplicated capability | One method + `data/` entry |
| `@story:KEY` as a Playwright tag | Tag is unenforceable + pollutes grep | `// story: KEY` comment + registry `stories[]` |

---

## Wait Strategy

- Locators auto-wait — no manual waits for most cases
- After `goto()` → `waitForLoadState('domcontentloaded')`
- After an action that triggers navigation → `page.waitForURL(/pattern/)`
- After an action that loads async content → `element.waitFor({ state: 'visible' })`

---

## Assertion Patterns

Prefer built-in web-first assertions (they auto-retry until timeout):

```
toBeVisible() / toBeHidden()
toHaveText('exact') / toContainText('partial')
toHaveURL(/pattern/)
toHaveValue('expected')
toBeEnabled() / toBeDisabled()
toHaveCount(N)
```

---

## package.json / tsconfig.json

The per-app suite already has these files (auto-created when the suite is scaffolded for a new app). The automation skill does NOT create new `package.json` or `tsconfig.json` files per story.

Key constraints:
- Dependencies in `dependencies`, not `devDependencies` (so `npm install` works on both local + HyperExecute)
- `@playwright/test`, `typescript`, `allure-playwright`, `allure-js-commons` are the core deps
- `tsconfig.json` defines the `@`-path aliases (`@tests/`, `@fixtures/`, etc.) — do not add new aliases without updating `tsconfig.json`
