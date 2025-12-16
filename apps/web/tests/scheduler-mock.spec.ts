import { test, expect } from '@playwright/test';

const FATAL_MATCHERS = [
  "cannot read properties of undefined (reading 'type')",
  "reading 'type'",
  'bad calendar item before render',
];

test.describe('Scheduler mock filtered fixture', () => {
  test('captures console output when loading filtered fixture', async ({ page }) => {
    const consoleMessages: string[] = [];

    page.on('console', (msg) => {
      const entry = `[${msg.type()}] ${msg.text()}`;
      consoleMessages.push(entry);
      // Surface browser console into test output so we can read the first failure
      console.log(entry);
    });

    page.on('pageerror', (error) => {
      const entry = `[pageerror] ${error.stack || error.message}`;
      consoleMessages.push(entry);
      console.log(entry);
    });

    await page.goto('/dev/scheduler-mock', { waitUntil: 'networkidle' });

    // Smoke check page is rendered
    await expect(page.getByRole('heading', { name: /scheduler/i })).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: /Load Filtered Fixture/i }).click({ force: true });

    // Let any runtime crashes/console noise flush
    await page.waitForTimeout(6_000);

    const fatalHits = consoleMessages.filter((msg) =>
      FATAL_MATCHERS.some((needle) => msg.toLowerCase().includes(needle.toLowerCase()))
    );

    console.log('[Scheduler E2E] Console summary', {
      total: consoleMessages.length,
      firstTen: consoleMessages.slice(0, 10),
      fatalHits,
    });

    // Fail fast if the known crash still occurs; the logs above will include the offending payload
    expect(fatalHits, 'No missing-type or Scheduler Debug errors should appear').toHaveLength(0);
  });
});
