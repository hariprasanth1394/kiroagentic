# App Discovery Guide (Product Knowledge)

How to inspect the live application and turn what you observe into PKB documentation. Everything here is **evidence-first** — you document only what the browser shows you.

## DOM Discovery Script

Run via `browser_evaluate` after navigating to the page you want to document:

```javascript
(() => {
  const els = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [data-testid]');
  return Array.from(els).slice(0, 60).map(el => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    testid: el.getAttribute('data-testid') || null,
    name: el.getAttribute('name') || null,
    text: el.textContent?.trim().slice(0, 60) || null,
    role: el.getAttribute('role') || null,
    ariaLabel: el.getAttribute('aria-label') || null,
    disabled: el.disabled ?? null
  }));
})()
```

Use the result to fill a screen doc's **Main Components** and **User Actions** sections. Record the real attribute you observed (id / data-testid / name / role / aria-label) — never invent one.

## Discovery Sequence (per page)

1. `browser_navigate` → load the page URL (or ask the user to navigate to the page they want documented).
2. `browser_snapshot` → capture the accessibility/page structure overview.
3. `browser_evaluate` → run the discovery script above.
4. Confirm the **URL** and **page title** from the browser — these go into Page Details.
5. Click through one forward step and **observe the transition** — the resulting URL is the navigation target. Only record transitions you actually observed.
6. For stateful elements (toggles, tabs, dropdowns, filters, enabled/disabled buttons): interact and note BOTH states as Business Rules (e.g. "City dropdown disabled until Country selected").
7. Note any flow that does not work in this environment under **Known Limitations** with the specific URL and reason.

## Mapping Observations → PKB Sections

| Observation | Goes into |
|---|---|
| URL, page title, module | Screen doc → Page Details |
| Visible controls (buttons, fields, dropdowns) | Screen doc → Main Components |
| What the user can do here | Screen doc → User Actions |
| Mandatory selection / conditional visibility / enabled-disabled logic | Screen doc → Business Rules **and** `business-rules.md` |
| Client-side validation messages shown | Screen doc → Validation Rules |
| Where each action leads (observed) | Screen doc → Navigation **and** `navigation-map.md` |
| Multi-page end-to-end path | Workflow doc → Navigation Flow |
| External links, third-party widgets (OneTrust, analytics) | Screen doc → Dependencies; product-overview Integrations |

## Confidence Tagging

Every screen and workflow doc ends with a **Confidence** section:

- **High** — directly observed in the live browser this session.
- **Medium** — observed but partially inferred (e.g. a "Next" button whose target you did not click).
- **Low** — downstream/dependent behaviour not yet directly observed.
- **Unknown** — cannot be verified; label it Unknown, never guess.

Tag inferred routes inline, e.g. `Unknown (inferred from URL pattern)`.

## Authentication / Blocked Flows

If a page needs a login you cannot provide, or a flow errors out in this environment:
- Do NOT guess what is behind the wall.
- Record it under the screen's **Known Limitations** with the exact URL and the reason (e.g. `https://app.example.com/account → requires login, deep inspection skipped`).
- Document what IS visible (public routes, the login page's own controls) and continue.

## Merge Discipline

All PKB files live under the app's resolved `{pkbDir}` (e.g. `qe-pipeline/knowledge/product-TCOE/`) — resolved in SKILL.md Step 0b from `pipeline-config.json → apps[appKey].pkbDir`. Never read or write another app's PKB.

Before writing any file, read the existing doc first. Append only new observations, remove duplicate lines, and never overwrite content that looks manually curated. Never regenerate the whole PKB — update only the files that changed, and bump the `{pkbDir}/navigation-map.md` "Last Updated" stamp when routes change.
