# Troubleshooting Guide — Kiro + QE Framework

## Part 1: Understanding Kiro

### Kiro Limitations (Important!)

| Limitation | What It Means | Workaround |
|---|---|---|
| **Context window** | Kiro can only hold ~200K tokens in memory. Long conversations get compacted — it may forget earlier details | Start a new session for each major task |
| **Not persistent** | Kiro doesn't "remember" previous sessions. Each session starts fresh | Use knowledge files for persistence across sessions |
| **Can't run forever** | If a command takes too long (2+ min), it times out | Use background processes for long-running commands |
| **One task at a time** | Kiro can't run two sessions simultaneously in the same workspace | Wait for current task to finish |

---

## Part 2: Common Kiro Issues

### "MCP server disconnected"

**Symptoms:** JIRA, Playwright, or GitLab tools stop working mid-session.

**Fix:**
1. Open Command Palette (Ctrl+Shift+P)
2. Search "MCP"
3. Click "Reconnect MCP Servers"

If that doesn't work: restart Kiro IDE.

### "Context compacted"

**Symptoms:** Kiro says something like "After context compaction, re-confirming position..."

**What happened:** The conversation got too long. Kiro compressed earlier messages.

**What to do:** It will continue working — just be more explicit if it seems confused about earlier context. If it's lost, start a new session and point it to the relevant output files.

### "Tool call failed" / "Permission denied"

**Symptoms:** Kiro asks for permission or shows a hook blocking an action.

**What to do:** Read what the hook is asking. If it's a legitimate safety check (e.g., "Are you sure you want to run HyperExecute?"), approve it. If it seems wrong, say "skip" or "proceed anyway."

### "The session seems slow / stuck"

**Symptoms:** Kiro takes 30+ seconds to respond with no progress.

**What's happening:** It's likely making multiple tool calls (reading files, searching, etc.) or waiting on an MCP server.

**What to do:** Wait. If truly stuck (3+ minutes), click the Stop button and re-ask.

---

## Part 3: QE Framework — What It Cannot Do Without You

### The framework DOES NOT:

| What | Why Not |
|---|---|
| Bypass MFA/CAPTCHA/SSO | Security mechanisms block automation by design |
| Fix infrastructure (VPN, tunnels, DNS) | It reports the problem but can't fix network issues |
| Make business decisions | "Is this a real bug or expected behaviour?" requires human judgment |
| Know undocumented requirements | If the JIRA story doesn't say it, Kiro can't know it |
| Push code to GitLab without asking | It always asks before pushing. By design. |

### The framework DOES:

| What | How |
|---|---|
| Read JIRA stories and generate test scenarios | Automatically from story ACs |
| Generate executable test scripts | Playwright (TS) with DOM-verified selectors |
| Run tests on cloud infrastructure | HyperExecute (LambdaTest) |
| Report results with pass/fail gate | Quality gate with thresholds |
| Create JIRA bugs for real defects | Classified: product bug vs script error vs env issue |
| Track flaky tests and failure patterns | Knowledge layer persists across runs |

---

## Part 4: Automation Script Generation

### When Kiro Gets Stuck Finding Locators

Don't give Kiro the answer directly — teach it how to find it. If you hand over selectors, Kiro won't learn the app structure and will ask every time.

**Instead of:** "Use `data-testid='submit-btn'`"

**Say:** "The element is inside an iframe named 'booking-frame'. Switch to that iframe first, then inspect." or "Scroll down to the footer section before looking for that button." or "The form renders after clicking the 'Book Now' tab — click that first, wait for the form, then inspect."

**Guide Kiro to the element, don't give the element.**

### Realistic Expectations

| Page Complexity | Iterations to Get Right |
|---|---|
| Simple (login, search) | 1-2 |
| Medium (forms, filters) | 2-4 |
| Complex (multi-step wizards) | 4-8 |
| iframe / shadow DOM / heavy async | May need guidance on where to look |

### If Stuck After 3+ Attempts

Tell Kiro the **approach**, not the answer:
- "Look inside the shadow DOM of the `<app-root>` component"
- "The modal appears only after the API call returns — wait for network idle"
- "Use the accessibility tree (browser_snapshot) instead of DOM for this page"

---

## Part 5: HyperExecute — Execution Issues

### When Artifacts Are Missing / Results Empty

Usually means tests never ran — failed at compile or config stage.

**What to do:**
1. Open HyperExecute dashboard → find job → view logs
2. Read the **pre-step logs** (Maven/NPM output)
3. Paste the **error** to Kiro: "HyperExecute logs show this error: [paste]"

