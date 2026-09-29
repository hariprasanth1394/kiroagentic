# Wizard - Test Format Selection (Academic)

## Purpose

Step 2 of the 4-step booking wizard. After selecting IELTS Academic in Step 1, this page allows the user to choose their preferred test format (Paper, Computer, Online, or all formats).

---

## Page Details

| Field | Value |
|-------|-------|
| Page Name | Test Format Selection (Academic) |
| Module | Booking Wizard |
| URL | `https://bxsearch.dev.ielts.com/wizard/type-academic` |
| Title | Book an IELTS Test \| IDP IELTS |
| Breadcrumb | None visible |
| Wizard Step | Step 2 / 4 — "Select test format" |

---

## Entry Conditions

- User selected "IELTS Academic" on the Test Type page (Step 1)
- No authentication required

---

## Exit Conditions

- User selects one of the four format options → proceeds to Step 3
- User clicks back arrow → returns to Test Type page (Step 1)

---

## Main Components

### Header

| Component | Type | Description |
|-----------|------|-------------|
| Back Arrow | Button | Returns to Test Type page (`/wizard/test-type`) |
| Language Selector (EN) | Button | Language dropdown |
| User Icon | Button | Account/profile access |

### Informational Section

| Component | Type | Description |
|-----------|------|-------------|
| Page Title | Heading (H1) | "IELTS Academic" |
| Description (line 1) | Paragraph | "When you take the IELTS Academic test you may choose between IELTS on paper or on computer." |
| Description (line 2) | Paragraph | "You can also try our new IELTS Online experience." |
| Description (line 3) | Paragraph | "Select your preferred test format and take IELTS your way." |

### Progress Indicator

| Component | Type | Description |
|-----------|------|-------------|
| Step Label | Text | "Step 2/4" |
| Step Description | Text | "Select test format" |
| Progress Bar | Progressbar | Visual progress indicator |

### Format Options

| Component | Type | Description |
|-----------|------|-------------|
| Section Title | Heading (H2) | "Which test format do you prefer?" |
| IELTS on Paper | Clickable Card | Traditional paper-based test |
| IELTS on Computer | Clickable Card | Computer-based test (with "Fastest results" badge) |
| IELTS Online | Clickable Card | Remote home-based test |
| Display all formats | Clickable Card | Shows all format options combined |

**Format Cards Detail:**

| Format | Icon | Description | Badge |
|--------|------|-------------|-------|
| IELTS on Paper | "Ielts on paper" | Complete the Listening, Reading and Writing tasks on paper in a test centre. The Speaking will be face-to-face with an examiner. | None |
| IELTS on Computer | "Ielts on computer" | Complete the Listening, Reading and Writing tasks on a computer in a test centre. The Speaking will be face-to-face with an examiner. | "Fastest results" (Flash icon) |
| IELTS Online | "Ielts online" | With IELTS Online you will take your test from home or another suitable location. Only some institutions accept IELTS Online. | None |
| Display all formats | "not sure" | If you're still undecided, browse test dates for all IELTS test format options and select a test session that suits your needs. | None |

### Footer

| Component | Type | Description |
|-----------|------|-------------|
| IDP IELTS Logo | Link/Image | Links to main IDP IELTS site |

---

## User Actions

| Action | Target | Expected Result |
|--------|--------|-----------------|
| Click Back Arrow | Back button | Returns to Test Type (`/wizard/test-type`) |
| Click IELTS on Paper | Card | Proceeds to Step 3 with Paper format selected |
| Click IELTS on Computer | Card | Proceeds to Step 3 with Computer format selected |
| Click IELTS Online | Card | Proceeds to Step 3 with Online format selected |
| Click Display all formats | Card | Proceeds to Step 3 showing all format sessions |
| Click EN | Language button | Opens language selector dropdown |
| Click User Icon | Button | Opens account/login panel |

---

## Business Rules

1. **Four format options** — Paper, Computer, Online, Display all formats
2. **No default selection** — No format is pre-selected
3. **Mandatory selection** — User must pick a format to proceed (card click = advance)
4. **Computer has fastest results** — Highlighted with "Fastest results" badge (Flash icon)
5. **Online has acceptance limitations** — "Only some institutions accept IELTS Online"
6. **Speaking is always face-to-face** — For Paper and Computer formats, Speaking component is with an examiner (not written/online)
7. **Online is taken from home** — Different from Paper/Computer which are at test centres
8. **"Display all formats" is a fallback** — For undecided users, aggregates all options in next step
9. **Page heading reflects test type** — H1 is "IELTS Academic" confirming Step 1 selection carried forward

---

## Dependencies

| Trigger | Effect |
|---------|--------|
| Test type selected in Step 1 (Academic) | Determines this page's content and URL (`/wizard/type-academic`) |
| Format selection | Determines available sessions/locations in Step 3 |
| "Display all formats" | Step 3 shows combined results for all formats |

---

## Navigation

| From | To | Trigger |
|------|-----|---------|
| Test Type (Step 1) | Format Selection (Step 2) | Click "IELTS Academic" card |
| Format Selection | Step 3 (Location/Sessions) | Click any format card |
| Format Selection | Test Type (Step 1) | Click back arrow |

---

## Validation Rules

- No form validation on this page (selection-based)
- User cannot proceed without selecting a format option

---

## Known Limitations

- URL pattern is `/wizard/type-academic` (not `/wizard/test-format` as previously inferred)
- Unknown whether General Training and UKVI have different format options
- Unknown whether IELTS Online availability varies by region
- "Fastest results" badge — unknown what the specific timeframe difference is

---

## Regression Impact

- Format selection determines session availability downstream
- "Fastest results" badge is a marketing differentiator — its removal/change impacts user decision
- IELTS Online acceptance caveat may need dynamic updating as more institutions accept it
- URL naming pattern (`type-academic`) suggests different pages per test type for Step 2

---

## Notes

- Step label format changed: "Step 2/4" (no space before slash) vs Step 1 "Step 1/ 4" (with space) — inconsistent formatting
- Console shows 4 errors and 16 warnings
- URL pattern reveals: Step 2 URL is test-type-specific (`/wizard/type-academic`)

---

## Confidence

| Section | Confidence |
|---------|-----------|
| Page Details | High |
| Components | High |
| Business Rules | High (directly observable) |
| Navigation | High (back arrow + card advance confirmed pattern) |
| Dependencies | Medium (downstream effects inferred) |
| Format-specific limitations | Medium (Online acceptance caveat is explicit) |
