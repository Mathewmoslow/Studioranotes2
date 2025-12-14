// Lightweight post-processing to expand narrative content into concrete tasks
// without replacing the primary Canvas normalization/AI extraction.

export type AugmentedTask = {
  title: string;
  type: string;
  estimatedHours?: number;
  dueDate?: string | null;
  description?: string;
  source: 'context-augmentor';
  needsReview?: boolean;
  suggestedBy?: string;
};

const VIDEO_TIME_REGEX = /\((\d{1,2}):(\d{2})(?::(\d{2}))?\)/; // e.g. (33:23) or (1:02:30)
const CHAPTER_RANGE_REGEX = /Chapter(?:s)?\s+(\d+)\s*(?:[-–]\s*(\d+))?/i;
const PAGE_RANGE_REGEX = /pp?\.\s*([\d\-–]+)/i;
const CHAPTER_TOKEN_REGEX = /Chapter\s+(\d+)/gi;

function parseVideoDurationHours(text: string): number | null {
  const match = text.match(VIDEO_TIME_REGEX);
  if (!match) return null;
  const hours = match[3] ? parseInt(match[1], 10) : 0;
  const minutes = match[3] ? parseInt(match[2], 10) : parseInt(match[1], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : parseInt(match[2], 10);
  const totalMinutes = hours * 60 + minutes + seconds / 60;
  return Math.max(0.25, Number((totalMinutes / 60).toFixed(2)));
}

function expandChapterRange(text: string): string[] {
  const match = text.match(CHAPTER_RANGE_REGEX);
  if (!match) return [];
  const start = parseInt(match[1], 10);
  const end = match[2] ? parseInt(match[2], 10) : start;
  if (Number.isNaN(start) || Number.isNaN(end) || end < start || end - start > 30) return [];
  const chapters: string[] = [];
  for (let i = start; i <= end; i += 1) {
    chapters.push(`Chapter ${i}`);
  }
  return chapters;
}

function estimateReadingHours(text: string): number | undefined {
  // If page range exists, approximate 5 minutes per page
  const pageMatch = text.match(PAGE_RANGE_REGEX);
  if (pageMatch) {
    const range = pageMatch[1];
    const [startStr, endStr] = range.split(/[-–]/).map(s => s.trim());
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    if (!Number.isNaN(start) && !Number.isNaN(end) && end >= start) {
      const pages = Math.max(1, end - start + 1);
      return Number(((pages * 5) / 60).toFixed(2)); // hours
    }
  }
  // Fallback: default per-chapter time
  const chapters = expandChapterRange(text);
  if (chapters.length > 0) {
    return 1; // 1 hour per chapter if no pages provided
  }
  return undefined;
}

function uniqueByTitle(tasks: AugmentedTask[]): AugmentedTask[] {
  const seen = new Set<string>();
  return tasks.filter(task => {
    const key = task.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractSingleChapters(text: string): string[] {
  const matches = Array.from(text.matchAll(CHAPTER_TOKEN_REGEX)).map(m => m[1]);
  return matches.filter(Boolean);
}

export function augmentContextTasks(rawText: string): {
  tasks: AugmentedTask[];
  suggestions: AugmentedTask[];
} {
  if (!rawText || rawText.trim().length === 0) {
    return { tasks: [], suggestions: [] };
  }

  const lines = rawText.split(/\n+/).map(l => l.trim()).filter(Boolean);
  const augmented: AugmentedTask[] = [];

  lines.forEach(line => {
    // Video parsing
    const videoHours = parseVideoDurationHours(line);
    if (videoHours) {
      const title = line.replace(VIDEO_TIME_REGEX, '').trim() || 'Video lesson';
      augmented.push({
        title,
        type: 'video',
        estimatedHours: videoHours,
        description: line,
        source: 'context-augmentor',
        needsReview: true,
        suggestedBy: 'duration-extraction',
      });
      return;
    }

    // Chapter range expansion
    const chapters = expandChapterRange(line);
    if (chapters.length > 0) {
      chapters.forEach(ch => {
        augmented.push({
          title: `${ch} Reading`,
          type: 'reading',
          estimatedHours: estimateReadingHours(line) ?? 1,
          description: line,
          source: 'context-augmentor',
          needsReview: true,
          suggestedBy: 'chapter-split',
        });
      });
      return;
    }

    // Standalone chapter tokens (e.g., "Chapter 10") even if combined with ranges
    const singles = extractSingleChapters(line);
    singles.forEach(num => {
      const title = `Chapter ${num} Reading`;
      augmented.push({
        title,
        type: 'reading',
        estimatedHours: estimateReadingHours(line) ?? 1,
        description: line,
        source: 'context-augmentor',
        needsReview: true,
        suggestedBy: 'chapter-token',
      });
    });
  });

  // Deduplicate by title to avoid noisy repeats
  const deduped = uniqueByTitle(augmented);

  // Treat all as suggestions (non-destructive)
  return {
    tasks: [],
    suggestions: deduped,
  };
}
