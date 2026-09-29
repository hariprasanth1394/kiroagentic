import { defineConfig } from '@playwright/test';

/**
 * LambdaTest remote-browser routing (Option B — cloud overlay).
 *
 * The execution skill builds the CDP wsEndpoint from this single source and
 * injects it into the HyperExecute YAML as the `LT_CDP_URL` env var. The
 * regression-suite `playwright.config.ts` reads `process.env.LT_CDP_URL` into
 * `use.connectOptions.wsEndpoint` when present. Specs are never modified and
 * never import a cloud-setup module — local runs (LT_CDP_URL unset) use a
 * local browser; HyperExecute runs (LT_CDP_URL set) use the remote grid.
 *
 * There is intentionally NO lambdatest-setup.ts. Routing is config-level, not
 * spec-level. See references/cloud-overlay.md.
 */

export interface LtCdpOptions {
  browserName?: string;
  browserVersion?: string;
  platform?: string;
  build?: string;
  name?: string;
  tunnelName?: string;
}

/**
 * Build the LambdaTest CDP wsEndpoint. This is the ONE authoritative place the
 * execution skill constructs the URL it injects as LT_CDP_URL. Credentials are
 * read from the environment (LT_USERNAME / LT_ACCESS_KEY) — never hardcoded.
 */
export function buildLtCdpUrl(opts: LtCdpOptions = {}): string {
  const capabilities = {
    browserName: opts.browserName || 'chromium',
    browserVersion: opts.browserVersion || 'latest',
    'LT:Options': {
      platform: opts.platform || 'Windows 11',
      build: opts.build || process.env.BUILD_NAME || 'Regression Suite',
      name: opts.name || process.env.TEST_NAME || 'Test',
      user: process.env.LT_USERNAME,
      accessKey: process.env.LT_ACCESS_KEY,
      network: true,
      console: true,
      tunnel: true,
      tunnelName: opts.tunnelName || 'ECS-Shared-Tunnel-NonProd',
    },
  };
  return `wss://cdp.lambdatest.com/playwright?capabilities=${encodeURIComponent(
    JSON.stringify(capabilities),
  )}`;
}

/**
 * Optional alternative wiring: a cloud config that can be selected on the
 * HyperExecute VM via `--config`. Equivalent to setting LT_CDP_URL. Provided so
 * either injection form works; the default/documented path is LT_CDP_URL.
 */
export default defineConfig({
  use: {
    connectOptions: { wsEndpoint: process.env.LT_CDP_URL || buildLtCdpUrl() },
  },
});
