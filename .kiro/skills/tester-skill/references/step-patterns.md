# Step Patterns & Language Rules

## Approved Step Actions

Use these EXACT patterns when writing test steps. The `action` field in the JSON schema must be one of: `Navigate`, `Type`, `Click`, `Select`, `Check`, `Uncheck`, `Clear`, `Wait for`, `Verify`, `Leave empty`.

### Step Formats

```
Navigate to {URL}
Type "{exact value}" in {field name} field
Click "{button text}" button
Click "{link text}" link
Select "{option text}" from {dropdown name} dropdown
Check "{checkbox label}" checkbox
Uncheck "{checkbox label}" checkbox
Clear {field name} field
Wait for {element name} to be visible
Wait for URL to contain "{path}"
Hover on "{element text}" in {location}
Press {Key} key
Set viewport to {width}x{height}
Scroll to {element/section name}
Verify {element} is visible/hidden/enabled/disabled
Leave empty {field name} field
```

### Banned Step Patterns (NEVER Use)

These result in scripts the Automation Agent cannot implement:

| Banned | Why | Replace With |
|---|---|---|
| "Fill all required fields" | Which fields? What values? | List each field + exact value |
| "Enter valid data" | What data exactly? | The actual value to type |
| "Fill the form correctly" | Which button submits? | Each field + click specific button |
| "Submit the form" | Which button? | Click "{exact button text}" button |
| "Enter invalid email" | WHAT invalid email? | Type "notanemail" in Email field |
| "Navigate to the page" | WHICH page? URL? | Navigate to {BASE_URL}/specific/path |
| "Verify the result" | WHAT result? | Verify {element} contains text "{text}" |
| "Complete the registration" | HOW? Each step? | Each field + each click explicitly |
| "Enter appropriate values" | What values? | The exact values |
| "Provide correct information" | What information? | Each field + value listed |

---

## Approved Expected Result Patterns

The `state` field must be one of: `is visible`, `is hidden`, `is disabled`, `is enabled`, `contains text`, `has value`, `changes to`, `displays`, `redirects to`, `has count`.

### Formats

```
{element} is visible
{element} is hidden
{element} is disabled
{element} is enabled
{element} contains text "{exact text}"
{element} has value "{exact value}"
URL changes to "{exact path}"
URL redirects to "{pattern}"
Page displays "{exact text}"
Error message displays "{exact error text}" below {field name}
{list/table} has count "{N items}"
Button "{name}" is disabled
```

### Banned Expected Result Patterns

| Banned | Replace With |
|---|---|
| "Works correctly" | What exactly happens — element visible, URL changes, text appears |
| "Shows appropriate error" | Error message "{exact text}" displays below {field} |
| "Page loads successfully" | URL changes to "{path}" + {element} is visible |
| "Form validates properly" | Specific error messages for specific fields |
| "User experience is good" | Measurable states — visible, enabled, contains text |
| "Submission is successful" | URL redirects to "{path}" or success message displays |
| "Correct message displayed" | "{exact message text}" is visible |
| "Proper feedback shown" | {element} contains text "{exact feedback}" |

---

## Banned Language — Zero Tolerance

These words MUST NOT appear in any step, expected result, or precondition:

| Banned Word | Replace With |
|---|---|
| "appropriate" | The specific expected behavior |
| "correct" / "correctly" | The exact expected state |
| "valid" (as in "enter valid data") | The actual value to type |
| "proper" / "properly" | The measurable outcome |
| "works" | What exactly happens |
| "good" | The specific criterion |
| "successful" / "successfully" | URL change, text appears, element visible |

---

## Precondition Patterns

### Approved

```
Browser at {BASE_URL}/{path} with page fully loaded and overlays dismissed
{Prior TC-ID} completed: {describe the end state visible on screen}
User with email "{email}" exists in the system
Viewport set to {width}x{height}
API server running at {BASE_URL} with auth token in environment
POST /endpoint previously called with {specific data} — response stored
```

### Banned

```
❌ Application is accessible
❌ User is on the page
❌ System is ready
❌ Prerequisites met
❌ Page loaded
```

---

## Placeholders for Unknown Data

When the story doesn't provide a specific value, use these standard placeholders (the Automation Agent recognizes them):

| Placeholder | When |
|---|---|
| `{BASE_URL}` | App base URL (replaced from env_config at runtime) |
| `{unique_email}` | Email that doesn't exist in system |
| `{existing_email}` | Email with existing account |
| `{error_message_for_X}` | Error text not specified in ACs |
| `{exact_behavior_TBD}` | Behavior needing dev clarification |
| `"A" repeated N times` | Boundary test string of N characters |
| `{API_ENDPOINT}` | API URL not specified |
