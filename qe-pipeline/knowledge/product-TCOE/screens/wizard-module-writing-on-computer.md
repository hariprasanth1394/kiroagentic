# Wizard - Writing Test Format Selection (Writing on Computer)

> **Confidence: High — verified live on SIT (2026-09-10).** Reached during the live automation walk for TCOE-1356. URL, heading, and options below were captured via Playwright DOM inspection (`count`-verified). Supersedes the earlier "to be verified" placeholder.

---

## Purpose

Wizard step reached after choosing the **IELTS on Computer** format for IELTS Academic. Lets the user select the specific **Writing** test format (on Paper / on Computer / display all) before proceeding to location selection.

---

## Page Details

| Field | Value |
|-------|-------|
| Page Name | IELTS Writing Test Format Selection |
| Module | Booking Wizard |
| URL | `https://bxsearch.ielts.sit.idp.com/wizard/format-academic` (verified live) |
| Title | Book an IELTS Test \| IDP IELTS |
| Heading (H1/H2) | "IELTS Writing test format" / "Select your IELTS Writing test format" |
| Wizard Step | After format (`/wizard/type-academic` → IELTS on Computer), before Location (`/wizard/test-location`) |

---

## Entry Conditions

- User selected **IELTS Academic** (test type) and **IELTS on Computer** (format) in the preceding wizard steps

## Exit Conditions

- User selects the **Writing on Computer** module option → proceeds to Location selection (`/wizard/test-location`)
- Back navigation returns to the format step

---

## Main Components (verified live)

Three selectable option cards render as `li.option` elements (same pattern as the type/format steps):

| Component | Type | Selector (verified) |
|-----------|------|---------------------|
| Writing on Paper | Clickable card | `li.option` hasText "Writing on Paper" |
| Writing on Computer | Clickable card | `li.option` hasText "Writing on Computer" |
| Display all options | Clickable card | `li.option` hasText "Display all options" |
| Fastest results (badge/button) | Button | `button.fastResultBtn` |
| Back | Button | `button.back-icon` |
| Language selector (EN) | Button | `button.language-dropdown-button` |
| User avatar (K) | Button | `button.userIcon` |

> Wizard cards must be clicked with a real Playwright locator `.click()` (dispatches Angular events). A raw JS `element.click()` does NOT trigger navigation — confirmed live.

---

## User Actions (verified live)

| Action | Target | Expected Result |
|--------|--------|-----------------|
| Select "Writing on Computer" | `li.option` hasText "Writing on Computer" | Advances toward Location selection |
| Select "Writing on Paper" | `li.option` hasText "Writing on Paper" | Selects paper writing format |
| Select "Display all options" | `li.option` hasText "Display all options" | Shows all writing format options |
| Click Back | `button.back-icon` | Returns to format step (`/wizard/type-academic`) |

---

## Business Rules

1. Module selection is required to proceed past format selection when IELTS on Computer is chosen (reported; to verify).

---

## Dependencies

| Trigger | Effect |
|---------|--------|
| Format = IELTS on Computer selected | Determines this module page is shown |
| Module selected | Determines/continues to location selection |

---

## Navigation

| From | To | Trigger |
|------|-----|---------|
| Format Selection (`/wizard/type-academic`, IELTS on Computer) | Module Selection (Writing on Computer) | Select IELTS on Computer |
| Module Selection (Writing on Computer) | Test Location (`/wizard/test-location`) | Select "Writing on Computer" |

---

## Validation Rules

- Selection-based; no form inputs expected (to confirm live).

---

## Known Limitations

- Not yet inspected live — added to close the gap found while validating TC-UI-010 (the E2E test case had skipped this page). Selectors, URL, and component structure must be captured in the next Product Knowledge discovery pass before automation relies on them.

---

## Regression Impact

- Sits on the primary booking happy path for IELTS on Computer; a break here blocks reaching location/date/session and therefore the offline-payment steps under test in TCOE-1356.

---

## Confidence

| Section | Confidence |
|---------|-----------|
| Existence + position in flow | Medium (product-owner confirmed) |
| Page Details / URL | Low (not inspected) |
| Components / selectors | Low (not inspected) |
| Navigation | Medium (reported order: format → this page → location) |
