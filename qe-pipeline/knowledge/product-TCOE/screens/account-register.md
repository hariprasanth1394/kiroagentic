# Account Register / Complete Profile Page

## Purpose

New-user registration page reached after entering an email that has no existing account. Collects the user's profile details (name, mobile, password) and required legal consents to create an IELTS account and continue with the booking.

---

## Page Details

| Field | Value |
|-------|-------|
| Page Name | Account Register / Complete Profile |
| Module | Account / Identity |
| URL | `https://account.ielts.sit.idp.com/register` |
| Title | IELTS \| Account |
| Environment | SIT |
| Breadcrumb | Back link → `/login-initiate` |

---

## Entry Conditions

- User submitted an email on `/login-initiate` that is not associated with an existing account (new user)
- No authentication required

---

## Exit Conditions

- User fills required fields, accepts required consents, and clicks "Next"
- "Next" button is disabled until required inputs/consents are satisfied

---

## Main Components

### Header

| Component | Type | Description |
|-----------|------|-------------|
| IDP IELTS Logo | Image/Link | Links to `https://ielts.sit.idp.com` |
| Back | Link | Returns to `/login-initiate` |

### Profile Form

| Component | Type | Description |
|-----------|------|-------------|
| Heading | Heading (H2) | "Complete your profile" |
| Instruction | Paragraph | "Add your details to continue with your booking" |
| Mobile notice | Paragraph + info icon | "Make sure your mobile number is correct. You'll use it to access your results and ID details." |
| First name | Textbox | Placeholder "First name" |
| Family name | Textbox | Placeholder "Family name" |
| Mobile number | Textbox with country code | Prefixed with "+61" country code |
| Password | Textbox (masked) | Has eye icon to toggle visibility |
| Next | Button | Disabled until required fields/consents complete |

### Consents

| Consent | Type | Required | Description |
|---------|------|----------|-------------|
| Terms & Conditions / Privacy Policy | Checkbox | Required (marked *) | "I agree to IDP's Terms and Conditions and Privacy Policy" |
| Overseas data transfer | Checkbox | Required (marked *) | "IELTS is a global test and I understand that my personal data will be transferred overseas for the purposes of conducting the IELTS test" |
| Marketing communications | Checkbox | Optional | "I agree to receive occasional communications and marketing messages from IDP about IELTS via Email, SMS, and WhatsApp" |
| Study abroad emails | Checkbox | Optional | "I'd like to receive emails and notifications for IDP study abroad and support services" |

**Legal Links:**
- Terms and Conditions → `https://ielts.idp.com/legal-notices#website-terms-of-use`
- Privacy Policy → `https://ielts.idp.com/legal-notices#ielts-australia-privacy-policy`

---

## User Actions

| Action | Target | Expected Result |
|--------|--------|-----------------|
| Enter First name | First name textbox | Value captured |
| Enter Family name | Family name textbox | Value captured |
| Enter Mobile number | Mobile textbox (+61) | Value captured |
| Enter Password | Password textbox | Value captured (masked) |
| Toggle password visibility | Eye icon | Shows/hides password |
| Check required consents | T&C + overseas data checkboxes | Enables progression |
| Click "Next" | Next button | Proceeds in signup flow (enabled once required inputs/consents met) |
| Click "Back" | Back link | Returns to `/login-initiate` |

---

## Business Rules

1. **Required profile fields** — First name, Family name, Mobile number, and Password are collected to create the account
2. **Mobile number matters** — Notice states the mobile is used to access results and ID details
3. **Mandatory consents** — Terms & Conditions/Privacy Policy and overseas data transfer consents are marked required (*)
4. **Optional consents** — Marketing communications and study-abroad emails are optional
5. **Next gated** — "Next" button remains disabled until required inputs and consents are satisfied
6. **Default country code** — Mobile number defaults to "+61" (Australia)

---

## Dependencies

| Trigger | Effect |
|---------|--------|
| Required fields + required consents complete | "Next" button becomes enabled |
| Click Next | Proceeds to next signup step (behaviour not yet observed) |

---

## Navigation

| From | To | Trigger |
|------|-----|---------|
| Account Register | Next signup step | Click "Next" (once enabled) |
| Account Register | Account Login Initiate | Click "Back" |
| Account Register | Legal Notices | Click Terms & Conditions or Privacy Policy |

---

## Validation Rules

- "Next" button disabled state observed until required inputs/consents complete
- Specific field-level validation (name format, mobile format, password complexity, error text) not yet observed — Unknown

---

## Test Data Guidance

- **Unique email required per run** — Signup requires a new, unused email each time. Convention: use a text prefix + timestamp for uniqueness (e.g. `qauser+{timestamp}@example.com` or `qauser{timestamp}@domain`). Aligns with the `{unique_email}` placeholder in anti-hallucination rules.

---

## Known Limitations

- Password complexity requirements not yet observed
- Mobile number format/validation not yet observed
- Post-"Next" behaviour (verification step vs. direct booking entry) not yet observed
- Whether country code is selectable (dropdown) not yet observed

---

## Regression Impact

- Core account-creation gate — any failure blocks new users from entering the booking flow
- Consent logic changes affect legal compliance across all new signups

---

## Notes

- SIT environment (`account.ielts.sit.idp.com`)
- Reached only for new-user emails; existing emails likely branch to sign-in (not observed)

---

## Confidence

| Section | Confidence |
|---------|-----------|
| Page Details | High |
| Components | High |
| Business Rules | High (field requirements and consent markers observed in DOM) |
| Navigation | Medium (Back confirmed; post-Next flow not observed) |
| Validation Rules | Unknown |
