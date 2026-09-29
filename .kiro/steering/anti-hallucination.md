---
inclusion: always
description: Universal anti-hallucination rules for all pipeline agents (placeholder-format standard, confidence tagging, stop signals, evidence requirements). Applies to every skill in every phase.
---

# Anti-Hallucination Rules (Universal)

These rules apply to EVERY agent in EVERY phase. No exceptions. Violating any rule invalidates the entire output.

---

## 1. NEVER INVENT — Absolute Prohibitions

| If you do not have this information | You MUST NOT | You MUST instead |
|---|---|---|
| API endpoint URL | Write any `/api/...` path | Use `{API_ENDPOINT}` placeholder |
| HTTP method (GET, POST, PUT) | Claim a specific method | Write "Send request to {API_ENDPOINT}" |
| HTTP status code | State "returns 201" as fact | Write "e.g., 400 status" or "success response" |
| JSON request/response structure | Invent `{"key": "value"}` schemas | Describe fields by name: "with fields: X, Y, Z" |
| Character limits for fields | Guess "max 40 characters" | Only use limits EXPLICITLY stated in story's Fields table. If no table: use extreme values (1000 chars) for boundary tests without claiming the limit |
| Error message text | Invent error copy | Use exact text from ACs, OR `{error_message_for_X}` placeholder |
| CSS selectors / class names | Guess based on common patterns | Inspect real DOM with `browser_evaluate` first |
| Internal architecture / DB tables | Reference undocumented internals | Only mention architecture details explicitly written in the story |
| HyperExecute YAML fields | Write from memory | Copy structure from `.kiro/skills/execution-skill/assets/hyperexecute-reference.yaml` |
| JIRA issue type / link type availability | Assume "Test", "Test Set", or a "Test" link type exist | Discover via `getVisibleJiraProjects` / `getIssueLinkTypes` before using; fall back to a confirmed type |
| Application behavior not stated in ACs | Claim "the app does X" | Mark as "Inferred" with low confidence |
| Figma design pixel values | State exact px/color values | Only report what `figma_get_design_context` returns |

---

## 2. EVIDENCE REQUIRED — Verify Before Generating

Every generated artifact must trace to a source. Before writing any output:

| Before you write... | You MUST have evidence from... | Evidence type |
|---|---|---|
| A selector in a Page Object | `browser_evaluate` DOM inspection showing the actual HTML attribute | Tool output showing tag, id, testid, name, role, ariaLabel |
| An assertion value (expected text) | The JIRA story AC text verbatim, OR live app visible text from `browser_snapshot` | Quoted text with source |
| A URL path in a test | Story description explicitly stating it, OR `browser_navigate` confirming it exists | URL from source |
| A YAML config structure | The reference file at `.kiro/skills/execution-skill/assets/hyperexecute-reference.yaml` | File read |
| A JIRA field value | A previous successful JIRA MCP call response | MCP response |
| A risk score | Calculation showing Severity Value × Likelihood Value | Math shown in Evidence column |
| A scenario | An AC, Field, Flow, or Business Rule from the story | Source column filled |

---

## 3. STOP SIGNALS — When You Must Pause

If you catch yourself doing any of these, STOP immediately:

- ❌ Writing a CSS selector without having run `browser_evaluate` → STOP. Inspect DOM first.
- ❌ Writing an API test body without endpoint contract from story → STOP. Use `{API_ENDPOINT}` placeholder.
- ❌ Generating 50+ lines of code without referencing the master test case document → STOP. Re-read the TC.
- ❌ Assuming what happens after a button click without having inspected → STOP. Click it in Playwright MCP and observe.
- ❌ Writing an error message in Expected Result without quoting the AC → STOP. Use placeholder.
- ❌ Copying YAML structure from memory instead of the reference file → STOP. Read the reference.
- ❌ Creating a JIRA issue type you haven't confirmed exists → STOP. Use Task with labels.
- ❌ Writing a test for something listed in "Out of Scope" → STOP. Delete it.

---

## 4. PLACEHOLDER FORMAT STANDARD

When information is unavailable, use EXACTLY these placeholders (downstream agents recognize them):

| Placeholder | When to use |
|---|---|
| `{API_ENDPOINT}` | API endpoint URL not specified in story |
| `{BASE_URL}` | Application base URL (replaced from env_config.json at runtime) |
| `{unique_email}` | Email that doesn't exist in system |
| `{existing_email}` | Email with existing account |
| `{error_message_for_X}` | Error message text not specified in ACs |
| `{exact_behavior_TBD}` | Behavior not defined — needs dev team clarification |
| `{DYNAMIC_ID_FORMAT_TBD}` | ID format not documented |
| `"A" repeated N times` | Boundary test string of N characters |

---

## 5. CONFIDENCE TAGGING

Every scenario, test case, or selector that comes from inference (not explicit source) MUST be tagged:

| Tag | Meaning | Used when |
|---|---|---|
| `Source: AC1` | Directly from acceptance criterion | Exact text in story |
| `Source: Field: X` | From Fields & Validation table | Explicit table in story |
| `Source: Flow 1` | From Navigation Flows section | Explicit flow in story |
| `Source: Inferred from app` | Discovered by live inspection | Not in story text |
| `Source: Inferred` | Logically deduced from context | Reasonable guess — lower confidence |
| `// ✅ Confirmed via browser_evaluate` | Selector verified against real DOM | Tool output confirmed |
| `// ⚠️ From snapshot only — verify` | Selector from accessibility snapshot, not DOM | Needs DOM verification |

---

## 6. OUTPUT VALIDATION — Before Marking Any Agent Complete

Every agent MUST perform a self-check before declaring its output final:

- [ ] Zero invented API endpoints (no `/api/...` unless explicitly in story)
- [ ] Zero invented JSON schemas (no `{"key": "value"}` unless from story)
- [ ] Zero definitive HTTP status codes stated as fact (use "e.g." prefix)
- [ ] Zero character limits stated unless from Fields & Validation table
- [ ] Zero error message text invented (either quoted from AC or placeholder)
- [ ] Every selector backed by DOM inspection evidence
- [ ] Every YAML structure matches reference file
- [ ] Placeholder header note present if any `{API_ENDPOINT}` placeholders used
- [ ] Source/Evidence column non-empty for every generated item
