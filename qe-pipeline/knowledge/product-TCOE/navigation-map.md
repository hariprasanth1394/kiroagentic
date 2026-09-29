# Navigation Map

## Application: IDP IELTS Booking System

## Environment: DEV (`bxsearch.dev.ielts.com`)

---

## Discovered Routes

### SIT — Account (`account.ielts.sit.idp.com`)

| Route | Page Name | Module | Status |
|-------|-----------|--------|--------|
| `/login-initiate` | Account Login / Signup Initiate | Account / Identity | Documented |
| `/register` | Account Register / Complete Profile | Account / Identity | Documented |
| `/dashboard` | Account Dashboard | Account / Identity | Documented |
| `/book-ielts/speaking` | Speaking Test Selection | Booking | Documented |

### SIT — Booking Account (`bx.ielts.sit.idp.com`)

Note: different subdomain (`bx.` not `bxsearch.`).

| Route | Page Name | Module | Status |
|-------|-----------|--------|--------|
| `/account/incomplete-profile` | Incomplete Profile (conditional) | Account / Booking | Documented |
| `/account/setup-account` | Setup Account / Complete Profile Form | Account / Booking | Documented |
| `/account/booking-summary` | Booking Summary / Review | Account / Booking | Documented |
| `/account/booking-summary/payment-options` | Payment Options | Account / Booking | Documented |
| `/account/booking-summary/payment-offline` | Offline Payment | Account / Booking | Documented |
| `/account/booking-confirmation-v2` | Booking Confirmation (Reserved) | Account / Booking | Documented |

### SIT — Booking (`bxsearch.ielts.sit.idp.com`)

Reached from the Account Dashboard "Book now" button, which opens the wizard in a NEW TAB. Same wizard pages as DEV, with one difference: the SIT wizard is a **5-step** flow (location shows "Step 4/5"), whereas DEV is **4-step** (location shows "Step 3/4"). The extra SIT step precedes location and is not yet identified.

| Route | Page Name | Module | Status |
|-------|-----------|--------|--------|
| `/wizard` | Wizard Landing | Booking Wizard | Documented (see DEV wizard docs) |

### DEV — Booking (`bxsearch.dev.ielts.com`)

| Route | Page Name | Module | Status |
|-------|-----------|--------|--------|
| `/wizard` | Wizard Landing | Booking Wizard | Documented |
| `/wizard/test-type` | Test Type Selection (Step 1/4) | Booking Wizard | Documented |
| `/wizard/type-academic` | Test Format Selection — Academic (Step 2/4) | Booking Wizard | Documented |
| `/wizard/type-general` | Test Format Selection — General Training (Step 2/4) | Booking Wizard | Unknown (inferred from URL pattern) |
| `/wizard/type-ukvi` | Test Format Selection — UKVI (Step 2/4) | Booking Wizard | Unknown (inferred from URL pattern) |
| `/wizard/test-location` | Test Location Selection (Step 3/4) | Booking Wizard | Documented |
| `/wizard/test-date/{locationCode}` | Test Date Selection (Step 4/4) | Booking Wizard | Documented |
| `/book-ielts` | Session Results Listing | Booking | Documented |
| Unknown | Booking/Payment | Booking | Unknown |

---

## Account → Booking Flow (SIT)

```
[Account Login Initiate] (account.ielts.sit.idp.com/login-initiate)
    │ enter email (new user)
    └──▶ [Account Register] (/register)
              │ complete profile + required consents → Next
              └──▶ [Account Dashboard] (/dashboard)
                        │ click "Book now"
                        └──▶ [BX Search Wizard] (bxsearch.ielts.sit.idp.com/wizard) — OPENS IN NEW TAB
                                  │ test type → format → location → date (5 steps on SIT)
                                  └──▶ [Session Results] (bxsearch.ielts.sit.idp.com/book-ielts)
                                            │ click "Select and continue" on a session
                                            └──▶ [Speaking Test Selection] (/book-ielts/speaking)
                                                      │ pick booking-for + speaking slot → Next step
                                                      │
                                                      ├── profile INCOMPLETE ──▶ [Incomplete Profile] (bx.ielts.sit.idp.com/account/incomplete-profile)
                                                      │                                │ "Complete profile"
                                                      │                                └──▶ [Setup Account form] (/account/setup-account)
                                                      │                                          │ fill IELTS profile + ID → Save and continue
                                                      │                                          └──▶ [Booking Summary] (/account/booking-summary)
                                                      │
                                                      └── profile COMPLETE ────▶ [Booking Summary] (/account/booking-summary — incomplete-profile & setup skipped)
                                                                                        │ tick T&C consent → Confirm and proceed with payment
                                                                                        └──▶ [Payment Options] (/account/booking-summary/payment-options)
                                                                                                  │ "How would you like to pay?"
                                                                                                  ├── Pay online ──▶ [Online/card payment] (not yet documented)
                                                                                                  └── Pay Offline ─▶ [Offline Payment] (/account/booking-summary/payment-offline)
                                                                                                            │ Cash / Cheque / Fund Transfer → Reserve now
                                                                                                            └──▶ [Booking Confirmation — Reserved] (/account/booking-confirmation-v2)
                                                                                                                      │ complete About you / Address / Occupation; pay by deadline
                                                                                                                      ├── "Complete payment" ──▶ [Payment instructions] (not yet documented)
                                                                                                                      └── "Continue to next step" ──▶ (post-info step; not yet documented)

  ── Online payment branch (USER-PROVIDED, not observed) ──
  [Payment Options] → "Pay online" (Stripe / Braintree / etc.)
      → [Booking Confirmation] (same page, message = "Payment successful")
          → fill About you / Your address / IELTS info
          → Next → [Upload ID image]
          → [IDV consent page]  (user agrees)
          → "Booking complete"
          → redirect to Dashboard / test-booking page

  NOTE (user-provided): post-booking details are stored against the APPLICATION Profile (per booking),
  NOT the created account Profile. Booking another session requires re-entering profile info.
```

