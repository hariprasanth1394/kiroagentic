# HyperExecute Run Guide

## Credential Loading

Read from `qe-pipeline/.env`:
```
LT_USERNAME=<value>
LT_ACCESS_KEY=<value>
```

Parse the file, extract values. **DO NOT echo values in output or logs.**

## Binary Path

Read from `qe-pipeline/config/pipeline-config.json → execution.hyperExecutePath`.

## Background Process Approach

HyperExecute jobs take 3-10 minutes. Use `control_pwsh_process` to avoid CLI timeout.

### Start

```
control_pwsh_process:
  action: start
  command: $env:LT_USERNAME="<value>"; $env:LT_ACCESS_KEY="<value>"; & "{hyperExecutePath}" --config hyperexecute.yaml --download-artifacts --force-clean-artifacts
  cwd: qe-pipeline/output/{KEY}/automation
```

### Poll (every 60 seconds)

```
get_process_output:
  terminalId: <from start>
  lines: 30
```

### Completion Signals

Look for in output:
- `"Job Link: https://..."` → capture as dashboardUrl
- `"PASSED"` or `"FAILED"` in summary → job complete
- `"stages completed"` with spinner → still running, poll again
- `"Error:"` line → job failed, capture full error message
- `"ERR::TIME::OUT"` → task timed out

### Stop

Once complete:
```
control_pwsh_process:
  action: stop
  terminalId: <from start>
```

## Why Background Process

- The process runs independently — no conversation timeout
- Poll at intervals instead of blocking
- Job completes on its own schedule
- Can do lightweight work between polls if needed

## DO NOTs

- DO NOT use `execute_pwsh` with a timeout for this command (it WILL time out)
- DO NOT echo credential values anywhere
- DO NOT assume job is done without seeing completion signals
- DO NOT kill the process early — let the job finish

## Retry Logic

| Situation | Action |
|---|---|
| Pre-step failure (npm install) | Fix package.json, retry ONCE |
| 401 Unauthorized | STOP — wrong credentials, report |
| ERR::TIME::OUT | Increase `taskTimeout` in YAML, retry ONCE |
| Network error during poll | Wait 30s, poll again |
| Process crashes | Re-start, retry ONCE |

Max total retries per run: 2 (1 for pre-step + 1 for timeout).
