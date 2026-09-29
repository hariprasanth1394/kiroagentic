# App Inspection Guide

## DOM Discovery Script

Run via `browser_evaluate` after navigating to the app URL:

```javascript
(() => {
  const els = document.querySelectorAll('button, a, input, select, textarea, [role="button"], [data-testid]');
  return Array.from(els).slice(0, 50).map(el => ({
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    testid: el.getAttribute('data-testid') || null,
    text: el.textContent?.trim().slice(0, 60) || null,
    role: el.getAttribute('role') || null,
    ariaLabel: el.getAttribute('aria-label') || null
  }));
})()
```

## Inspection Sequence

1. `browser_navigate` → load app URL
2. `browser_snapshot` → get page structure overview
3. `browser_evaluate` → run the discovery script above
4. Click through the happy path flow at least ONCE — observe what happens after each action
5. For stateful elements (toggles, filters, tabs): click each, note BOTH states
6. Document non-working flows as environment limitations

## Stateful Elements

Record in `statefulElements[]` array:
```json
{
  "element": "Toggle/Tab/Filter name",
  "stateBefore": "State before interaction",
  "stateAfter": "State after interaction"
}
```

Examples: active/inactive tabs, expanded/collapsed sections, filter applied/cleared, sort ascending/descending.

## Figma Inspection

When story contains `figma.com/design/` or `figma.com/file/`:

1. Parse URL to extract `fileKey` and `nodeId`
   - nodeId: replace `-` with `:` in the URL fragment
2. Call `figma_get_screenshot` with fileKey and nodeId
3. From the visual, extract ONLY:
   - Button labels (exact text)
   - Field names (exact labels)
   - Component structure (layout, sections)
4. Cross-reference with live app:
   - Element in Figma but not in app → potential "not yet implemented" scenario
   - Element in app but not in Figma → potential "undocumented feature" scenario
   - Label differs between Figma and app → note the discrepancy

**DO NOT extract:** pixel values, hex colors, spacing, font sizes, exact CSS properties.

## Authentication Handling

If page requires login you cannot provide:
- Note as prerequisite: `"apiAuthTokenAvailable": "missing"`
- Add to `environmentLimitations`: "Authentication required — deep inspection skipped"
- Continue with what's visible (login page elements, public routes)
- DO NOT guess what's behind the auth wall
