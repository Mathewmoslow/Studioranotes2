import { defineConfig } from '@playwright/test';

// Detect if running against production Vercel
const isProduction = (process.env.TEST_BASE_URL || 'https://studiora.io').includes('studiora.io');

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  // Only run API tests against production, skip browser-based integration tests
  testMatch: isProduction
    ? ['**/context-augment.spec.ts', '**/scheduler-mock.spec.ts']
    : ['**/*.spec.ts'],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'https://studiora.io',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});
