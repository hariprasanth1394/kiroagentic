/**
 * Journey Generation Template
 *
 * Used by the Automation Skill to generate cross-feature journeys in the regression
 * suite. A journey composes MULTIPLE single-domain flows into one end-to-end business
 * scenario, reusable across tests with different data. It is the anti-duplication
 * mechanism for multi-feature paths — never inline a multi-feature path into a spec.
 *
 * Replace all {{PLACEHOLDER}} tokens at generation time.
 *
 * Layer: journeys/  (level 4 — above flows)
 * File naming: {journey-name}.journey.ts  (flat — no subdirectories)
 * Allowed imports: @flows/*, @core/* ONLY
 * Banned imports: @pages/*, @services/*, @components/*, @fixtures/*, @tests/*
 * Constraint: NO locators, NO pages/services — a journey orchestrates FLOWS only
 *
 * Order flows to respect produce-before-consume data dependencies
 * (see {suiteDir}/project/dependency-map.yaml). Exposes a single execute() method.
 *
 * Placeholders:
 *   {{JOURNEY_NAME}}   — PascalCase journey class name (e.g., SignupToFirstOrderJourney)
 *   {{DOMAINS}}        — Comma-separated domains this journey spans (e.g., auth, checkout)
 *   {{PARAMS}}         — Interface definition for journey parameters
 *   {{FLOW_IMPORTS}}   — Import statements for the flows this journey composes
 *   {{STEPS}}          — Ordered flow.execute() calls inside execute()
 */

import { Page } from '@playwright/test';
{{FLOW_IMPORTS}}

/**
 * Parameters for {{JOURNEY_NAME}} — business-level, no UI/API details.
 */
export interface {{JOURNEY_NAME}}Params {
{{PARAMS}}
}

/**
 * Result returned by {{JOURNEY_NAME}} — business-level end-to-end outcome.
 */
export interface {{JOURNEY_NAME}}Result {
  success: boolean;
{{RESULT_FIELDS}}
}

/**
 * {{JOURNEY_NAME}} — cross-feature orchestration spanning: {{DOMAINS}}.
 *
 * This journey:
 * 1. Composes MULTIPLE flows (no pages/services/locators)
 * 2. Orders flows to satisfy data dependencies (produce-before-consume)
 * 3. Accepts business-level parameters
 * 4. Exposes a single execute() method
 */
export class {{JOURNEY_NAME}} {
  readonly name = '{{JOURNEY_NAME}}';
  readonly domains = '{{DOMAINS}}';

{{FLOW_INSTANCES}}

  constructor(page: Page) {
{{FLOW_CONSTRUCTORS}}
  }

  /**
   * Execute the cross-feature journey by composing flows in order.
   *
   * @param params - Business-level parameters
   * @returns Business-level end-to-end result
   */
  async execute(params: {{JOURNEY_NAME}}Params): Promise<{{JOURNEY_NAME}}Result> {
{{STEPS}}
  }
}