## Booking Progress Stepper (observed on /book-ielts/speaking)

`Test date → Account → Review → Payment → Profile & ID → Booking complete`

> Full end-to-end workflow documented in `workflows/offline-booking-flow.md`.

## Navigation Flow

```
[Wizard Landing] (/wizard)
    │
    └──▶ [Step 1: Test Type] (/wizard/test-type)
              │
              ├── IELTS Academic ──▶ [Step 2: Format] (/wizard/type-academic)
              │         │
              │         ├── IELTS on Paper ──▶ [Step 3: Location] (/wizard/test-location)
              │         ├── IELTS on Computer ──▶ [Step 3: Location] (/wizard/test-location)
              │         ├── IELTS Online ──▶ [Step 3: Location] (/wizard/test-location)
              │         └── Display all formats ──▶ [Step 3: Location] (/wizard/test-location)
              │
              ├── IELTS General Training ──▶ [Step 2: Format] (/wizard/type-general — inferred)
              │         └──▶ [Step 3: Location] (/wizard/test-location)
              │
              └── IELTS for UKVI ──▶ [Step 2: Format] (/wizard/type-ukvi — inferred)
                        └──▶ [Step 3: Location] (/wizard/test-location)

[Step 3: Location] (/wizard/test-location)
    │
    ├── Select Country → Enables City dropdown
    └── Select City → [Step 4: Test Date] (/wizard/test-date/{locationCode})

[Step 4: Test Date] (/wizard/test-date/{locationCode})
    │
    └── Select date range + "Find sessions" → [Session Results] (/book-ielts)

[Session Results] (/book-ielts)
    │
    ├── "Select and continue" → [Booking/Payment] (Unknown URL)
    ├── Click criteria chip → Returns to relevant wizard step (inferred)
    ├── Test centre location → Google Maps (external, new tab)
    └── "Need help" → Help content (Unknown)
```

---

## External Links (Observed)

| From Page | Link Text | Destination | Opens In |
|-----------|-----------|-------------|----------|
| Wizard Landing | Terms & Conditions | `ielts.idp.com/legal-notices#ielts-test-and-payment-terms-and-conditions` | Unknown |
| Wizard Landing | Privacy Policy | `ielts.idp.com/legal-notices#ielts-australia-privacy-policy` | Unknown |
| Wizard Landing | IDP IELTS Logo (footer) | `ielts.idp.com` | Unknown |
| Test Type | Check who accepts IELTS here | `ielts.idp.com/about/who-accepts-ielts/organisations-that-accept-ielts` | Unknown |
| Test Location | Explore IELTS Online | `bx.ielts.dev.idp.com/booking` | New tab (newtab icon) |
| Session Results | Test centre location | Google Maps (coordinates) | New tab (newtab icon) |

---

## Persistent Components (Present on All Pages)

| Component | Type | Notes |
|-----------|------|-------|
| Language Selector (EN) | Button + Dropdown | Top-right |
| User Icon | Button | Top-right |
| IDP IELTS Logo (footer) | Link | Bottom of page |
| Back Arrow | Button | Present from Step 1 onwards |

---

## Navigation Patterns

| Pattern | Behaviour | Confidence |
|---------|-----------|------------|
| Forward navigation (Steps 1-2) | Card click = advance to next step | High |
| Forward navigation (Step 3) | Dropdown selection = advance | High |
| Forward navigation (Step 4) | Date selection on calendar = advance (inferred) | Medium |
| Back navigation | Back arrow button returns to previous step | High |
| No skip | Steps must be completed sequentially | High |
| State preservation on back | Unknown | Unknown |
| URL parameterization | Step 4 URL includes location code (e.g., `/test-date/ioc`) | High |

---

## Last Updated

2026-08-06 — Based on discovery of `/wizard`, `/wizard/test-type`, `/wizard/type-academic`, `/wizard/test-location`, `/wizard/test-date/ioc`, and `/book-ielts`
