# JIRA Transitions for Retest

## Connection

Read from `qe-pipeline/config/pipeline-config.json`:
- **cloudId:** `jira.cloudId`
- **browseUrl:** `jira.storyUrlFormat`

## Discover Available Transitions

```
getTransitionsForJiraIssue:
  cloudId: {cloudId}
  issueIdOrKey: {bug key}
```

Look for:
- Close/Done: transition with name containing "Done", "Closed", or "Resolve"
- Reopen: transition with name containing "Reopen", "To Do", or "Backlog"

## Test PASSED → Close Bug

```
transitionJiraIssue:
  cloudId: {cloudId}
  issueIdOrKey: {bug key}
  transition: { "id": "{done transition id}" }
```

Then comment:
```
addCommentToJiraIssue:
  cloudId: {cloudId}
  issueIdOrKey: {bug key}
  contentFormat: markdown
  commentBody: "✅ **Retest PASSED** — {date}\nFix verified. Test {TC-ID} now passes. Closing."
```

## Test FAILED → Reopen Bug

```
transitionJiraIssue:
  cloudId: {cloudId}
  issueIdOrKey: {bug key}
  transition: { "id": "{reopen transition id}" }
```

Then comment:
```
addCommentToJiraIssue:
  cloudId: {cloudId}
  issueIdOrKey: {bug key}
  contentFormat: markdown
  commentBody: "❌ **Retest FAILED** — {date}\nError: `{errorMessage}`\nFix did not resolve the issue. Reopening."
```

Then escalate priority:
```
editJiraIssue:
  cloudId: {cloudId}
  issueIdOrKey: {bug key}
  fields: { "priority": { "name": "{escalated}" } }
```

## Priority Escalation

| Current | Escalates To |
|---|---|
| Low | Medium |
| Medium | High |
| High | Highest |
| Highest | Stays Highest + add label `critical-blocker` |

## Error Handling

| Situation | Action |
|---|---|
| Transition not available | Log "Cannot transition {key}". Skip to next bug. |
| Comment fails | Continue — transition is more important. |
| Priority edit fails | Log, continue. |
