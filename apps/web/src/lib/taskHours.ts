/**
 * Task Hours Estimation System
 *
 * Based on working scheduler from Canvas2/Dynamic scheduler/
 * Extracted from Dynamobile.html and Dyna-schedule AI-Enhanced.html
 *
 * This system provides accurate hour estimates for different task types
 * to enable the scheduler to create realistic study blocks.
 */

export interface TaskHoursEstimate {
  type: string
  title?: string
  points?: number
  submissionTypes?: string[]
  userPreferences?: {
    useAutoEstimation?: boolean
    defaultHoursPerType?: Record<string, number>
  }
}

/**
 * Hours configuration for task types
 * Includes min, max, and default estimates
 */
export interface TaskHoursConfig {
  min: number
  max: number
  default: number
  description?: string
}

/**
 * Base hours database extracted from legacy working scheduler
 * Source: Canvas2/Dynamic scheduler/ + StudentLife/src/config/taskHours.ts
 * Expanded with min/max ranges for better estimation
 */
export const TASK_HOURS_DATABASE: Record<string, TaskHoursConfig> = {
  // Study Tasks
  reading: {
    min: 1,
    max: 2,
    default: 1.5,
    description: "Per chapter or article"
  },
  assignment: {
    min: 2,
    max: 4,
    default: 3,
    description: "Homework, problem sets"
  },
  quiz: {
    min: 2,
    max: 3,
    default: 2.5,
    description: "Study time for quiz"
  },
  exam: {
    min: 6,
    max: 10,
    default: 8,
    description: "Study time for exam"
  },
  midterm: {
    min: 8,
    max: 12,
    default: 10,
    description: "Study time for midterm"
  },
  final: {
    min: 10,
    max: 15,
    default: 12,
    description: "Study time for final"
  },
  project: {
    min: 8,
    max: 20,
    default: 10,
    description: "Papers, presentations, group projects"
  },

  // Class Activities
  lecture: {
    min: 1,
    max: 3,
    default: 1.5,
    description: "Class duration"
  },
  lab: {
    min: 3,
    max: 5,
    default: 4,
    description: "Lab session + report"
  },
  clinical: {
    min: 4,
    max: 8,
    default: 6,
    description: "Clinical rotation"
  },
  simulation: {
    min: 2,
    max: 4,
    default: 3,
    description: "Simulation lab"
  },
  tutorial: {
    min: 1,
    max: 2,
    default: 1,
    description: "Tutorial or recitation"
  },

  // Online Activities
  discussion: {
    min: 0.5,
    max: 1.5,
    default: 1,
    description: "Discussion posts and replies"
  },
  video: {
    min: 0.5,
    max: 2,
    default: 1,
    description: "Video lectures or recordings"
  },

  // Specialized Tasks (Nursing-specific)
  vsim: {
    min: 1.5,
    max: 3,
    default: 2,
    description: "Virtual simulation"
  },
  prep: {
    min: 0.5,
    max: 2,
    default: 1,
    description: "Preparation work"
  },
  drill: {
    min: 0.5,
    max: 1.5,
    default: 1,
    description: "Practice drills"
  },
  remediation: {
    min: 1,
    max: 3,
    default: 2,
    description: "Remediation work"
  },
  presentation: {
    min: 2,
    max: 4,
    default: 3,
    description: "Presentations"
  },
  skills: {
    min: 1,
    max: 3,
    default: 2,
    description: "Skills demonstration"
  },
  activity: {
    min: 0.25,
    max: 1,
    default: 0.5,
    description: "Short activities"
  },
  admin: {
    min: 0.25,
    max: 0.5,
    default: 0.25,
    description: "Administrative tasks"
  },

  // Default fallback
  default: {
    min: 2,
    max: 4,
    default: 3,
    description: "Unknown task type"
  }
}

/**
 * Helper to get base hours value (for backwards compatibility)
 */
export function getBaseHours(type: string): number {
  const config = TASK_HOURS_DATABASE[type] || TASK_HOURS_DATABASE.default
  return config.default
}

/**
 * Estimate hours for a task based on type, title, and metadata
 *
 * This function combines:
 * 1. User preferences (if auto-estimation enabled and custom hours set)
 * 2. Base hours from TASK_HOURS_DATABASE
 * 3. Title keyword analysis
 * 4. Points/complexity adjustment
 * 5. Submission type hints from Canvas
 */
