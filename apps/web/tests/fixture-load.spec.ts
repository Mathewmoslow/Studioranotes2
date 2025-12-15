import { test, expect } from '@playwright/test';

test.describe('Fixture load smoke', () => {
  test('loads shifted Canvas fixture without errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`console: ${msg.text()}`);
    });

    const response = await page.goto('/dev/mock-test', { waitUntil: 'networkidle' });
    expect(response?.status(), 'dev mock-test page should load').toBeLessThan(400);
    await expect(page.getByRole('heading', { name: /Shifted Canvas Test Harness/i })).toBeVisible();

    await page.getByTestId('load-fixture-btn').click();

    const status = page.getByTestId('fixture-status');
    await expect(status).toContainText(/Loaded/i);
    await expect(status).toContainText(/courses loaded/i);
    await expect(status).toContainText(/tasks loaded/i);

    expect(consoleErrors, `No console/page errors expected, saw: ${consoleErrors.join(' | ')}`).toHaveLength(0);
  });
});
