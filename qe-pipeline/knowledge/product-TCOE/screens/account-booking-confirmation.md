# Account - Booking Confirmation (Reserved)

## Purpose

Final step of the booking flow. Confirms the test is reserved and prompts the user to complete remaining post-booking information (about you, address, occupation) and to complete payment by the deadline. Represents the "Booking complete" stage of the stepper.

---

## Page Details

| Field | Value |
|-------|-------|
| Page Name | Booking Confirmation (Reserved) |
| Module | Account / Booking |
| URL | `https://bx.ielts.sit.idp.com/account/booking-confirmation-v2` |
| Title | Idp |
| Environment | SIT |
| Breadcrumb | Booking progress stepper (Test date ✓ → Account ✓ → Review ✓ → Payment ✓ → Profile & ID ✓ → Booking complete) |

---

## Entry Conditions

- User clicked "Reserve now" on the Offline Payment page (booking reserved)

---

## Exit Conditions

- User completes the post-booking info sections and clicks "Continue to next step" (disabled until sections completed)
- User clicks "Complete payment" to view/complete payment instructions

---

## Booking Progress Stepper

| Order | Step | State (this run) |
|-------|------|------------------|
| 1 | Test date | Completed (checkmark) |
| 2 | Account | Completed (checkmark) |
| 3 | Review | Completed (checkmark) |
| 4 | Payment | Completed (checkmark) |
| 5 | Profile & ID | Completed (checkmark) |
| 6 | Booking complete | Current |

---

## Main Components

### Header

| Component | Type | Description |
|-----------|------|-------------|
| IDP Logo | Image | Brand logo |
| Progress Stepper | Navigation | All prior steps checkmarked; "Booking complete" current |
| User Avatar ("T") | Button | Account menu |

### Confirmation Header

| Component | Type | Description |
|-----------|------|-------------|
| Calendar Icon | Image | "Multicolorcalender" |
| Heading | Heading (H2) | "Your test is reserved! Complete your booking" |
| Message | Paragraph | "Please provide the following information to finish your booking. This helps us improve our services and may be required by some IELTS organisations and regulators." |

### Post-Booking Info Sections (Accordions)

| Section | State | Notes |
|---------|-------|-------|
| About you | Incomplete | Collapsed accordion; fields not yet observed |
| Your address | Incomplete | Collapsed accordion; fields not yet observed |
| Your occupation | Incomplete | Collapsed accordion; fields not yet observed |

### Booking / Payment Panel

| Component | Type | Description |
|-----------|------|-------------|
| Test Type | Heading (H3) | "IELTS on Computer Academic" |
| Test Centre | Text + location icon | "IDP IELTS Test Centre Building Melbourne" |
| Address | Text + location icon | "L7/170 Queen Brampton auatralia test centre, Melbourne VIC 30d" (test data) |
| Payment Reminder | Info panel | "Ready to pay now? To confirm your IELTS test reservation, you must complete payment by **3am, 14 Sep 2026**. If you do not, your reservation will be cancelled, and you will not be able to sit the test. View the payment instructions now or access them later through your account." |
| Complete payment | Button (external link) | Opens payment instructions |
| Close | Button | Dismisses the payment reminder panel |

**Session Details:**

| Slot | Date | Time | Format |
|------|------|------|--------|
| Listening, Reading Writing test | 16/09/2026 | 7:30 AM | IELTS on Computer |
| Speaking test | 16/09/2026 | 7:00 AM | — |

### Action

| Component | Type | Description |
|-----------|------|-------------|
| Continue to next step | Button | Disabled until post-booking info sections completed |

---

## User Actions

| Action | Target | Expected Result |
|--------|--------|-----------------|
| Expand "About you" | Accordion | Reveals about-you fields (not yet observed) |
| Expand "Your address" | Accordion | Reveals address fields (not yet observed) |
| Expand "Your occupation" | Accordion | Reveals occupation fields (not yet observed) |
| Click "Complete payment" | Button (external link) | Opens payment instructions |
| Click "Continue to next step" | Button | Proceeds after info sections completed |
| Click "Close" | Payment panel close | Dismisses the payment reminder |

---

## Business Rules

1. **Test reserved on "Reserve now"** — Reservation is confirmed but booking is not final until payment + info are complete
2. **Post-booking info required** — "About you", "Your address", "Your occupation" must be completed (all start Incomplete)
3. **Payment deadline enforced** — Must pay by 3am, 14 Sep 2026 or the reservation is cancelled and the test cannot be sat
4. **Payment can be deferred** — Payment instructions can be viewed now or accessed later via the account
5. **Continue gated** — "Continue to next step" is disabled until the info sections are completed
6. **Info may be regulator-required** — Message notes some IELTS organisations/regulators may require this information

