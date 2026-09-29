# Account Dashboard Page

## Purpose

Post-registration/login landing page for the IELTS account. Greets the user, shows account email, and provides the primary "Book now" CTA to enter the booking flow plus access to IELTS services (tests & results, preparation, community).

---

## Page Details

| Field | Value |
|-------|-------|
| Page Name | Account Dashboard |
| Module | Account / Identity |
| URL | `https://account.ielts.sit.idp.com/dashboard` |
| Title | IELTS \| Account |
| Environment | SIT |
| Breadcrumb | None visible |

---

## Entry Conditions

- User has completed registration (clicked "Next" on `/register`) or signed in
- Authenticated session established (user greeting and email displayed)

---

## Exit Conditions

- User clicks "Book now" to start the booking flow
- User clicks one of the IELTS services cards

---

## Main Components

### Header

| Component | Type | Description |
|-----------|------|-------------|
| IDP Logo | Image/Link | Links to `https://ielts.sit.idp.com` |
| User Avatar | Button | Shows user initial ("T"); account menu |

### Welcome Section

| Component | Type | Description |
|-----------|------|-------------|
| Greeting | Heading (H2) | "Hello Testuser" (reflects registered first name) |
| Email | Paragraph | Displays account email (e.g. `testuseyrrjb@gmail.com`) |
| Book now | Button | Primary CTA to start the booking flow |

### IELTS Services Section

| Component | Type | Description |
|-----------|------|-------------|
| Section Heading | Heading (H3) | "IELTS services" |
| My tests and results | Card (clickable) | "Access your IELTS test results and manage your upcoming test bookings." |
| My IELTS preparation | Card (clickable) | "Get ready for IELTS and prepare with these free resources." |
| My IELTS community | Card (clickable) | "Join the IELTS community and connect with IELTS experts and test takers." |

---

## User Actions

| Action | Target | Expected Result |
|--------|--------|-----------------|
| Click "Book now" | Book now button | Starts booking flow (navigates to BX Search / wizard) |
| Click "My tests and results" | Service card | Opens tests & results area |
| Click "My IELTS preparation" | Service card | Opens preparation resources |
| Click "My IELTS community" | Service card | Opens community area |
| Click user avatar ("T") | Avatar button | Opens account menu |

---

## Business Rules

1. **Authenticated area** — Dashboard requires a signed-in/registered session
2. **Personalised greeting** — Displays the registered first name and account email
3. **Booking entry point** — "Book now" is the primary path from the account into the booking flow
4. **Avatar initial** — User avatar shows the first initial of the registered name

---

## Dependencies

| Trigger | Effect |
|---------|--------|
| Successful registration/login | Dashboard rendered with user context |
| Click Book now | Proceeds to booking flow (BX Search / find sessions wizard) |

---

## Navigation

| From | To | Trigger |
|------|-----|---------|
| Dashboard | Booking flow (BX Search / wizard) | Click "Book now" |
| Dashboard | Tests & Results | Click "My tests and results" |
| Dashboard | IELTS Preparation | Click "My IELTS preparation" |
| Dashboard | IELTS Community | Click "My IELTS community" |
| Dashboard | IDP IELTS Home (SIT) | Click header logo |

---

## Validation Rules

- None observable on this page (no form inputs)

---

## Known Limitations

- Destination URL of "Book now" not yet observed (expected to route to the BX Search booking wizard)
- Service card destinations not yet observed
- Account menu (avatar) contents not yet observed

---

## Regression Impact

- Central hub after authentication — "Book now" failure blocks entry into the entire booking flow
- Greeting/email rendering confirms successful account creation; regressions here indicate auth/session issues

---

## Notes

- SIT environment (`account.ielts.sit.idp.com`)
- Registration completes directly to the dashboard (no intermediate verification step observed in this run)

---

## Confidence

| Section | Confidence |
|---------|-----------|
| Page Details | High |
| Components | High |
| Business Rules | High |
| Navigation | Medium (destinations inferred from labels; targets not yet observed) |
| Validation Rules | High (no inputs present) |