export function estimateTaskHours(estimate: TaskHoursEstimate): number {
  const { type, title = '', points = 0, submissionTypes = [], userPreferences } = estimate

  // Check if user has disabled auto-estimation
  if (userPreferences?.useAutoEstimation === false) {
    // Use user's custom hours if available
    if (userPreferences.defaultHoursPerType?.[type]) {
      return userPreferences.defaultHoursPerType[type]
    }
  }

  // If auto-estimation is enabled (or not set), check for user-customized hours first
  if (userPreferences?.defaultHoursPerType?.[type]) {
    return userPreferences.defaultHoursPerType[type]
  }

  // Fall back to system defaults
  let baseHours = getBaseHours(type)

  // Adjust for title keywords (from legacy system)
  const titleLower = title.toLowerCase()

  // Short videos
  if (titleLower.includes('one-minute') || titleLower.includes('1-minute')) {
    return 0.5
  }

  // Quick/short tasks
  if (titleLower.includes('quick') || titleLower.includes('short') || titleLower.includes('attestation')) {
    baseHours *= 0.5
  }

  // Quiz length adjustments
  if (type === 'quiz') {
    if (titleLower.match(/\((\d+)\s*(questions|points)\)/)) {
      const match = titleLower.match(/\((\d+)\s*(questions|points)\)/)
      const count = match ? parseInt(match[1]) : 0

      if (count <= 10) return 1          // Short quiz
      if (count <= 25) return 1.5        // Medium quiz
      if (count <= 50) return 2          // Long quiz
      if (count > 50) return 2.5         // Very long quiz
    }
  }

  // Exam types
  if (type === 'exam') {
    if (titleLower.includes('midterm')) return 8
    if (titleLower.includes('final')) return 10
    if (titleLower.includes('hesi')) return 2
    if (titleLower.includes('standardized')) return 2.5
  }

  // Adjust by Canvas submission types (if available)
  if (submissionTypes.length > 0) {
    if (submissionTypes.includes('online_quiz')) return 2.5
    if (submissionTypes.includes('discussion_topic')) return 0.5
    if (submissionTypes.includes('online_upload') && type === 'assignment') return 3
    if (submissionTypes.includes('external_tool')) return 2
  }

  // Adjust by points (complexity proxy)
  if (points > 0) {
    if (points >= 100) baseHours *= 1.5    // Major assignment
    if (points >= 50 && points < 100) baseHours *= 1.2   // Significant assignment
    if (points <= 10) baseHours *= 0.5     // Minor assignment
  }

  // Ensure minimum 0.5 hours
  return Math.max(0.5, Math.round(baseHours * 2) / 2)  // Round to nearest 0.5
}

/**
 * Determine task type from Canvas assignment
 *
 * This uses a combination of:
 * - Canvas submission_types field
 * - Assignment name keywords
 * - Points thresholds
 */
export function determineAssignmentType(assignment: any): string {
  const name = (assignment.name || '').toLowerCase()
  const submissionTypes = assignment.submission_types || []

  // Check Canvas submission types first (most reliable)
  if (submissionTypes.includes('online_quiz')) return 'quiz'
  if (submissionTypes.includes('discussion_topic')) return 'discussion'

  // Check title keywords
  if (name.includes('exam') || name.includes('midterm') || name.includes('final')) return 'exam'
  if (name.includes('quiz') || name.includes('test')) return 'quiz'
  if (name.includes('project')) return 'project'
  if (name.includes('presentation')) return 'presentation'
  if (name.includes('discussion')) return 'discussion'
  if (name.includes('reading') || name.includes('chapter')) return 'reading'
  if (name.includes('video') || name.includes('watch')) return 'video'
  if (name.includes('lab')) return 'lab'
  if (name.includes('clinical')) return 'clinical'
  if (name.includes('simulation') || name.includes('vsim')) return 'simulation'
  if (name.includes('prep') || name.includes('case study')) return 'prep'
  if (name.includes('remediation')) return 'remediation'
  if (name.includes('activity')) return 'activity'
  if (name.includes('skills')) return 'skills'

  // Check points threshold
  if (assignment.points_possible) {
    if (assignment.points_possible >= 100) return 'exam'
    if (assignment.points_possible <= 10) return 'quiz'
  }

  // Default to assignment
  return 'assignment'
}

