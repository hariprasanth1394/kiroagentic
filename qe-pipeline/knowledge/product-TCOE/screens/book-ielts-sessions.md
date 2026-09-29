# Book IELTS - Session Results Listing

## Purpose

Displays available IELTS test sessions matching the user's wizard selections (test type, format, location, date range). This is the post-wizard results page where users select a specific session to book.

---

## Page Details

| Field | Value |
|-------|-------|
| Page Name | Session Results Listing |
| Module | Booking |
| URL (DEV) | `https://bxsearch.dev.ielts.com/book-ielts` |
| URL (SIT) | `https://bxsearch.ielts.sit.idp.com/book-ielts` |
| Title | Book an IELTS Test \| IDP IELTS |
| Breadcrumb | None visible |
| Wizard Step | Post-wizard (results) |

> **Environment differences (observed on SIT 2026-09-09):**
> - Page heading on SIT: **"Select your Listening, Reading, Writing test"** (DEV showed "Select your written test").
> - Results count observed: **"Displaying 45 test session(s)"** (DEV showed 25). Count is data-driven and varies by criteria.
> - Prices on SIT are clean: **AUD 250** per session (DEV had corrupted price values).
> - Each session card on SIT additionally shows a **"Writing on Computer"** row and an **"Accessible IELTS test location"** row.
> - Date range chip reflected the selected range: **"16/09/2026 - 30/09/2026"**.
> - Single test centre observed on SIT: **IDP IELTS Test Centre Building Melbourne** (Google Maps `-37.8164203,144.9587528`). Session times observed: 7:30 AM, 9:00 AM, 11:00 AM.

---

## Entry Conditions

- User completed the 4-step wizard and clicked "Find sessions"
- Wizard selections carried forward: Test Type, Format, Location, Date Range

---

## Exit Conditions

- User clicks "Select and continue" on a session → proceeds to booking/payment (Unknown)
- User clicks a filter/criteria chip to modify search → returns to relevant wizard step (inferred)

---

## Main Components

### Header / Search Summary Bar

| Component | Type | Description |
|-----------|------|-------------|
| IDP IELTS Logo | Link/Image | Links to home page |
| Test Type Chip | Clickable | "IELTS Academic" with icon — editable filter |
| Format Chip | Clickable | "IELTS on Computer" with icon — editable filter |
| Location Chip | Clickable | "Melbourne, Australia" with map icon — editable filter |
| Date Range Chip | Clickable | "12/08/2026 - 26/08/2026" with calendar icon — editable filter |
| Search Icon | Clickable Image | "search-logo" — triggers new search |
| Language Selector (EN) | Button | Language dropdown |
| User Icon | Button | Account/profile access |

### Page Title Section

| Component | Type | Description |
|-----------|------|-------------|
| Page Heading | Heading (H2) | "Select your written test" |

### Filter/View Controls

| Component | Type | Description |
|-----------|------|-------------|
| Test Centre Dropdown | Clickable | "All test centres" with down-arrow — filter by specific centre |
| Filter Button | Clickable | "Filter" with filter-icon |
| Map View Toggle | Clickable | "Map view" with list-icon — switches to map display |

### Help Banner

| Component | Type | Description |
|-----------|------|-------------|
| Help Card | Clickable | "Need help with your IELTS test?" with "Learn more" link |

### Results Section

| Component | Type | Description |
|-----------|------|-------------|
| Results Count | Heading (H2) | "Displaying 25 test session(s)" |
| Sort Control | Button | "Sort by: Earliest date" |

### Session Cards

Each session card contains:

| Component | Type | Description |
|-----------|------|-------------|
| Day of Week | Heading (H2) | e.g., "Wed", "Thu", "Fri", "Sat" |
| Date | Heading (H3) | Day number + Month (e.g., "12 Aug") |
| Test Type | Heading (H4) | "IELTS Academic" |
| Location | Link | Test centre name — links to Google Maps |
| Time | Heading (H4) | Session start time (e.g., "6:30 AM", "8:52 AM") |
| Seat Status | Paragraph | "Seats available" with vector icon |
| Results Timeline | Info row | "Results expected in 1-5 days" |
| Format | Info row | "IELTS on computer" |
| Price | Info row | Price in local currency (e.g., "AUD 1") |
| Retake Policy | Info row | "One Skill Retake available" |
| Book Button | Button | "Select and continue" |

### Footer

| Component | Type | Description |
|-----------|------|-------------|
| Not visible in current viewport | — | May exist below fold |

---

## User Actions

