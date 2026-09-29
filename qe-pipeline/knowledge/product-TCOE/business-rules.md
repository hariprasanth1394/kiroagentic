# Business Rules

## Source

All rules documented here are directly observable from the application UI/DOM.

---

## Global Rules

| ID | Rule | Evidence | Confidence |
|----|------|----------|------------|
| BR-001 | No authentication required to start booking wizard | Landing page loads without login | High |
| BR-002 | Cookie consent banner appears on first visit | OneTrust banner present in DOM | High |
| BR-003 | Booking implies agreement to Terms & Conditions and Privacy Policy | Explicit text on landing page | High |
| BR-004 | Application requires JavaScript to render | SPA — no content without JS | High |
| BR-005 | Language selection available (default: EN) | Language button with dropdown arrow visible | High |

---

## Booking Wizard Rules

| ID | Rule | Evidence | Confidence |
|----|------|----------|------------|
| BR-010 | Wizard has 4 steps | "Step 1/ 4" visible on test-type page | High |
| BR-011 | Step 1 is Test Type selection | URL `/wizard/test-type`, heading "Select your IELTS test type" | High |
| BR-012 | Three test types available: Academic, General Training, UKVI | Three cards on test-type page | High |
| BR-013 | Test type selection is mandatory before proceeding | No "Next" button — card click = proceed | High |
| BR-014 | Single entry path into wizard | Only one CTA on landing: "Find an IELTS test session" | High |
| BR-015 | Wizard steps are sequential (no skip) | Progress bar + back arrow navigation | Medium |
| BR-016 | UKVI requires checking with UK government before booking | Explicit guidance text on UKVI card | High |
| BR-017 | Step 2 is Test Format selection | URL `/wizard/type-academic`, heading "Which test format do you prefer?" | High |
| BR-018 | Step 2 URL is test-type-specific | URL pattern `/wizard/type-{type}` (e.g., `type-academic`) | High |
| BR-019 | Academic has 4 format options: Paper, Computer, Online, Display all | Four cards on format page | High |
| BR-020a | IELTS on Computer has "Fastest results" badge | Flash icon + text badge on Computer card | High |
| BR-021a | IELTS Online has acceptance limitations | Explicit text: "Only some institutions accept IELTS Online" | High |
| BR-022 | Speaking component is always face-to-face with examiner | Explicit in Paper and Computer card descriptions | High |
| BR-023 | Paper and Computer tests are at test centres | Explicit in card descriptions | High |
| BR-024 | Online test is taken from home/suitable location | Explicit in IELTS Online card description | High |
| BR-025 | "Display all formats" aggregates all options for undecided users | Explicit in card description | High |
| BR-026 | Step 3 is Test Location selection | URL `/wizard/test-location`, heading "Test location" | High |
| BR-027 | Step 3 URL is generic (not type-specific) | Same URL regardless of test type/format selected | High |
| BR-028 | Country must be selected before City | City dropdown is disabled until Country is chosen | High |
| BR-029 | Country → City is a cascading dependency | Selecting Country enables and populates City dropdown | High |
| BR-030a | Location data is loaded asynchronously | Loading indicator present in DOM | High |
| BR-031a | Not all countries/cities may be available | Help text explicitly states this | High |
| BR-032a | IELTS Online is fallback when location unavailable | "Explore IELTS Online" link provided as alternative | High |
| BR-033 | Step 3 is first form-based interaction | Dropdowns instead of card selection pattern | High |
| BR-044 | City dropdown includes search/filter textbox | "Search..." placeholder in expanded dropdown | High |
| BR-045 | City dropdown auto-opens after Country selection | Dropdown in expanded+active state immediately | High |
| BR-046 | Country dropdown shows selected value | Button text changes to country name (e.g., "Australia") | High |
| BR-047 | City options are buttons within dropdown panel | Each city rendered as clickable button | High |
| BR-048 | City selection navigates to Step 4 | Selecting city navigates to `/wizard/test-date/{locationCode}` | High |
| BR-034 | Step 4 is Test Date selection | URL `/wizard/test-date/ioc`, heading "Test date" | High |
| BR-035 | Step 4 URL includes location code | Pattern `/wizard/test-date/{locationCode}` (observed: "ioc") | High |
| BR-036 | Date range selection supported | Description: "Select a date or date range" | High |
| BR-037 | Maximum 6 months advance booking | Explicit: "You may search for test dates up to 6 months in advance" | High |
| BR-038 | Past dates are disabled in calendar | Dates before today greyed out and non-clickable | High |
| BR-039 | Dual-month calendar view | Two months displayed simultaneously (Aug + Sep 2026) | High |
| BR-040 | Week starts on Sunday | Calendar column headers: S, M, T, W, T, F, S | High |
| BR-041 | Forward-only calendar navigation | Only "Next month" button — no "Previous month" | High |
| BR-042 | Date availability is location-dependent | URL parameterized by location code | High |
| BR-043 | Some future dates may be disabled | Sept 9+ disabled despite being within 6-month window — suggests no sessions | Medium |
| BR-049 | Date range selection is two-click | First click = start date, second click = end date | High |
| BR-050 | "Find sessions" button appears only after date range is selected | Progressive disclosure — action bar hidden until selection complete | High |
| BR-051 | "Clear selection" link available after date selection | Allows reset without back navigation | High |
| BR-052 | Selected date range displayed in DD/MM/YYYY format | Observed: "12/08/2026 - 26/08/2026" | High |
| BR-053 | Date range confirmation shown in H3 heading | "You have selected" + range — dynamically populated | High |
| BR-054 | End date of range gets active state in calendar | End date gridcell marked [active] | High |
| BR-055 | Explicit "Find sessions" action required | Date selection alone does NOT auto-navigate — user must click button | High |

