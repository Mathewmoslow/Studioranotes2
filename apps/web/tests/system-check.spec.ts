import { test, expect } from '@playwright/test';
import fixture from '../src/lib/fixtures/canvas-shifted.json';

const filterCourses = (courses: any[]) => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const recent = courses.filter((c) => {
    const start = c.start_at ? new Date(c.start_at) : null;
    const end = c.end_at ? new Date(c.end_at) : null;
    if (start && end) {
      return start >= sixMonthsAgo || end >= sixMonthsAgo;
    }
    return false;
  });
  return recent.length > 0 ? recent.slice(0, 8) : courses.slice(0, 6);
};

test.describe('System check: shifted Canvas scheduling', () => {
  test('loads, schedules, and leaves no unscheduled tasks', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`console: ${msg.text()}`);
    });

    const courses = (fixture as any)?.courses || [];
    const filtered = filterCourses(courses);
    const expectedTasks = filtered.reduce((sum, c) => sum + (c.assignments?.length || 0), 0);

    await page.goto('/dev/mock-test', { waitUntil: 'networkidle' });

    await page.getByTestId('load-fixture-btn').click();
    await expect(page.getByTestId('fixture-status')).toContainText(/Loaded/i);

    const storeAfterLoad = await page.evaluate(() => {
      const raw = window.localStorage.getItem('schedule-store');
      return raw ? JSON.parse(raw) : null;
    });
    const loadedTasks = storeAfterLoad?.state?.tasks || [];
    expect(loadedTasks.length, 'All fixture tasks should load').toBe(expectedTasks);

    await page.getByRole('button', { name: /Schedule shifted data/i }).click();

    const storeAfterSchedule = await page.evaluate(() => {
      const raw = window.localStorage.getItem('schedule-store');
      return raw ? JSON.parse(raw) : null;
    });

    const scheduledTasks = storeAfterSchedule?.state?.tasks || [];
    const timeBlocks = storeAfterSchedule?.state?.timeBlocks || [];
    const unscheduled = scheduledTasks.filter((t: any) => t.dueDate && !t.isScheduled);

    expect(unscheduled.length, 'No tasks with due dates should remain unscheduled').toBe(0);
    expect(timeBlocks.length, 'Should create study blocks').toBeGreaterThan(0);

    expect(consoleErrors, `No console/page errors expected, saw: ${consoleErrors.join(' | ')}`).toHaveLength(0);

    // Log a concise summary for human review in CI output
    console.log('[System Check Summary]', {
      filteredCourses: filtered.length,
      expectedTasks,
      loadedTasks: loadedTasks.length,
      timeBlocks: timeBlocks.length,
      unscheduled: unscheduled.length,
    });
  });
});
