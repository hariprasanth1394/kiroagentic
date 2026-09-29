# DOM Exploration Guide

## Strategy: Test-Case-Driven Navigation

Use `test-cases.json` as your navigation map. The goal is **2–3 independently verified, count=1 selectors per interactive element**. Build a route list from all unique URLs in preconditions + navigation steps, then run phases below for every route.

---

## Phase 1 — Navigate and Initial Snapshot

```
browser_navigate → load the URL
browser_snapshot → accessibility-tree preview (roles + names)
```

Snapshot gives you accessible names quickly. **Never write a selector from snapshot text alone** — always confirm with `browser_evaluate`.

---

## Phase 2 — Full Element Inventory

Run this once per page. Return value is your primary evidence source:

```javascript
(() => {
  const els = document.querySelectorAll(
    'button, a[href], input, select, textarea, ' +
    '[role="button"], [role="tab"], [role="menuitem"], [role="option"], ' +
    '[role="checkbox"], [role="radio"], [role="switch"], [role="combobox"], ' +
    '[role="listbox"], [role="dialog"], [data-testid], [data-test], [data-cy], ' +
    '[aria-label], form, table thead th, [role="columnheader"], [contenteditable="true"]'
  );
  return Array.from(els).slice(0, 100).map(el => ({
    tag: el.tagName.toLowerCase(), id: el.id || null,
    testid: el.getAttribute('data-testid') || el.getAttribute('data-test') || el.getAttribute('data-cy') || null,
    name: el.getAttribute('name') || null, type: el.getAttribute('type') || null,
    role: el.getAttribute('role') || null, ariaLabel: el.getAttribute('aria-label') || null,
    placeholder: el.getAttribute('placeholder') || null,
    text: el.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80) || null,
    href: el.getAttribute('href') || null
  }));
})()
```

`testid`, `id`, `ariaLabel`, `name` are your gold attributes. `className` is last-resort only.

---

## Phase 3 — Selector Priority + Count Verification

For each element, try candidates top-down. **Stop at the first that verifies count=1.**

| Priority | Playwright selector | Use when |
|---|---|---|
| 1 | `getByTestId('value')` | `testid` attribute present |
| 2 | `getByRole('role', { name: '...' })` | Clear role + unique accessible name |
| 3 | `getByLabel('label text')` | `<label>` or `aria-labelledby` present |
| 4 | `getByPlaceholder('text')` | Input with placeholder |
| 5 | `getByText('exact text', { exact: true })` | Unique visible text |
| 6 | `locator('#id')` | Stable, non-generated `id` |
| 7 | `locator('[name="value"]')` | Form `name` attribute |
| 8 | `locator('[aria-label="value"]')` | When `getByRole` alone is ambiguous |
| 9 | `locator('tag[attr="value"]')` | Narrowed CSS (last resort) |

**Never use:** class-only, `[class*=`, positional (`:nth-child`, `.first()`), comma-separated.

**Count verification is mandatory for every candidate (primary and each fallback):**

| Playwright locator | DOM equivalent for `browser_evaluate` |
|---|---|
| `getByTestId('foo')` | `document.querySelectorAll('[data-testid="foo"]').length` |
| `getByPlaceholder('x')` | `document.querySelectorAll('[placeholder="x"]').length` |
| `getByText('x', {exact:true})` | `Array.from(document.querySelectorAll('*')).filter(e=>e.textContent?.trim()==='x').length` |
| `locator('#x')` | `document.querySelectorAll('#x').length` |
| `locator('[name="x"]')` | `document.querySelectorAll('[name="x"]').length` |

- Returns **1** → valid. Record: `{ source: "playwright-mcp", count: 1, verifiedBy: "browser_evaluate" }`
- Returns **0** → does not exist in this state. Try hidden-UI reveal (Phase 4) or next candidate.
- Returns **> 1** → ambiguous. Narrow it (parent scope, `exact: true`, add attribute) and re-verify.

A count you typed without running the query is self-reported evidence — hard violation.

---

## Phase 4 — Reveal Hidden UI

Trigger each pattern, then re-run Phase 2–3 on the revealed content:

