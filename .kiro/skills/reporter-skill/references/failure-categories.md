# Failure Classification Rules

## Priority Order

Apply in this order — first match wins. Do NOT double-classify.

### 1. Flaky (excluded from pass rate)

Condition: `retriedAndPassed: true` in execution_result.json

The test failed on first attempt but passed on retry. This is NOT a product defect — it's test instability.

Action: Count separately. Do NOT include in pass/fail denominator.

### 2. Environment Issue (counts as failure)

Error patterns:
- `TimeoutError` on `page.goto()` or `page.waitForNavigation()`
- `ECONNREFUSED`
- `net::ERR_CONNECTION_REFUSED`
- `net::ERR_NAME_NOT_RESOLVED`
- `net::ERR_TIMED_OUT`
- HTTP 502, 503 in error message
- `ERR_CERT_AUTHORITY_INVALID` (SSL/proxy issue)
- **CDP / remote-browser connection errors** — `wsEndpoint`, `cdp.lambdatest.com`, `browserType.connect`, `WebSocket connection closed`, `Target closed`, `Target page, context or browser has been closed` occurring BEFORE the test body ran. These mean the remote browser session never established — infra, not the app.
- Tunnel errors — `tunnel not connected`, `Tunnel is not running`

These mean the APP or INFRA was unavailable — not a code defect.

**EDGE CASE 1:** `TimeoutError` on `expect(locator).toBeVisible()` AFTER a successful navigation + user action = Product Defect (the element should have appeared but didn't). Only classify as environment if the timeout is on the navigation/connection itself.

**EDGE CASE 2 — network-call / clickstream assertions:** A test that waits for or asserts a specific network request (analytics/clickstream beacon, tracking call, API side-effect) via `page.waitForRequest`/`waitForResponse`/`expect(request)...`:
- If the assertion fails because the expected call was NOT fired or fired with wrong payload AFTER the page loaded and the action ran → **Product Defect** (the app failed to emit the expected call).
- If it fails because the browser/CDP session dropped or the network was unreachable (`Target closed`, `WebSocket closed`, `ECONNREFUSED` on the beacon host) → **Environment Issue**.
- Distinguish by WHERE the error originates: assertion-on-request-contents = product; transport/connection death = environment.

### 3. Test Script Error (counts as failure)

Error patterns:
- `locator resolved to 0 elements` — selector is wrong
- `strict mode violation` — selector matches multiple elements
- `TypeError` — code bug in test
- `ReferenceError` — undefined variable in test
- `Cannot read properties of null/undefined` — test code issue
- `SyntaxError` — compilation should have caught this

These are automation bugs, not product bugs.

### 4. Product Defect (default — counts as failure)

Everything else, primarily:
- Assertion failures: `expect(received).toBe(expected)` — actual ≠ expected
- `expect(locator).toBeVisible()` timeout AFTER page loaded successfully
- `expect(page).toHaveURL()` — wrong URL after action
- `expect(element).toHaveText()` — wrong text content

These indicate the application behaved differently than expected.

## Summary Table

| Category | Counts in pass rate? | JIRA action |
|---|---|---|
| Flaky | NO (excluded) | Count in quality_gate.json → failureCategories.flakyTest (no separate file) |
| Environment | YES (as failure) | No bug filed — infra issue |
| Script Error | YES (as failure) | Maintenance Task filed |
| Product Defect | YES (as failure) | Bug filed |
