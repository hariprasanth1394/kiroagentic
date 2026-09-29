/**
 * Flow Generation Template
 *
 * Used by the Automation Skill to generate flows in the regression suite.
 * Replace all {{PLACEHOLDER}} tokens at generation time.
 *
 * Layer: flows/  (single-domain business capability; may be HYBRID: UI page + API service)
 * File naming: {journey}.flow.ts  (flat — no subdirectories)
 * Allowed imports: @pages/*, @services/*, @core/*
 * Banned imports: @components/*, @journeys/*, @fixtures/*, @tests/*
 * Constraint: NO locators anywhere in this file
 *
 * Hybrid pattern: a flow may compose a Page (UI) AND a Service (API) — e.g. seed data
 * via the service (API), act/verify via the page (UI), then re-check backend via the
 * service. The flow decides UI vs API; callers just invoke the capability.
 *
 * Each public business operation this flow implements should be registered as a
 * capability id ({APP}-{DOMAIN}-{VERB}) in flow-catalog.json (see registry-schema.md).
 *
 * Placeholders:
 *   {{FLOW_NAME}}       — PascalCase flow class name (e.g., PlaceOrderFlow)
 *   {{DOMAIN}}          — Business domain tag (e.g., checkout)
 *   {{PARAMS}}          — Interface definition for flow parameters
 *   {{PAGE_IMPORTS}}    — Import statements for page objects used by this flow (UI)
 *   {{SERVICE_IMPORTS}} — Import statements for service objects used by this flow (API)
 *   {{STEPS}}           — Business-level step implementations inside execute()
 */

import { Page } from '@playwright/test';
{{PAGE_IMPORTS}}
{{SERVICE_IMPORTS}}

/**
 * Parameters for {{FLOW_NAME}} — business-level, no UI details.
 */
export interface {{FLOW_NAME}}Params {
{{PARAMS}}
}

/**
 * Result returned by {{FLOW_NAME}} — business-level outcome.
 */
export interface {{FLOW_NAME}}Result {
  success: boolean;
{{RESULT_FIELDS}}
}

/**
 * {{FLOW_NAME}} — a single-domain business capability in the {{DOMAIN}} domain.
 *
 * This flow:
 * 1. Calls page-layer (UI) and/or service-layer (API) methods only — no locators
 * 2. Accepts business-level parameters
 * 3. Returns a business-level result
 * 4. Exposes a single execute() method
 */
export class {{FLOW_NAME}} {
  readonly name = '{{FLOW_NAME}}';
  readonly domain = '{{DOMAIN}}';

{{PAGE_INSTANCES}}
{{SERVICE_INSTANCES}}

  constructor(page: Page) {
{{PAGE_CONSTRUCTORS}}
{{SERVICE_CONSTRUCTORS}}
  }

  /**
   * Execute the {{DOMAIN}} business journey.
   *
   * @param params - Business-level parameters
   * @returns Business-level result
   */
  async execute(params: {{FLOW_NAME}}Params): Promise<{{FLOW_NAME}}Result> {
{{STEPS}}
  }
}