---

## Session Results Rules

| ID | Rule | Evidence | Confidence |
|----|------|----------|------------|
| BR-060 | Session results page URL is `/book-ielts` | Observed URL after "Find sessions" | High |
| BR-061 | Results page shows all wizard selections as editable chips | Header bar with type/format/location/dates | High |
| BR-062 | Default sort is "Earliest date" | Sort button text | High |
| BR-063 | Multiple sessions per day possible | Multiple cards for same date (e.g., 12 Aug) | High |
| BR-064 | Multiple test centres per city | "Melbourne" and "Melbourne (240)" are distinct | High |
| BR-065 | Price displayed in local currency | "AUD" prefix for Australian sessions | High |
| BR-066 | Session results expected in 1-5 days for Computer format | Consistent across all observed sessions | High |
| BR-067 | "One Skill Retake available" on Computer sessions | Shown on every observed session card | High |
| BR-068 | Seat availability status shown per session | "Seats available" text with icon | High |
| BR-069 | Test centre location links to Google Maps with coordinates | href contains lat/long params | High |
| BR-070 | Page heading is "Select your written test" | Implies Speaking component booked separately | High |
| BR-071 | 25 sessions displayed per search | Heading: "Displaying 25 test session(s)" | High |
| BR-072 | Filter by test centre available | "All test centres" dropdown | High |
| BR-073 | Map view toggle available | "Map view" clickable element | High |
| BR-074 | Session cards are fully clickable | Cursor pointer on entire card | High |
| BR-075 | "Select and continue" button per session | Each session has its own booking CTA | High |

---

## Account & Booking (Post-Wizard) Rules

> Environment note: These rules were observed on **SIT** (`account.ielts.sit.idp.com`, `bxsearch.ielts.sit.idp.com`, `bx.ielts.sit.idp.com`). Some entries are **user-provided** (not directly observed) and are tagged accordingly.

