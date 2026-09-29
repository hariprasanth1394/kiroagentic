# Account - Incomplete Profile (Conditional)

## Purpose

Conditional interstitial shown during booking when the signed-in IDP account is missing required profile details. Prompts the user to complete their profile before continuing to the booking summary. **If the profile is already complete, this page is skipped and the flow goes straight to the booking summary.**

---

## Page Details

| Field | Value |
|-------|-------|
| Page Name | Incomplete Profile |
| Module | Account / Booking |
| URL | `https://bx.ielts.sit.idp.com/account/incomplete-profile` |
| Title | Idp |
| Environment | SIT |
| Breadcrumb | Booking progress stepper (Test date ✓ → Account → Review → Payment → Profile & ID → Booking complete) |

---

## Conditional Behaviour (Important)

- **Appears only when profile data is missing.** Reached after selecting the speaking slot and clicking "Next step" on `/book-ielts/speaking` **when the account profile is incomplete**.
- **Skipped when profile is complete** — the flow then proceeds directly to the booking summary.
- Note the subdomain change: this page is on `bx.ielts.sit.idp.com` (not `bxsearch.ielts.sit.idp.com`).

---

## Entry Conditions

- User is booking with a signed-in IDP account
- Required profile details are missing on that account
- User clicked "Next step" on the Speaking Test Selection page

---

## Exit Conditions

- User clicks "Complete profile" to provide the missing details
- User clicks "Back" to return to the previous booking step

---

## Booking Progress Stepper

| Order | Step | State (this run) |
|-------|------|------------------|
| 1 | Test date | Completed (checkmark) |
| 2 | Account | Current (implied) |
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

### Main Section

| Component | Type | Description |
|-----------|------|-------------|
| Back | Button | Returns to previous step |
| ID Card Icon | Image | "id-card" |
| Heading | Heading (H2) | "Complete your profile" |
| Message | Paragraph | "We found your existing IDP account. Please provide a few additional details to continue with booking." |
| Complete profile | Button | Opens the profile completion form |

### Cookie Banner

| Component | Type | Description |
|-----------|------|-------------|
| Title | Heading (H2) | "We value your privacy" |
| Description | Text | Cookie usage explanation |
| Cookie Policy | Link | `https://ielts.idp.com/legal-notices` |
| Accept and Proceed | Button | Accepts cookies, dismisses banner |
| Close | Button | Closes banner |

---

## User Actions

| Action | Target | Expected Result |
|--------|--------|-----------------|
| Click "Complete profile" | Button | Opens profile completion form (fields not yet observed) |
| Click "Back" | Button | Returns to previous booking step |
| Click "Accept and Proceed" | Cookie banner | Accepts cookies, dismisses banner |
| Click "Close" | Cookie banner | Closes cookie banner |

---

## Business Rules

1. **Conditional page** — Shown only when the account profile is missing required details
2. **Skipped when complete** — A complete profile bypasses this page and lands on the booking summary
3. **Existing account detected** — Message confirms the system recognised an existing IDP account and needs additional details
4. **Cookie consent** — Cookie banner appears on this subdomain (`bx.ielts.sit.idp.com`)

---

## Dependencies

| Trigger | Effect |
|---------|--------|
| Incomplete profile + "Next step" on speaking page | Routes here |
| Complete profile | Proceeds toward booking summary |
| Click "Complete profile" | Opens the profile detail form |

---

## Navigation

| From | To | Trigger |
|------|-----|---------|
| Speaking Test Selection (`/book-ielts/speaking`) | Incomplete Profile | Click "Next step" (when profile incomplete) |
| Incomplete Profile | Profile completion form | Click "Complete profile" |
| Incomplete Profile | Previous step | Click "Back" |
| Speaking Test Selection | Booking Summary (direct) | Click "Next step" (when profile ALREADY complete — this page skipped) |

---

## Validation Rules

- Which specific profile fields are missing is not shown on this page — revealed after clicking "Complete profile" (not yet observed)

---

## Known Limitations

- The profile-completion form fields are not yet observed (behind "Complete profile")
- Exact condition/threshold for "incomplete" not observable from this page
- Subdomain differs (`bx.` vs `bxsearch.`) — relationship between the two hosts not fully mapped

---

## Regression Impact

- Conditional gate in the booking flow — incorrect triggering could block users with complete profiles or let incomplete profiles through
- Sits between session/speaking selection and the booking summary

---

## Notes

- SIT environment; subdomain `bx.ielts.sit.idp.com` (distinct from the `bxsearch.` search/booking host)
- Page title is "Idp" (differs from the "Book an IELTS Test | IDP IELTS" title used on bxsearch pages)
- This page was NOT present in the prior PKB (new discovery)
- Per user: this step is bypassed entirely when the profile is already complete

---

## Confidence

| Section | Confidence |
|---------|-----------|
| Page Details | High |
| Components | High |
| Conditional behaviour | High (confirmed by user + observed message) |
| Business Rules | High |
| Navigation | Medium (post-"Complete profile" form not yet observed) |
| Validation Rules | Unknown |
