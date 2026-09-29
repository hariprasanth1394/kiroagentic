# Layer Contracts

Reference document defining the six-layer architecture, dependency hierarchy, import rules, naming conventions, and ownership constraints for the regression suite.

---

> **App-agnostic:** these layers describe HOW any application's suite is structured. Every app resolves its own isolated `{suiteDir}` (see qe-shared-rules → Multi-App Resolution); no layer or example here is specific to any one application.

## Layers

| Level | Layer | Directory | Purpose |
|-------|-------|-----------|---------|
| 0 | **Core** | `core/` | Foundation utilities shared across all layers: base page, API client, auth handler, constants |
| 1 | **Data** | `data/` | Test data + variations as typed constants (e.g. datasets keyed by variant). No logic, no locators, no API calls |
| 1 | **Components** | `components/` | Reusable UI widget abstractions that own widget-scoped locators |
| 2 | **Pages** | `pages/` | Page assembly objects that own page-scoped locators and compose components (UI implementation) |
| 2 | **Services** | `services/` | API implementation objects built on the core `ApiClient` — own HTTP request/response for business operations. Peer of Pages (UI vs API). NO locators |
| 3 | **Flows** | `flows/` | Single-domain business capabilities. Compose pages (UI) and/or services (API) — the **hybrid** mechanism. Contain NO locators |
| 4 | **Journeys** | `journeys/` | Cross-feature integration orchestration — compose MULTIPLE flows into one end-to-end scenario spanning domain/system boundaries. NO pages/services/locators |
| 5 | **Fixtures** | `fixtures/` | Playwright fixture definitions that inject flows, journeys, auth, API clients, and data factories |
| 6 | **Tests** | `tests/` | Declarative test files that call flows/journeys via fixtures; tagged with domain and suite (smoke/regression) |

**Pages vs Services (level 2 peers):** a page is the UI implementation of a feature; a service is the API implementation of the same or a related feature. A flow may use one or both.

---

### Flow vs Journey — Definitive Distinction

| | Flow | Journey |
|---|---|---|
| **Scope** | One domain / one feature | Multiple domains / multiple features |
| **Composes** | Pages (UI) and/or Services (API) | Flows only — never pages or services directly |
| **Locators** | None — calls page/service methods | None — calls flow methods |
| **Typical name** | `place-order.flow.ts`, `login.flow.ts` | `guest-checkout-to-order-confirm.journey.ts` |
| **When to use** | Any test that exercises one feature end-to-end | Any test that crosses from feature A into feature B |
| **Analogy** | Unit of one feature's business logic | Integration of multiple features' business logic |

**Example — flow:**
```
place-order.flow.ts
  execute(orderData):
    → cartPage.addItem(orderData.item)       // UI page
    → checkoutPage.fillPayment(orderData)     // UI page
    → orderService.verifyOrderCreated(id)     // API service
```

**Example — journey (composes flows):**
```
signup-to-first-order.journey.ts
  execute(userData, orderData):
    → loginFlow.execute(userData)             // flow 1 — auth domain
    → profileFlow.execute(userData.profile)   // flow 2 — user domain
    → placeOrderFlow.execute(orderData)       // flow 3 — checkout domain
```

**Is a Journey the same as integration testing?**

Yes — a journey IS integration testing in this framework. It validates that multiple features work correctly **together end-to-end**, which is exactly what integration testing means:

- A single flow tests one feature in isolation (closer to component/unit test in scope)
- A journey tests the handoff between features — the **seams** between systems (e.g. does a successfully registered user actually land in the right state to place an order?)
- If your app integrates with external systems (payment gateway, email service, CRM), a journey that crosses into those systems is integration testing of different applications

In practice: any test that would need to say "first do X in System A, then verify Y in System B" → that is a journey, and it is integration testing. The journey layer is where you write cross-feature and cross-system assertions without duplicating the individual feature logic already in flows.

**Data layer (variations):** test data and its variations live in `data/` as typed constants and are passed **into** flow/service methods as parameters. This is how the framework avoids per-variant methods (no `createVariantA()`/`createVariantB()`): one capability method + many data entries. Adding a variation = add a data entry, not a new method. `data/` may be imported by services, flows, journeys, and fixtures; it imports only `core/` (shared types/constants).