| Pattern | How to reveal |
|---|---|
| Dropdown / select | `browser_click` trigger → evaluate options |
| Modal / dialog | `browser_click` opener → discover all modal elements |
| Tabs | `browser_click` each tab → evaluate panel content |
| Accordion | `browser_click` each header → discover inner elements |
| Toast / success message | Submit a valid form → evaluate immediately |
| Inline error message | Submit invalid form → evaluate error containers |
| Inline edit field | Click read-only value → discover revealed input |
| Confirmation dialog | Trigger dangerous action → discover Cancel + Confirm |
| Drawer / side panel | Trigger open → full discovery inside |
| Pagination | Click next/load → discover newly visible items |

Both success and error message elements belong in the Page Object even though they are transient.

---

## Phase 5 — Form Deep Dive

Run for every form to capture label associations and validation error containers:

```javascript
// Field inventory with label associations
(() => {
  const inputs = document.querySelectorAll('input, select, textarea, [role="combobox"], [contenteditable]');
  return Array.from(inputs).map(el => {
    const lbl = el.id ? document.querySelector(`label[for="${el.id}"]`) : el.closest('label');
    return { tag: el.tagName.toLowerCase(), id: el.id || null, name: el.getAttribute('name') || null,
      type: el.getAttribute('type') || null, placeholder: el.getAttribute('placeholder') || null,
      ariaLabel: el.getAttribute('aria-label') || null, testid: el.getAttribute('data-testid') || null,
      required: el.hasAttribute('required'), label: lbl?.textContent?.trim() || null };
  });
})()

// Error/validation container discovery
(() => {
  const errs = document.querySelectorAll(
    '[role="alert"], [aria-live="polite"], [aria-live="assertive"], ' +
    '[data-testid*="error"], [data-testid*="invalid"], [data-testid*="validation"]'
  );
  return Array.from(errs).map(el => ({
    tag: el.tagName.toLowerCase(), testid: el.getAttribute('data-testid') || null,
    role: el.getAttribute('role') || null, ariaLive: el.getAttribute('aria-live') || null,
    text: el.textContent?.trim().slice(0, 60) || null
  }));
})()
```

---

## Phase 6 — Interaction-Trace Discovery

Walk through each multi-step test flow in the browser to catch state-dependent elements:

1. Navigate to the precondition URL, ensure auth state
2. Execute each step (`browser_click`, `browser_type`, `browser_select`)
3. After each action: `browser_snapshot` + Phase 2 query on changed content
4. Catch: post-submit success elements, field-level errors, wizard step 2 forms, button state changes

---

## Selector Map (output of discovery)

Before writing any Page Object, record this per page:

```
Page: /dashboard
  "Create Session" button
    primary:  getByTestId('create-session-btn')      [count=1, verifiedBy=browser_evaluate]
    fallback: getByRole('button',{name:'Create Session'})  [count=1, verifiedBy=browser_evaluate]
    // backup: locator('#create-session')            [count=1, verifiedBy=browser_evaluate]

  Error banner
    primary:  getByRole('alert')                     [count=1, after triggering error]
    fallback: getByTestId('error-banner')            [count=1, verifiedBy=browser_evaluate]
```

Chain primary + fallback with `.or()` in the Page Object. Third selector is an evidence-tagged comment.
If you cannot find a verified second selector, use only the primary — one solid selector beats two where one is guessed.

---

## Can't Find a Feature?

1. Recheck test case preconditions for the exact URL and state
2. Inspect nav/sidebar/hamburger menu (Phase 2 on `nav a, [role="menuitem"]`)
3. Check for auth wall — mark tests `needs-review` ("behind auth wall"), not `notAutomatable`
4. Check for shadow DOM: `page.locator('host').locator('inner')`, re-verify count in that context
5. Check for iframe: `page.frameLocator('iframe[src*="..."]').locator('...')`
6. Feature-flagged off → `notAutomatable` with `howToObtain: "enable feature flag X"`

---

## Anti-Hallucination Checklist

Before recording any selector:

- [ ] Executed against live DOM via `browser_evaluate`?
- [ ] Tool returned integer **1**?
- [ ] `verifiedBy` = `"browser_evaluate"` or `"locator.count()"`?
- [ ] Count is the value the tool returned — not typed manually?
- [ ] Free of banned patterns (`[class*=`, `.first()`, comma-separated)?
- [ ] Each `.or()` fallback has its own separate evidence entry?
