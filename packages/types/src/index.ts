// Unified type definitions for StudiOra Notes

// ============= User Role Types =============
export type UserRole = 'student' | 'instructor'

// ============= User & Auth Types =============
export interface User {
  id: string
  email: string
  name?: string
  image?: string
  subscription: 'free' | 'premium' | 'pro'
  universities: University[]
  canvasTokens: CanvasToken[]
  preferences: UserPreferences
  onboardingCompleted: boolean
  createdAt: Date
  updatedAt: Date
}

export interface University {
  id: string
  name: string
  domain: string
  canvasUrl?: string
}

export interface CanvasToken {
  id: string
  universityId: string
  token: string
  expiresAt?: Date
  lastSync?: Date
}

// ============= Course Types =============
export interface Course {
  id: string
  code: string // e.g., "NURS320"
  name: string
  instructor?: string
  description?: string
  color: string
  creditHours?: number

  // Schedule data
  schedule?: RecurringEvent[]
  semester?: string
  year?: number

  // NotesAI data
  notesCount?: number
  modules?: Module[]
  conceptMaps?: ConceptMap[]
  studyMaterials?: StudyMaterial[]

  // Progress tracking
  progress?: number
  completedModules?: string[]

  // Canvas integration
  canvasId?: string
  canvasCourseCode?: string
  canvasSyncEnabled?: boolean
  lastCanvasSync?: Date
}

export interface RecurringEvent {
  dayOfWeek: number // 0-6 (Sunday to Saturday)
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  type: 'lecture' | 'lab' | 'clinical' | 'tutorial' | 'seminar'
  location?: string
  room?: string
}

// ============= Task & Assignment Types =============
export interface Task {
  id: string
  title: string
  description?: string
  courseId: string
  type: TaskType

  // Timing
  dueDate: Date
  startDate?: Date
  completedAt?: Date

  // Scheduling
  estimatedHours: number
  actualHours?: number
  complexity: 1 | 2 | 3 | 4 | 5
  priority: 'critical' | 'high' | 'medium' | 'low'

  // Study blocks
  scheduledBlocks?: StudyBlock[]

  // Notes integration
  relatedNotes?: Note[]
  suggestedReadings?: string[]
  conceptsToReview?: string[]
  descriptionHtml?: string

  // Settings
  isHardDeadline?: boolean
  canSplit?: boolean
  preferredTimes?: TimePreference[]
  bufferDays?: number

  // Status
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue'
  progress?: number

  // Canvas data
  canvasId?: string
  canvasSubmissionId?: string
  grade?: number
  feedback?: string
}

export type TaskType =
  // Student task types
  | 'assignment'
  | 'exam'
  | 'quiz'
  | 'project'
  | 'presentation'
  | 'lab'
  | 'clinical'
  | 'reading'
  | 'discussion'
  | 'paper'
  | 'other'
  // Instructor task types
  | 'grading'          // Grade student submissions
  | 'lecture-prep'     // Prepare lecture materials
  | 'office-hours'     // Block office hours time
  | 'content-creation' // Create course content
  | 'grade-entry'      // Enter grades in system
  | 'feedback'         // Write detailed feedback
  | 'meeting'          // Department/admin meetings

export type TimePreference = 'early-morning' | 'morning' | 'afternoon' | 'evening' | 'night'

export interface StudyTimePreferences {
  earlyMorning?: boolean
  morning?: boolean
  afternoon?: boolean
  evening?: boolean
  night?: boolean
  [key: string]: boolean | undefined
}

export interface TaskDurationDefaults {
  // Core academic tasks
  assignment?: number
  exam?: number
  project?: number
  reading?: number
  quiz?: number
  homework?: number
  lab?: number

  // Additional task types
  video?: number
  discussion?: number
  prep?: number
  remediation?: number
  vsim?: number
  simulation?: number
  activity?: number
  admin?: number
  presentation?: number
  skills?: number
  clinical?: number
  lecture?: number
  tutorial?: number

  [key: string]: number | undefined
}

export interface StudyDayPreferences {
  monday?: boolean
  tuesday?: boolean
  wednesday?: boolean
  thursday?: boolean
  friday?: boolean
  saturday?: boolean
  sunday?: boolean
  [key: string]: boolean | undefined
}

// ============= Study Block Types =============
export interface StudyBlock {
  id: string
  taskId?: string
  courseId?: string

  // Timing
  startTime: Date
  endTime: Date
  duration: number // minutes

  // Type and content
  type: StudyBlockType
  category?: BlockCategory // Visual category for styling
  title: string
  description?: string

  // Smart features
  suggestedContent?: {
    notes?: Note[]
    conceptMaps?: ConceptMap[]
    practiceQuestions?: Question[]
    resources?: Resource[]
  }

