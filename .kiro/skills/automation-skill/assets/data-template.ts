/**
 * Data Generation Template
 *
 * Used by the Automation Skill to generate test-data files in the regression suite.
 * A data file holds test data and its VARIATIONS as typed, exported constants. Callers
 * (services/flows/journeys/fixtures) import a dataset and pass it INTO a capability
 * method as a parameter — so a new variation is a new data entry, NOT a new method.
 *
 * Replace all {{PLACEHOLDER}} tokens at generation time.
 *
 * Layer: data/  (level 1 — peer of components)
 * File naming: {name}.data.ts  (flat — no subdirectories; name usually matches a domain)
 * Allowed imports: @core/* ONLY (shared types/constants)
 * Banned imports: @components/*, @pages/*, @services/*, @flows/*, @journeys/*, @fixtures/*, @tests/*
 * Constraint: PURE DATA — no logic, no locators, no API calls, no assertions
 *
 * Placeholders:
 *   {{DATA_NAME}}      — PascalCase data type name (e.g., OrderData)
 *   {{FIELDS}}         — Interface field declarations (business fields only)
 *   {{COLLECTION}}     — camelCase export name for the variation map (e.g., orders)
 *   {{VARIATIONS}}     — Variation entries keyed by variant name
 */

/**
 * Shape of a single {{DATA_NAME}} record — business fields only, no UI/API details.
 */
export interface {{DATA_NAME}} {
{{FIELDS}}
}

/**
 * {{COLLECTION}} — variations keyed by variant name.
 *
 * Add a new key to introduce a new variation; do NOT add a new method anywhere.
 * Callers pick a variation and pass it to a capability method, e.g.:
 *   await someFlow.execute({ data: {{COLLECTION}}.<variantKey> });
 */
export const {{COLLECTION}}: Record<string, {{DATA_NAME}}> = {
{{VARIATIONS}}
};
