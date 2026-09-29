# Booking Flow

## Overview

The IELTS test booking is a 4-step wizard flow hosted at `bxsearch.dev.ielts.com/wizard`.

---

## Flow Steps

| Step | Name | URL | Selection Type | Options |
|------|------|-----|----------------|---------|
| Entry | Wizard Landing | `/wizard` | Single CTA | "Find an IELTS test session" |
| 1 | Test Type | `/wizard/test-type` | Card selection (1 of 3) | Academic, General Training, UKVI |
| 2 | Format (Academic) | `/wizard/type-academic` | Card selection (1 of 4) | Paper, Computer, Online, Display all |
| 2 | Format (General) | `/wizard/type-general` (inferred) | Unknown | Unknown |
| 2 | Format (UKVI) | `/wizard/type-ukvi` (inferred) | Unknown | Unknown |
| 3 | Location | `/wizard/test-location` | Cascading dropdowns (Country → City) | Dynamic (API-driven) |
| 4 | Test Date | `/wizard/test-date/{locationCode}` | Dual-month calendar (date or range) | Dynamic (availability-based) |

---

## Preconditions

- No login required to start
- Cookie consent banner must be dismissed (or implied by continued browsing)
- User agrees to T&C and Privacy Policy by proceeding

---

## Step Details

### Entry: Wizard Landing (`/wizard`)

- Single action available: Click "Find an IELTS test session"
- No form inputs
- Informational content: value propositions, legal links

### Step 1: Test Type (`/wizard/test-type`)

- Three mutually exclusive options presented as clickable cards
- No "Next" button — selecting a card immediately advances
- Back arrow returns to landing
- Help link: "Check who accepts IELTS here"

**Options:**

| Option | Target Audience | Key Guidance |
|--------|----------------|--------------|
| IELTS Academic | University/professional registration | None |
| IELTS General Training | Migration purposes | None |
| IELTS for UKVI | UK study/living | "Check which UKVI test you need with the UK government before booking" |

### Step 2: Format (`/wizard/type-academic`)

- Page heading reflects selected test type: "IELTS Academic"
- Four format options presented as clickable cards
- No "Next" button — selecting a card immediately advances
- Back arrow returns to Step 1 (Test Type)
- URL pattern is test-type-specific: `/wizard/type-{type}`

**Options (Academic):**

| Option | Venue | Speaking | Badge | Limitation |
|--------|-------|----------|-------|------------|
| IELTS on Paper | Test centre | Face-to-face with examiner | None | None |
| IELTS on Computer | Test centre | Face-to-face with examiner | "Fastest results" | None |
| IELTS Online | Home/suitable location | Unknown | None | "Only some institutions accept IELTS Online" |
| Display all formats | N/A (aggregates all) | N/A | None | None |

### Step 3: Location (`/wizard/test-location`)

- First step with form controls (dropdowns) instead of card selection
- Two cascading dropdowns: Country → City
- City dropdown disabled until Country is selected
- Data loaded asynchronously (loading indicator visible)
- Help section offers IELTS Online as fallback if location unavailable
- "Explore IELTS Online" link opens in new tab (different subdomain: `bx.ielts.dev.idp.com`)
- Generic URL — not dependent on prior test type/format selections

**Form Controls:**

| Control | Type | Initial State | Enabled When |
|---------|------|---------------|--------------|
| Country | Dropdown | "Select Country" (enabled) | Always |
| City | Dropdown | "Select City" (disabled) | After Country selected |

### Step 4: Test Date (`/wizard/test-date/{locationCode}`)

- Final wizard step — dual-month calendar interface
- URL includes location code from Step 3 (e.g., "ioc")
- Supports date or date range selection
- Up to 6 months advance booking allowed
- Past dates disabled, future dates without sessions also disabled
- Only "Next month" navigation (no back in calendar)
- Week starts on Sunday

**Calendar Controls:**

| Control | Type | Behaviour |
|---------|------|-----------|
| Enabled date | Gridcell (clickable) | Available for selection |
| Disabled date | Gridcell (disabled) | Past or no sessions |
| Next month | Button | Advances calendar view |

---

## Post-Wizard Flow

### Session Results (`/book-ielts`)

- Displays matching test sessions based on all wizard selections
- Header shows editable criteria chips (type, format, location, dates)
- Sessions sorted by "Earliest date" (default)
- Each session card shows: date, time, test centre, price, seat status, results timeline, retake policy
- "Select and continue" button per session — leads to booking/payment (Unknown)
- Page heading "Select your written test" — implies Speaking booked separately
- Filters: test centre dropdown, Filter button, Map view toggle
- 25 sessions displayed (pagination unknown)

---

## Confidence

| Section | Level |
|---------|-------|
| Steps 1-4 (full wizard) | High |
| Post-wizard (session results) | High |
| Post-session-selection (booking/payment) | Unknown |
