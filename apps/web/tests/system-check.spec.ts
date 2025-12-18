import { test, expect } from '@playwright/test';

const EXPECTED_COURSES = 4;
const EXPECTED_TASKS = 88;

const expectDueClustersVisible = async (page: any) => {
  // Look for a DUE label in the calendar; use the first occurrence
  await expect(page.locator('text=DUE').first()).toBeVisible();
};

// Ensure single run order
(test as any).describe?.configure?.({ mode: 'serial' });

test.use({
  // Rely on existing dev server via PLAYWRIGHT_BASE_URL; do not auto-start
  baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3200',
});

test('Deterministic system check loads fixture and schedules it', async ({ page }) => {
  test.setTimeout(120000);

  await page.goto('/dev/system-check', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Deterministic System Check' })).toBeVisible();

  const button = page.getByRole('button', { name: /Load & Schedule 2026 Fixture/i });
  await button.click();

  // Wait for status update confirming scheduling
  await expect(page.getByText('Scheduled. Courses:', { exact: false })).toBeVisible({ timeout: 60000 });

  // Verify status text includes expected counts
  const statusText = await page.getByText(/Courses: .*Tasks: /i).textContent();
  expect(statusText).toBeTruthy();
  expect(statusText).toContain(`Courses: ${EXPECTED_COURSES}`);
  expect(statusText).toContain(`Tasks: ${EXPECTED_TASKS}`);

  // Wait for calendar heading to render
  await expect(page.getByRole('heading', { name: 'Schedule', exact: true })).toBeVisible();

  await expectDueClustersVisible(page);

  const scheduled = page.locator('[data-testid="schedule-item"]');
  await expect.poll(async () => await scheduled.count(), { timeout: 20000 }).toBeGreaterThan(0);
});
