/**
 * Fixture Generation Template
 *
 * Used by the Automation Skill to generate fixtures in the regression suite.
 * Replace all {{PLACEHOLDER}} tokens at generation time.
 *
 * Layer: fixtures/
 * File naming: {domain}.fixture.ts
 * Allowed imports: @flows/*, @core/*
 * Banned imports: @pages/*, @components/*, @tests/*
 * Constraint: Extends base test with flow injection
 *
 * Placeholders:
 *   {{DOMAIN}}        — Business domain name (e.g., checkout)
 *   {{FLOW_IMPORTS}}  — Import statements for flow classes
 *   {{FIXTURE_TYPE}}  — TypeScript type definition for fixture providers
 *   {{PROVIDERS}}     — Fixture provider implementations (flow instantiation + use)
 */

import { test as base } from '@playwright/test';
{{FLOW_IMPORTS}}

/**
 * Fixture type definition for the {{DOMAIN}} domain.
 * Each key becomes an injectable dependency available to tests.
 */
type {{DOMAIN}}Fixtures = {
{{FIXTURE_TYPE}}
};

/**
 * Extended test object with {{DOMAIN}} domain fixtures.
 *
 * Tests import { test, expect } from this file to receive
 * injected flows, auth context, and data factories.
 */
export const test = base.extend<{{DOMAIN}}Fixtures>({
{{PROVIDERS}}
});

export { expect } from '@playwright/test';
