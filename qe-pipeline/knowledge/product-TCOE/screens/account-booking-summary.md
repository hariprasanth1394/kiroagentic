# Account - Booking Summary / Review

## Purpose

Review step of the booking flow. Displays the user's profile and ID details, the selected written (LRW) and Speaking sessions, promotions, a voucher-code field, and the payment breakdown. The user confirms T&C consent and proceeds to payment.

---

## Page Details

| Field | Value |
|-------|-------|
| Page Name | Booking Summary / Review |
| Module | Account / Booking |
| URL | `https://bx.ielts.sit.idp.com/account/booking-summary` |
| Title | Idp |
| Environment | SIT |
| Breadcrumb | Booking progress stepper (Test date ✓ → Account ✓ → Review → Payment → Profile & ID → Booking complete) |

---

## Entry Conditions

- User completed the setup-account form and clicked "Save and continue" (or reached here directly when profile was already complete)

---

## Exit Conditions

- User ticks the T&C consent checkbox and clicks "Confirm and proceed with payment" (disabled until consent given)
- "Back" returns to the previous step
- "Edit" links return to the relevant booking/profile step

---

## Booking Progress Stepper

| Order | Step | State (this run) |
|-------|------|------------------|
| 1 | Test date | Completed (checkmark) |
| 2 | Account | Completed (checkmark) |
| 3 | Review | Current |
| 4 | Payment | Pending |
| 5 | Profile & ID | Pending |
| 6 | Booking complete | Pending |

---

## Main Components

### Header

| Component | Type | Description |
|-----------|------|-------------|
| IDP Logo | Image | Brand logo |
| Progress Stepper | Navigation | Test date (✓) → Account (✓) → Review → Payment → Profile & ID → Booking complete |
| User Avatar ("T") | Button | Account menu |

### Left Column — Profile & ID Review

**IELTS profile** (read-only summary, with Edit button):

| Field | Observed Value (test data) |
|-------|----------------------------|
| Title | Miss |
| Gender | Female |
| First name | Testuser |
| Family name | Teueudhe23 |
| Date of birth | 12/12/2000 |
| First language | Armenian |
| Email (Verified) | testuseyrrjb@gmail.com |
| Mobile | +61 - 234567890 |
| Level of education | Secondary 16 to 19 years |
| Years studying English | 4 years |

**Identification Document (ID)** (read-only summary, with Edit button):

| Field | Observed Value (test data) |
|-------|----------------------------|
| Identification type | Passport |
| Nationality on your ID | Albania |
| ID number | ewqweq |
| ID expiry date | 12/12/2030 |
| ID issuing authority | ssew |

### Right Column — Booking Summary

**Session details** — Heading "IELTS on Computer Academic":

| Slot | Date | Details | Edit target |
|------|------|---------|-------------|
| Listening, Reading, Writing | Wed 16 Sep | IDP IELTS Test Centre Building Melbourne, 7:30 AM, IELTS on computer | `bxsearch.ielts.sit.idp.com/book-ielts/?isMinor=false` |
| Speaking | Wed 16 Sep | IDP IELTS Test Centre Building Melbourne, 7:00 AM | `bxsearch.ielts.sit.idp.com/book-ielts/speaking?isMinor=false` |

**Booking promotion:** "Book now to receive a free IELTS Preparation course" — study materials, sample questions, 60+ video tutorials. (Appears twice in DOM.)

**Voucher code:** Textbox "Enter voucher code here (optional)" + "Apply" button. (Appears twice in DOM.)

**Payment details:**

| Line | Amount |
|------|--------|
| IELTS on Computer Academic | AUD 200 |
| GST | AUD 50 |
| **Total** | **AUD 250** |

**Consent & Action:**

| Component | Type | Description |
|-----------|------|-------------|
| T&C Consent | Checkbox | "By proceeding, I confirm that I have read and agreed to the IELTS on Computer Academic Terms and Conditions" (links to T&C PDF) |
| Confirm and proceed with payment | Button | Disabled until consent checkbox is ticked |

