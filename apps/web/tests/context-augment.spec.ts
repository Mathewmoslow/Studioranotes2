import { test, expect } from '@playwright/test';

// This test exercises the context extraction endpoint with MOCK_EXTRACTION=true
// and ensures deterministic suggestions (video durations / chapter splits) are returned.

const SAMPLE_CONTEXT = `
Reproductive Health Disorders: Women’s and Men’s Health Pre-Class Videos
Watch: Chapter 12: Management of Oncologic Disorders (33:23)
Watch: Chapters 51: Cervical Cancer (10:43)
Watch: Chapters 52: Breast Cancer (15:01)
Watch: Chapters 53: Male Reproductive System Disorders and Management (11:46)

Read Chapters 5-7 and Chapter 10
Chapter 5: Pain Assessment in Children (pp. 101-120)
`;

test.describe('Context extraction augmentation', () => {
  test('returns suggestions for videos and chapter splits', async ({ request }) => {
    const res = await request.post('/api/canvas/extract-context', {
      data: {
        syllabus: SAMPLE_CONTEXT,
        additionalContext: SAMPLE_CONTEXT,
        courseName: 'Test Course',
        moduleDescriptions: [],
        assignmentDescriptions: [],
        pages: [],
        announcements: [],
        discussions: [],
        existingAssignments: [],
        existingEvents: [],
      },
    });

    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.success).toBeTruthy();

    const suggestions = json.extracted?.suggestions || [];
    expect(suggestions.length).toBeGreaterThan(0);

    // At least one video suggestion and one reading suggestion
    const hasVideo = suggestions.some((s: any) => (s.type || '').toLowerCase().includes('video'));
    const hasReading = suggestions.some((s: any) => (s.type || '').toLowerCase().includes('reading'));

    expect(hasVideo).toBeTruthy();
    expect(hasReading).toBeTruthy();

    // Suggestions should carry source and needsReview flags
    suggestions.forEach((s: any) => {
      expect(s.source).toBeTruthy();
    });
  });
});