  // Energy and scheduling
  energyLevel: 'low' | 'medium' | 'high'
  canReschedule?: boolean
  locked?: boolean

  // Progress
  status: 'scheduled' | 'in-progress' | 'completed' | 'skipped' | 'rescheduled'
  completionRate?: number
  notesCreated?: string[]

  // Pomodoro/Timer data
  timerSessions?: TimerSession[]
}

export type StudyBlockType =
  | 'reading'
  | 'note-taking'
  | 'practice'
  | 'review'
  | 'writing'
  | 'research'
  | 'group-study'
  | 'break'

/**
 * Block categories for visual differentiation (from StudentLife legacy system)
 * Each category has distinct visual styling for better calendar readability
 */
export type BlockCategory =
  // Student categories
  | 'DO'       // Work to be done (assignments, reading, studying)
  | 'DUE'      // Hard deadlines (exam times, submission deadlines)
  | 'CLASS'    // Scheduled classes (lectures, labs, tutorials)
  | 'CLINICAL' // Clinical rotations and practical sessions
  // Instructor categories
  | 'GRADING'  // Grading work (assignments, exams, feedback)
  | 'PREP'     // Lecture prep and content creation
  | 'OFFICE'   // Office hours
  | 'ADMIN'    // Meetings and administrative tasks

/**
 * Visual styling for different block categories
 */
export interface BlockVisualStyle {
  category: BlockCategory
  pattern: 'solid' | 'diagonal-stripes' | 'cross-hatch' | 'dots'
  opacity: number // 0.0 - 1.0
  borderStyle: 'solid' | 'dashed' | 'double' | 'dotted'
  borderWidth: number // pixels
  icon?: string // emoji or icon code
  gradient?: boolean
}

/**
 * Default visual styles for block categories
 */
export const BLOCK_VISUAL_STYLES: Record<BlockCategory, BlockVisualStyle> = {
  // Student block styles
  DO: {
    category: 'DO',
    pattern: 'diagonal-stripes',
    opacity: 0.66,
    borderStyle: 'solid',
    borderWidth: 2,
    icon: '📚',
    gradient: false
  },
  DUE: {
    category: 'DUE',
    pattern: 'solid',
    opacity: 0.80,
    borderStyle: 'solid',
    borderWidth: 3,
    icon: '⏰',
    gradient: true
  },
  CLASS: {
    category: 'CLASS',
    pattern: 'cross-hatch',
    opacity: 0.50,
    borderStyle: 'dashed',
    borderWidth: 2,
    icon: '🎓',
    gradient: false
  },
  CLINICAL: {
    category: 'CLINICAL',
    pattern: 'dots',
    opacity: 0.33,
    borderStyle: 'double',
    borderWidth: 4,
    icon: '🏥',
    gradient: false
  },
  // Instructor block styles
  GRADING: {
    category: 'GRADING',
    pattern: 'solid',
    opacity: 0.75,
    borderStyle: 'solid',
    borderWidth: 2,
    icon: '✏️',
    gradient: false
  },
  PREP: {
    category: 'PREP',
    pattern: 'diagonal-stripes',
    opacity: 0.60,
    borderStyle: 'solid',
    borderWidth: 2,
    icon: '📝',
    gradient: false
  },
  OFFICE: {
    category: 'OFFICE',
    pattern: 'solid',
    opacity: 0.50,
    borderStyle: 'dashed',
    borderWidth: 2,
    icon: '🚪',
    gradient: false
  },
  ADMIN: {
    category: 'ADMIN',
    pattern: 'dots',
    opacity: 0.40,
    borderStyle: 'dotted',
    borderWidth: 2,
    icon: '📋',
    gradient: false
  }
}

// ============= Note Types =============
export interface Note {
  id: string
  slug: string
  title: string
  courseId: string
  moduleId?: string

  // Content
  content: string
  markdown: string
  html?: string
  summary?: string

  // Metadata
  createdAt: Date
  updatedAt: Date
  lastAccessedAt?: Date

  // Organization
  tags?: string[]
  category?: NoteCategory
  type?: NoteType

  // AI features
  aiGenerated?: boolean
  generationPrompt?: string
  style?: NoteStyle

  // Relations
  relatedNotes?: string[]
  linkedTasks?: string[]
  conceptMapIds?: string[]

  // Study features
  starred?: boolean
  archived?: boolean
  reviewCount?: number
  comprehensionScore?: number
}

export type NoteCategory =
  | 'lecture'
  | 'textbook'
  | 'clinical'
  | 'lab'
  | 'study-guide'
  | 'summary'
  | 'concept'
  | 'other'

export type NoteType =
  | 'comprehensive'
  | 'outline'
  | 'summary'
  | 'flashcards'
  | 'concept-map'
  | 'qa'

