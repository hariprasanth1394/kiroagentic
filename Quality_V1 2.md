# AI-Driven End-to-End Quality Automation Framework

**Version:** 2.0
**Status:** Implementation-Ready
**Audience:** QE Engineers, Automation Architects, DevOps Teams, Release Managers
**Last Updated:** 2025

---

## Table of Contents

1. [Objective](#1-objective)
2. [Inputs](#2-inputs)
3. [Entry Criteria](#3-entry-criteria)
4. [Multi-Agent Workflow](#4-multi-agent-workflow)
5. [Test Flow](#5-test-flow)
6. [API and Contract Testing](#6-api-and-contract-testing)
7. [Playwright Standards (UI Automation)](#7-playwright-standards-ui-automation)
8. [Test Data Management](#8-test-data-management)
9. [Test Environment Strategy](#9-test-environment-strategy)
10. [Gitlab / CI Integration](#10-Gitlab--ci-integration)
11. [YAML Pipeline](#11-yaml-pipeline)
12. [HyperExecute Configuration](#12-hyperexecute-configuration)
13. [Agent Failure Handling](#13-agent-failure-handling)
14. [Defect Workflow](#14-defect-workflow)
15. [Retesting](#15-retesting)
16. [Reporting](#16-reporting)
17. [Stakeholder Notification and Distribution](#17-stakeholder-notification-and-distribution)
18. [Test Management Integration ( Xray)](#18-test-management-integration---xray)
19. [Release Gate and Go/No-Go Output](#19-release-gate-and-gono-go-output)
20. [Confluence Publish Integration](#20-confluence-publish-integration)
21. [Sprint Versioning and Test Asset Lifecycle](#21-sprint-versioning-and-test-asset-lifecycle)
22. [Exit Criteria](#22-exit-criteria)
23. [Outputs](#23-outputs)
24. [Key Principles](#24-key-principles)
25. [Final Goal](#25-final-goal)

---

## 1. Objective

This framework establishes a fully autonomous, AI-driven Quality Engineering (QE) lifecycle that spans requirements ingestion through production ready  code readiness. Each phase of the QE process is handled by a specialized AI agent, enabling end-to-end test coverage — functional UI, API — with minimal manual intervention.

The primary objectives are:

- Eliminate manual test case authoring by generating structured test cases directly from requirements and user stories.
- Produce production-ready Playwright automation scripts for UI and API tests following Page Object Model (POM) standards.
- Execute tests at scale using LambdaTest HyperExecute and report results in real time.
- Fix tests in case of failure in script execution due to flaky object oriented issues
- Automatically log and assign defects in JIRA; validate fixes through automated retesting.
- Feed a machine-readable quality gate output into the release pipeline to enable autonomous Go/No-Go decisions.
- Publish results to Jira and push execution records to the team's test management tool ( Scale Xray).

The framework is designed to be repeatable, auditable, and extensible across sprints and release cycles.

---

## 2. Inputs

The AI agents consume the following structured inputs at the start of each QE cycle. All inputs must be provided in JIRA-compatible or Kiro readable format before the cycle is triggered.

### 2.1 Requirements Document

A jira story describing the feature or module under test. Must include functional scope, constraints, and any non-functional requirements (functional) relevant to the test cycle.

**Expected format:** `https://idpchange.atlassian.net/browse/<Story_id>`

### 2.2 User Stories

Individual user stories in standard format:

```
As a [role], I want to [action], so that [outcome].
```

Each story must carry a unique JIRA story ID (e.g., `PROJ-101`) for traceability linking. 

### 2.3 Acceptance Criteria

Structured acceptance criteria (AC) per user story, written in Given-When-Then or bullet format. These serve as the primary basis for positive test case generation. Each AC must be explicitly listed and linked to its parent story ID.

### 2.4 API Specifications

OpenAPI / Swagger specification files (`.yaml` or `.json`) for all APIs in scope. These are consumed by the Automation Agent to generate API test scripts. If no spec file exists, a JIRA task must be raised to the development team before QE cycle start.

**Expected format:** `api_spec_<service_name>_v<version>.yaml`

### 2.5 Environment Configuration

A configuration file specifying base URLs, feature flag states, and service endpoints for the target test environment. This file is environment-specific and must be committed to the config store (not hardcoded in test scripts).

**Expected format:** `env_config_<environment>.json`


### 2.6 Previous Sprint Defect Register (Optional)

JIRA export of unresolved or deferred defects from the previous sprint. The Planner Agent uses this to prioritize retesting of previously defective areas in the new cycle.

---

## 3. Entry Criteria

All conditions below must be satisfied and verified by the Planner Agent before the QE cycle is triggered. If any condition fails, the agent raises a blocking flag and notifies the QE lead.

### 3.1 Requirement Readiness

- Requirements document reviewed and approved by the Product Owner.
- Acceptance criteria defined for every story in scope.
- No open ambiguities or unresolved comments on the requirements.
- API specification files are available and validated against the deployed service.

### 3.2 Environment

- Target test environment (sandbox) is deployed and passing the unit test check.
- Environment URL, credentials, and configuration parameters are available in the config store.
- If the environment is behind a VPN or firewall, the LambdaTest tunnel is configured and verified (see Section 13.4).

### 3.3 Test Data

- Baseline test data sets (users, accounts, testcentre, etc.) are provisioned via seeding scripts.
- Data isolation strategy for parallel test threads is confirmed (see Section 9).
- Sensitive data (PII) is anonymized or replaced with synthetic equivalents.

### 3.4 Access and Tooling

- LambdaTest HyperExecute credentials and project configuration are in place.
- JIRA project access granted to the automation service account.
- Scale or Xray API token is available for test execution record push.
- CI/CD pipeline (Gitlab) is configured with the correct branch and trigger settings.
- GitLab repository access for script commit and retrieval is confirmed.
- Jira space and target page for report publishing are identified.
- Email distribution list for notifications is configured.

### 3.5 Script Versioning

- All generated scripts gets executed successfully without any failures in hyperexecute
- Successful scripts are commited to merged to the test repository branch handling any merge errors. 
- All previously generated scripts compile without errors on the current branch.

---

## 4. Multi-Agent Workflow

The framework is composed of seven specialized AI agents. Each agent has a defined input, responsibility, output, and failure behavior. Agents operate sequentially; each agent's output becomes the next agent's input. No agent proceeds without a validated output from its predecessor.

---

### 4.1 Planner Agent

**Role:** Requirements analysis, scenario extraction, and risk identification.

**Inputs:** Jira user stories with acceptance criteria, API specs, previous sprint defect register(optional).

**Responsibilities:**

- Parse and structure all functional requirements by feature.
- Extract testable scenarios from user stories and AC, including API contract scenarios.
- Identify risk areas: new functionality, integrations, frequently defective modules, and regulatory-sensitive flows.
- Incorporate previous sprint defects as elevated-risk areas for prioritization(optional).
- Produce a scenario list with risk classification (Critical / High / Medium / Low).
- Validate that API spec files exist for all API-dependent features before proceeding.

**Output:** Scenario inventory document, risk register
**Failure behavior:** If jira story is missing, malformed, the agent update the JIRA story status to "QE Blocker" and halts the cycle.

---

### 4.2 Tester Agent

**Role:** Test case generation across UI, API, and non-functional dimensions.

**Inputs:** Scenario inventory and risk register from the Planner Agent.

**Responsibilities:**

- Generate test cases for each scenario across four categories: Positive, Negative, Edge, and Boundary.
- Generate API test cases (status codes, schema validation, error responses, auth) for each endpoint in scope.
- Map every test case back to its parent user story & acceptance criteria
- Deduplicate: if two ACs produce functionally identical test cases, generate one with both ACs listed in the traceability field.
- Push generated test cases to  Scale Xray via API (see Section 20).

**Test Case Table (UI Example):**

| TC ID | Title | Steps | Expected Result | Priority | Category | Module | Type |
|-------|-------|-------|-----------------|----------|----------|--------|------|
| TC-001 | Successful user login with valid credentials | 1. Navigate to login page. 2. Enter valid username and password. 3. Click Login. | User redirected to dashboard. Session token set. | Critical | Positive | Authentication | UI |
| TC-002 | Login blocked with invalid password | 1. Navigate to login page. 2. Enter valid username and incorrect password. 3. Click Login. | Error message displayed. No session created. | High | Negative | Authentication | UI |
| TC-003 | Login with password at minimum character boundary (8 chars) | 1. Enter valid username and 8-character password. 2. Click Login. | Login succeeds. No truncation or validation error. | Medium | Boundary | Authentication | UI |
| TC-004 | Login with empty username field | 1. Leave username blank. 2. Enter password. 3. Click Login. | Inline validation error shown. Form not submitted. | High | Negative | Authentication | UI |
| TC-005 | Session expiry after configured timeout | 1. Login. 2. Leave idle for timeout period. 3. Navigate to protected route. | User redirected to login. Session token invalidated. | High | Edge | Authentication | UI |
| TC-006 | Concurrent login from two different browsers | 1. Login from Browser A. 2. Login from Browser B. 3. Attempt action in Browser A. | Behavior matches defined session policy. | Medium | Edge | Authentication | UI |

**Test Case Table (API Example):**

| TC ID | Endpoint | Method | Scenario | Expected Status | Schema Valid | Priority | Type |
|-------|----------|--------|----------|----------------|--------------|----------|------|
| API-001 | /auth/login | POST | Valid credentials | 200 + JWT token | Yes | Critical | API |
| API-002 | /auth/login | POST | Invalid password | 401 + error body | Yes | High | API |
| API-003 | /auth/login | POST | Missing request body | 400 + validation error | Yes | High | API |
| API-004 | /users/{id} | GET | Valid user ID, authenticated | 200 + user object | Yes | Critical | API |
| API-005 | /users/{id} | GET | Unauthenticated request | 401 | Yes | High | API |
| API-006 | /users/{id} | GET | Non-existent user ID | 404 + error body | Yes | Medium | API |

**Output:** Master test case document (Markdown table + Xray)

---

### 4.3 Automation Agent

**Role:** Playwright script generation for UI and API tests.

**Inputs:** Master test case document, API spec files, environment config.

**Responsibilities:**

- Generate one Playwright test script per UI test case, following the POM structure.
- Generate API test scripts using Playwright's `request` context (or a designated API test utility).
- Implement assertions for all expected results defined in the test case table, including JSON schema validation for API responses.
- Add structured logging at step level (start, action, assertion, pass/fail).
- Create reusable helper functions for repeated actions (login, navigation, API auth token retrieval).
- Parameterize test data and environment config; never hardcode credentials or URLs.
- Credentials should be encrypted with Base64 in internal automation scripts
- Tag tests with TC ID, priority, module, and type (ui / api / feature) for selective execution.
- Create active sprint branch in the GIT test repository and commit all generated scripts.

**UI Script example:**

```typescript
// tests/authentication/tc001_login_valid.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { testData } from '../../data/authData';

test.describe('@ui @authentication @critical TC-001', () => {
  test('Successful user login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await test.step('Navigate to login page', async () => {
      await loginPage.navigate();
    });

    await test.step('Enter valid credentials and submit', async () => {
      await loginPage.login(testData.validUser.username, testData.validUser.password);
    });

    await test.step('Verify redirect to dashboard', async () => {
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="user-greeting"]')).toBeVisible();
    });
  });
});
```

**API Script example:**

```typescript
// tests/api/auth/api001_login_valid.spec.ts
import { test, expect } from '@playwright/test';
import { validateSchema } from '../../utils/schemaValidator';
import { loginResponseSchema } from '../../schemas/authSchemas';

test.describe('@api @authentication @critical API-001', () => {
  test('POST /auth/login returns 200 and valid JWT for valid credentials', async ({ request }) => {
    const response = await request.post('/auth/login', {
      data: { username: process.env.TEST_USERNAME, password: process.env.TEST_PASSWORD }
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('token');
    expect(validateSchema(body, loginResponseSchema)).toBe(true);
  });
});
```

**Output:** Complete set of Playwright UI and API test scripts committed to the test repository.

---

### 4.4 Execution Agent

**Role:** Test execution via HyperExecute for UI, API suites.

**Inputs:** Playwright scripts, HyperExecute YAML configuration, environment config.

**Responsibilities:**

- Trigger test execution on LambdaTest HyperExecute using the defined YAML pipeline.
- Run UI, API, performance, and accessibility suites in parallel as separate execution streams.
- Distribute tests across parallel nodes according to concurrency configuration.
- Capture console logs, network logs, screenshots on failure, and video recordings for UI tests.
- Capture response payloads and timing data for API tests.
- Store all raw execution artifacts in the designated output directory.
- Emit a machine-readable `execution_result.json` for downstream agents.
- If execution is aborted mid-run, capture partial results and emit an `execution_partial.json` with a clear abort reason (see Section 15).

**Output:** `execution_result.json`, hyperexecute report link with raw test logs, screenshots, video recordings, API response logs.

---

### 4.5 Reporter Agent

**Role:** Result analysis, report generation.

**Inputs:** `execution_result.json`, raw artifacts.

**Responsibilities:**

- Parse execution results and classify each test as Passed, Failed, Skipped, or Flaky.
- Identify flaky tests (inconsistent pass/fail across retries) and flag for investigation.
- Map failures to the originating test case ID, user story, acceptance criterion, and API endpoint.
- Quantify coverage by module, priority, and test type (UI / API / Feature).
- Generate sprint-over-sprint trend data: pass rate change, new failures, resolved failures, flaky test count change.
- Produce the QE report (see Section 18) in Markdown, HTML, and a machine-readable `quality_gate.json`.
- Push execution results to  Scale Xray (see Section 20).

**Output:** QE summary report (HTML), `quality_gate.json`, coverage matrix, flaky test register.

---

### 4.6 Defect Agent

**Role:** JIRA defect creation, deduplication, and assignment.

**Inputs:** Failed test list from the Reporter Agent, Default Defect Assignee.

**Responsibilities:**

- Create one JIRA bug per distinct failure. Deduplicate failures across retries and across parallel threads.
- Cross-reference new failures against open JIRA bugs from prior sprints to avoid duplicate tickets.
- Populate every JIRA bug with the following fields:

| Field | Content |
|-------|---------|
| Summary | Concise, action-oriented failure description |
| Steps to Reproduce | Numbered steps extracted from the failing test script |
| Expected Result | Expected result from the test case definition |
| Actual Result | Observed behavior from logs, screenshots, or API response payload |
| Severity | Critical / Major / Minor / Trivial (mapped from TC priority) |
| Priority | P1 / P2 / P3 / P4 |
| Test Type | UI / API |
| Attachments | Screenshot, video recording, console log, API response payload |
| Labels | Module tag, sprint ID, automated-regression, test-type |
| Linked Story | Parent JIRA user story ID |
| Linked TC | Test case ID from test management tool |

- Assign the bug to the default defect assignee.
- Post a comment on the parent user story linking to the newly created bug.

**Output:** JIRA bug tickets, defect summary table in QE report.

**Failure behavior:** If the JIRA API is unavailable, the agent writes failures to `defects_pending.json` and retries every 15 minutes for up to 2 hours before alerting the QE lead.

---

### 4.7 Retest Agent

**Role:** Fix validation and JIRA closure.

**Inputs:** List of JIRA bugs with status "Ready for Retest", linked TC IDs.

**Responsibilities:**

- Re-execute only the test cases linked to resolved bugs via HyperExecute tag filter.
- Pass on retest: set JIRA status to Closed; add comment with execution timestamp and session URL.
- Fail on retest: set JIRA status to Reopened; add updated failure evidence; escalate priority if this is the second reopen.
- Run a scoped smoke regression across impacted modules after all targeted retests complete.
- Append a retest summary section to the original QE report.
- Push updated execution results to  Scale Xray.
- Regenerate `quality_gate.json` to reflect post-retest pass rate.

**Output:** Updated JIRA tickets (Closed or Reopened), updated `quality_gate.json`, retest summary.

---

## 5. Test Flow

The following sequence represents the complete, end-to-end QE lifecycle including all agent handoffs, human gates, and downstream integrations.

```
Requirements User Stories + AC + API Specs + Environment Config
        |
        v
[Planner Agent]
--> Scenario Inventory, Risk Register
        |
        v
[Tester Agent]
--> Master Test Case Table (UI + API)
--> Push test cases to Xray
        |
        v
[Automation Agent]
--> Playwright UI + API Scripts committed to test repo
        |
        v
[Execution Agent]
--> HyperExecute Run (UI + API)
--> execution_result.json + Artifacts
        |
        v
[Reporter Agent]
--> QE Report (HTML) + quality_gate.json
--> Push results to Xray
        |
        v
[Release Gate Check]
--> quality_gate.json evaluated against thresholds
--> Pass: proceed to deployment  |  Fail: block deployment, notify release manager
        |
        v
[Defect Agent]
--> JIRA Bugs Created + Assigned
        |
        v
Development Agent
--> Bugs Fixed, status set to "Ready for Retest"
        |
        v
[Retest Agent]
--> Targeted Retest
--> JIRA Updated (Closed / Reopened)
--> quality_gate.json regenerated
        |
        v
[Reporter Agent - Final Pass]
--> Final QE Report generated
--> Jira page updated
--> Stakeholder notifications sent
--> GITLAB status set
```

---

## 6. API and Contract Testing

### 6.1 Scope

All REST and GraphQL APIs exposed by the application under test are in scope for API testing. API tests run in parallel with UI tests as a separate HyperExecute execution stream. API test results feed into the same QE report, quality gate, and JIRA defect workflow.

### 6.2 Test Categories

- **Contract tests:** Validate response schema against the OpenAPI spec using JSON Schema validation. Every endpoint must pass contract validation before functional tests are considered.
- **Functional tests:** Validate business logic, status codes, and response payloads for happy path, error, and edge scenarios.
- **Authentication and authorization tests:** Validate that protected endpoints enforce token requirements, role-based access, and scope restrictions.
- **Integration tests:** Validate end-to-end API flows that span multiple services (e.g., create order, trigger inventory update, confirm notification dispatch).

### 6.3 Schema Validation Utility

A shared utility validates API responses against JSON schemas derived from the OpenAPI spec. The schemas are stored under `schemas/` and versioned alongside the test scripts.

```typescript
// utils/schemaValidator.ts
import Ajv from 'ajv';
const ajv = new Ajv({ allErrors: true });

export function validateSchema(data: unknown, schema: object): boolean {
  const validate = ajv.compile(schema);
  const valid = validate(data);
  if (!valid) {
    console.error('Schema validation errors:', ajv.errorsText(validate.errors));
  }
  return !!valid;
}
```

### 6.4 API Test Folder Structure

```
tests/
|-- api/
|   |-- auth/
|   |   |-- api001_login_valid.spec.ts
|   |   |-- api002_login_invalid.spec.ts
|   |-- users/
|   |   |-- api004_get_user.spec.ts
|   |-- orders/
|       |-- api010_create_order.spec.ts
schemas/
|-- authSchemas.ts
|-- userSchemas.ts
|-- orderSchemas.ts
```

### 6.5 API Test Execution Tags

API tests are tagged `@api` and run as a separate suite in HyperExecute to avoid coupling with UI browser setup overhead. The tag filter `--grep @api` is used in the API-specific HyperExecute job.

### 6.6 API Defect Classification

API test failures are classified in JIRA with the label `test-type:api`. The defect description includes the request payload, response payload, expected schema, and actual response. The Defect Agent attaches the raw response JSON as a file attachment.

## 7. Playwright Standards (UI Automation)

All generated UI scripts must conform to the following standards. Deviation requires a documented justification.

### 7.1 Page Object Model (POM)

Every page or significant component has a dedicated Page Object class. Page Objects encapsulate locators and actions; tests contain only flow logic and assertions.

```typescript
// pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.locator('[data-testid="username"]');
    this.passwordInput = page.locator('[data-testid="password"]');
    this.loginButton = page.locator('[data-testid="login-btn"]');
    this.errorMessage = page.locator('[data-testid="error-msg"]');
  }

  async navigate() {
    await this.page.goto(process.env.BASE_URL + '/login');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

### 7.2 Modular Folder Structure

```
project-root/
|-- pages/
|   |-- LoginPage.ts
|   |-- DashboardPage.ts
|   |-- CheckoutPage.ts
|-- tests/
|   |-- ui/
|   |   |-- authentication/
|   |   |   |-- tc001_login_valid.spec.ts
|   |   |   |-- tc002_login_invalid.spec.ts
|   |   |-- checkout/
|   |       |-- tc010_checkout_happy_path.spec.ts
|   |-- api/
|   |   |-- auth/
|   |   |   |-- api001_login_valid.spec.ts
|   |   |-- users/
|   |       |-- api004_get_user.spec.ts
|-- schemas/
|   |-- authSchemas.ts
|   |-- userSchemas.ts
|-- utils/
|   |-- logger.ts
|   |-- apiHelper.ts
|   |-- schemaValidator.ts
|   |-- testDataHelper.ts
|-- data/
|   |-- authData.ts
|   |-- checkoutData.ts
|-- config/
|   |-- env_config_staging.json
|   |-- team_mapping.json
|-- playwright.config.ts
|-- hyperexecute.yaml
|-- hyperexecute_api.yaml
```

### 7.3 Browser Matrix

All UI tests run against the following browsers via HyperExecute. Browser scope per test is controlled by Playwright project configuration.

| Browser | Engine | Desktop | Mobile Viewport |
|---------|--------|---------|----------------|
| Chrome (latest) | Chromium | Yes | Yes (375px) |


### 7.4 Assertions

- Use Playwright's built-in `expect` with web-first assertions (`toBeVisible`, `toHaveText`, `toHaveURL`).
- Every test must have at least one explicit assertion.
- Avoid `page.waitForTimeout`; use `expect` with auto-retry or `waitFor` with a defined condition.
- For API tests, assert status code, response schema, and at least one business-logic field per test.

### 7.5 Logging

Structured step-level logging using `test.step()`. On failure, automatically attach a screenshot, console log, and (for API tests) the response payload via the global `afterEach` hook.

```typescript
// playwright.config.ts (global hook)
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('failure-screenshot', {
      body: screenshot,
      contentType: 'image/png',
    });
    const logs = await page.evaluate(() => window.__consoleLogs__ ?? []);
    await testInfo.attach('console-log', {
      body: JSON.stringify(logs, null, 2),
      contentType: 'application/json',
    });
  }
});
```

### 7.6 Reusable Utilities

Common flows (authentication token retrieval, API data seeding, navigation guards, accessibility checks) are extracted to `utils/` and imported where needed. No logic is duplicated across test files.

---

## 8. Test Data Management

### 8.1 Strategy

Test data is managed as code. All data files are versioned in the test repository alongside scripts. No test script creates data through the UI if an API or seeding script can create it faster and more reliably.

### 8.2 Data Isolation for Parallel Execution

HyperExecute runs tests in parallel across multiple nodes. Each parallel thread must operate on isolated data to prevent cross-thread contamination.

**Approach:** Each test that requires unique data (e.g., a user account, an order) uses the `testDataHelper` to request a unique data set. The helper provisions data via API before the test and tags it with the thread ID.

```typescript
// utils/testDataHelper.ts
export async function createIsolatedUser(request: any): Promise<{ username: string; password: string }> {
  const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const response = await request.post('/admin/users', {
    data: { username: `test_user_${uniqueSuffix}`, password: 'Test@123', role: 'standard' }
  });
  const body = await response.json();
  return { username: body.username, password: 'Test@123' };
}
```

### 8.3 Data Cleanup(Optional)

A cleanup hook runs in `afterAll` to delete all data created during the test run. Cleanup is tagged by run ID so partial cleanup can be re-triggered if a run is aborted.

```typescript
test.afterAll(async ({ request }) => {
  await request.delete(`/admin/test-data/cleanup/${process.env.RUN_ID}`);
});
```

### 8.4 Static Reference Data

Static test data (product IDs, category codes, fixed configuration values) is stored in `data/` files as TypeScript constants. These are read-only and never modified during a test run.

### 8.5 Sensitive Data Governance

- No real PII, real credentials, or production data is used in any test.
- All credentials are stored in the CI/CD secret store (Gitlab Credentials / Vault) and injected as environment variables at runtime.
- Test data files committed to the repository must not contain passwords, API keys, or tokens.
- The Automation Agent validation step checks all generated scripts for hardcoded credential patterns using a regex lint rule before committing.

---

## 9. Test Environment Strategy

### 9.1 Environment Ownership

| Environment | Purpose | Owner | Reset Frequency |
|-------------|---------|-------|----------------|
| sandbox | functional story testing | Test Team | On merge request approval in gitlab pipeline |


### 9.2 Tunnel Configuration for Restricted Environments

If the sandbox environment is behind a corporate firewall or VPN, the LambdaTest tunnel must be configured before the Execution Agent runs.

```yaml
# hyperexecute.yaml (tunnel addition)
tunnel: true
tunnelOpts:
  name: qe-staging-tunnel
```

The tunnel is started as a pre-step in the gitlab pipeline and verified active before HyperExecute is invoked.

### 9.3 Environment Reset After Run

After each QE cycle, the staging environment is reset to a known baseline state using the data cleanup scripts (Section 9.3) and a feature flag reset script. This ensures a clean state for the next cycle.

---

## 10. Gitlab CI Integration

### 10.1 Trigger Configuration

| Trigger | Suite | Branch |
|---------|-------|--------|
| Push to `feature/*` | Smoke (Critical tests only) | Feature branch |
| Pull request to `main` | Smoke + API | main |
| Push to `release/*` | Full regression (UI + API) | Release branch |
| Nightly schedule (02:00 UTC) | Full regression | main |
| Manual (Build with Parameters) | Configurable | Any |

### 10.2 Execute Tests

Gitlab invokes the HyperExecute CLI for UI and API suites in separate steps.

```bash
# UI tests
./hyperexecute --config hyperexecute.yaml --user $LT_USERNAME --key $LT_ACCESS_KEY

# API tests
./hyperexecute --config hyperexecute_api.yaml --user $LT_USERNAME --key $LT_ACCESS_KEY

```

### 10.3 Publish Reports

- Playwright HTML report published to artifact section in gitlab.
- `quality_gate.json` evaluated by a post-step script to determine build pass/fail status.
- All report URLs posted to the configured JIRA story.

### 10.4 Archive Artifacts

All execution artifacts are archived with a 30-day retention policy:

- `playwright-report/**`
- `test-results/**`
- `logs/**`
- `quality_gate.json`

### 10.5 Pipeline Abort and Partial Results

If the pipeline is aborted (timeout, infrastructure failure, manual stop), a `post { aborted { } }` block fires the Reporter Agent with `execution_partial.json`. A partial QE report is generated and a "QE Blocker" JIRA task is raised with the abort reason. The pipeline is safe to re-trigger; previously passed tests are not re-executed if the `--shard` or tag filter is set correctly.

---

## 11. YAML Pipeline

The full Gitlab yaml file covers all stages: dependency installation, environment health check, test generation, script generation, UI execution, API execution, NFT execution, reporting, release gate, defect logging, and retesting.

```yaml
# .gitlab-ci.yml

image: node:20-alpine

stages:
  - install
  - generate_tests
  - generate_automation
  - ui_tests
  - api_tests
  - quality_gate
  - publish
  - defects
  - notify
  - retest

variables:
  BASE_URL: "https://staging.example.com"
  RUN_ID: "${CI_PIPELINE_ID}_${CI_COMMIT_SHORT_SHA}"

  # Configure these securely in GitLab CI/CD Variables
  LT_USERNAME: $LT_USERNAME
  LT_ACCESS_KEY: $LT_ACCESS_KEY
  JIRA_TOKEN: $JIRA_TOKEN
  _TOKEN: $_TOKEN

before_script:
  - npm ci
  - npm install -g @lambdatest/hyperexecute-cli k6

cache:
  paths:
    - node_modules/

install_dependencies:
  stage: install
  script:
    - echo "Dependencies installed successfully"

generate_test_cases:
  stage: generate_tests
  script:
    - node agents/plannerAgent.js
    - node agents/testerAgent.js
  artifacts:
    when: always
    paths:
      - outputs/
      - test_cases.json
      - test_cases.md
      - scenario_inventory.json
    expire_in: 7 days

generate_automation_scripts:
  stage: generate_automation
  script:
    - node agents/automationAgent.js
    - npx tsc --noEmit
  artifacts:
    when: always
    paths:
      - tests/
      - playwright-report/
    expire_in: 7 days

execute_ui_tests:
  stage: ui_tests
  script:
    - |
      hyperexecute \
        --config hyperexecute.yaml \
        --user $LT_USERNAME \
        --key $LT_ACCESS_KEY
  artifacts:
    when: always
    reports:
      junit: results/junit.xml
    paths:
      - playwright-report/
      - results/
      - logs/
    expire_in: 14 days

execute_api_tests:
  stage: api_tests
  script:
    - |
      hyperexecute \
        --config hyperexecute_api.yaml \
        --user $LT_USERNAME \
        --key $LT_ACCESS_KEY
  artifacts:
    when: always
    reports:
      junit: results/junit.xml
    paths:
      - results/
      - logs/
    expire_in: 14 days

generate_report_and_quality_gate:
  stage: quality_gate
  script:
    - node agents/reporterAgent.js
    - node agents/qualityGateEvaluator.js
  artifacts:
    when: always
    paths:
      - quality_gate.json
      - reports/
    expire_in: 14 days

publish_reports:
  stage: publish
  script:
    - echo "Publishing reports completed"
  artifacts:
    when: always
    paths:
      - playwright-report/
      - results/
      - logs/
      - quality_gate.json
    expire_in: 30 days

log_defects:
  stage: defects
  script:
    - node agents/defectAgent.js

notify_stakeholders:
  stage: notify
  script:
    - node agents/notifyAgent.js --status success
  when: on_success

notify_failure:
  stage: notify
  script:
    - node agents/notifyAgent.js --status failure
  when: on_failure

notify_aborted:
  stage: notify
  script:
    - node agents/reporterAgent.js --partial
    - node agents/notifyAgent.js --status aborted
  when: canceled

retest:
  stage: retest
  script:
    - node agents/retestAgent.js
  rules:
    - exists:
        - results/defects_ready_for_retest.json
  artifacts:
    when: always
    paths:
      - quality_gate.json
      - results/
    expire_in: 14 days
```

## 12. HyperExecute Configuration

### 12.1 UI Test Configuration

```yaml
# hyperexecute.yaml
version: "0.1"
runson: linux
concurrency: 10
autosplit: true

pre:
  - npm ci

testDiscovery:
  type: automatic
  mode: dynamic
  command: npx playwright test --list --grep @ui --reporter=json
  testRunnerCommand: npx playwright test $test --grep @ui

testRunnerCommand: npx playwright test $test --grep @ui --reporter=html,junit

report:
  type: html
  frameworkName: playwright
  filename: playwright-report/index.html

uploadArtefacts:
  - name: playwright-ui-report
    path: [playwright-report/]
  - name: test-results
    path: [test-results/]
  - name: logs
    path: [logs/]
```

### 12.2 API Test Configuration

```yaml
# hyperexecute_api.yaml
version: "0.1"
runson: linux
concurrency: 5
autosplit: true

pre:
  - npm ci

testDiscovery:
  type: automatic
  mode: dynamic
  command: npx playwright test --list --grep @api --reporter=json
  testRunnerCommand: npx playwright test $test --grep @api

testRunnerCommand: npx playwright test $test --grep @api --reporter=json,junit

uploadArtefacts:
  - name: api-test-results
    path: [api-results/]
```

### 12.3 Result Capture

- HyperExecute generates a consolidated dashboard URL per execution. This URL is stored as a Gitlab build parameter and linked in the QE report and all JIRA tickets.
- The Execution Agent polls the HyperExecute REST API to retrieve per-test pass/fail results and timing data once the run completes.
- Results from both UI and API jobs are merged into a single `execution_result.json` by the Reporter Agent.
---

### 12.4 Tunnel Configuration

For environments behind a firewall:

```yaml
# Addition to hyperexecute.yaml
tunnel: true
tunnelOpts:
  name: qe-sandbox-tunnel
  port: 8080
```

The tunnel is started in the gitlab pipeline before the HyperExecute invocation and stopped in the `post { always { } }` block.

---

## 13. Agent Failure Handling

Every agent must handle failure gracefully. No silent failure is acceptable. Each agent failure produces an observable artifact and a notification.

### 13.1 Failure Behaviors by Agent

| Agent | Failure Condition | Behavior | Notification |
|-------|------------------|----------|-------------|
| Planner Agent | Requirements MD missing or unparseable | Write `planner_error.json`; raise JIRA QE Blocker; halt pipeline | Slack: qe-alerts + QE Lead email |
| Tester Agent |  Xray API unavailable | Write test cases to local MD only; continue; flag sync failure | Slack: qe-alerts |
| Automation Agent | TypeScript compile error in generated script | Write `compile_errors.json`; halt pipeline; list failing scripts | Slack: qe-alerts + QE Lead email |
| Execution Agent | HyperExecute run fails to start | Retry 3 times with 5-minute backoff; if still failing, halt and alert | Slack: qe-alerts + DevOps email |
| Execution Agent | Run aborted mid-execution | Capture partial results in `execution_partial.json`; run Reporter Agent with partial flag | Slack: qe-alerts |
| Reporter Agent | Missing execution result JSON | Write `reporter_error.json`; halt; do not raise defects without a valid result | Slack: qe-alerts |
| Defect Agent | JIRA API unavailable | Write pending defects to `defects_pending.json`; retry every 15 min for 2 hours; alert after 2 hours | Slack: qe-alerts + QE Lead email |
| Retest Agent | No bugs in "Ready for Retest" status | Skip stage cleanly; log skip reason in build log | None (expected condition) |

### 13.2 Pipeline Abort vs. Pipeline Failure

- **Abort:** Infrastructure failure (agent unreachable, Docker image pull failure, timeout). Captured in `post { aborted { } }` block. Partial report generated. Run is safe to restart from the failing stage.
- **Failure:** Agent logic failure (compile error, quality gate breach, health check failure). Captured in `post { failure { } }` block. Root cause logged. Run must be investigated before restarting.

### 13.3 Retry Policy

| Operation | Max Retries | Backoff | Escalation |
|-----------|------------|---------|-----------|
| HyperExecute invocation | 3 | 5 min | DevOps alert |
| JIRA API call | 5 | 3 min | QE Lead alert after 2 hrs |
| Confluence publish | 2 | 2 min | Log failure; do not block pipeline |
|  Xray push | 3 | 2 min | Log failure; do not block pipeline |

---

## 14. Defect Workflow

### 14.1 Flow

```
Test Fails in Execution
        |
        v
Reporter Agent classifies failure (UI / API)
        |
        v
Defect Agent cross-references against open JIRA bugs
        |
        +-- Duplicate found --> Link new execution evidence to existing bug; do not create new ticket
        |
        +-- New failure --> Create JIRA bug with full evidence
                |
                v
        Assign to default assignee
                |
                v
        Developer Agent investigates and fixes; sets status to "Ready for Retest"
                |
                v
        Retest Agent re-executes linked test cases
                |
                +-- Pass --> JIRA: Closed; comment with evidence
                |
                +-- Fail --> JIRA: Reopened; re-assign; escalate if second reopen
```

### 14.2 Severity and Priority Mapping

| TC Priority | JIRA Severity | JIRA Priority | SLA (fix by) |
|-------------|--------------|---------------|-------------|
| Critical | Critical | P1 | Same sprint |
| High | Major | P2 | Same sprint |
| Medium | Minor | P3 | Same sprint |
| Low | Trivial | P4 | Same sprint |

### 14.3 Defect Deduplication Rules

A new JIRA bug is not created if all of the following match an existing open bug: module, test case ID, and failure type. Instead, the Defect Agent adds a comment to the existing bug with the new execution evidence and increments a "recurrence count" custom field.

---

## 15. Retesting

### 15.1 Targeted Retest

When a developer marks a bug "Ready for Retest", the Retest Agent:

1. Reads bugs with status "Ready for Retest" from JIRA.
2. Resolves each bug's linked TC IDs from the JIRA custom field.
3. Executes only those test cases via HyperExecute using `--grep` with the TC ID tag.
4. Records the pass/fail result and updates JIRA accordingly.
5. Pushes retest execution records to  Xray.

### 15.2 Regression Smoke After Retest

Once all targeted retests are complete and no bugs remain in "Reopened" status, the Retest Agent triggers a scoped smoke regression across all modules that had failures in the current cycle. This validates that fixes did not introduce regressions in adjacent functionality.

### 15.3 JIRA Update Rules

- **Pass:** Status set to Closed. Comment: execution timestamp, HyperExecute session URL, pass screenshot.
- **Fail:** Status set to Reopened. Comment: failure screenshot, log snippet, failure description. Priority escalated by one level if this is the second reopen. QE Lead notified.

### 15.4 Retest Quality Gate

After the retest cycle, `quality_gate.json` is regenerated. If the post-retest pass rate still does not meet the release threshold, the Release Gate remains failed and the Release Manager is notified.

---

## 16. Reporting

The QE report is produced by the Reporter Agent, updated after retesting, and published to Confluence. It is the single source of truth for the QE cycle outcome.

### 16.1 Execution Summary

| Metric | UI Tests | API Tests | Performance | Accessibility | Security |
|--------|----------|-----------|-------------|---------------|----------|
| Total | N | N | N thresholds | N pages | N alerts |
| Passed / Met | N | N | N | N | N |
| Failed / Breached | N | N | N | N | N |
| Skipped | N | N | - | - | - |
| Flaky | N | N | - | - | - |
| Pass Rate | % | % | % | % | % |
| Duration | hh:mm | hh:mm | hh:mm | - | - |

### 16.2 Defect Summary

| JIRA ID | Summary | Module | Type | Severity | Priority | Status |
|---------|---------|--------|------|----------|----------|--------|
| PROJ-210 | Login fails with valid SSO on Safari | Authentication | UI | Major | P2 | Open |
| PROJ-211 | Checkout total wrong with discount code | Checkout | API | Critical | P1 | Fixed |
| PROJ-212 | p95 response time breach on /search endpoint | Search | Performance | Major | P2 | Open |

### 16.3 Coverage Matrix

| Module | Stories | ACs | UI TCs | API TCs | Pass Rate (UI) | Pass Rate (API) |
|--------|---------|-----|--------|---------|---------------|----------------|
| Authentication | 4 | 12 | 18 | 8 | 94% | 100% |
| Checkout | 6 | 20 | 31 | 14 | 87% | 93% |
| Profile | 3 | 8 | 11 | 5 | 100% | 100% |


### 16.4 Risk Register Update

The risk register from the Planner Agent is updated with actual failure counts per risk area. Modules with failures above their risk threshold are highlighted and escalated to the next sprint's risk register automatically.

### 16.5 Flaky Test Register

| TC ID | Title | Module | Flaky Rate | Last Seen | Recommended Action |
|-------|-------|--------|-----------|-----------|-------------------|
| TC-022 | Checkout timeout on slow network | Checkout | 40% | Sprint N | Quarantine; fix network wait logic |
| API-009 | Order status polling race condition | Orders | 25% | Sprint N | Investigate async timing; add retry |

### 16.6 Quality Gate Summary

The report includes the final quality gate verdict: PASS or FAIL, with a breakdown by gate criterion.

---

## 17. Stakeholder Notification and Distribution

### 17.1 Distribution Matrix

| Audience | Channel | Trigger | Content |
|----------|---------|---------|---------|
| QE Team | Email | Every pipeline run | Pass/fail counts, HyperExecute URL, Gitlab build URL |
| Product Owner| Email | Every pipeline run | Status, Gitlab build URL |

### 17.2 Notification Agent

The Notify Agent (`agents/notifyAgent.js`) reads the run status, the distribution matrix from `config/notification_config.json`, and the relevant report sections, then dispatches notifications via the appropriate channels.

```json
// config/notification_config.json (sample)
{
  "channels": {
    "qe_lead": { "type": "email", "address": "${QE_LEAD_EMAIL}" },
  },
  "triggers": {
    "every_run": ["qe_alerts"],
    "gate_failure": ["qe_lead"],
    "agent_failure": ["qe_lead"],
    "defect_created": ["qe_lead"],
    "cycle_complete": ["product_owner_email"]
  }
}
```

### 17.3 Notification Content Standards

- Every notification includes: build ID, branch, environment, run status, and a direct link to the relevant Gitlab report or JIRA ticket.
- Failure notifications include the specific failure reason. No generic "build failed" messages.
- Notifications do not contain sensitive data (credentials, PII, internal IP addresses).

---

## 18. Test Management Integration (Xray)

### 18.1 Purpose

Xray (JIRA plugin) is the system of record for test cases and execution history. All test cases generated by the Tester Agent and all execution results from the Execution Agent are pushed to this system via API. This provides an auditable, long-term test execution history independent of the CI system.

### 18.2 Test Case Push (Tester Agent)

After generating the master test case table, the Tester Agent pushes test cases to  Xray:

- New test cases are created with TC ID, title, steps, expected result, priority, module, and linked story.
- Existing test cases (matched by TC ID) are updated if the script or expected result has changed.
- The returned  Xray test case ID is stored in `test_cases.json` for use by the execution record push step.

```bash
#  Scale API (example)
curl -X POST "https://<jira-host>/rest/atm/1.0/testcase" \
  -H "Authorization: Bearer $_TOKEN" \
  -H "Content-Type: application/json" \
  -d @outputs/test_cases__payload.json
```

### 18.3 Execution Record Push (Reporter Agent and Retest Agent)

After each execution, the Reporter Agent pushes execution results to a  Xray Test Cycle:

- A new Test Cycle is created per build (named: `Sprint_<N>_Build_<ID>`).
- Each test execution record is linked to the corresponding test case ID.
- Pass / Fail / Skipped status, execution timestamp, and HyperExecute session URL are recorded.
- Retest results are pushed to a separate Test Cycle named `Sprint_<N>_Retest_<ID>`.

### 18.4 Traceability via  Xray

The combination of JIRA user story →  test case → execution record → JIRA defect forms the complete traceability chain. This chain is queryable in JIRA for compliance, audit, and release documentation purposes.

---

## 19. Release Gate and Go/No-Go Output

### 19.1 Quality Gate File

The Reporter Agent produces `quality_gate.json` after every execution. This file is the machine-readable verdict consumed by the release pipeline.

```json
// quality_gate.json (sample)
{
  "build_id": "123_abc1234",
  "branch": "release/2.4.0",
  "environment": "staging",
  "timestamp": "2025-06-01T04:15:00Z",
  "verdict": "FAIL",
  "criteria": {
    "overall_pass_rate": { "threshold": 95, "actual": 91, "status": "FAIL" },
    "critical_tc_pass_rate": { "threshold": 100, "actual": 97, "status": "FAIL" },
    "open_p1_defects": { "threshold": 0, "actual": 1, "status": "FAIL" },
    "open_p2_defects": { "threshold": 0, "actual": 2, "status": "FAIL" },
    "performance_thresholds_met": { "status": "PASS" },
    "critical_accessibility_violations": { "threshold": 0, "actual": 0, "status": "PASS" },
    "high_security_alerts": { "threshold": 0, "actual": 0, "status": "PASS" }
  }
}
```

### 19.2 Gate Evaluation

The `qualityGateEvaluator.js` script reads `quality_gate.json` and exits with code 0 (pass) or 1 (fail). Gitlab interprets a non-zero exit as a build failure, which blocks any downstream deployment stage.

```javascript
// agents/qualityGateEvaluator.js
const gate = require('../results/quality_gate.json');
if (gate.verdict === 'FAIL') {
  console.error('Quality gate FAILED. Blocking deployment.');
  console.error(JSON.stringify(gate.criteria, null, 2));
  process.exit(1);
}
console.log('Quality gate PASSED. Deployment may proceed.');
process.exit(0);
```

### 19.3 Threshold Configuration

All gate thresholds are configurable per project and per branch in `config/quality_gate_config.json`. Release branches typically have stricter thresholds than feature branches.

```json
// config/quality_gate_config.json
{
  "feature/*": {
    "overall_pass_rate": 85,
    "critical_tc_pass_rate": 100,
    "open_p1_defects": 0
  },
  "release/*": {
    "overall_pass_rate": 95,
    "critical_tc_pass_rate": 100,
    "open_p1_defects": 0,
    "open_p2_defects": 0,
    "performance_thresholds_met": true,
    "critical_accessibility_violations": 0,
    "high_security_alerts": 0
  }
}
```

### 19.4 Release Manager Notification

When the quality gate is evaluated on a release branch, the Release Manager receives an email containing:

- The gate verdict (PASS / FAIL).
- A criterion-by-criterion breakdown.
- A link to the full QE report on Jira.
- A link to the Gitlab build.
- For PASS: a Go recommendation with a request for manual sign-off.
- For FAIL: a No-Go statement listing the blocking criteria and the responsible QE Lead.

---

## 20. Confluence Publish Integration

### 20.1 Target Structure

Each sprint QE report is published to a jira story page. The page hierarchy is:

```
QE Reports (Space)
|-- <Project Name>
|   |-- Sprint N QE Report
|   |   |-- Execution Summary
|   |   |-- Defect Summary
|   |   |-- Coverage Matrix
|   |   |-- Risk Register Update
|   |   |-- Flaky Test Register
|   |   |-- Retest Summary
|   |   |-- Quality Gate Result
```

### 20.2 Publish Mechanism

The JIRA Publisher Agent (`agents/jiraPublisher.js`) converts the Markdown QE report into JIRA-compatible rich text/Atlassian Document Format (ADF) and publishes or updates the target JIRA Story via the JIRA REST API.

```bash
# Jira REST API upsert
curl -X POST "https://<jira-host>/rest/api/3/issue/<story-key>/attachments" \
  -H "Authorization: Bearer $JIRA_TOKEN" \
  -H "X-Atlassian-Token: no-check" \
  -F "file=@quality_gate.json" \
  -F "file=@playwright-report.zip"
```
### 20.3 Page Naming Convention

Pages are named: `<Project>_Sprint<N>_QE_Report_Build<ID>`. If a page for the current sprint already exists, it is updated (not duplicated). If it does not exist, it is created under the project parent page.

### 20.4 Failure Handling

If the Confluence publish fails, the pipeline does not fail. The error is logged to `logs/confluence_publish_error.log` and the QE Lead is notified via Slack. The report remains available in Gitlab and as a Markdown file in the repository.

---

## 21. Sprint Versioning and Test Asset Lifecycle

### 21.1 Git Branching Strategy

The test repository follows the same branching strategy as the application repository.

| Branch Type | Purpose | Source Branch | Merge Target |
|-------------|---------|--------------|-------------|
| `feature/<story-id>` | New test cases and scripts for a feature | `main` | `main` (via PR) |
| `sprint/<sprint-id>` | Consolidated sprint test scope | `main` | `main` (at sprint close) |
| `release/<version>` | Release candidate regression suite | `main` | `main` (post-release) |
| `main` | Stable, production-validated test suite | - | - |

### 21.2 Test Asset Tagging

At sprint close, all test case IDs, script filenames, and  Xray test cycles are tagged with the sprint ID (e.g., `sprint-24`). This makes it possible to reconstruct the exact test scope executed for any past sprint.

### 21.3 Test Case Retirement

A test case is retired (moved to `archive/` folder and marked Deprecated in  Xray) when:

- The feature it covers is removed from the product.
- The acceptance criterion it maps to is deleted or superseded.
- The test has been quarantined as flaky for more than two consecutive sprints without a fix.

Retirement requires a QE Lead approval tracked in JIRA. Retired test cases are not deleted; they remain searchable for audit purposes.

### 21.4 Script Update Policy

When a requirement or acceptance criterion changes mid-sprint:

1. The Tester Agent re-runs for the affected story only (not the full cycle).
2. The Automation Agent regenerates only the scripts whose test cases changed.
3. The changed scripts are committed to the feature branch with a commit message referencing the JIRA story ID.
4. A PR review is triggered for any changes to Critical test scripts.

---

## 22. Exit Criteria

The QE cycle is considered complete and the quality gate is set to PASS when all of the following conditions are met:

**Execution Completeness:**
- All in-scope test cases have been executed at least once.
- All Critical and High test cases have been executed across all required browsers.
- API contract tests have passed for all in-scope endpoints.

**Defect Status:**
- All Critical (P1) defects are Closed.
- All High (P2) defects are Closed or have approved deferral documentation in JIRA.

**Quality Thresholds:**
- Overall pass rate meets or exceeds the configured threshold (default: 95%).
- Critical test case pass rate is 100%.

**Process Completeness:**
- Retesting completed for all resolved defects.
- Flaky tests reviewed and either fixed or quarantined with a tracking JIRA ticket.
-  Xray execution records pushed and verified.
- Final QE report published to Jira.
- Stakeholder notifications sent.
- All test artifacts archived in Gitlab.
- `quality_gate.json` reflects final post-retest state with verdict PASS.

---

## 23. Outputs

All artifacts produced by the QE cycle are listed below with their format, owning agent, and storage location.

| Artifact | Format | Owner | Location |
|----------|--------|-------|----------|
| Scenario Inventory | JSON + MD | Planner Agent | `/outputs/scenario_inventory.json` |
| Risk Register | MD table | Planner Agent | `/outputs/risk_register.md` |
| Master Test Case Document | MD + CSV | Tester Agent | `/outputs/test_cases/` |
| Xray Test Cases | JIRA (via API) | Tester Agent | JIRA Test Management |
| Playwright UI Scripts | TypeScript | Automation Agent | `/tests/ui/` (Git) |
| Playwright API Scripts | TypeScript | Automation Agent | `/tests/api/` (Git) |
| Execution Result JSON | JSON | Execution Agent | `/results/execution_result.json` |
| Execution Logs | Plain text | Execution Agent | Gitlab Archive |
| Screenshots and Videos | PNG / MP4 | Execution Agent | Gitlab Archive |
| API Response Logs | JSON | Execution Agent | Gitlab Archive |
| Xray Execution Records | JIRA (via API) | Reporter Agent | JIRA Test Management |
| QE Summary Report | MD + HTML | Reporter Agent | Gitlab + Jira |
| Coverage Matrix | MD table | Reporter Agent | QE Summary Report |
| Sprint Trend Data | JSON | Reporter Agent | `/outputs/trend_<sprint>.json` |
| Flaky Test Register | MD table | Reporter Agent | QE Summary Report |
| Quality Gate File | JSON | Reporter Agent | `/results/quality_gate.json` |
| JIRA Defect Tickets | JIRA | Defect Agent | JIRA Project |
| Build MD | MD | Reporter + Defect Agent | `/outputs/build_<id>.md` |
| Pending Defects (fallback) | JSON | Defect Agent | `/results/defects_pending.json` |
| Retest Summary | MD section | Retest Agent | Appended to QE Report |
| Jira Story Page | XHTML | Jira Publisher | Jira Space |

---

## 24. Key Principles

### Traceability

Every test case is linked to a user story and acceptance criterion. Every defect is linked to a failing test case and its parent story. Every execution record in  Xray is linked to a test case and a build. The traceability chain must be complete before the QE cycle exits. No untraceable test cases, orphan defects, or unlinked execution records are permitted.

### No Duplication

The Tester Agent deduplicates scenarios before generating test cases. The Defect Agent deduplicates failures before creating JIRA bugs. No test case is scripted twice. No bug is filed twice for the same failure.

### Validate AI Output

All AI-generated artifacts must pass validation before being used downstream. Test cases: schema completeness check. Scripts: TypeScript compilation. Defect descriptions: field completeness check. Critical test cases on the first cycle require human review (Gate 2). The framework never allows unvalidated AI output to reach production tooling.

### Risk-Based Execution

Test case prioritization and execution order follow the risk register. Critical and High-risk scenarios run first. If execution must be halted, the highest-priority tests will have already run. NFT scope is determined by risk classification, not exhaustive coverage of all pages and endpoints.

### Auditability

Every agent action is logged with a timestamp and the input that triggered it. All logs are archived. Gate approvals are recorded with approver identity and timestamp. The full lifecycle from requirements to production monitoring feedback is traceable from a single Confluence page or the Gitlab build record.

### Fail Fast, Fail Visibly

Any failure — agent failure, environment failure, quality gate breach — is immediately visible. No silent failures. Every failure has a named owner and an action item. The pipeline does not proceed past a blocking failure; it stops, notifies, and waits.

### Continuous Improvement

Flaky test patterns feed back into the Automation Agent's generation rules. Production incident patterns feed back into the Planner Agent's risk classification. Sprint-over-sprint trend data is reviewed at sprint retrospectives to identify systemic quality issues. The framework improves each sprint.

---

## 25. Final Goal

The final goal is a fully autonomous, self-improving AI-driven QE lifecycle in which:

- Requirements ingested at sprint start automatically produce tested, validated, and reported functionality by sprint end.
- Human engineers focus on requirements quality, risk assessment review, and architectural decisions.
- Every test type — functional UI, functional API, performance, accessibility, security — is covered automatically without manual configuration per sprint.
- Defects are detected, logged, assigned, and validated without manual triage.
- Every release exits with a complete, traceable, and auditable QE record that satisfies compliance, stakeholder, and engineering review requirements.
- The quality gate provides a binary, machine-readable Go/No-Go signal that release pipelines can act on autonomously.
- Production incidents feed back into the next sprint's risk register, eliminating recurring coverage gaps.
- The framework operates at scale across multiple teams, products, and technology stacks with shared agent infrastructure and project-specific configuration.

---

*Document maintained by the IQCOE Team. Version this document in Git alongside the framework code. Update at the start of each major framework revision and after any retroactive gap is identified.*
