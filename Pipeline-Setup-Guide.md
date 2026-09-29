# QE Framework — Setup Guide for New Users

This guide walks you through setting up the AI-driven QE pipeline from scratch. Follow each step in order.

---

## Prerequisites

Before starting, ensure you have:

- [Kiro IDE](https://kiro.dev) installed
- Git installed and configured
- A LambdaTest account (for HyperExecute execution)
- A GitLab personal access token (for cloning test repos)
- Access to your JIRA project (for story ingestion and defect creation)

---

## Step 1: Clone the Framework

```bash
git clone https://gitlab.com/idp-education/iqcoe/EnterpriseAIProgram.git
cd EnterpriseAIProgram
```

Open this folder in Kiro IDE. The framework structure loads automatically.

---

## Step 2: Configure LambdaTest Credentials

LambdaTest (HyperExecute) is where all tests execute. You need an account.

### Get Your Credentials

1. Go to [app.lambdatest.com](https://app.lambdatest.com)
2. Click your profile icon → **Account Settings**
3. Copy your **Username** and **Access Key**

### Set Up `.env`

Edit `qe-pipeline/.env`:

```dotenv
# HyperExecute / LambdaTest Credentials
LT_USERNAME={{your_lambdatest_username}}
LT_ACCESS_KEY={{your_lambdatest_access_key}}

# LambdaTest Tunnel (MANDATORY — apps are behind corporate proxy/WAF)
LT_TUNNEL_NAME={{TUNNEL-NAME}}

```

**Important:** Never commit `.env` to Git. It's already in `.gitignore`.

---

## Step 3: Configure GitLab MCP Server

The framework uses a GitLab MCP server to:
- Clone test repositories
- Read file contents from repos
- Commit generated test scripts
- Create branches and merge requests

### Get a GitLab Personal Access Token

1. Go to GitLab → **Settings** → **Access Tokens**
2. Create a token with scopes: `api`, `read_repository`, `write_repository`
3. Copy the token

### Configure in Kiro

Edit `.kiro/settings/mcp.json` and update the GitLab section:

```
"args": {{path-to "gitlab-mcp/index.js"}},(Ex:"C:\\Users\\guruprasadreddy\\Kiro_QE_Native\\gitlab-mcp\\index.js")
"env": {
  "GITLAB_URL": "https://gitlab.com",
  "GITLAB_ACCESS_TOKEN": {{glpat-your-token-here}}
}
    
```

**Note:** Set `"disabled": false` to enable. The token goes in `GITLAB_ACCESS_TOKEN`.

---

## Step 7: Download HyperExecute CLI

The HyperExecute binary is needed for submitting jobs:

### Windows
```powershell
Invoke-WebRequest -Uri "https://downloads.lambdatest.com/hyperexecute/windows/hyperexecute.exe" -OutFile "hyperexecute.exe"
```

### Mac
```bash
curl -o hyperexecute https://downloads.lambdatest.com/hyperexecute/darwin/hyperexecute && chmod +x hyperexecute
```

### Linux
```bash
curl -o hyperexecute https://downloads.lambdatest.com/hyperexecute/linux/hyperexecute && chmod +x hyperexecute
```

Place the binary at the workspace root (or update `execution.hyperExecutePath` in `pipeline-config.json`).

---

## Running the Pipeline

Once setup is complete, you can use these commands:

### Full Pipeline (New Feature Testing)
```
"Run Planning for PROJ-123"
"Run Scripting for PROJ-123"
"Run Execution for PROJ-123"
"Run Closure for PROJ-123"
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| "Failed to get job ID" | LT_ACCESS_KEY wrong or expired | Regenerate key at app.lambdatest.com |
| Clone fails | GITLAB_ACCESS_TOKEN missing/expired | Create new token in GitLab settings |
| JIRA "unauthorized" | OAuth session expired | Re-authenticate via browser when prompted |
| HyperExecute "tunnel not connected" | Tunnel binary not available | Ensure `tunnel: true` in YAML, HyperExecute will auto-start tunnel |
| Tests fail with "element not found" | App behind VPN/WAF | Verify tunnel is enabled + correct tunnel name in .env |
| "npm ERR! code SELF_SIGNED_CERT" | Corporate proxy SSL inspection | `npm config set strict-ssl false` is in pre steps (already handled by policy) |
| Spinner "stuck" during execution | Job is running remotely — CLI is polling | Wait 5-10 min for Java projects, check HyperExecute dashboard |

---

## HyperExecute Dashboard

Monitor your test runs at:
```
https://hyperexecute.lambdatest.com/hyperexecute
```

Each job has:
- Real-time logs per test
- Video recordings
- Network HAR files
- Artifact downloads

---

## Key Files Reference

| File | Purpose | When to Edit |
|---|---|---|
| `qe-pipeline/.env` | Credentials | Once during setup, rotate keys periodically |
| `.kiro/settings/mcp.json` | MCP server connections | Once during setup |
| `qe-pipeline/config/env_config.json` | Target app URL and environment | Per sprint/story |
| `qe-pipeline/config/pipeline-config.json` | JIRA project, GitLab repo, agent config | Once per project |
| `qe-pipeline/config/regression-registry.json` | Test suite registry | When adding new apps/suites |
| `qe-pipeline/config/quality-gate-thresholds.json` | Pass/fail thresholds | When adjusting quality bar |
| `.kiro/skills/{skill}/assets/*-policy.json` | Agent behaviour rules (in the owning skill's assets/; shared ones duplicated per consumer) | When changing how agents work |

---

## Security Notes

- **Never commit** `.env` or `mcp.json` with real tokens to Git
- **Rotate** LambdaTest and GitLab tokens quarterly
- **Use** per-user tokens, not shared team tokens
- **The framework** never pushes test scripts back to GitLab without explicit user command
- **Credentials** are read from `.env` at runtime — not stored in policy files

---

## Next Steps

1. ✅ Complete all setup steps above
2. Try: `"Run pipeline for {YOUR-STORY-KEY}"` — watch the full pipeline run
3. Try: `"Run Regression for {your-app}"` — see existing tests execute
4. Read `QE-Framework-Complete-Guide.md` for full architecture details
