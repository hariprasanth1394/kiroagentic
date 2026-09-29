/**
 * Component Generation Template
 *
 * Used by the Automation Skill to generate components in the regression suite.
 * Replace all {{PLACEHOLDER}} tokens at generation time.
 *
 * Layer: components/
 * File naming: {widget-name}.component.ts
 * Allowed imports: @core/* ONLY
 * Banned imports: @pages/*, @flows/*, @fixtures/*, @tests/*
 * Constraint: Components own widget-scoped locators
 *
 * Placeholders:
 *   {{COMPONENT_NAME}} — PascalCase component class name (e.g., DatePickerComponent)
 *   {{WIDGET_TYPE}}    — Widget category: picker | form | navigation | modal | table | list
 *   {{LOCATORS}}       — Widget-scoped locator declarations (private readonly)
 *   {{METHODS}}        — Widget interaction methods exposed to the Page Layer
 */

import { Page, Locator } from '@playwright/test';
import { TIMEOUTS } from '@core/constants';

/**
 * ComponentDefinition interface — all components implement this contract.
 */
export interface ComponentDefinition {
  readonly name: string;
  readonly locators: Record<string, Locator>;
}

/**
 * {{COMPONENT_NAME}} — a {{WIDGET_TYPE}} widget component.
 *
 * Owns widget-scoped locators discovered from the live DOM.
 * Exposes interaction methods consumed by the Page Layer.
 */
export class {{COMPONENT_NAME}} implements ComponentDefinition {
  readonly name = '{{COMPONENT_NAME}}';
  readonly locators: Record<string, Locator>;

  // ─── Widget-Scoped Locators ─────────────────────────────────────────
{{LOCATORS}}

  constructor(private readonly page: Page, private readonly rootSelector: string = '{{ROOT_SELECTOR}}') {
    const root = this.page.locator(rootSelector);

    // Initialize widget-scoped locators — all scoped to the widget root
{{LOCATOR_INIT}}

    // Expose locators via the ComponentDefinition contract
    this.locators = {
{{LOCATOR_MAP}}
    };
  }

  // ─── Widget Interaction Methods ─────────────────────────────────────
{{METHODS}}
}