| ID | Rule | Evidence | Confidence |
|----|------|----------|------------|
| BR-100 | Booking requires an IDP account (email entry → sign-in or register) | `/login-initiate` email gate | High |
| BR-101 | New users register via "Complete your profile" (name, mobile, password, consents) | `/register` form | High |
| BR-102 | T&C/Privacy and overseas-data-transfer consents are mandatory to register | Required (*) checkboxes on `/register` | High |
| BR-103 | Registration completes to the account Dashboard | Observed redirect to `/dashboard` | High |
| BR-104 | Dashboard "Book now" opens the booking wizard in a NEW TAB | Observed new tab to `bxsearch.ielts.sit.idp.com/wizard` | High |
| BR-105 | SIT wizard is a 5-step flow (location = Step 4/5, date = Step 5/5) | Observed step labels on SIT | High |
| BR-106 | After selecting a written (LRW) session, user selects a Speaking slot | `/book-ielts/speaking` page | High |
| BR-107 | Speaking timing options: Before written / Same day / After written test | Tabs on speaking page | High |
| BR-108 | User must indicate booking for self (18+) or as guardian (under 18) | Radio group on speaking page | High |
| BR-109 | Registered agents can book on behalf via a separate flow | "Book on behalf" panel | High |
| BR-110 | Incomplete-profile interstitial is CONDITIONAL — shown only when profile data is missing | `/account/incomplete-profile`; skipped when complete (user-confirmed) | High |
| BR-111 | Profile completion requires details matching test-day ID (printed on TRF, uneditable after issue) | Warning alert on `/account/setup-account` | High |
| BR-112 | Booking summary shows price + GST = total; T&C consent required before payment | `/account/booking-summary` (AUD 200 + 50 = 250) | High |
| BR-113 | Payment methods: Pay online and Pay Offline | `/account/booking-summary/payment-options` | High |
| BR-114 | Offline payment must be completed by a deadline or the booking is cancelled | Notice + "Pay by 14 September, 3am" | High |
| BR-115 | Offline accepted methods: Cash, Cheque, Fund Transfer (centre-specific) | `/account/booking-summary/payment-offline` | High |
| BR-116 | "Reserve now" reserves the booking; confirmation shows deadline to pay | `/account/booking-confirmation-v2` | High |
| BR-117 | Post-booking info (About you / Address / Occupation) starts Incomplete and gates "Continue" | Confirmation page accordions | High |
| BR-118 | Online payment (provider e.g. Stripe/Braintree) lands on same confirmation page with "Payment successful" message | User-provided — not observed | Medium |
| BR-119 | After successful online payment: fill About you / Address / IELTS info → Next → upload ID image → IDV consent page → agree → "Booking complete" → redirect to Dashboard / test-booking page | User-provided — not observed | Medium |
| BR-120 | Post-booking profile details are saved against the APPLICATION Profile (per booking), NOT the created account Profile | User-provided — not observed | Medium |
| BR-121 | Consequence of BR-120: booking another session does NOT reuse previously-entered profile info; user must re-enter it | User-provided — not observed | Medium |

> **Observed anomalies (SIT):** Recurring DOM messages across summary/payment/confirmation pages — "Application timeout", "An error has occurred", "Unable to continue booking", "Consent unavailable", and "Payment Failed" on the confirmation page. Cause unconfirmed. Flagged for investigation; not treated as normal behaviour.

---

## Cookie / Consent Rules

| ID | Rule | Evidence | Confidence |
|----|------|----------|------------|
| BR-020 | Closing banner or continuing to browse implies consent | Banner text states this | High |
| BR-021 | Cookie Policy link available in banner | Link to legal-notices page | High |

---

## Navigation Rules

| ID | Rule | Evidence | Confidence |
|----|------|----------|------------|
| BR-030 | Back navigation available from Step 1 onwards | Back arrow button visible on test-type page | High |
| BR-031 | Footer logo links to main IDP IELTS site | Link href to ielts.idp.com | High |
| BR-032 | T&C and Privacy links open legal notices page | Link hrefs with anchors | High |

---

## Unknown / Unverified

| ID | Question | Status |
|----|----------|--------|
| BR-U01 | Does back navigation preserve state? | Unknown |
| BR-U02 | Does language change persist across wizard steps? | Unknown |
| BR-U03 | What happens if user is already logged in? | Unknown |
| BR-U04 | Are test type options dynamic (API-driven) or static? | Unknown |
| BR-U05 | Do General Training and UKVI have different format options than Academic? | Unknown |
| BR-U06 | What is the specific results timeframe for "Fastest results" (Computer)? | Unknown |
| BR-U07 | Does IELTS Online availability vary by region? | Unknown |
| BR-U08 | How many countries/cities are available in the dropdown? | Unknown |
| BR-U09 | Does location availability depend on test type or format? | Unknown |
| BR-U10 | What happens after City is selected — immediate navigation or confirmation? | Unknown |
| BR-U11 | What error state shows if location API fails to load? | Unknown |
| BR-U12 | What happens after "Find sessions" is clicked — new page or inline results? | Unknown |
| BR-U13 | Can user select a single date (not a range)? | Unknown |
| BR-U14 | What is the maximum date range width allowed? | Unknown (14 days observed) |
| BR-U15 | What does "ioc" location code map to? | Unknown |
| BR-U16 | Is there a "Previous month" navigation for future months already passed current? | Unknown |
| BR-U17 | What does "Select and continue" lead to? (payment? review? speaking booking?) | Unknown |
| BR-U18 | Is Speaking test booked separately after written test selection? | Unknown |
| BR-U19 | How does pagination work beyond 25 results? | Unknown |
| BR-U20 | What are the available sort options besides "Earliest date"? | Unknown |
| BR-U21 | What filter options exist beyond test centre? | Unknown |
| BR-U22 | Can wizard selections be modified via chips without restarting? | Unknown |