---

## Dependencies

| Trigger | Effect |
|---------|--------|
| "Reserve now" on Offline Payment | Routes here; test reserved |
| Complete post-booking info sections | Enables "Continue to next step" |
| Complete payment by deadline | Confirms the reservation |
| Deadline passes without payment | Reservation cancelled |

---

## Navigation

| From | To | Trigger |
|------|-----|---------|
| Offline Payment (`/account/booking-summary/payment-offline`) | Booking Confirmation | Click "Reserve now" |
| Booking Confirmation | Payment instructions | Click "Complete payment" |
| Booking Confirmation | Next step | Click "Continue to next step" (after info complete) |

---

## Validation Rules

- "Continue to next step" disabled until post-booking info sections completed (observed disabled)
- Section field requirements not yet observed (accordions collapsed)

---

## Known Limitations

- The three info accordions (About you / Your address / Your occupation) are collapsed — their fields/requirements not yet observed
- **DOM shows "Payment Failed"** message — present in the snapshot; cause unconfirmed. Since offline payment is expected to be completed later, this may be a state/messaging artefact — flagged, not treated as confirmed behaviour.
- Downstream after "Continue to next step" and the payment-instructions screen not yet observed
- Address text is test data

---

## Online Payment Outcome & Post-Booking Sequence (User-Provided — Not Yet Observed)

> Source: User-provided during discovery, 2026-09-09. NOT directly observed in the browser this session. Confidence: Medium (to be verified by walking the online-payment flow).

- **Same page, different message:** When payment is made **online** (via a provider such as **Stripe / Braintree** or similar), the user lands on this same confirmation page but the message is **"Payment successful"** — instead of the offline "reserved / pay by deadline" messaging observed in this session.
- **Post-booking info becomes fillable:** After successful online payment, the user can complete the previously-Incomplete sections — **About you**, **Your address**, and **IELTS info** — on this page.
- **Then ID upload:** Clicking **Next** takes the user to a step to **upload an ID image**.
- **Then IDV consent:** The next page is a **consent page for IDV (Identity Verification)**.
- **Booking complete → redirect:** Once the user agrees to the IDV consent, the flow shows **"Booking complete"** and redirects the user to the **Dashboard** or a **test-booking page**.

### Full post-payment sequence (user-provided)

```
[Booking Confirmation] (Payment successful)
   → fill About you / Your address / IELTS info
   → Next → [Upload ID image]
   → [IDV consent page]  (user agrees)
   → "Booking complete"
   → redirect to Dashboard / test-booking page
```

---

## Key Business Rule — Profile Scope (User-Provided — Not Yet Observed)

> Source: User-provided during discovery, 2026-09-09. NOT directly observed. Confidence: Medium. Flagged as a likely-important behaviour for test design.

- The post-booking details (**About you / address / IELTS info**, etc.) are saved against the **Application Profile** (i.e. tied to this specific booking/application) — **NOT** against the user's **created (account) Profile**.
- **Consequence:** If the same user books **another session**, the previously-entered profile information is **not carried over** — they must re-enter it. This means the "incomplete profile" / info-collection steps recur per booking rather than being remembered on the account.
- **Test-design implication:** Regression/automation should not assume profile data persists across bookings for the same account. A second booking by the same user is expected to require re-entry.

---

## Regression Impact

- Terminal confirmation step — must accurately reflect the reserved booking and payment deadline
- Post-booking info gating affects booking finalisation
- Payment deadline messaging is critical to avoid unintended cancellations
- The "Payment Failed" message warrants investigation as a potential defect

---

## Notes

- SIT environment; subdomain `bx.ielts.sit.idp.com`
- URL: `/account/booking-confirmation-v2` (note the `-v2` suffix)
- All six stepper stages now complete/current — this is the end of the booking flow walked in this session
- This page was NOT present in the prior PKB (new discovery)

---

## Confidence

| Section | Confidence |
|---------|-----------|
| Page Details | High |
| Components | High |
| Business Rules | High (reservation, deadline, gating observed) |
| Navigation | Medium (post-continue and payment-instructions not observed) |
| Info section fields | Low (accordions collapsed) |
| "Payment Failed" message | Low (present in DOM; cause unconfirmed) |