Kiro can't access HyperExecute logs directly. You are the bridge.

### Common Log Errors

| Error in Logs | What Happened | What to Tell Kiro |
|---|---|---|
| `Could not resolve dependencies` | Maven proxy/version issue | "Dependency resolution failed: [paste error]" |
| `UnsupportedClassVersionError` | Java version mismatch | "Needs Java 17, YAML has 11" |
| `No tests found` / `0 scenarios` | Wrong tag or no matching tests | "Tag doesn't exist in repo, check correct tag" |
| `Tunnel connection failed` | Network issue | "Tunnel can't connect, check network" |
| `Task timed out` | Slow env or infinite loop | "Timed out at 600s, increase timeout or check why" |

### Test Failure vs Infrastructure Failure

- Some pass, some fail → **test failures** (real results, report them)
- All fail with same error / 0 executed → **infra failure** (fix config, re-run, don't file defects)

---

## Part 6: Framework-Specific Troubleshooting

### "Run pipeline" — Nothing happens

| Check | Fix |
|---|---|
| Did you say the exact command? | Must be: `"Run {phase} for PROJ-123"` |
| Is JIRA MCP connected? | Check MCP panel in Kiro sidebar. If disconnected, reconnect |

### HyperExecute spinner looks "stuck"

**This is normal.** The CLI polls the remote job every few seconds. The spinner continues until the remote job finishes. Java projects take 5-10 minutes (Maven compile + test run). Don't kill it.

**To confirm it's running:** Check the HyperExecute dashboard:
```
https://hyperexecute.lambdatest.com/hyperexecute
```

### "Quality gate: NOT_EVALUATED"

**Means:** Tests didn't complete — execution had an infrastructure error.

**Common causes:**
- Tunnel couldn't connect
- App was down during test window
- Timeout exceeded (600s default)

**Fix:** Read `execution_result.json`, look at the `error` field. Usually has the root cause.

### Tests pass locally but fail on HyperExecute

| Possible Cause | Fix |
|---|---|
| Different browser version | Specify exact version in YAML config |
| Environment variables missing | Add them to YAML `env:` section |
| Timing differences (cloud is slower) | Use proper waits, not `setTimeout` |
| Tunnel not reaching specific endpoints | Check HyperExecute tunnel logs |

### JIRA defect creation fails

| Check | Fix |
|---|---|
| JIRA MCP authenticated? | If OAuth expired, re-authenticate when prompted |
| Issue type "Bug" exists in project? | Some projects only have "Story" and "Task" — agent falls back to Task |
| Duplicate defect detected? | Agent searches before creating. Check if it added a comment to existing issue instead |

---

## Part 7: Best Practices

### DO:
- Start each major task in a **new Kiro session** (fresh context)
- Check `qe-pipeline/.env` has valid credentials **before** running
- Use the **HyperExecute dashboard** to monitor jobs (don't rely on CLI spinner)
- Read **execution_result.json** when things fail — it has the error details
- Keep **one pipeline run per session** — don't run Planning + Scripting + Testing in the same chat
- **Review generated scripts** before pushing — Kiro is good but not perfect

### DON'T:
- Don't expect Kiro to remember things from yesterday's session
- Don't run multiple pipeline phases without checking the output of each
- Don't kill the HyperExecute CLI when it looks "stuck" — it's polling
- Don't skip reading error messages — they tell you exactly what went wrong
- Don't change policy files without understanding what they control
- Don't commit `.env` or `mcp.json` with real tokens to Git
- Don't assume "no error" means "success" — always verify the output files

---

## Part 8: When to Escalate

| Situation | Who to Contact |
|---|---|
| LambdaTest account issues (billing, access) | LambdaTest support |
| GitLab repo access denied | Your GitLab admin |
| JIRA project permissions | Your JIRA admin |
| Framework bug (agent produces wrong output despite correct input) | Framework maintainer |
| Kiro IDE crashes / won't start | [Kiro support](https://kiro.dev) |
| Tests fail due to app bug | Dev team (file JIRA bug) |
| Tests fail due to environment | DevOps/Infra team |
| Tests fail due to test script error | QE team (fix the script) |

---

### 80/20 Rule

The framework handles 80% autonomously. The 20% that needs you:
- Providing context it can't discover (undocumented APIs, business rules)
- Maintaining credentials and access
- Making judgment calls on ambiguous failures
- Setting up test data and environments
- Reviewing and approving generated outputs before they reach production systems
