# Wizard Landing Page

## Purpose

Entry point for the IELTS test booking flow. Welcomes the user and provides a single CTA to begin the booking wizard (Find an IELTS test session).

---

## Page Details

| Field | Value |
|-------|-------|
| Page Name | Wizard Landing |
| Module | Booking Wizard |
| URL | `https://bxsearch.dev.ielts.com/wizard` |
| Title | Book an IELTS Test \| IDP IELTS |
| Breadcrumb | None visible |

---

## Entry Conditions

- User navigates directly to the wizard URL
- No authentication required to view this page
- Cookie consent banner appears on first visit

---

## Exit Conditions

- User clicks "Find an IELTS test session" card to proceed into the booking wizard

---

## Main Components

### Header

| Component | Type | Description |
|-----------|------|-------------|
| IDP Logo | Image/Link | Links to `https://ielts.idp.com` |
| Language Selector | Button | Displays "EN", has dropdown arrow |
| User Icon | Button | Account/profile access |

### Welcome Section

| Component | Type | Description |
|-----------|------|-------------|
| Greeting | Heading (H1) | "Hi there / Welcome to IDP IELTS" |
| Value Propositions | List (3 items) | Key selling points |

**Value Propositions:**
1. Take your test on computer or paper
2. Get your results typically within 1-5 days
3. Accepted by more than 12,000 organisations worldwide

### Booking Section

| Component | Type | Description |
|-----------|------|-------------|
| Section Title | Heading (H2) | "Book an IELTS test" |
| Find Session Card | Clickable List Item | Icon + title + description |

**Find Session Card:**
- Icon: "onboard me" image
- Title: "Find an IELTS test session" (H3)
- Description: "Select your test type, format, location and test date."

### Footer

| Component | Type | Description |
|-----------|------|-------------|
| Terms & Conditions | Link | Links to legal notices page |
| Privacy Policy | Link | Links to privacy policy section |
| IDP IELTS Logo | Link/Image | Links to main IDP IELTS site |

### Cookie Consent Banner (First Visit)

| Component | Type | Description |
|-----------|------|-------------|
| Title | Heading | "We value your privacy" |
| Description | Text | Cookie usage explanation |
| Cookie Policy Link | Link | Links to legal notices |
| Accept and Proceed | Button | Dismisses banner, accepts cookies |
| Close | Button | Closes banner |

---

## User Actions

| Action | Target | Expected Result |
|--------|--------|-----------------|
| Click "Find an IELTS test session" | Session card | Navigates to test type selection step |
| Click "EN" | Language button | Opens language dropdown |
| Click User Icon | User button | Opens account/login panel |
| Click Terms & Conditions | Link | Opens legal notices page |
| Click Privacy Policy | Link | Opens privacy policy section |
| Click IDP Logo (header) | Logo | Unknown - likely navigates to IDP IELTS home |
| Click IDP Logo (footer) | Footer link | Navigates to `https://ielts.idp.com` |
| Accept cookies | Cookie banner button | Dismisses cookie banner |

---

## Business Rules

1. **No authentication required** — Landing page is publicly accessible
2. **Cookie consent required** — Banner appears on first visit; accepting is implied by continued use
3. **Legal agreement** — "By booking an IELTS test with IDP, you are agreeing to the Terms & Conditions and Privacy Policy"
4. **Single entry path** — Only one CTA available ("Find an IELTS test session")

---

## Dependencies

| Trigger | Effect |
|---------|--------|
| Cookie acceptance | Banner dismissed, cookies stored |
| Click Find Session | Proceeds to next wizard step (test type/format/location/date selection) |

---

## Navigation

| From | To | Trigger |
|------|-----|---------|
| Wizard Landing | Test Session Search | Click "Find an IELTS test session" |
| Wizard Landing | IDP IELTS Home | Click footer logo |
| Wizard Landing | Legal Notices | Click Terms & Conditions or Privacy Policy |

---

## Validation Rules

- None observable on this page (no form inputs)

---

## Known Limitations

- Cookie banner elements exist in DOM but may not be visually interactable via standard click (observed during automation — may need JavaScript click)
- Page requires JavaScript to render (SPA)

---

## Regression Impact

- Entry point for entire booking flow — any failure here blocks all downstream functionality
- Language selector affects all subsequent pages
- Cookie consent state may affect tracking/analytics throughout the session

---

## Notes

- This is the DEV environment (`bxsearch.dev.ielts.com`)
- URL params include analytics tracking (`s2s_fbp`, `s2s_ga`, `s2s_gac`)
- Single-page application — content loads dynamically

---

## Confidence

| Section | Confidence |
|---------|-----------|
| Page Details | High |
| Components | High |
| Business Rules | Medium (legal agreement inferred from text) |
| Navigation | Medium (next step inferred from description) |
| Dependencies | Low (downstream behavior not yet observed) |