---

## Dependency Hierarchy

```typescript
const LAYER_HIERARCHY: Record<string, number> = {
  core: 0,
  data: 1,       // peer of components (pure test data)
  components: 1,
  pages: 2,
  services: 2,   // peer of pages (API vs UI)
  flows: 3,
  journeys: 4,
  fixtures: 5,
  tests: 6,
};
```

**Rule:** A layer may only import from layers with a LOWER numeric level (peers at the same level do NOT import each other — a page never imports a service and vice versa; they meet only inside a flow). No upward imports allowed.

---

## Allowed Imports

```typescript
const ALLOWED_IMPORTS: Record<string, string[]> = {
  core: [],                                    // No suite imports at all
  data: ['core'],                              // Core only (shared types/constants); pure data
  components: ['core'],                        // Core only
  pages: ['components', 'core'],               // Components + Core
  services: ['data', 'core'],                  // Data + Core (ApiClient) — NO pages/components
  flows: ['pages', 'services', 'data', 'core'],// Pages (UI) + Services (API) + Data + Core — the hybrid layer
  journeys: ['flows', 'data', 'core'],         // Flows + Data + Core (NO pages/services/components)
  fixtures: ['flows', 'journeys', 'data', 'core'], // Flows + Journeys + Data + Core
  tests: ['fixtures'],                         // Fixtures ONLY (nothing else)
};
```

### Import Resolution

Imports are resolved by matching path prefixes:

| Prefix Pattern | Resolves To |
|---|---|
| `@tests/` or `../tests/` | tests |
| `@fixtures/` or `../fixtures/` | fixtures |
| `@journeys/` or `../journeys/` | journeys |
| `@flows/` or `../flows/` | flows |
| `@services/` or `../services/` | services |
| `@data/` or `../data/` | data |
| `@pages/` or `../pages/` | pages |
| `@components/` or `../components/` | components |
| `@core/` or `../core/` | core |

External package imports (from `node_modules`) are not subject to layer rules.

---

## File Naming Conventions

| Layer | Pattern | Example |
|-------|---------|---------|
| Core | `{module-name}.ts` | `base-page.ts`, `api-client.ts`, `auth-handler.ts`, `constants.ts` |
| Data | `{name}.data.ts` (flat) | `order.data.ts`, `users.data.ts` |
| Components | `{widget-name}.component.ts` | `date-picker.component.ts`, `nav-bar.component.ts` |
| Pages | `{page-name}.page.ts` | `checkout-page.page.ts`, `login-page.page.ts` |
| Services | `{name}.service.ts` (flat) | `order.service.ts`, `user.service.ts` |
| Flows | `{journey}.flow.ts` (flat) | `place-order.flow.ts`, `login.flow.ts` |
| Journeys | `{journey-name}.journey.ts` (flat) | `signup-to-first-order.journey.ts` |
| Fixtures | `{domain}.fixture.ts` | `checkout.fixture.ts`, `auth.fixture.ts` |
| Tests | `{feature}.spec.ts` (flat) | `place-order.spec.ts`, `login-flow.spec.ts` |

---

## Layer Ownership

### Core Layer Owns
- `BasePage` class — common navigation (`navigate`, `waitForReady`, `getTitle`)
- `ApiClient` class — HTTP methods (`get`, `post`, `put`, `delete`)
- `AuthHandler` class — session management (`login`, `logout`, `getStorageState`, `isAuthenticated`)
- `constants` module — `BASE_URL`, `API_BASE`, `TIMEOUTS`, `CREDENTIALS`

### Data Layer Owns
- **Test data + variations** as typed, exported constants (e.g. a dataset object keyed by variant such as region/type)
- Reusable inputs consumed by services/flows/journeys as parameters
- NO logic, NO locators, NO API calls, NO assertions — pure data. Imports `core/` types/constants only

### Component Layer Owns
- **Widget-scoped locators** — each component encapsulates its own selectors
- Widget interaction methods exposed to the Page layer
- No business logic; only UI widget abstraction

### Page Layer Owns
- **Page-scoped locators** — each page object owns its selectors with evidence
- Component composition — pages assemble components into page interactions
- Navigation methods for the specific page

