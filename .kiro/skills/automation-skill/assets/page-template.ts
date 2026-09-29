/**
 * Page Object Generation Template
 *
 * Used by the Automation Skill to generate page objects in the regression suite.
 * Replace all {{PLACEHOLDER}} tokens at generation time.
 *
 * Layer: pages/
 * File naming: {page-name}.page.ts
 * Allowed imports: @components/*, @core/*
 * Banned imports: @flows/*, @fixtures/*, @tests/*
 *
 * Placeholders:
 *   {{PAGE_NAME}}   — PascalCase page class name (e.g., CheckoutPage)
 *   {{URL}}         — Page route path (e.g., /checkout)
 *   {{LOCATORS}}    — Readonly Locator property declarations
 *   {{COMPONENTS}}  — Component composition declarations
 *   {{METHODS}}     — Page interaction methods
 */

import { Page, Locator } from '@playwright/test';
import { BasePage } from '@core/base-page';
import { TIMEOUTS } from '@core/constants';
{{COMPONENT_IMPORTS}}

/**
 * {{PAGE_NAME}} — page object for the {{URL}} route.
 *
 * Owns page-scoped locators and composes components.
 * Flows call methods on this page; tests never interact directly.
 */
export class {{PAGE_NAME}} extends BasePage {
  /** Page metadata */
  readonly name = '{{PAGE_NAME}}';
  readonly url = '{{URL}}';

  // ─── Page-Scoped Locators ───────────────────────────────────────────
{{LOCATORS}}

  // ─── Composed Components ────────────────────────────────────────────
{{COMPONENTS}}

  constructor(page: Page) {
    super(page);

    // Initialize page-scoped locators — discovered from live DOM via Playwright MCP
{{LOCATOR_INIT}}

    // Compose components — delegate widget interactions
{{COMPONENT_INIT}}
  }

  // ─── Page Navigation ────────────────────────────────────────────────

  /**
   * Navigate to this page and wait for it to be ready.
   */
  async navigate(): Promise<void> {
    await super.navigate(this.url);
    await this.waitForReady();
  }

  // ─── Page Interaction Methods ───────────────────────────────────────
{{METHODS}}
}
