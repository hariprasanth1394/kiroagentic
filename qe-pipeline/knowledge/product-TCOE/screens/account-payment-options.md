# Account - Payment Options

## Purpose

Payment step of the booking flow. Lets the user choose how to pay for the booking — online (card) or offline — before completing the booking. Offline payment carries a payment deadline after which the booking is cancelled.

---

## Page Details

| Field | Value |
|-------|-------|
| Page Name | Payment Options |
| Module | Account / Booking |
| URL | `https://bx.ielts.sit.idp.com/account/booking-summary/payment-options` |
| Title | Idp |
| Environment | SIT |
| Breadcrumb | Booking progress stepper (Test date ✓ → Account ✓ → Review ✓ → Payment → Profile & ID → Booking complete) |

---

## Entry Conditions

- User ticked T&C consent and clicked "Confirm and proceed with payment" on the Booking Summary page

---

## Exit Conditions

- User selects a payment method (Pay online or Pay Offline) to proceed
- "Back to previous" returns to the Booking Summary

---

## Loading Behaviour (Observed)

- Payment methods load asynchronously. On first render the methods list was empty; after a short wait the "Pay online" and "Pay Offline" options appeared.
- DOM also contained transient messages: "Application timeout", "An error has occurred", "Unable to continue booking", "Consent unavailable" (see Known Limitations).

---

## Booking Progress Stepper

| Order | Step | State (this run) |
|-------|------|------------------|
| 1 | Test date | Completed (checkmark) |
| 2 | Account | Completed (checkmark) |
| 3 | Review | Completed (checkmark) |
| 4 | Payment | Current |
| 5 | Profile & ID | Pending |
| 6 | Booking complete | Pending |

---

## Main Components

### Header

| Component | Type | Description |
|-----------|------|-------------|
| IDP Logo | Image | Brand logo |
| Progress Stepper | Navigation | Test date (✓) → Account (✓) → Review (✓) → Payment → Profile & ID → Booking complete |
| User Avatar ("T") | Button | Account menu |

### Main Section

| Component | Type | Description |
|-----------|------|-------------|
| Back to previous | Button | Returns to Booking Summary |
| Heading | Heading (H2) | "How would you like to pay?" |

### Offline Payment Notice

| Component | Type | Description |
|-----------|------|-------------|
| Notice | Info banner | "Please note: If you choose to pay offline please complete your payment before the date indicated, otherwise your booking would be cancelled" |
| Dismiss notice | Button | Closes the notice |

### Payment Method Options (List)

| Option | Icon | Details | Action |
|--------|------|---------|--------|
| Pay online | card icon | (Card payment) | Arrow button to proceed |
| Pay Offline | business icon | Clock: "Pay by 14 September, 3am"; description "this is for testing" (test data) | Arrow button to proceed |

---

## User Actions

| Action | Target | Expected Result |
|--------|--------|-----------------|
| Click "Pay online" | Option / arrow | Proceeds to online (card) payment |
| Click "Pay Offline" | Option / arrow | Proceeds with offline payment (pay by deadline) |
| Click "Dismiss notice" | Notice close | Dismisses the offline-payment notice |
| Click "Back to previous" | Button | Returns to Booking Summary |

---

## Business Rules

1. **Two payment methods** — Pay online (card) and Pay Offline
2. **Offline payment deadline** — Offline payment must be completed before an indicated date/time ("Pay by 14 September, 3am" in this run), or the booking is cancelled
3. **Notice warns of cancellation** — Explicit banner about the offline payment deadline and cancellation consequence
4. **Payment step follows Review** — Reached only after confirming the booking summary and T&C consent

---

## Dependencies

| Trigger | Effect |
|---------|--------|
| Confirm and proceed with payment (Booking Summary) | Routes here |
| Select a payment method | Proceeds to that method's flow |
| Offline deadline passes without payment | Booking cancelled (per notice) |

---

## Navigation

| From | To | Trigger |
|------|-----|---------|
| Booking Summary (`/account/booking-summary`) | Payment Options | Confirm and proceed with payment |
| Payment Options | Online payment flow | Click "Pay online" |
| Payment Options | Offline payment flow | Click "Pay Offline" |
| Payment Options | Booking Summary | Click "Back to previous" |

---

## Validation Rules

- No form inputs on this page (method selection)
- Payment method availability is loaded asynchronously; empty state observed before load completes

---

## Known Limitations

- **DOM error/consent messages present:** "Application timeout", "An error has occurred", "An error has occured" (sic), "Unable to continue booking", "Consent unavailable". These appeared alongside the (eventually loaded) options. Their trigger/impact is unconfirmed — flagged for investigation, not treated as normal.
- Payment options initially rendered empty and populated after a delay — possible latency/loading issue on SIT
- The offline deadline value ("14 September, 3am") is dynamic/data-driven
- Pay Offline description "this is for testing" is test data
- Downstream flows for both Pay online and Pay Offline not yet observed

---

## Online Payment Branch (User-Provided — Not Yet Observed)

> Source: User-provided during discovery, 2026-09-09. NOT directly observed in the browser this session. Confidence: Medium (to be verified by walking the online flow).

- Selecting **Pay online** uses a payment provider (e.g. **Stripe, Braintree**, or similar) to take card payment.
- On successful online payment, the user lands on the **same confirmation page** as the offline branch (`/account/booking-confirmation-v2`), but the message is **"Payment successful"** (vs the reserved/deadline messaging on the offline branch).
- A successful online payment then unlocks the post-booking information flow (see booking-confirmation doc): About you → Your address → IELTS info → upload ID image → IDV consent → Booking complete.

---

## Regression Impact

- Payment method selection is a critical conversion point
- Offline deadline logic drives booking cancellation — errors here have financial/booking consequences
- The async loading + error messages suggest a fragile area worth monitoring for flakiness

---

## Notes

- SIT environment; subdomain `bx.ielts.sit.idp.com`
- URL nests under booking summary: `/account/booking-summary/payment-options`
- This page was NOT present in the prior PKB (new discovery)

---

## Confidence

| Section | Confidence |
|---------|-----------|
| Page Details | High |
| Components (after load) | High |
| Business Rules | High (both methods + offline notice observed) |
| Navigation | Medium (downstream payment flows not yet observed) |
| Error/timeout messages | Low (present in DOM; cause unconfirmed) |
| Loading behaviour | High (empty-then-populated observed directly) |
