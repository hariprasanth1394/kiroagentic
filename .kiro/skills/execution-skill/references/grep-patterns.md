# Grep Filter Patterns

## Execution Modes

The execution skill supports three modes for scoping which tests run. Each mode maps to a Playwright `--grep` argument.

| Mode | Filter | Use Case |
|---|---|---|
| **Story** | **file list** (resolved from registry, NOT grep) | Default for pipeline runs — execute the specific spec files that belong to a JIRA story |
| **Domain** | `--grep "@domain:{TAG}"` | Domain-scoped regression — execute all tests in a business domain |
| **Full** | _(no filter)_ | Full regression — execute everything in the suite |

> Story is NOT a tag. Story mode does not use `--grep`. It resolves the exact spec files for the story from the registry `domain-index.json → domains[].tests` (entries whose `stories[]` contains the key) or from that story's `automation-manifest.json → artifacts.tests[].file`, then passes those file paths to Playwright. This is more accurate than grep because a shared test belonging to several stories runs correctly for each owning story.

## How Tags Are Embedded

Tests use `@domain` and `@suite:*` tags in their `test.describe` block title. Story is not a tag — it lives in the registry.

```typescript
test.describe('@domain:booking @suite:smoke @suite:regression Booking Flow', () => {
  test('should create a new booking', async ({ bookingFlow }) => {
    // ...
  });
});
```

Tags are part of the describe string. Playwright's `--grep` performs a regex match against the full test title (describe + test name concatenated).

## Story Mode (Default) — file list, not grep

Runs the specific spec files that belong to a JIRA story. Resolve the file list first, then pass paths:

```bash
# 1. Resolve files for the story from the registry / manifest (see below)
# 2. Run them by path:
npx playwright test tests/place-order.spec.ts tests/order-confirmation.spec.ts --project=chromium
```

**Resolution order:**
1. `automation-manifest.json → artifacts.tests[].file` for this story's run (authoritative for the just-automated set), OR
2. `registry/domain-index.json → domains[].tests` filtered to entries whose `stories[]` contains the key (authoritative across the whole suite, incl. tests reused by this story).

**When used:** Every pipeline execution triggered by a story. There is no `@story` tag to grep.

## Domain Mode

Runs all tests in a business domain for targeted regression.

```bash
npx playwright test --grep "@domain:booking"
```

**When used:** Domain-scoped regression runs. Triggered manually or by the orchestrator when validating an entire domain after multiple story completions.

**Matches:** Any test whose describe block contains `@domain:booking`.

## Full Mode

Runs the entire regression suite with no filter.

```bash
npx playwright test
```

**When used:** Scheduled full regression (e.g., nightly). No grep argument — all tests in `testDir` execute.

## Integration with HyperExecute

The grep pattern is appended to the `testRunnerCommand` in the generated YAML:

### Story Mode YAML (file list — no grep)
```yaml
# testDiscovery yields the resolved spec files; the runner runs them by path
testRunnerCommand: "npx playwright test $test --project=chromium"
```

### Domain Mode YAML
```yaml
testRunnerCommand: "npx playwright test $test --project=chromium --grep \"@domain:booking\""
```

### Full Mode YAML
```yaml
testRunnerCommand: "npx playwright test $test --project=chromium"
```

## Tag Format Reference

| Tag | Pattern | Example |
|---|---|---|
| Domain | `@domain:{business-area}` | `@domain:booking` |
| Suite | `@suite:{smoke\|regression}` | `@suite:smoke` or `@suite:regression` or both |

Story is not a tag — it is resolved from the registry to a file list (see Story Mode).

## Suite Filtering (Smoke / Regression)

Run only smoke tests for a fast validation pass:
```bash
npx playwright test --grep "@suite:smoke"
```

Run full regression (all suites):
```bash
npx playwright test --grep "@suite:regression"
```

## Multiple Domains

Grep supports regex OR for combining domain filters:

```bash
npx playwright test --grep "@domain:booking|@domain:checkout"
```

## Execution Skill Logic

1. Read the automation manifest to determine execution mode
2. If `storyKey` is present → **story mode**: resolve the spec file list from the manifest `artifacts.tests[].file` (or `domain-index.json` entries whose `stories[]` contains the key) and run those paths — no grep
3. If `domain` is specified without a story → domain mode: build `--grep "@domain:{TAG}"`
4. If neither → full mode: no filter
5. For domain/full, inject the grep argument into `testRunnerCommand`; for story mode, feed the resolved file list via `testDiscovery` / paths