### Service Layer Owns
- **API operations** for a business area, built on the core `ApiClient` (e.g. `create()`, `get()`, `update()`, `delete()`, plus response-shape/value validators)
- Request building, auth headers, response parsing — the API counterpart of a Page
- NO locators, NO UI. A service is pure API implementation

### Flow Layer Owns
- Single-domain business capability orchestration — a sequence of page (UI) and/or service (API) calls
- Single `execute()` method per flow class accepting business-level parameters
- **Hybrid** scenarios: a flow may create data via a service (API), act/verify via a page (UI), then check backend state via a service again. The flow decides UI vs API; callers just invoke the capability
- NO locators — flows express what happens, not how the UI is accessed

### Journey Layer Owns
- **Cross-feature (integration) orchestration** — composes MULTIPLE flows into one end-to-end business scenario that spans domain boundaries
- Single `execute()` method per journey class accepting business-level parameters
- Reusable across tests with different data (the anti-duplication mechanism for multi-feature paths)
- NO pages/services/locators — a journey calls flows only; it never reaches down into UI or API implementation details
- **Integration testing:** if a scenario touches more than one feature (or more than one application/system), it belongs in a journey. A journey is the test-framework equivalent of an integration test — it validates that separate subsystems work correctly in combination.

### Fixture Layer Owns
- Playwright fixture extensions that wire flows, auth, and data into test context
- Setup/teardown lifecycle for test dependencies
- Provider mapping (`flow` | `core` | `factory`)

### Test Layer Owns
- Declarative test scenarios calling flows **or journeys** through injected fixtures
- Tag annotations: `@domain:{value}`, `@suite:smoke` and/or `@suite:regression` (a test belonging to both suites carries both tags; story association is in the registry, not a tag)
- Assertions on business outcomes (not UI mechanics)

---

## Constraints

| Constraint | Applies To | Rule |
|---|---|---|
| `noLocatorsInTests` | Test Layer | Tests MUST NOT contain locator strings (`page.getByTestId`, `page.getByRole`, `page.getByLabel`, `page.getByText`, `page.locator`, `[data-testid=`, `[aria-label=`) |
| `noLocatorsInFlows` | Flow Layer | Flows MUST NOT contain locator strings (same patterns as above) |
| `noLocatorsInJourneys` | Journey Layer | Journeys MUST NOT contain locator strings (they call flows only) |
| `noLocatorsInServices` | Service Layer | Services are API-only — MUST NOT contain UI locator strings |
| `noLocatorsInData` | Data Layer | Data files are pure constants — MUST NOT contain locators, logic, or API calls |
| `dataDrivenVariations` | Data + Flow/Service Layers | Variations live as `data/` entries passed into ONE capability method as parameters — NEVER one method per variant |
| `noDirectPageImportsInTests` | Test Layer | Tests MUST NOT import from `pages/`, `components/`, `services/`, `flows/`, `journeys/`, or `core/` directly |
| `noUpwardImports` | All Layers | No layer may import from a layer with a higher numeric level; peers (pages↔services) do not import each other |
| `singleMethodPerFlow` | Flow Layer | Each flow class exposes exactly ONE public `execute()` method |
| `singleMethodPerJourney` | Journey Layer | Each journey class exposes exactly ONE public `execute()` method |
| `twoTagsPerTest` | Test Layer | Every `test.describe` block MUST include `@domain:{value}` and at least one of `@suite:smoke` / `@suite:regression`. A test belonging to both suites carries both. Story keys are NOT tags — they are recorded in the registry `stories[]` arrays (many-to-many). |
| `flatLayers` | All Layers | No subdirectories in any layer — files sit directly under `tests/`, `journeys/`, `flows/`, `services/`, `pages/`, `components/`, `data/`, `core/` |

---

## Constraint Enforcement

Constraints are enforced at **generation time** by the Automation Skill:

1. After generating a file, run static import analysis
2. Check all imports against `ALLOWED_IMPORTS` for the file's layer
3. Scan file content for banned patterns (locators in tests/flows/journeys/services)
4. Verify tag presence in test describe blocks
5. If ANY violation found: **reject the file**, report the violation, and fix before committing

The `playwright-standard.json` policy file is the machine-readable source of truth for these rules. This document is the human-readable reference.
