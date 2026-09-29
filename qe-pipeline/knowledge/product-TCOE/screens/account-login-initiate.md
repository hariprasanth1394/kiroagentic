# Account Login / Signup Initiate Page

## Purpose

Entry point for IELTS account access (BX Signup / login flow). Prompts the user to enter their email address to continue into either sign-in (existing account) or account creation (new user). First step of the end-to-end IELTS Academic booking flow.

---

## Page Details

| Field | Value |
|-------|-------|
| Page Name | Account Login / Signup Initiate |
| Module | Account / Identity |
| URL | `https://account.ielts.sit.idp.com/login-initiate` |
| Title | IELTS \| Account |
| Environment | SIT |
| Breadcrumb | None visible |

---

## Entry Conditions

- User navigates to `https://account.ielts.sit.idp.com` (redirects to `/login-initiate`)
- No authentication required to view this page

---

## Exit Conditions

- User enters an email address and submits (arrow button) to continue into the sign-in / signup flow

---

## Main Components

### Header

| Component | Type | Description |
|-----------|------|-------------|
| IDP IELTS Logo | Image/Link | Links to `https://ielts.sit.idp.com` |

### Main Section

| Component | Type | Description |
|-----------|------|-------------|
| Heading | Heading (H2) | "Welcome to IDP IELTS" |
| Instruction | Paragraph | "Enter your email to continue" |
| Email address | Textbox | Email input field |
| Continue | Button | Arrow icon button, submits the email |
| Info notice | Paragraph + icon | Guidance on using an existing/valid email |
| Check your results here | Link | Links to `https://ielts.sit.idp.com/results/check-your-result` |

---

## User Actions

| Action | Target | Expected Result |
|--------|--------|-----------------|
| Enter email | Email textbox | Email captured for continuation |
| Click arrow button | Continue button | Submits email, proceeds in login/signup flow |
| Click "check your results here" | Link | Navigates to results check page |
| Click IDP IELTS Logo | Header logo | Navigates to `https://ielts.sit.idp.com` |

---

## Business Rules

1. **Email required to continue** — A single email field gates entry into the flow
2. **Existing account guidance** — Users are advised to sign in with the same email previously used for an IELTS test or other IDP service
3. **Valid email required for new accounts** — Notice explicitly states to use a valid email address when creating a new account

---

## Dependencies

| Trigger | Effect |
|---------|--------|
| Submit email | Proceeds to sign-in or signup step (behaviour not yet observed) |

---

## Navigation

| From | To | Trigger |
|------|-----|---------|
| Account Login Initiate | Sign-in / Signup step | Submit email (arrow button) |
| Account Login Initiate | Results check page | Click "check your results here" |
| Account Login Initiate | IDP IELTS Home (SIT) | Click header logo |

---

## Validation Rules

- Email field present; specific validation behaviour (format, required error text) not yet observed — Unknown

---

## Known Limitations

- Post-submit behaviour (whether it branches to sign-in vs. account creation) not yet observed
- Email validation rules not yet observed

---

## Regression Impact

- Entry point for the entire account + booking flow — failure here blocks all downstream signup and booking functionality

---

## Notes

- SIT environment (`account.ielts.sit.idp.com`) — distinct from the DEV booking environment (`bxsearch.dev.ielts.com`) documented elsewhere in the PKB
- `https://account.ielts.sit.idp.com` redirects to `/login-initiate`

---

## Confidence

| Section | Confidence |
|---------|-----------|
| Page Details | High |
| Components | High |
| Business Rules | High (from on-page notice text) |
| Navigation | Medium (destinations from link URLs; post-submit flow not observed) |
| Validation Rules | Unknown |
