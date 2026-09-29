# Wizard - Test Type Selection

## Purpose

Step 1 of the 4-step booking wizard. Allows the user to select their IELTS test type before proceeding to format/location/date selection.

---

## Page Details

| Field | Value |
|-------|-------|
| Page Name | Test Type Selection |
| Module | Booking Wizard |
| URL | `https://bxsearch.dev.ielts.com/wizard/test-type` |
| Title | Book an IELTS Test \| IDP IELTS |
| Breadcrumb | None visible |
| Wizard Step | Step 1 / 4 — "Select test type" |

---

## Entry Conditions

- User clicked "Find an IELTS test session" on the Wizard Landing page
- No authentication required

---

## Exit Conditions

- User selects one of the three test type options → proceeds to next step
- User clicks back arrow → returns to Wizard Landing page

---

## Main Components

### Header

| Component | Type | Description |
|-----------|------|-------------|
| Back Arrow | Button | Returns to previous page (Wizard Landing) |
| Language Selector (EN) | Button | Language dropdown |
| User Icon | Button | Account/profile access |

### Informational Section

| Component | Type | Description |
|-----------|------|-------------|
| Page Title | Heading (H1) | "Test type" |
| Description (line 1) | Paragraph | "There are a few types of IELTS tests to choose from, depending on what you may require it for." |
| Description (line 2) | Paragraph | "It is important you understand which IELTS test you need before you book." |
| Check Acceptance Link | Link | "Check who accepts IELTS here" — links to organisations that accept IELTS |

### Progress Indicator

| Component | Type | Description |
|-----------|------|-------------|
| Step Label | Text | "Step 1/ 4" |
| Step Description | Text | "Select test type" |
| Progress Bar | Progressbar | Visual progress indicator |

### Test Type Options

| Component | Type | Description |
|-----------|------|-------------|
| Section Title | Heading (H2) | "Select your IELTS test type" |
| IELTS Academic | Clickable Card | For university or professional registration |
| IELTS General Training | Clickable Card | For migration purposes |
| IELTS for UKVI | Clickable Card | For UK study or living |

**Test Type Cards Detail:**

| Test Type | Icon | Description |
|-----------|------|-------------|
| IELTS Academic | "Ielts academic" icon | Tests English language proficiency at an academic level, for university or professional registration |
| IELTS General Training | "Ielts general training" icon | Tests English level proficiency in a practical and everyday context, for migration purposes |
| IELTS for UKVI | "UKVI" icon | Required if you plan to study or live in the UK. Must check which UKVI test you need with the UK government before booking |

### Footer

| Component | Type | Description |
|-----------|------|-------------|
| IDP IELTS Logo | Link/Image | Links to main IDP IELTS site |

---

## User Actions

| Action | Target | Expected Result |
|--------|--------|-----------------|
| Click Back Arrow | Back button | Returns to Wizard Landing (`/wizard`) |
| Click IELTS Academic | Card | Proceeds to Step 2 with Academic selected |
| Click IELTS General Training | Card | Proceeds to Step 2 with General Training selected |
| Click IELTS for UKVI | Card | Proceeds to Step 2 (or UKVI sub-selection) |
| Click "Check who accepts IELTS here" | Link | Opens external page listing accepting organisations |
| Click EN | Language button | Opens language selector dropdown |
| Click User Icon | Button | Opens account/login panel |

---

## Business Rules

1. **Mandatory selection** — User must pick one of the three test types to proceed
2. **No default selection** — No test type is pre-selected
3. **UKVI guidance** — User is advised to check with UK government before booking UKVI
4. **4-step wizard** — Test Type is Step 1 of 4 (test type → format → location → date inferred)
5. **Single selection** — Only one test type can be chosen (cards are mutually exclusive)

---

## Dependencies

| Trigger | Effect |
|---------|--------|
| Test type selection | Determines available formats in Step 2 |
| Test type selection | Determines available locations (UKVI has specific approved centres) |
| Back navigation | Returns to landing without losing state (Unknown - needs verification) |

---

## Navigation

| From | To | Trigger |
|------|-----|---------|
| Wizard Landing | Test Type Selection | Click "Find an IELTS test session" |
| Test Type Selection | Step 2 (Format/Location) | Click any test type card |
| Test Type Selection | Wizard Landing | Click back arrow |
| Test Type Selection | External: Who Accepts IELTS | Click "Check who accepts IELTS here" |

---

## Validation Rules

- No form validation on this page (selection-based, not input-based)
- User cannot proceed without selecting a test type (no "Next" button visible — selection IS the action)

---

## Known Limitations

- No visible "help" or "info" tooltip for individual test types
- UKVI card does not show sub-types (Academic/General) at this step — Unknown if next step differentiates
- External link ("Check who accepts IELTS here") may navigate away from wizard — Unknown if it opens in new tab

---

## Regression Impact

- Test type selection drives the entire downstream flow (format availability, location availability, pricing)
- If this step fails, no booking can proceed
- Changes to test type offerings (adding/removing types) impact this page directly

---

## Notes

- Progress bar shows Step 1/4 — full wizard flow is: Test Type → (inferred) Format → Location → Date
- The "Step 1/ 4" text has an inconsistent space before the slash (possible UI bug)
- Console shows 4 errors and 22 warnings (may indicate frontend issues)

---

## Confidence

| Section | Confidence |
|---------|-----------|
| Page Details | High |
| Components | High |
| Business Rules | High (directly observable) |
| Navigation | Medium (Step 2 destination inferred) |
| Dependencies | Medium (downstream effects inferred from description) |
| Validation Rules | Medium (no explicit error states observed) |
