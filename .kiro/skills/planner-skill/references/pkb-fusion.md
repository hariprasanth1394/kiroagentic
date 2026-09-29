# AC + PKB Fusion (Scenario Derivation)

How to derive scenarios by **fusing the story's Acceptance Criteria with the Product Knowledge Base (PKB)**. This is a self-contained procedure applied during Step 5 (Generate Scenarios). It does not replace AC-driven generation — it enriches it so the scenarios (and the test cases derived from them downstream) reflect the app's real documented pages and flows.

## The two sources and how they combine

| Source | Authority over | Role |
|---|---|---|
| **Acceptance Criteria (story)** | *What* must work, and what is in/out of scope | **Source of truth.** Every AC still produces its scenarios as before. |
| **PKB** (`{pkbDir}/`) | *How* the app actually behaves — real pages, components, entry/exit conditions, business rules, validations, navigation, failure points | **Enrichment.** Fills the gaps ACs leave implicit. Never overrides an AC. |

> **{pkbDir}** = the app's resolved Product Knowledge Base directory (`apps[appKey].pkbDir`, e.g. `qe-pipeline/knowledge/product-TCOE/`). If it does not exist, skip fusion entirely and generate from ACs only.

## Golden rule

> **Story scope decides IF a scenario exists. The PKB decides HOW precisely it is described and WHICH documented edge cases within that scope get covered.**

The PKB never expands scope beyond the story. It makes the in-scope scenarios complete and concrete.

---

## Procedure

### F1 — Map each AC to the PKB

For each Acceptance Criterion, find the PKB screen(s) and/or workflow it touches (match by page name, route, feature, or the flow the AC describes). Record the matches — they become the scenario's `pkbRefs`.

- Match found → this AC's scenarios get enriched (F2) and gap-filled (F3).
- No match → generate from the AC alone, as today. Do not invent PKB content.

### F2 — Enrich AC scenarios with PKB detail (make them concrete)

When an AC maps to a PKB screen/workflow, pull real, documented detail into the scenario instead of guessing:

- **Steps** — use the screen's real **URL**, **Main Components**, and **User Actions** to write precise `steps[]` (exact navigate path, exact control names) rather than vague ones.
- **Preconditions** — use the screen's documented **Entry Conditions** and the workflow's **Start Page**.
- **Expected outcome** — use documented **Exit Conditions** / the next page in the **Navigation Flow**.
- **End-to-end flow** — when the AC spans a multi-page workflow, follow the PKB workflow's **Navigation Flow** in order so the scenario traverses the real page sequence.

Everything pulled here must be present in the PKB. If the PKB marks something `Unknown` or `Low` confidence, carry that down: set the scenario `confidence` no higher than the PKB's for that detail.

### F3 — Gap-fill within story scope (the "missing cases")

For each in-scope screen/workflow, the PKB often documents behaviour the AC did not spell out. Generate the missing scenarios **only when they fall within what the story is about**:

| PKB item on an in-scope screen/flow | Missing scenario to add | Category |
|---|---|---|
| Documented **Business Rule** (mandatory field, conditional visibility, enabled/disabled control, navigation condition) | negative / branch scenario the AC didn't mention | negative |
| Documented **Validation Rule** (client-side validation message) | validation scenario using the documented message text | negative / error-handling |
| Documented **Failure Point** on the workflow | risk-weighted edge scenario | error-handling |
| A **branch** in the PKB Navigation Flow that the story's flow reaches (e.g. an "incomplete profile" detour) | one end-to-end scenario per reachable branch | positive / negative |

**Scope test before adding any gap-fill scenario** — add it only if BOTH hold:
1. The screen/workflow is part of a flow the story's ACs actually exercise, AND
2. It is not listed in the story's **Out of Scope** section.

If either fails → do NOT generate it. (You can revisit broader PKB coverage later; for now stay story-bounded.)

### F4 — Tag origin and PKB references (traceability)

Every scenario records where it came from so a reviewer can trace it:

- **`source`** — say which AC and/or which PKB artifact it came from. Use one of these forms:
  - AC only: `"AC-2"`
  - AC enriched by PKB: `"AC-2 + PKB:screens/wizard-test-location"`
  - PKB gap-fill (no explicit AC, but in story scope): `"PKB:workflows/offline-booking-flow (in-scope gap)"`
- **`pkbRefs`** (optional object, see schema) — the concrete PKB files/flow this scenario is grounded in:
  ```json
  "pkbRefs": {
    "screens": ["wizard-test-location", "book-ielts-sessions"],
    "workflow": "offline-booking-flow",
    "navigationPath": "/wizard/test-location → /wizard/test-date/{loc} → /book-ielts"
  }
  ```
  Use the PKB file base names (no path, no `.md`). Omit `pkbRefs` entirely for scenarios with no PKB match.
- **`confidence`** — a PKB gap-fill scenario inherits the PKB's confidence for that item; never mark it `high` unless the PKB documented it `High`.

`pkbRefs` is what carries the page/flow context across the contract to the Tester, which resolves those screen docs to build exact steps. Without it the enrichment is lost at the boundary — so populate it whenever a scenario is grounded in the PKB.

---

## Guardrails (do not violate)

- **PKB never overrides an AC.** If the PKB and an AC disagree, the AC wins; note the discrepancy in the scenario `description` for the team to reconcile.
- **PKB never expands scope.** Out-of-Scope items stay out even if fully documented in the PKB.
- **No invention.** If a detail is in neither the AC nor the PKB, do not fabricate it — follow `anti-hallucination.md` (placeholders, `confidence: low`, mark Unknown).
- **Respect the scope cap.** Fusion still obeys the Step 5 scope cap. If gap-fill would exceed the cap, keep AC-mandatory scenarios first, then highest-risk PKB gap-fills, and drop the rest.
- **PKB is read-only here.** The planner never writes to `{pkbDir}` — that is the product-knowledge-skill's job.

## Quick example

Story AC: "A user can select a test location and see available sessions."
PKB documents: `wizard-test-location.md` (City dropdown disabled until Country selected — a Business Rule), and `offline-booking-flow.md` (workflow: location → date → sessions).

Fused scenarios:
- `AC-1` positive, enriched → real steps through `/wizard/test-location` with exact Country/City controls, `pkbRefs.screens = ["wizard-test-location"]`.
- `PKB gap-fill` negative → "Attempt to select City before Country" (from the documented Business Rule), in scope because the AC exercises this screen. `source: "AC-1 + PKB:screens/wizard-test-location"`, `category: negative`.
- `AC-1` end-to-end → follows the workflow Navigation Flow to the sessions page, `pkbRefs.workflow = "offline-booking-flow"`.
