# Output Formats

> **The planner does NOT post to JIRA.** Its only output is `scenario-inventory.json` (plus the per-app env-config `appUrl`/`apiBaseUrl` update). It reads JIRA (`getJiraIssue`, `searchJiraIssuesUsingJql`) but never writes. Stakeholder-facing scenario counts and risks are conveyed to the user in the chat summary and live in the JSON — no story comment is posted. JIRA writes (Test/Test Set issues) are the Tester skill's job.

## Chat Summary (report to the user, not JIRA)

After writing `scenario-inventory.json`, summarize to the user in chat: scope (ACs/fields/flows → scenario count), category breakdown (positive/negative/boundary/error-handling), top risks with scores, environment limitations, and "Next: Run Tester for {KEY}".

## Confidence Rules

| Value | When to assign |
|---|---|
| `"high"` | From explicit ACs, Fields table, or Business Rules in the story |
| `"medium"` | From JIRA comments or Figma interpretation |
| `"low"` | Inferred from app inspection or context (not stated anywhere in story) |

## Prerequisites Object

Set each field based on what you find in the story:

```json
"prerequisites": {
  "apiKeyAvailable": "available | missing | not_needed",
  "apiAuthTokenAvailable": "available | missing | not_needed",
  "dynamicIdFormatDocumented": "documented | tbd | not_needed",
  "apiSpecsCurrent": "confirmed | stale_risk | not_applicable"
}
```

- `"available"` — explicitly confirmed in story or comments
- `"missing"` — needed but not provided/confirmed
- `"not_needed"` — story doesn't require this
- `"documented"` / `"tbd"` — for ID formats
- `"confirmed"` / `"stale_risk"` — for API specs freshness
