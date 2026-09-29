# Wizard - Test Location Selection

## Purpose

Step 3 of the 4-step booking wizard. Allows the user to select their country and city to find a nearby test centre for their IELTS test.

---

## Page Details

| Field | Value |
|-------|-------|
| Page Name | Test Location Selection |
| Module | Booking Wizard |
| URL (DEV) | `https://bxsearch.dev.ielts.com/wizard/test-location` |
| URL (SIT) | `https://bxsearch.ielts.sit.idp.com/wizard/test-location` |
| Title | Book an IELTS Test \| IDP IELTS |
| Breadcrumb | None visible |
| Wizard Step (DEV) | Step 3 / 4 — "Select location" |
| Wizard Step (SIT) | Step 4 / 5 — "Select location" |

> **Environment difference (observed 2026-09-09):** On SIT (`bxsearch.ielts.sit.idp.com`) this page is **Step 4/5**, whereas on DEV it was **Step 3/4**. The SIT wizard has an additional step (total 5 vs 4). The location page structure and behaviour are otherwise identical across environments. The extra SIT step appears before location — not yet identified.

---

## Entry Conditions

- User selected a test format on the Format page (Step 2)
- No authentication required

---

## Exit Conditions

- User selects Country and City → proceeds to Step 4 (inferred)
- User clicks back arrow → returns to Format page (Step 2)

---

## Main Components

### Header

| Component | Type | Description |
|-----------|------|-------------|
| Back Arrow | Button | Returns to Format page (Step 2) |
| Language Selector (EN) | Button | Language dropdown |
| User Icon | Button | Account/profile access |

### Informational Section

| Component | Type | Description |
|-----------|------|-------------|
| Page Title | Heading (H1) | "Test location" |
| Description | Paragraph | "Select your country and city to find a test centre near you." |

### Progress Indicator

| Component | Type | Description |
|-----------|------|-------------|
| Step Label | Text | "Step 3/4" |
| Step Description | Text | "Select location" |
| Progress Bar | Progressbar | Visual progress indicator |

### Location Selection Form

| Component | Type | Description | State |
|-----------|------|-------------|-------|
| Section Title | Heading (H2) | "Where do you want to take this test?" | — |
| Country Label | Text | "Country" | — |
| Country Dropdown | Button/Dropdown | "Select Country" placeholder; shows selected value (e.g., "Australia") | Enabled |
| City Label | Text | "City" | — |
| City Dropdown | Button/Dropdown | "Select City" placeholder | Disabled until Country selected; Enabled after |

**City Dropdown (Expanded State):**

| Component | Type | Description |
|-----------|------|-------------|
| Search Input | Textbox | "Search..." placeholder — allows filtering cities |
| City Options | Button(s) | Clickable city names (e.g., "Melbourne") |

### Fallback/Help Section

| Component | Type | Description |
|-----------|------|-------------|
| Location Icon | Image | "location-icon" |
| Help Text | Paragraph | "If your country or city location is not available, please check if you are eligible for an IELTS Online test." |
| Explore IELTS Online | Link | Links to `bx.ielts.dev.idp.com/booking` — opens in new tab (newtab icon) |

### Footer

| Component | Type | Description |
|-----------|------|-------------|
| IDP IELTS Logo | Link/Image | Links to main IDP IELTS site |

### Loading State

| Component | Type | Description |
|-----------|------|-------------|
| Loading indicator | Image | "Loading ..." alt text — appears while data is fetched |

---

## User Actions

| Action | Target | Expected Result |
|--------|--------|-----------------|
| Click Back Arrow | Back button | Returns to Format page (Step 2) |
| Click Country Dropdown | Country button | Opens country selection list |
| Select Country | Country option | Enables City dropdown, populates cities for selected country |
| Click City Dropdown | City button | Opens city selection list (only after country selected) |
| Select City | City option | Proceeds to Step 4 or shows available sessions (Unknown) |
| Click "Explore IELTS Online" | Link | Opens IELTS Online booking page in new tab |
| Click EN | Language button | Opens language selector dropdown |
| Click User Icon | Button | Opens account/login panel |

---

## Business Rules

1. **Country must be selected before City** — City dropdown is disabled until Country is chosen
2. **Cascading dependency** — Country selection populates the City dropdown dynamically
3. **Not all locations available** — Help text explicitly states some countries/cities may not be listed
4. **IELTS Online fallback** — If location not available, user is directed to IELTS Online as alternative
5. **"Explore IELTS Online" opens in new tab** — Evidenced by "newtab" icon on the link
6. **Data is loaded asynchronously** — Loading indicator present in DOM
7. **First form-based interaction** — This is the first step with actual form controls (dropdowns) instead of card selection
8. **URL is generic** — Unlike Step 2 (`/wizard/type-academic`), Step 3 uses a single URL `/wizard/test-location` regardless of prior selections
9. **City dropdown has search/filter** — Textbox with "Search..." placeholder allows filtering cities by typing
10. **City dropdown auto-opens after Country selection** — Dropdown is in expanded+active state immediately after Country is selected
11. **Country shows selected value** — After selection, button text changes from "Select Country" to selected country name (e.g., "Australia")
12. **City options are buttons** — Each city is a clickable button within the dropdown panel

---

## Dependencies

| Trigger | Effect |
|---------|--------|
| Format selected in Step 2 | Navigates to this page |
| Country selection | Enables City dropdown, loads cities, auto-opens City dropdown |
| City selection | Navigates to Step 4: Test Date (`/wizard/test-date/{locationCode}`) |
| No location available | User redirected to IELTS Online alternative |

---

## Navigation

| From | To | Trigger |
|------|-----|---------|
| Format Selection (Step 2) | Test Location (Step 3) | Click format card |
| Test Location (Step 3) | Format Selection (Step 2) | Click back arrow |
| Test Location (Step 3) | Test Date (Step 4) `/wizard/test-date/{locationCode}` | Select City |
| Test Location (Step 3) | IELTS Online Booking (external) | Click "Explore IELTS Online" |

---

## Validation Rules

- City dropdown disabled until Country selected (implicit validation)
- Unknown whether explicit error messages appear if API fails to load countries/cities

---

## Known Limitations

- Cannot determine full country/city list without interacting with dropdowns
- Unknown how many countries/cities are available
- Unknown whether location availability depends on test type or format
- Loading indicator suggests API-driven data — may have latency issues
- "Explore IELTS Online" link points to a different subdomain (`bx.ielts.dev.idp.com`)
- Only one city observed for Australia: "Melbourne" — unknown if more load dynamically or via search

---

## Regression Impact

- Country/City dropdowns are API-driven — backend changes can break this step
- Cascading dropdown dependency is a common failure point
- If location data API is down, user cannot proceed (no static fallback observed)
- Different subdomain for IELTS Online link may have separate availability

---

## Notes

- This is the first step with form controls (dropdowns) rather than card selection
- URL pattern shifts: Steps 1-2 had descriptive URLs, Step 3 is generic `/wizard/test-location`
- Loading indicator visible in DOM — page fetches data asynchronously on load
- Console shows 6 errors and 23 warnings (increased from previous steps)

---

## Confidence

| Section | Confidence |
|---------|-----------|
| Page Details | High |
| Components | High |
| Business Rules | High (cascading dropdown + search directly observable) |
| Navigation | High (Step 4 destination confirmed: `/wizard/test-date/{locationCode}`) |
| Dependencies | High (disabled state + auto-open confirmed) |
| Validation | Low (no error states observed) |
