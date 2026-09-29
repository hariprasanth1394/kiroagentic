# Workflow — IELTS Academic Booking (Offline Payment)

## Purpose

The complete end-to-end journey a real user takes to book an IELTS Academic (on Computer) test session and reserve it via **offline payment**. Captured live on SIT during discovery on 2026-09-09. This is the canonical "happy path" for a new user booking and paying offline.

---

## Start Page

Account Login / Signup Initiate — `https://account.ielts.sit.idp.com/login-initiate`

## End Page

Booking Confirmation (Reserved) — `https://bx.ielts.sit.idp.com/account/booking-confirmation-v2`
(Test reserved; payment to be completed offline by the deadline.)

---

## Environment & Hosts

| Host | Role |
|------|------|
| `account.ielts.sit.idp.com` | Account (login, register, dashboard) |
| `bxsearch.ielts.sit.idp.com` | Booking wizard + session search |
| `bx.ielts.sit.idp.com` | Booking account setup, summary, payment, confirmation |

---

## Navigation Flow

| # | Step | Page | URL | Key Action |
|---|------|------|-----|-----------|
| 1 | Enter email | Account Login Initiate | `account…/login-initiate` | Enter email (new user → register) |
| 2 | Register | Account Register | `account…/register` | Name, mobile, password, required consents → Next |
| 3 | Dashboard | Account Dashboard | `account…/dashboard` | Click "Book now" (opens wizard in NEW TAB) |
| 4 | Wizard Landing | Wizard Landing | `bxsearch…/wizard` | Click "Find an IELTS test session" card to enter the wizard |
| 5 | Wizard: Test Type | Test Type | `bxsearch…/wizard/test-type` | Select IELTS Academic |
| 6 | Wizard: Format | Format (Academic) | `bxsearch…/wizard/type-academic` | Select IELTS on Computer |
| 7 | Wizard: Module | Module Selection (Writing on Computer) | `{TBD}` | Select "Writing on Computer" module (⚠️ Low confidence — not yet inspected live; see screens/wizard-module-writing-on-computer.md) |
| 8 | Wizard: Location | Test Location | `bxsearch…/wizard/test-location` | Country = Australia → City = Melbourne |
| 9 | Wizard: Date | Test Date | `bxsearch…/wizard/test-date/ioc` | Select date range → results |
| 10 | Session Results | Session Listing | `bxsearch…/book-ielts` | "Select and continue" on a session |
| 11 | Speaking | Speaking Selection | `bxsearch…/book-ielts/speaking` | Booking-for = self; confirm speaking slot → Next step |
| 12a | (Conditional) Incomplete Profile | Incomplete Profile | `bx…/account/incomplete-profile` | "Complete profile" — shown only if profile data missing |
| 12b | (Conditional) Setup Account | Setup Account form | `bx…/account/setup-account` | Fill IELTS profile + ID → Save and continue |
| 13 | Booking Summary | Review | `bx…/account/booking-summary` | Tick T&C consent → Confirm and proceed with payment |
| 14 | Payment Options | Payment Options | `bx…/account/booking-summary/payment-options` | Choose "Pay Offline" (deadline timer visible — TCOE-1356 AC-1) |
| 15 | Offline Payment | Offline Payment | `bx…/account/booking-summary/payment-offline` | Review accepted methods → "Reserve now" |
| 16 | Confirmation | Booking Confirmation (Reserved) | `bx…/account/booking-confirmation-v2` | "Pay now" section present (TCOE-1356 AC-2/3); test reserved; pay by deadline |

**Conditional branch (Steps 12a/12b):** If the account profile is already complete, steps 12a and 12b are **skipped** and the flow goes straight from Speaking (step 11) to Booking Summary (step 13).

**⚠️ Step 7 (Module Selection — Writing on Computer):** Added after the product owner confirmed this page appears live between format and location. Not yet inspected in a live discovery pass — its URL/components/selectors are `{TBD}`. Capture on the next Product Knowledge run before automation depends on it.

```
Login → Register → Dashboard
   → [NEW TAB] Wizard Landing ("Find an IELTS test session")
   → Test Type (Academic) → Format (on Computer) → Module (Writing on Computer ⚠️) → Location → Date
   → Session Results → Speaking (booking-for + slot)
   → { profile incomplete: Incomplete Profile → Setup Account }   (skipped if complete)
   → Booking Summary (T&C consent)
   → Payment Options (deadline timer) → Pay Offline → Reserve now
   → Booking Confirmation (Reserved) ("Pay now" section)
```

---

## Business Rules (governing this workflow)

- New users must register with mandatory T&C/Privacy + overseas-data consents (BR-101, BR-102)
- Booking wizard opens in a new tab from the Dashboard (BR-104)
- SIT wizard is a 5-step flow (BR-105)
- Speaking is selected alongside the written session; booking-for (self/guardian) required (BR-106, BR-108)
- Incomplete-profile steps are conditional — shown only when profile data is missing (BR-110)
- Profile details must match test-day ID; printed on TRF, uneditable after issue (BR-111)
- T&C consent required before payment (BR-112)
- Offline payment must be completed by the deadline or the booking is cancelled (BR-114)
- Accepted offline methods are centre-specific: Cash, Cheque, Fund Transfer (BR-115)
- "Reserve now" reserves the booking pending offline payment (BR-116)

(See `business-rules.md` BR-100–BR-121 for full detail.)

---

## Dependencies

- **Authenticated account** — the entire booking flow requires a signed-in IDP account
- **Cross-tab** — the wizard runs in a separate browser tab from the account pages
- **API-driven data** — location/city lists, session availability, and payment options load asynchronously
- **Conditional profile detour** — depends on whether the account profile is complete
- **Payment deadline** — reservation depends on completing offline payment before the due date/time

---

## Failure Points (observed & likely)

- **Payment options load latency** — options rendered empty on first load and only appeared after a wait (SIT)
- **Recurring DOM error/consent messages** — "Application timeout", "An error has occurred", "Unable to continue booking", "Consent unavailable" across summary/payment pages; "Payment Failed" on confirmation. Cause unconfirmed — flagged for investigation.
- **Cross-tab / new-tab handling** — the wizard opening in a new tab is a common automation failure point
- **Cascading location dropdowns** — Country→City dependency is API-driven and a typical break point
- **Consent gating** — "Confirm and proceed" disabled until T&C ticked; "Next step" gated on selections
- **Conditional branch** — automation must handle both the incomplete-profile detour and the direct-to-summary path

---

## Regression Impact

- This is the primary revenue/conversion path — any break blocks real bookings end to end
- Highest-priority regression candidate: full offline booking happy path (new user)
- Must cover the conditional profile branch (both incomplete and complete profile states)
- Payment total accuracy (AUD 200 + GST 50 = 250) and offline deadline messaging are critical
- The recurring SIT error messages should be tracked as potential defects/flaky areas

---

## Related Workflow (Not Yet Walked)

- **Online payment variant** — user-provided (BR-118–121, not observed): "Pay online" via Stripe/Braintree lands on the same confirmation page with "Payment successful", then About you → Address → IELTS info → upload ID → IDV consent → Booking complete → redirect to Dashboard/test-booking. Post-booking details bind to the **Application Profile**, not the account Profile (not reused for a second booking).

---

## Confidence

| Section | Confidence |
|---------|-----------|
| Navigation Flow (offline path) | High (walked live end to end) |
| Conditional branch | High (user-confirmed + observed) |
| Business Rules | High (observed) |
| Failure Points | Medium (mix of observed and likely) |
| Online payment variant | Medium (user-provided, not observed) |
