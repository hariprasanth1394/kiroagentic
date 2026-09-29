# QE Framework V3 — AI-Driven Quality Automation

A policy-driven, AI-native test automation framework built on Kiro + LambdaTest HyperExecute.

## Architecture

```
┌──────────────────────────────┐
│         ORCHESTRATOR         │
│   Routes commands to agents  │
└─────────────┬────────────────┘
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
 AGENTS    CONTRACTS   HOOKS
(execute)  (communicate)(validate)
    │                     │
    ▼                     ▼
 POLICIES            VALIDATION
(behaviour)           POLICY
    │
    ▼
 KNOWLEDGE
(memory)
```

**Four Layers:**
- **Agents** — execute work (Planner, Tester, Automation, Execution, Reporter, Defect, Retest)
- **Contracts** — JSON schemas for inter-agent communication
- **Policies** — behaviour rules agents read at runtime
- **Knowledge** — persistent memory that accumulates across runs

## Quick Start

### Prerequisites

- [Kiro IDE](https://kiro.dev) with workspace opened on this folder
- LambdaTest account (credentials in `qe-pipeline/.env`)
- Git access to the test automation repo

### Setup

1. Clone this repo
2. Copy `qe-pipeline/.env.example` to `qe-pipeline/.env` and fill credentials:
   ```
   LT_USERNAME=your_username
   LT_ACCESS_KEY=your_access_key
   ```
3. Open in Kiro

### Run Commands

| Command | What it does |
|---|---|
| `Run Planning for TCOE-XXX` | Extract scenarios from JIRA story |
| `Run Scripting for TCOE-XXX` | Generate Playwright test scripts |
| `Run Execution for TCOE-XXX` | Execute tests on HyperExecute |
| `Run Closure for TCOE-XXX` | Create defects + retest |
| `Run Regression` | Run P1 regression suite |
| `Run Regression for {AREA}` | Run tests for specific feature area |

## Folder Structure

```
.kiro/
├── hooks/              # Thin policy-loading validators
├── skills/             # Agent procedure files (slim, policy-driven)
├── steering/           # Auto-included context rules
└── settings/           # MCP server configuration

qe-pipeline/
├── policies/           # Behaviour rules (12 files)
├── knowledge/          # Long-term memory (6 files)
├── contracts/schemas/  # JSON schemas for contracts
├── config/             # Environment, pipeline, HyperExecute config
└── output/             # Per-run artifacts (gitignored)
```

## Key Files

| File | Purpose |
|---|---|
| `.kiro/skills/{skill}/assets/*-policy.json` | Behaviour rules, co-located with the owning skill (JSON lives in assets/). Change behaviour here, not in the skill prompt. `naming-policy.json` is split per owner; `jira-policy.json` is duplicated across tester/defect/retest — keep those copies in sync. |
| `qe-pipeline/knowledge/pipeline-health.json` | Run history — pass rates, durations over time |
| `qe-pipeline/knowledge/failure-history.json` | Failure baseline — new vs pre-existing failures |
| `qe-pipeline/knowledge/flaky-tests.json` | Flaky test registry with escalation thresholds |
| `qe-pipeline/config/regression-registry.json` | Impact map — feature areas → test suites |
| `qe-pipeline/config/hyperexecute-reference.yaml` | Minimal working HyperExecute YAML template |

## Design Principles

1. **Policy over Prompt** — Change rules in JSON policies, not agent markdown files
2. **Discover First, Reuse Second, Generate Last** — Regression uses existing tests before creating new ones
3. **Evidence First** — No selector without DOM proof, no result without parsed output
4. **Knowledge Accumulates** — Every run feeds baseline, flakiness, and selector health data
5. **Hooks Validate, Not Implement** — Hooks load validation-policy.json, never hardcode rules

## Regression Testing

The framework supports two regression modes:

**Maintenance + Run** — Tests need updating after a new feature:
```
Clone → Inspect live DOM → Compare selectors → Fix broken ones → Run
```

**Run Only** — Tests are current, just execute:
```
Clone → Generate YAML → Submit to HyperExecute → Report
```

Impact map resolves "what changed" → "what to test":
- `booking` → P1 booking suites (@TTP2, @TTP3)
- `review-page` → TCOE-330 Playwright specs
- `registration` → TCOE-147 Playwright specs

## HyperExecute Configuration

Key lessons learned and baked into policies:
- Use `autosplit: true` + `testDiscovery (raw/dynamic)` for parallel execution
- Always `npm config set strict-ssl false` first (Windows runner SSL cert issue)
- Never use `framework: playwright` block (forces single machine)
- Never use `npm ci` (use `npm install`)
- Tunnel required for WAF-protected apps

## Contributing

- To add new behaviour rules → edit the `*-policy.json` in the owning skill's `.kiro/skills/{skill}/assets/` folder (for `jira-policy.json`, update the tester/defect/retest copies together)
- To register a new regression suite → add entry to `regression-registry.json`
- To add a new feature area → add to `impactMap` in the registry
- Agent skills should rarely need modification