/**
 * Service Generation Template
 *
 * Used by the Automation Skill to generate API service objects in the regression suite.
 * A service is the API counterpart of a Page: it owns HTTP request/response for a
 * business area, built on the core ApiClient. Flows call service methods for the API
 * side of a (possibly hybrid) scenario.
 *
 * Replace all {{PLACEHOLDER}} tokens at generation time.
 *
 * Layer: services/  (level 2 — peer of pages)
 * File naming: {name}.service.ts  (flat — no subdirectories)
 * Allowed imports: @core/* ONLY (ApiClient, constants, auth)
 * Banned imports: @components/*, @pages/*, @flows/*, @journeys/*, @fixtures/*, @tests/*
 * Constraint: API only — NO UI locators, NO Playwright Page usage
 *
 * Each public method that represents a business operation should be registered as a
 * capability id ({APP}-{DOMAIN}-{VERB}, kind: api) in service-catalog.json.
 *
 * Placeholders:
 *   {{SERVICE_NAME}} — PascalCase service class name (e.g., OrderService)
 *   {{DOMAIN}}       — Business domain tag (e.g., checkout)
 *   {{METHODS}}      — Public API operation methods (create/get/update/delete + validators)
 */

import { ApiClient } from '@core/api-client';

/**
 * {{SERVICE_NAME}} — API implementation for the {{DOMAIN}} domain.
 *
 * Owns request building, auth headers, and response parsing via the core ApiClient.
 * Exposes business API operations to the flow layer. Contains NO UI locators.
 */
export class {{SERVICE_NAME}} {
  readonly name = '{{SERVICE_NAME}}';
  readonly domain = '{{DOMAIN}}';

  private readonly api: ApiClient;

  constructor(api: ApiClient) {
    this.api = api;
  }

  // ─── API Operations (each may back a capability id) ─────────────────
{{METHODS}}
}