export type NoteStyle =
  | 'comprehensive'
  | 'concise'
  | 'guided'
  | 'flexible'
  | 'exploratory'

// ============= Schedule Types =============
export interface ScheduleEvent {
  id: string
  type: EventType
  title: string

  // Timing
  startTime: Date
  endTime: Date
  allDay?: boolean

  // Relations
  courseId?: string
  taskId?: string
  blockId?: string

  // Display
  color?: string
  icon?: string

  // Status
  completed?: boolean
  attendance?: 'present' | 'absent' | 'late'

  // Recurrence
  recurring?: boolean
  recurrenceRule?: RecurrenceRule
}

export type EventType =
  | 'class'
  | 'exam'
  | 'assignment-due'
  | 'study-block'
  | 'meeting'
  | 'clinical'
  | 'lab'
  | 'other'

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly'
  interval?: number
  daysOfWeek?: number[]
  endDate?: Date
  exceptions?: Date[]
}

// ============= User Preferences =============
export interface UserPreferences {
  // Study preferences
  studyHours: {
    start: string // HH:mm
    end: string // HH:mm
  }
  themePaletteId?: string
  breakDuration: number // minutes
  sessionDuration: number // minutes
  studySessionDuration?: number
  maxDailyStudyHours: number

  // Energy levels by hour (0-23)
  energyLevels: Record<number, number> // 1-10 scale

  // Time preferences
  preferredStudyTimes: TimePreference[] | StudyTimePreferences
  avoidTimes?: TimeSlot[]

  // Task defaults
  bufferDefaults?: {
    assignment: number
    exam: number
    project: number
    reading: number
  }
  defaultHoursPerType?: TaskDurationDefaults
  useAutoEstimation?: boolean // Toggle for automatic hours estimation
  complexityDefaults?: Record<string, number>
  complexityMultipliers?: Record<number, number>
  hoursPerWorkDay?: number
  daysBeforeExam?: number
  daysBeforeAssignment?: number
  daysBeforeProject?: number
  daysBeforeReading?: number
  daysBeforeLab?: number

  // Scheduling
  autoReschedule: boolean
  allowWeekendStudy: boolean
  minimumBreakBetweenSessions: number // minutes
  hoursPerWeekday?: number
  hoursPerWeekend?: number
  defaultBufferDays?: number
  studyDays?: StudyDayPreferences

  // Notifications
  enableNotifications: boolean
  reminderTiming: number // minutes before event

  // Display
  theme: 'light' | 'dark' | 'system'
  calendarView: 'day' | 'week' | 'month'
  firstDayOfWeek: number // 0-6

  // AI preferences
  noteGenerationStyle: NoteStyle
  aiAssistanceLevel: 'minimal' | 'moderate' | 'maximum'
}

export interface TimeSlot {
  dayOfWeek?: number
  startTime: string
  endTime: string
  reason?: string
}

// ============= Analytics Types =============
export interface StudyAnalytics {
  userId: string
  period: 'day' | 'week' | 'month' | 'semester'

  // Time metrics
  totalStudyTime: number // minutes
  averageSessionLength: number
  longestStreak: number // days
  currentStreak: number

  // Productivity
  tasksCompleted: number
  tasksOverdue: number
  completionRate: number

  // Academic
  averageGrade?: number
  gradeImprovement?: number

  // Content
  notesCreated: number
  notesReviewed: number
  conceptsMastered: number

  // Patterns
  mostProductiveTime: string
  mostProductiveDay: string
  studyPatterns: StudyPattern[]
}

export interface StudyPattern {
  time: string
  productivity: number
  frequency: number
}

// ============= Other Types =============
export interface Module {
  id: string
  courseId: string
  number: number
  title: string
  description?: string
  weekNumber?: number
  topics?: string[]
  learningObjectives?: string[]
  notes?: Note[]
  completed?: boolean
}

export interface ConceptMap {
  id: string
  courseId: string
  title: string
  nodes: ConceptNode[]
  edges: ConceptEdge[]
  createdAt: Date
  updatedAt: Date
}

export interface ConceptNode {
  id: string
  label: string
  type: string
  x: number
  y: number
  color?: string
}

export interface ConceptEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface StudyMaterial {
  id: string
  courseId: string
  title: string
  type: 'pdf' | 'video' | 'link' | 'document'
  url?: string
  content?: string
  tags?: string[]
}

export interface Question {
  id: string
  question: string
  answer: string
  options?: string[]
  explanation?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  tags?: string[]
}

export interface Resource {
  id: string
  title: string
  type: 'article' | 'video' | 'website' | 'book'
  url?: string
  description?: string
}

export interface TimerSession {
  startTime: Date
  endTime: Date
  duration: number
  completed: boolean
  breaks?: number
}
