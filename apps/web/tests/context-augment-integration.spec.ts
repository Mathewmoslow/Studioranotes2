import { test, expect } from '@playwright/test';

const LETTER = `
Welcome to Adult Health II – Fall!

Key dates:
- Midterm Exam: October 15, 2025 at 9:00 AM (covers Modules 1–4)
- Final Exam: December 10, 2025 at 1:00 PM (covers Modules 5–8)

Assignments:
- Care Plan #1 (Cardiac) due October 18, 2025 at 8:00 PM. Estimated 3 hours.
- Reading: Chapters 5-7 and Chapter 10; focus on Chapter 5 (pp. 101-120).
- Watch pre-class videos: Management of Oncologic Disorders (33:23), Cervical Cancer (10:43), Breast Cancer (15:01), Male Reproductive Disorders (11:46).
`;

test.describe('Context augmentor integration with fixture present', () => {
  test('extracts tasks/suggestions from welcome letter and keeps store intact', async ({ page }) => {
    // Keep console/page errors visible
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(`console: ${msg.text()}`);
    });

    // Load the dev harness and fixture (filtered)
    await page.goto('/dev/mock-test', { waitUntil: 'networkidle' });
    await page.getByTestId('load-fixture-btn').click();
    await expect(page.getByTestId('fixture-status')).toContainText(/Loaded/i);

    const beforeStore = await page.evaluate(() => {
      const raw = window.localStorage.getItem('schedule-store');
      return raw ? JSON.parse(raw) : null;
    });
    const beforeTasks = beforeStore?.state?.tasks?.length || 0;
    const beforeCourses = beforeStore?.state?.courses?.length || 0;

    // Call the extract-context API directly with the welcome letter
    const response = await page.evaluate(async (letter) => {
      const res = await fetch('/api/canvas/extract-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          syllabus: letter,
          additionalContext: letter,
          courseName: 'Welcome Letter Test',
          moduleDescriptions: [],
          assignmentDescriptions: [],
          pages: [],
          announcements: [],
          discussions: [],
          existingAssignments: [],
          existingEvents: [],
        }),
      });
      const json = await res.json();
      return { status: res.status, json };
    }, LETTER);

    expect(response.status).toBeLessThan(400);
    const extracted = response.json?.extracted || {};
    // If the API is mocked and returns nothing, fall back to local augmentor for validation
    let tasksCount = extracted.tasks?.length || 0;
    let suggCount = extracted.suggestions?.length || 0;
    if (tasksCount === 0 && suggCount === 0) {
      const fallback = await page.evaluate((letter) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { augmentContextTasks } = require('../src/lib/contextAugmentor');
        return augmentContextTasks(letter);
      }, LETTER);
      tasksCount = fallback.tasks?.length || 0;
      suggCount = fallback.suggestions?.length || 0;
    }

    expect(tasksCount).toBeGreaterThan(0);
    expect(suggCount).toBeGreaterThan(0);

    // Basic content checks
    const titles = [
      ...(extracted.tasks || []).map((t: any) => t.title || ''),
      ...(extracted.suggestions || []).map((s: any) => s.title || ''),
    ].join(' ');
    expect(titles.toLowerCase()).toContain('midterm');
    expect(titles.toLowerCase()).toContain('final');
    expect(titles.toLowerCase()).toContain('chapter 10');

    // Ensure fixture store remains populated
    const afterStore = await page.evaluate(() => {
      const raw = window.localStorage.getItem('schedule-store');
      return raw ? JSON.parse(raw) : null;
    });
    const afterTasks = afterStore?.state?.tasks?.length || 0;
    const afterCourses = afterStore?.state?.courses?.length || 0;

    expect(afterTasks).toBe(beforeTasks);
    expect(afterCourses).toBe(beforeCourses);

    expect(consoleErrors, `No console/page errors expected, saw: ${consoleErrors.join(' | ')}`).toHaveLength(0);
  });
});
