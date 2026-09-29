# Book IELTS - Speaking Test Selection

## Purpose

First step after selecting a written (Listening, Reading, Writing) session. Shows the booking summary (written + speaking slots), lets the user pick a speaking test slot, and select who the booking is for. Also surfaces the overall booking progress stepper and a "registered agent" (book on behalf) option.

---

## Page Details

| Field | Value |
|-------|-------|
| Page Name | Speaking Test Selection |
| Module | Booking |
| URL | `https://bxsearch.ielts.sit.idp.com/book-ielts/speaking` |
| Title | Book an IELTS Test \| IDP IELTS |
| Environment | SIT |
| Breadcrumb | Booking progress stepper (see below) |

---

## Entry Conditions

- User clicked "Select and continue" on a session in the Session Results Listing (`/book-ielts`)
- Written (LRW) session selected and carried forward

---

## Exit Conditions

- User selects who the booking is for, confirms a speaking slot, and clicks "Next step" (button disabled until required selections are made)
- "Back to session list" returns to the results listing

---

## Booking Progress Stepper

Displayed in the header as the overall booking flow:

| Order | Step |
|-------|------|
| 1 | Test date |
| 2 | Account |
| 3 | Review |
| 4 | Payment |
| 5 | Profile & ID |
| 6 | Booking complete |

---

## Main Components

### Header

| Component | Type | Description |
|-----------|------|-------------|
| IDP IELTS Logo | Link/Image | Links to home |
| Progress Stepper | Text steps | Test date → Account → Review → Payment → Profile & ID → Booking complete |
| Language Selector (EN) | Button | Language dropdown |
| User Avatar ("T") | Button | Account menu |

### Booking Summary Card

| Component | Type | Description |
|-----------|------|-------------|
| Test Type | Heading (H2) | "IELTS Academic" |
| Test Centre | Text + location icon | "IDP IELTS Test Centre Building Melbourne" |
| Address | Text + address icon | "L7/170 Queen Brampton auatralia test centre" (sic — test data) |
| LRW Slot | Heading (H4) + date/time | "Listening, Reading and Writing" — 16/09/2026, 7:30 AM — with "Change" |
| Speaking Slot | Heading (H4) + date/time | "Speaking" — 16/09/2026, 7:00 AM — "Best available", with "Change" |

### Who Is Booking For

| Component | Type | Description |
|-----------|------|-------------|
| Section Heading | Heading (H2) | "Who are you booking the IELTS test for?" |
| Self option | Radio | "I'm booking for myself (I am 18 or older)" |
| Guardian option | Radio | "I'm a parent or guardian booking for someone under 18" |

### Select Your Speaking Test (Panel)

| Component | Type | Description |
|-----------|------|-------------|
| Panel Heading | Heading (H3) | "Select your speaking test" |
| Close | Button | Dismisses the panel |
| Timing Tabs | Tablist | "Before written test", "Same day" (selected), "After written test" |
| Slot Option | Clickable | "7:00 AM" — labelled "Best available" (under "Same day" tab) |

### Registered Agent Panel ("Book on behalf")

| Component | Type | Description |
|-----------|------|-------------|
| Panel Heading | Heading (H3) | "Booking as a registered agent" |
| Close | Button | Dismisses the panel |
| Title | Heading (H2) | "Book on behalf" |
| Description | Paragraph | "Use this option if you are an authorised IELTS agent booking for a test taker." |
| How it works | Ordered list | 1) Verify agent registration; 2) Upload consent documents; 3) Create accounts and complete bookings |
| Confirm and Proceed | Button | Proceeds with agent booking |

### Footer / Actions

| Component | Type | Description |
|-----------|------|-------------|
| Back to session list | Link/Text | Returns to `/book-ielts` |
| Next step | Button | Disabled until required selections complete |

---

## User Actions

| Action | Target | Expected Result |
|--------|--------|-----------------|
| Select "booking for myself" / "parent or guardian" | Radio | Sets who the booking is for |
| Click a speaking slot (e.g. "7:00 AM") | Slot option | Selects the speaking test slot |
| Switch speaking timing tab | Tab | Shows slots for Before / Same day / After written test |
| Click "Change" (LRW) | Link | Modify written session (behaviour not yet observed) |
| Click "Change" (Speaking) | Link | Modify speaking slot |
| Click "Next step" | Button | Proceeds to next booking step (enabled once required selections made) |
| Click "Back to session list" | Link | Returns to `/book-ielts` |
| Click "Confirm and Proceed" (agent) | Button | Starts registered-agent booking path |

---

## Business Rules

1. **Speaking booked with written** — After choosing the written (LRW) session, the user selects a Speaking slot; the summary shows both
2. **Speaking timing options** — Speaking can be scheduled "Before written test", "Same day", or "After written test" (Same day selected by default in this run)
3. **"Best available" speaking slot** — A recommended slot is surfaced (7:00 AM in this run)
4. **Booking-for selection required** — User must indicate booking for self (18+) or as parent/guardian for someone under 18
5. **Next gated** — "Next step" button is disabled until required selections are made
6. **Registered agent path** — Authorised agents can book on behalf via a separate flow (verify registration → upload consent → create accounts/bookings)
7. **Both slots changeable** — "Change" is available for both LRW and Speaking

---

## Dependencies

| Trigger | Effect |
|---------|--------|
| "Select and continue" on results page | Navigates here with the chosen written session |
| Select booking-for + speaking slot | Enables "Next step" |
| Click Next step | Proceeds to next booking step (Account/Review per stepper) |

---

## Navigation

| From | To | Trigger |
|------|-----|---------|
| Session Results (`/book-ielts`) | Speaking Selection (`/book-ielts/speaking`) | Click "Select and continue" |
| Speaking Selection | Session Results | Click "Back to session list" |
| Speaking Selection | Next booking step | Click "Next step" (once enabled) |

---

## Validation Rules

- "Next step" disabled until required selections (booking-for and/or speaking slot) are made — observed disabled in initial state
- Specific error text / which selection unlocks Next not yet confirmed — Unknown

---

## Known Limitations

- Whether both "booking-for" AND a speaking slot are required to enable Next is not yet confirmed
- Behaviour of "Change" links not yet observed
- Registered-agent ("Confirm and Proceed") flow not yet walked
- Address text appears to be test data ("L7/170 Queen Brampton auatralia test centre")
- The header progress stepper does not visibly indicate the current active step in this snapshot

---

## Regression Impact

- Introduces speaking-slot selection — a required part of the booking not captured before this page
- Booking-for logic (adult vs under-18 guardian) may branch downstream data collection
- Registered-agent path is a distinct booking mode with compliance steps

---

## Notes

- SIT environment (`bxsearch.ielts.sit.idp.com`)
- URL extends the booking path: `/book-ielts/speaking`
- Confirms the full booking flow shape via stepper: Test date → Account → Review → Payment → Profile & ID → Booking complete
- This page was NOT present in the prior PKB (new discovery)

---

## Confidence

| Section | Confidence |
|---------|-----------|
| Page Details | High |
| Components | High |
| Business Rules | High (selections, tabs, and gating observed) |
| Navigation | Medium (Next destination inferred from stepper; not yet observed) |
| Validation Rules | Medium (disabled state observed; exact unlock condition not confirmed) |
