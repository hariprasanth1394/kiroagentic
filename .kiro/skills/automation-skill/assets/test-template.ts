/**
 * Test File Generation Template
 *
 * Used by the Automation Skill to generate test specs in the regression suite.
 * Replace all {{PLACEHOLDER}} tokens at generation time.
 *
 * Layer: tests/
 * File naming: {feature}.spec.ts  (flat — no subdirectories)
 * Allowed imports: @fixtures/* ONLY
 * Banned imports: @pages/*, @components/*, @flows/*, @core/*
 * Constraint: NO locator strings, NO direct page imports
 *
 * Placeholders:
 *   {{DOMAIN}}          — Business domain tag (e.g., checkout)
 *   {{FEATURE}}         — Feature name for the describe block (e.g., Place Order)
 *   {{SUITE_TAGS}}      — One or both suite tags, space-separated (e.g., @suite:smoke @suite:regression)
 *   {{STORY_KEY}}       — JIRA story key(s) for the header comment ONLY — NOT a describe tag
 *   {{FIXTURE_IMPORT}}  — Fixture import path (e.g., @fixtures/checkout.fixture)
 *   {{TESTS}}           — Individual test blocks calling flows via fixtures
 *
 * Suite tag rules:
 *   - Regression-only test:    @suite:regression
 *   - Smoke-only test:         @suite:smoke
 *   - Both (critical paths):   @suite:smoke @suite:regression
 *   Derive from tags.suite[] in test-cases.json (set by Tester skill per risk/priority mapping).
 *
 * Story association:
 *   Story keys go in the registry stories[] arrays (many-to-many), NOT as Playwright tags.
 *   The '// story: {{STORY_KEY}}' comment below is for human reference only — never grep-filtered.
 */

import { test, expect } from '{{FIXTURE_IMPORT}}';

/**
 * {{FEATURE}} — {{DOMAIN}} domain tests.
 * story: {{STORY_KEY}}  (human reference — not a tag; story tracked in registry stories[])
 */
test.describe('{{FEATURE}} @domain:{{DOMAIN}} {{SUITE_TAGS}}', () => {

{{TESTS}}
});
