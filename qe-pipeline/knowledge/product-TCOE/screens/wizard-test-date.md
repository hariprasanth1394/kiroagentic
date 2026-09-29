# Wizard - Test Date Selection

## Purpose

Step 4 (final step) of the 4-step booking wizard. Allows the user to select a date or date range for their IELTS test using a dual-month calendar interface.

---

## Page Details

| Field | Value |
|-------|-------|
| Page Name | Test Date Selection |
| Module | Booking Wizard |
| URL (DEV) | `https://bxsearch.dev.ielts.com/wizard/test-date/ioc` |
| URL (SIT) | `https://bxsearch.ielts.sit.idp.com/wizard/test-date/ioc` |
| Title | Book an IELTS Test \| IDP IELTS |
| Breadcrumb | None visible |
| Wizard Step (DEV) | Step 4 / 4 — "Select test date" (final step) |
| Wizard Step (SIT) | Step 5 / 5 — "Select test date" (final step) |

> **Environment difference (observed 2026-09-09):** On SIT this is **Step 5/5**; on DEV it was **Step 4/4**. Both are the final wizard step. The `ioc` location code (Melbourne, Australia) is consistent across environments. Calendar structure and behaviour are identical.

---

## Entry Conditions

- User selected Country and City on the Location page (Step 3)
- No authentication required

---

## Exit Conditions

- User selects a date or date range → proceeds to search results / session listing (inferred)
- User clicks back arrow → returns to Location page (Step 3)

---

## Main Components

### Header

| Component | Type | Description |
|-----------|------|-------------|
| Back Arrow | Button | Returns to Location page (Step 3) |
| Language Selector (EN) | Button | Language dropdown |
| User Icon | Button | Account/profile access |

### Informational Section

| Component | Type | Description |
|-----------|------|-------------|
| Page Title | Heading (H1) | "Test date" |
| Description | Paragraph | "Select a date or date range to take the IELTS test. You may search for test dates up to 6 months in advance." |

### Progress Indicator

| Component | Type | Description |
|-----------|------|-------------|
| Step Label | Text | "Step 4/4" |
| Step Description | Text | "Select test date" |
| Progress Bar | Progressbar | Visual progress indicator (full) |

### Calendar Section

| Component | Type | Description |
|-----------|------|-------------|
| Section Title | Heading (H2) | "Select a date or date range" |
| Selection Confirmation | Heading (H3) | "You have selected" + date range (appears after selection) |
| Month Navigation | Button | "Next month" — navigates calendar forward |
| Calendar Grid (Month 1) | Grid | August 2026 — interactive calendar |
| Calendar Grid (Month 2) | Grid | September 2026 — interactive calendar |

### Action Bar (Appears After Date Selection)

| Component | Type | Description |
|-----------|------|-------------|
| Clear selection | Clickable text/link | Resets date selection |
| Find sessions | Button | Submits date range and searches for available sessions |

**Calendar Grid Structure:**

| Element | Type | Details |
|---------|------|---------|
| Column Headers | S, M, T, W, T, F, S | Week starts on Sunday |
| Enabled Dates | Clickable gridcell | Dates with available test sessions |
| Disabled Dates | Disabled gridcell | Past dates or dates without availability |

**Observed Date Availability (August 2026):**

| Date Range | State | Notes |
|------------|-------|-------|
| 1–5 Aug 2026 | Disabled | Past dates (today is 6 Aug 2026) |
| 6–31 Aug 2026 | Enabled | Available for selection |

**Observed Date Availability (September 2026):**

| Date Range | State | Notes |
|------------|-------|-------|
| 1–8 Sep 2026 | Enabled | Available for selection |
| 9–30 Sep 2026 | Disabled | Beyond availability window or no sessions |

### Footer

| Component | Type | Description |
|-----------|------|-------------|
| IDP IELTS Logo | Link/Image | Links to main IDP IELTS site |

---

## User Actions

