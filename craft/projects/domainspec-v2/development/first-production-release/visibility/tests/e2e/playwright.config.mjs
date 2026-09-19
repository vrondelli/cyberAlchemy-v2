import { defineConfig } from '../../../../../../ide-extension/node_modules/@playwright/test/index.mjs';


export default defineConfig({
  testDir: '.',
  testMatch: /roadmap-lab-surface\.spec\.mjs/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  reporter: [['list']],
  outputDir: '../../../../../../../output/playwright/roadmap-lab-swu005-results',
  use: {
    browserName: 'chromium',
    actionTimeout: 8_000,
    navigationTimeout: 15_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
