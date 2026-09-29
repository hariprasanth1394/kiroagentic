# Account - Setup Account / Complete Profile Form

## Purpose

Profile completion form reached from the Incomplete Profile page. Collects the personal details required for the IELTS booking and Test Report Form (TRF), plus identification document details. Details must match the ID used on test day.

---

## Page Details

| Field | Value |
|-------|-------|
| Page Name | Setup Account / Complete Profile Form |
| Module | Account / Booking |
| URL | `https://bx.ielts.sit.idp.com/account/setup-account` |
| Title | Idp |
| Environment | SIT |
| Breadcrumb | Booking progress stepper (Test date ✓ → Account → Review → Payment → Profile & ID → Booking complete) |

---

## Entry Conditions

- User clicked "Complete profile" on the Incomplete Profile page
- Signed-in account with missing profile details

---

## Exit Conditions

- User completes required fields (both accordion sections) and clicks "Save and continue" (disabled until valid)
- "Back" returns to the previous step

---

## Booking Progress Stepper

| Order | Step | State (this run) |
|-------|------|------------------|
| 1 | Test date | Completed (checkmark) |
| 2 | Account | Current |
| 3 | Review | Pending |
| 4 | Payment | Pending |
| 5 | Profile & ID | Pending |
| 6 | Booking complete | Pending |

---

## Main Components

### Header

| Component | Type | Description |
|-----------|------|-------------|
| IDP Logo | Image | Brand logo |
| Progress Stepper | Navigation | Test date (✓) → Account → Review → Payment → Profile & ID → Booking complete |
| User Avatar ("T") | Button | Account menu |

### Page Heading & Warning

| Component | Type | Description |
|-----------|------|-------------|
| Heading | Heading (H1) | "Complete your profile" |
| Warning Alert | Alert | "All personal details must match the identification document you will use on test day. These details will be printed on your Test Report Form (TRF). Please check carefully and update any incorrect information before completing your registration. Changes cannot be made after your TRF has been issued." |

### Section 1 — IELTS Profile (Accordion, expanded)

| Field | Type | State |
|-------|------|-------|
| Title | Combobox (dropdown) | Empty ("Title") |
| First name | Textbox | Pre-filled ("Testuser") |
| Family name | Textbox | Pre-filled ("Teueudhe23") |
| Gender | Combobox (dropdown) | Empty ("Select gender") |
| Date of birth | Textbox + calendar button | Empty ("DD/MM/YYYY") |
| Level of education | Combobox (dropdown) | Empty ("Select level of education") |
| Years studying English | Combobox (dropdown) | Empty ("Select years studying English") |
| First language | Combobox (dropdown) | Empty ("Select first language") |
| Mobile | Country code + textbox | Pre-filled ("+61" AU, "234567890") |

### Section 2 — Identification Document (ID) (Accordion, collapsed)

| Component | Type | Description |
|-----------|------|-------------|
| Section Toggle | Button/Heading (H4) | "Identification Document (ID)" — collapsed; contents not yet observed |

### Actions

| Component | Type | Description |
|-----------|------|-------------|
| Back | Button | Returns to previous step |
| Save and continue | Button | Disabled until required fields complete |

---

## User Actions

| Action | Target | Expected Result |
|--------|--------|-----------------|
| Select Title | Title dropdown | Sets title |
| Edit First / Family name | Textboxes | Updates name (pre-filled from account) |
| Select Gender | Gender dropdown | Sets gender |
| Enter Date of birth | DOB field / calendar | Sets DOB |
| Select Level of education | Dropdown | Sets education level |
| Select Years studying English | Dropdown | Sets value |
| Select First language | Dropdown | Sets first language |
| Edit Mobile | Mobile field | Updates mobile |
| Expand "Identification Document (ID)" | Accordion toggle | Reveals ID fields (not yet observed) |
| Click "Save and continue" | Button | Proceeds toward booking summary (enabled once valid) |
| Click "Back" | Button | Returns to previous step |

---

## Business Rules

1. **Details must match ID** — Warning states personal details must match the identification document used on test day
2. **Printed on TRF** — Details appear on the Test Report Form; cannot be changed after TRF is issued
3. **Two-section form** — IELTS profile + Identification Document, presented as accordions
4. **Pre-filled from account** — First name, Family name, and Mobile are pre-populated from the registered account
5. **Additional required fields** — Title, Gender, Date of birth, Level of education, Years studying English, First language must be provided
6. **Save gated** — "Save and continue" is disabled until required fields (both sections) are complete
7. **Default country code** — Mobile defaults to "+61" (AU)

---

## Dependencies

| Trigger | Effect |
|---------|--------|
| "Complete profile" on Incomplete Profile page | Routes here |
| All required fields complete (both sections) | Enables "Save and continue" |
| Save and continue | Proceeds toward booking summary/review |

---

## Navigation

| From | To | Trigger |
|------|-----|---------|
| Incomplete Profile (`/account/incomplete-profile`) | Setup Account (`/account/setup-account`) | Click "Complete profile" |
| Setup Account | Booking Summary / Review | Click "Save and continue" (once valid) |
| Setup Account | Previous step | Click "Back" |

---

## Validation Rules

- "Save and continue" disabled until required fields complete (observed disabled state)
- Field-level validation (DOB format, required indicators, error text) not yet observed — Unknown
- Identification Document section requirements not yet observed (collapsed)

---

## Known Limitations

- Identification Document (ID) accordion is collapsed — its fields/requirements not yet observed
- Dropdown option lists (Title, Gender, Education, Years, First language) not yet enumerated
- Exact set of required vs optional fields not fully confirmed
- Pre-filled family name "Teueudhe23" appears to be test data

---

## Regression Impact

- Core data-collection step feeding the TRF — errors here have downstream, hard-to-reverse consequences (TRF cannot be changed after issue)
- Required-field validation gates progression to payment/booking
- ID document capture is compliance-critical

---

## Notes

- SIT environment; subdomain `bx.ielts.sit.idp.com`
- Reached only via the conditional Incomplete Profile path (or equivalent when profile data is missing)
- This page was NOT present in the prior PKB (new discovery)

---

## Confidence

| Section | Confidence |
|---------|-----------|
| Page Details | High |
| Components (IELTS profile) | High |
| Components (ID section) | Low (collapsed, not observed) |
| Business Rules | High (warning text + field states observed) |
| Navigation | Medium (Save destination inferred) |
| Validation Rules | Unknown |
