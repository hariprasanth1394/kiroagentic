# JIRA Defect Creation

## Connection

Read from `qe-pipeline/config/pipeline-config.json`:
- **cloudId:** `jira.cloudId`
- **projectKey:** Derived from story key at runtime
- **browseUrl:** `jira.storyUrlFormat`

## Deduplication Query

```
searchJiraIssuesUsingJql:
  cloudId: {cloudId}
  jql: "issuetype = Bug AND project = {projectKey} AND statusCategory != Done AND summary ~ \"[{TC-ID}]\""
```

If results found:
- Same story → add comment with new evidence:
  ```
  addCommentToJiraIssue:
    cloudId: {cloudId}
    issueIdOrKey: {existing bug key}
    contentFormat: markdown
    commentBody: "**New evidence from run {pipelineRunId}:**\nError: `{errorMessage}`\nDashboard: {dashboardUrl}"
  ```
- Different story → cross-link:
  ```
  createIssueLink:
    cloudId: {cloudId}
    type: "Relates"
    inwardIssue: {existing bug key}
    outwardIssue: {KEY}
  ```

## Create Bug (Product Defect)

```
createJiraIssue:
  cloudId: {cloudId}
  projectKey: {derived from KEY}
  issueTypeName: Bug
  summary: "[{TC-ID}] {concise description of what's wrong}"
  contentFormat: markdown
  description: |
    ## What Went Wrong

    {One sentence: what was attempted and what actually happened}

    ## Steps to Reproduce

    {From test-cases.json → find TC by id → format steps[]:
     "1. {action} {target} — {value}"
     "2. {action} {target} — {value}"}

    ## Expected Result

    {From test-cases.json → expectedResults[]:
     "- {element} {state} {value}"}

    ## Actual Result

    {errorMessage from execution_result.json}

    ## Evidence

    | Item | Value |
    |---|---|
    | Test Case | {TC-ID} |
    | Category | Product Defect |
    | Platform | HyperExecute |
    | Environment | {baseUrl} |
    | Dashboard | {dashboardUrl} |
  additional_fields:
    labels: ["automated-regression", "qe-pipeline", "{KEY}"]
    priority: { "name": "{mapped priority}" }
```

**Priority mapping:**
- Critical → "Highest"
- High → "High"
- Medium → "Medium"
- Low → "Low"

## Create Task (Test Script Error)

```
createJiraIssue:
  cloudId: {cloudId}
  projectKey: {derived from KEY}
  issueTypeName: Task
  summary: "[{TC-ID}] Test maintenance: {what's broken}"
  contentFormat: markdown
  description: |
    ## Test Script Issue

    Automated test {TC-ID} is failing due to a test code problem (not an app bug).

    ## Error

    {errorMessage from execution_result.json}

    ## Likely Cause

    {Based on error pattern:
     "locator resolved to 0 elements" → selector needs updating
     "strict mode violation" → selector matches multiple elements
     "TypeError" → code bug in test script}

    ## Action Needed

    Update test script. Re-run via "Run Scripting for {KEY}" (regenerate + local validate) then "Run Execution for {KEY}" after fix.
  additional_fields:
    labels: ["test-maintenance", "qe-pipeline", "{KEY}"]
    priority: { "name": "Medium" }
```

## Linking (IMMEDIATELY after creation)

For each created issue:

```
createIssueLink:
  cloudId: {cloudId}
  type: "Relates"
  inwardIssue: {created bug/task key}
  outwardIssue: {KEY}
```

If test issue key exists in `jira-upload-summary.md`:
```
createIssueLink:
  cloudId: {cloudId}
  type: "Relates"
  inwardIssue: {created bug/task key}
  outwardIssue: {test issue key}
```