/**
 * Apply complexity multiplier to base hours
 * From HOURS_SYSTEM_FOR_CHATGPT.md and SCHEDULER_DOCUMENTATION.md
 *
 * Complexity scale:
 * 1 star: Simple (×0.5)
 * 2 stars: Basic (×0.75)
 * 3 stars: Standard (×1.0)
 * 4 stars: Major (×1.5)
 * 5 stars: Comprehensive (×2.0)
 */
export function applyComplexityMultiplier(baseHours: number, complexity: number = 3): number {
  const multipliers = [0.5, 0.75, 1.0, 1.5, 2.0]
  const multiplier = multipliers[Math.max(0, Math.min(4, complexity - 1))]
  return baseHours * multiplier
}

/**
 * Get lead time (buffer days) based on task type
 * From SCHEDULER_DOCUMENTATION.md
 */
export const LEAD_TIME_DEFAULTS: Record<string, number> = {
  exam: 7,           // Start studying 7 days before
  project: 5,        // Start 5 days before
  assignment: 3,     // Start 3 days before
  quiz: 2,           // Start 2 days before
  reading: 1,        // Start 1 day before
  lab: 2,            // Start 2 days before
  default: 3,        // Default 3 days
}

export function getLeadTime(taskType: string): number {
  return LEAD_TIME_DEFAULTS[taskType] || LEAD_TIME_DEFAULTS.default
}

/**
 * Parse chapter ranges from reading titles
 * Examples:
 * - "Read Chapters 5-8" → 4 chapters
 * - "Read Ch 12" → 1 chapter
 * - "Read pages 50-75" → ~2 chapters (25 pages ÷ 20 per chapter)
 */
export function parseChapterCount(title: string): number {
  // Match patterns like "Ch 5-8", "Chapters 5-8", "Ch. 5-8"
  const rangeMatch = title.match(/(?:ch(?:apter)?s?\.?)\s*(\d+)\s*[-–]\s*(\d+)/i)
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1])
    const end = parseInt(rangeMatch[2])
    return Math.abs(end - start) + 1
  }

  // Match single chapter like "Ch 5", "Chapter 12"
  const singleMatch = title.match(/(?:ch(?:apter)?\.?)\s*(\d+)/i)
  if (singleMatch) {
    return 1
  }

  // Match "Read pages 50-75" → estimate based on pages
  const pageMatch = title.match(/(?:pages?|pp?\.?)\s*(\d+)\s*[-–]\s*(\d+)/i)
  if (pageMatch) {
    const start = parseInt(pageMatch[1])
    const end = parseInt(pageMatch[2])
    const pages = Math.abs(end - start) + 1
    // Assume 20 pages per hour of reading
    return Math.max(1, Math.ceil(pages / 20))
  }

  return 1 // Default to 1 chapter
}

/**
 * Calculate reading hours based on chapter count and complexity
 */
export function getReadingHours(title: string, complexity: number = 3): number {
  const chapterCount = parseChapterCount(title)
  const hoursPerChapter = applyComplexityMultiplier(getBaseHours('reading'), complexity)
  return chapterCount * hoursPerChapter
}

/**
 * Split reading task by chapters
 * Example: "Read Chapters 5-8" → ["Read Chapter 5", "Read Chapter 6", "Read Chapter 7", "Read Chapter 8"]
 */
export function splitReadingByChapters(title: string): string[] {
  const rangeMatch = title.match(/(?:ch(?:apter)?s?\.?)\s*(\d+)\s*[-–]\s*(\d+)/i)

  if (!rangeMatch) {
    return [title] // Not a chapter range, return as-is
  }

  const start = parseInt(rangeMatch[1])
  const end = parseInt(rangeMatch[2])
  const chapterCount = Math.abs(end - start) + 1

  // Only split if more than 1 chapter
  if (chapterCount <= 1) {
    return [title]
  }

  // Generate individual chapter titles
  const chapters: string[] = []
  const prefix = title.substring(0, rangeMatch.index).trim()
  const suffix = title.substring(rangeMatch.index! + rangeMatch[0].length).trim()

  for (let i = start; i <= end; i++) {
    const chapterTitle = `${prefix} Chapter ${i} ${suffix}`.trim()
    chapters.push(chapterTitle)
  }

  return chapters
}