| Action | Target | Expected Result |
|--------|--------|-----------------|
| Click Back Arrow | Back button | Returns to Location page (Step 3) |
| Click first enabled date | Calendar gridcell | Selects start date of range |
| Click second enabled date | Calendar gridcell | Selects end date of range; shows confirmation + action bar |
| Click "Next month" | Navigation button | Advances calendar by one month |
| Click "Clear selection" | Text link | Resets date selection, hides action bar |
| Click "Find sessions" | Button | Searches for available test sessions in selected date range |
| Click EN | Language button | Opens language selector dropdown |
| Click User Icon | Button | Opens account/login panel |

---

## Business Rules

1. **Dual-month calendar view** — Two months displayed side by side (August + September 2026)
2. **Date range selection is two-click** — First click = start date, second click = end date
3. **Maximum 6 months advance booking** — Explicit in description text
4. **Past dates are disabled** — Dates before today (6 Aug 2026) cannot be selected
5. **Some future dates disabled** — September 9+ disabled, suggesting no sessions available or availability window limit
6. **Week starts on Sunday** — Column headers: S, M, T, W, T, F, S
7. **Forward-only calendar navigation** — Only "Next month" button visible (no "Previous month")
8. **URL includes location code** — `/wizard/test-date/ioc` — "ioc" appears to be the city/location code
9. **No "Previous month" navigation** — Cannot navigate to months before current display
10. **Availability is location-dependent** — Different locations will show different available dates
11. **Selection confirmation shown** — H3 displays "You have selected" + date range in DD/MM/YYYY format
12. **Date format is DD/MM/YYYY** — Observed: "12/08/2026 - 26/08/2026"
13. **"Find sessions" button appears after selection** — Action bar hidden until range is selected
14. **"Clear selection" available after selection** — Allows user to reset and re-select
15. **End date gets [active] state** — End date gridcell marked as active in DOM
16. **Date range can span multiple weeks** — Observed: 12 Aug to 26 Aug (14 days)

---

## Dependencies

| Trigger | Effect |
|---------|--------|
| Location selected in Step 3 | Determines URL path suffix and available dates |
| Date selection | Proceeds to session listing/results (inferred) |
| "Next month" click | Loads next month's availability |
| Test type + format + location | Combined determine which dates have sessions |

---

## Navigation

| From | To | Trigger |
|------|-----|---------|
| Location (Step 3) | Test Date (Step 4) | Select City |
| Test Date (Step 4) | Location (Step 3) | Click back arrow |
| Test Date (Step 4) | Session Results | Click "Find sessions" button |

---

## Validation Rules

- Past dates cannot be selected (disabled state)
- Dates beyond availability window cannot be selected (disabled state)
- Date range requires two clicks (start + end) to enable "Find sessions" button
- "Clear selection" resets the range (inferred)

---

## Known Limitations

- No "Previous month" button — cannot view past months
- Unknown what page loads after "Find sessions" is clicked (session listing URL unknown)
- URL suffix "ioc" — unknown full mapping of city codes
- Cannot determine maximum date range width (14 days observed but max unknown)
- Unknown whether single-date selection (no range) is supported

---

## Regression Impact

- Calendar is the final wizard step — date availability directly impacts bookability
- Disabled/enabled date logic depends on session availability API
- If date API fails, no dates would be selectable, blocking the entire booking
- Location code in URL means deep-linking to Step 4 is possible
- Calendar navigation ("Next month") must correctly load new availability data

---

## Notes

- URL pattern: `/wizard/test-date/{locationCode}` — location-specific
- This is the final wizard step (4/4) — "Find sessions" button triggers session search
- Dual-month calendar is a richer UI component than previous steps
- "Find sessions" button only appears after date range is selected (progressive disclosure)
- Date format DD/MM/YYYY with " - " separator for range display
- Availability gap: August 6–31 enabled, Sept 1–8 enabled, Sept 9+ disabled — suggests ~1 month availability window from today
- H3 heading is dynamically populated with selection confirmation (empty before selection)

---

## Confidence

| Section | Confidence |
|---------|-----------|
| Page Details | High |
| Components | High |
| Business Rules | High (calendar states + action bar directly observable) |
| Navigation | High ("Find sessions" button confirms explicit action) |
| Dependencies | High (disabled states confirm availability logic) |
| Date selection interaction | High (two-click range confirmed from observation) |