| Action | Target | Expected Result |
|--------|--------|-----------------|
| Click "Select and continue" | Session book button | Proceeds to booking/payment (Unknown) |
| Click Test Type chip | Header chip | Returns to test type selection (inferred) |
| Click Format chip | Header chip | Returns to format selection (inferred) |
| Click Location chip | Header chip | Returns to location selection (inferred) |
| Click Date Range chip | Header chip | Returns to date selection (inferred) |
| Click Search icon | Header icon | Triggers new search with current filters |
| Click "All test centres" | Dropdown | Filters by specific test centre |
| Click "Filter" | Button | Opens additional filter options |
| Click "Map view" | Toggle | Switches to map-based view of sessions |
| Click "Sort by: Earliest date" | Sort button | Changes sort order |
| Click location link | Test centre link | Opens Google Maps in new tab |
| Click "Need help" | Help card | Opens help/support content |

---

## Business Rules

1. **25 sessions displayed** — Results heading shows "Displaying 25 test session(s)"
2. **Default sort is "Earliest date"** — Sessions ordered chronologically
3. **Multiple sessions per day** — Same date can have multiple time slots
4. **Multiple test centres per city** — "IDP IELTS Test Centre Building Melbourne" and "Melbourne (240)" are different centres
5. **Location links to Google Maps** — Uses coordinates (lat/long) in URL
6. **Seat availability shown** — "Seats available" with icon
7. **Results timeline shown** — "Results expected in 1-5 days" (consistent with "IELTS on Computer" format)
8. **Price displayed in local currency** — AUD for Australia
9. **One Skill Retake available** — Noted for each session
10. **Search criteria visible as chips** — All wizard selections displayed as editable chips in header
11. **Chips are clickable** — Cursor pointer on each chip suggests they're editable/navigable
12. **Page title is "Select your written test"** — Implies Speaking test may be booked separately
13. **URL changes from wizard pattern** — `/book-ielts` is outside the `/wizard/` path
14. **No pagination visible** — Unknown if results scroll or paginate for more than 25
15. **Session cards are clickable** — Entire card has cursor pointer (not just the button)

---

## Dependencies

| Trigger | Effect |
|---------|--------|
| "Find sessions" clicked on Step 4 | Navigates to this page with results |
| Wizard selections (type/format/location/dates) | Determines which sessions are shown |
| "Select and continue" click | Proceeds to session booking (Unknown URL) |
| Chip click | Returns to respective wizard step to modify (inferred) |
| Sort change | Reorders session list |
| Filter/centre change | Narrows displayed sessions |

---

## Navigation

| From | To | Trigger |
|------|-----|---------|
| Test Date (Step 4) | Session Results | Click "Find sessions" |
| Session Results | Booking/Payment (Unknown) | Click "Select and continue" |
| Session Results | Wizard Steps (inferred) | Click any criteria chip |
| Session Results | Google Maps (external) | Click test centre location link |
| Session Results | Help Page (Unknown) | Click "Need help" card |

---

## Validation Rules

- No form validation visible on this page
- Unknown what happens if no sessions match the criteria (empty state)

---

## Known Limitations

- Price data appears corrupted in DEV: "AUD 86558020000000000000" on several sessions (likely test data)
- Unknown how pagination works for more than 25 results
- Unknown what "Select and continue" leads to (payment? review?)
- "Select your written test" implies Speaking is separate — booking flow for Speaking unknown
- Map view not yet observed
- Filter options not yet observed
- Sort options beyond "Earliest date" not yet observed

---

## Regression Impact

- This is the conversion page — session selection directly leads to booking
- Price display is critical (corrupted prices in DEV could indicate API issues)
- Seat availability must be real-time to avoid overbooking
- Google Maps links must use correct coordinates
- Sort and filter must work correctly to surface relevant sessions
- Session count must be accurate

---

## Notes

- URL is `/book-ielts` — exits the `/wizard/` URL space
- Page heading "Select your written test" suggests a multi-part booking (written + speaking)
- Some prices show "AUD 1" (likely test/dev data) while others show nonsensical values
- Two distinct test centres in Melbourne observed with different Google Maps coordinates
- Session times vary widely (6:30 AM to 10:52 PM) — may include different timezone representations
- "One Skill Retake available" appears on every session — may be a standard policy for Computer-based tests

---

## Confidence

| Section | Confidence |
|---------|-----------|
| Page Details | High |
| Components | High |
| Business Rules | High (directly observable) |
| Navigation (inbound) | High (confirmed from wizard) |
| Navigation (outbound) | Low (post-selection flow unknown) |
| Data accuracy | Low (dev environment has corrupted prices) |