---

## User Actions

| Action | Target | Expected Result |
|--------|--------|-----------------|
| Click "Edit" (profile) | Edit button | Returns to profile edit |
| Click "Edit" (ID) | Edit button | Returns to ID edit |
| Click "Edit" (LRW session) | Link | Returns to session selection (`/book-ielts/?isMinor=false`) |
| Click "Edit" (Speaking) | Link | Returns to speaking selection (`/book-ielts/speaking?isMinor=false`) |
| Enter voucher + Apply | Voucher field + button | Applies discount code |
| Tick T&C consent | Checkbox | Enables "Confirm and proceed with payment" |
| Click "Confirm and proceed with payment" | Button | Proceeds to Payment step (once consent given) |
| Click "Back" | Button | Returns to previous step |
| Click "Terms and Conditions" | Link | Opens T&C PDF |

---

## Business Rules

1. **Review before payment** — All profile, ID, and session details are shown for confirmation before payment
2. **Editable sections** — Profile, ID, and each session slot have Edit links back to their respective steps
3. **Payment breakdown** — Price + GST shown separately with a Total (AUD 200 + AUD 50 = AUD 250)
4. **Voucher code optional** — Optional discount code with Apply
5. **T&C consent required** — "Confirm and proceed with payment" is disabled until the consent checkbox is ticked
6. **Promotion** — Free IELTS Preparation course promoted with booking
7. **Email verified** — Account email shows a "Verified" status
8. **Edit links carry isMinor flag** — Session edit URLs include `?isMinor=false` (reflects the booking-for = self/adult choice)

---

## Dependencies

| Trigger | Effect |
|---------|--------|
| Save and continue (setup-account) OR complete profile | Routes here |
| Tick consent checkbox | Enables "Confirm and proceed with payment" |
| Confirm and proceed | Proceeds to Payment step |
| Apply voucher | Adjusts payment total (behaviour not yet observed) |

---

## Navigation

| From | To | Trigger |
|------|-----|---------|
| Setup Account (`/account/setup-account`) | Booking Summary | Save and continue |
| Booking Summary | Payment step | Confirm and proceed with payment (after consent) |
| Booking Summary | Session selection | Click session "Edit" links |
| Booking Summary | Previous step | Click "Back" |
| Booking Summary | T&C PDF | Click "Terms and Conditions" |

---

## Validation Rules

- "Confirm and proceed with payment" disabled until T&C consent checkbox is ticked (observed disabled)
- Voucher validation behaviour not yet observed — Unknown

---

## Known Limitations

- **DOM shows error/consent messages:** "An error has occurred", "An error has occured" (sic), "Unable to continue booking", "Consent unavailable". These were present in the snapshot; their trigger conditions are not confirmed — possibly related to a consent service. Flagged for investigation, not treated as normal state.
- Booking promotion and Voucher code blocks appear **duplicated** in the DOM (twice each) — may be a rendering issue on SIT
- Voucher apply behaviour and payment-total recalculation not yet observed
- Post-confirm Payment page not yet observed

---

## Regression Impact

- Final review before payment — data shown here must accurately reflect all prior selections
- Payment breakdown (price/GST/total) accuracy is critical
- Consent gating is a compliance control before payment
- The observed error/consent messages suggest a potential defect area worth monitoring

---

## Notes

- SIT environment; subdomain `bx.ielts.sit.idp.com`; Edit links point back to `bxsearch.ielts.sit.idp.com`
- All personal/ID values above are test data entered during discovery
- This page was NOT present in the prior PKB (new discovery)

---

## Confidence

| Section | Confidence |
|---------|-----------|
| Page Details | High |
| Components | High |
| Business Rules | High (values, breakdown, gating observed) |
| Navigation | Medium (payment destination inferred; not yet observed) |
| Error/consent messages | Low (present in DOM; cause unconfirmed) |
| Validation Rules | Medium |
