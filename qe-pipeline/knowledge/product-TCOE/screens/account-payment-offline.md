# Account - Offline Payment

## Purpose

Offline payment step reached after selecting "Pay Offline". Lists the accepted offline payment methods at the test centre, restates the booking summary and payment total with the payment deadline, and lets the user reserve the booking ("Reserve now"). Detailed payment instructions are provided on the next screen.

---

## Page Details

| Field | Value |
|-------|-------|
| Page Name | Offline Payment |
| Module | Account / Booking |
| URL | `https://bx.ielts.sit.idp.com/account/booking-summary/payment-offline` |
| Title | Idp |
| Environment | SIT |
| Breadcrumb | Booking progress stepper (Test date ✓ → Account ✓ → Review ✓ → Payment → Profile & ID → Booking complete) |

---

## Entry Conditions

- User selected "Pay Offline" on the Payment Options page

---

## Exit Conditions

- User clicks "Reserve now" to reserve the booking (detailed payment instructions provided on the next screen)
- "Update Payment" returns to change the payment method

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

### Left Column — Accepted Payment Options

| Component | Type | Description |
|-----------|------|-------------|
| Update Payment | Button | Returns to change payment method |
| Section Heading | Heading (H2) | "Accepted payment options at this test centre" |
| Deadline Note | Paragraph | "Your booking would be cancelled if you fail to pay by the due date" |
| Alert | Alert (red) | "Please accept the terms and conditions and click 'Reserve Now' to proceed with your booking. Detailed payment instructions will be provided on the next screen." |

**Accepted Methods (list):**

| Method | Instruction |
|--------|-------------|
| Cash | "Please visit the centre with cash before the deadline." |
| Cheque | "Please visit the centre with your cheque before the deadline." |
| Fund Transfer | "Please complete your bank transfer before the deadline." |
| aaa | "sssss" (test data) |

### Right Column — Booking Summary

**Session details** — Heading "IELTS on Computer Academic":

| Slot | Date | Details |
|------|------|---------|
| Listening, Reading, Writing | Wed 16 Sep | IDP IELTS Test Centre Building Melbourne, 7:30 AM, IELTS on computer |
| Speaking | Wed 16 Sep | IDP IELTS Test Centre Building Melbourne, 7:00 AM |

**Booking promotion:** "Book now to receive a free IELTS Preparation course" (appears twice in DOM).

**Payment details:**

| Line | Amount |
|------|--------|
| Deadline | Pay by 14 September, 3am (clock icon) |
| IELTS on Computer Academic | AUD 200 |
| GST | AUD 50 |
| **Total** | **AUD 250** |

### Action

| Component | Type | Description |
|-----------|------|-------------|
| Reserve now | Button | Reserves the booking; next screen provides detailed payment instructions |

---

## User Actions

| Action | Target | Expected Result |
|--------|--------|-----------------|
| Click "Reserve now" | Button | Reserves booking; proceeds to payment instructions / next step |
| Click "Update Payment" | Button | Returns to payment options to change method |

---

## Business Rules

1. **Accepted offline methods** — Cash, Cheque, Fund Transfer (plus a test-data entry "aaa") are the offline options at this centre
2. **Method instructions** — Each method includes an instruction to complete payment before the deadline
3. **Deadline enforced** — Booking is cancelled if not paid by the due date ("Pay by 14 September, 3am")
4. **Reserve to proceed** — User clicks "Reserve now"; detailed payment instructions are provided on the next screen
5. **Terms acceptance referenced** — Alert instructs the user to accept T&C and click "Reserve Now" (T&C was accepted on the Booking Summary step)
6. **Payment total consistent** — AUD 200 + GST AUD 50 = AUD 250 (matches Booking Summary)
7. **Centre-specific** — Accepted methods are described as "at this test centre" — may vary by centre

---

## Dependencies

| Trigger | Effect |
|---------|--------|
| "Pay Offline" on Payment Options | Routes here |
| Reserve now | Reserves booking; proceeds to instructions/next step |
| Update Payment | Returns to Payment Options |
| Deadline passes without payment | Booking cancelled (per notice) |

---

## Navigation

| From | To | Trigger |
|------|-----|---------|
| Payment Options (`/account/booking-summary/payment-options`) | Offline Payment | Click "Pay Offline" |
| Offline Payment | Payment instructions / next step | Click "Reserve now" |
| Offline Payment | Payment Options | Click "Update Payment" |

---

## Validation Rules

- No form inputs on this page
- Reserve now behaviour (success screen vs. further steps) not yet observed

---

## Known Limitations

- **DOM error/consent messages present:** "An error has occurred", "An error has occured" (sic), "Unable to continue booking", "Consent unavailable". Present in the snapshot; cause unconfirmed — flagged, not treated as normal.
- Booking promotion block appears **duplicated** in the DOM
- Payment method "aaa" / "sssss" is clearly test data
- Post-"Reserve now" screen (payment instructions, Profile & ID, Booking complete) not yet observed
- Deadline value is dynamic/data-driven

---

## Regression Impact

- Final action before reservation — "Reserve now" commits the booking (pending offline payment)
- Accepted-methods list is centre-specific and data-driven — errors could mislead users on how to pay
- Deadline logic drives cancellation — financial/booking consequences
- Payment total must match prior steps

---

## Notes

- SIT environment; subdomain `bx.ielts.sit.idp.com`
- URL: `/account/booking-summary/payment-offline`
- This page was NOT present in the prior PKB (new discovery)
- Represents the offline branch of the payment step; the online branch ("Pay online") was not walked

---

## Confidence

| Section | Confidence |
|---------|-----------|
| Page Details | High |
| Components | High |
| Business Rules | High (methods, deadline, total observed) |
| Navigation | Medium (post-Reserve flow not yet observed) |
| Error/consent messages | Low (present in DOM; cause unconfirmed) |
