'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  TextField,
  Container,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormHelperText,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import NumberStepper from '@/components/ui/NumberStepper'
import {
  School,
  Schedule,
  AutoAwesome,
  CloudUpload,
  Check,
  Error as ErrorIcon,
  ExpandMore,
} from '@mui/icons-material'
import { useSession } from 'next-auth/react'
import { useScheduleStore } from '@/stores/useScheduleStore'
import { getUniversityList, getCanvasUrl, getUniversityConfig } from '@/data/universities'
import { getCourseColor } from '@/lib/courseColors'
import ReconcileTasksModal from '@/components/modals/ReconcileTasksModal'
import { isBefore } from 'date-fns'

const steps = [
  'Welcome',
  'University & Canvas Setup',
  'Study Preferences',
  'Additional Context',
  'Get Started',
]

const studyDayOptions = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
] as const

interface OnboardingFlowProps {
  onComplete: () => void
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const { data: session } = useSession()
  const { addCourse, generateSmartSchedule, updatePreferences, updateCourse, tasks, updateTask, updateEvent } = useScheduleStore()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [canvasConnected, setCanvasConnected] = useState(false)
  const [canvasCourses, setCanvasCourses] = useState<any[]>([])
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const selectedCoursesRef = useRef<string[]>([])  // Use ref to preserve state across closures
  const [error, setError] = useState<string | null>(null)
  const [importingCourses, setImportingCourses] = useState(false)
  const [importStatus, setImportStatus] = useState('')
  const [processedCount, setProcessedCount] = useState(0)
  const [showOverdueModal, setShowOverdueModal] = useState(false)
  const [overdueTasks, setOverdueTasks] = useState<any[]>([])
  const [additionalContext, setAdditionalContext] = useState<{[courseId: string]: string}>({})
  const [pendingMeetingCourses, setPendingMeetingCourses] = useState<any[]>([])
  const [meetingDialogOpen, setMeetingDialogOpen] = useState(false)
  const [meetingDrafts, setMeetingDrafts] = useState<Record<string, any>>({})
  const [formData, setFormData] = useState({
    university: '',
    canvasUrl: '',
    canvasToken: '',
    studyHoursStart: '09:00',
    studyHoursEnd: '21:00',
    weekendStudyHours: 5,
    sessionDuration: 45,
    preferredTimes: [] as string[],
    studyDays: {
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: false,
    },
    useAutoEstimation: true,
    taskDurations: {
      assignment: 3,
      exam: 8,
      project: 10,
      reading: 3,
      quiz: 1.5,
      homework: 3,
      lab: 4,
      video: 1,
      prep: 1,
      lecture: 1.5,
      skills: 2,
    },
  })

  
  const getDurationKeyForTask = (type: string) => {
    const normalized = type?.toLowerCase() || 'assignment'
    const validKeys: Array<keyof typeof formData.taskDurations> = [
      'assignment',
      'exam',
      'project',
      'reading',
      'quiz',
      'homework',
      'lab',
      'video',
      'prep',
      'lecture',
      'skills'
    ]
    if (validKeys.includes(normalized as any)) {
      return normalized as keyof typeof formData.taskDurations
    }
    return 'assignment'
  }

  const getEstimatedHoursForTask = (type: string) => {
    const key = getDurationKeyForTask(type)
    return formData.taskDurations[key] || formData.taskDurations.assignment || 2
  }

  const mapConfidenceToPriority = (confidence?: string) => {
    switch (confidence?.toLowerCase()) {
      case 'high':
        return 'high'
      case 'medium':
        return 'medium'
      case 'low':
        return 'low'
      default:
        return 'medium'
    }
  }

  const determineAssignmentType = (name: string) => {
    const lower = name?.toLowerCase() || ''
    if (lower.includes('exam') || lower.includes('final') || lower.includes('midterm')) return 'exam'
    if (lower.includes('quiz') || lower.includes('test')) return 'quiz'
    if (lower.includes('project') || lower.includes('capstone') || lower.includes('presentation')) return 'project'
    if (lower.includes('reading') || lower.includes('chapter') || lower.includes('textbook')) return 'reading'
    if (lower.includes('lab') || lower.includes('clinical')) return 'lab'
    return 'assignment'
  }

  const parseDueDateValue = (value?: string | Date | null) => {
    if (!value) return null
    const parsed = value instanceof Date ? value : new Date(value)
    return isNaN(parsed.getTime()) ? null : parsed
  }

  const sanitizeDescription = (value?: string) => {
    if (!value) return ''
    const withoutDangerous = value
      .replace(/<\s*(script|style|link)[^>]*>.*?<\/\s*\1\s*>/gis, '')
      .replace(/<\s*link[^>]*>/gi, '')
    const text = withoutDangerous.replace(/<[^>]+>/g, ' ')
    return text.replace(/\s+/g, ' ').trim()
  }

  const buildDescriptionFields = (raw?: string) => {
    return {
      description: sanitizeDescription(raw),
      descriptionHtml: raw || undefined
    }
  }

  const stripHtml = (value?: string) => {
    if (!value) return ''
    const withoutScripts = value.replace(/<script[^>]*>.*?<\/script>/gi, '')
    const text = withoutScripts.replace(/<[^>]+>/g, ' ')
    return text.replace(/\s+/g, ' ').trim()
  }

  const getPageSnippet = (body?: string, limit = 200) => {
    const text = stripHtml(body || '')
    if (text.length <= limit) return text
    return `${text.slice(0, limit)}...`
  }

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const normalizeTimeString = (value?: string) => {
    if (!value) return value
    const [hoursStr, minutesStr] = value.split(':')
    const hours = Number.parseInt(hoursStr, 10)
    const minutes = Number.parseInt(minutesStr, 10)
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  const isMeetingLikeEvent = (event: any) => {
    const type = (event?.type || '').toLowerCase()
    const title = (event?.title || '').toLowerCase()

    const meetingKeywords = ['class', 'lecture', 'lab', 'seminar', 'tutorial', 'meeting']
    const hasKeyword = meetingKeywords.some(keyword => title.includes(keyword))

    return type === 'event' || type === 'calendar_event' || hasKeyword
  }

  const normalizeCanvasEvent = (event: any) => {
    if (!event) return null
    const rawStart = event.startTime || event.start_at || event.startAt
    const rawEnd = event.endTime || event.end_at || event.endAt
    const startTime = rawStart ? new Date(rawStart) : null
    let endTime = rawEnd ? new Date(rawEnd) : null

    if (!startTime || isNaN(startTime.getTime())) return null

    if (!endTime || isNaN(endTime.getTime()) || endTime <= startTime) {
      endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // default to 1h if missing
    }

    return {
      ...event,
      startTime,
      endTime,
      isMeeting: isMeetingLikeEvent(event)
    }
  }

  const mergeScheduleWithCanvasMeetings = (recurringSchedule: any[] = [], meetingEvents: any[] = []) => {
    const merged = new Map<string, any>()

    const upsert = (item: any, source: 'canvas' | 'syllabus') => {
      const key = `${item.dayOfWeek}-${item.startTime}`
      const existing = merged.get(key)
      if (!existing) {
        merged.set(key, { ...item, source })
        return
      }

      merged.set(key, {
        ...existing,
        ...item,
        startTime: item.startTime || existing.startTime,
        endTime: item.endTime || existing.endTime,
        location: item.location || existing.location,
        source: existing.source === source ? source : 'canvas'
      })
    }

    recurringSchedule.forEach((recurring) => {
      const hasValidDay = typeof recurring?.dayOfWeek === 'number' && recurring.dayOfWeek >= 0 && recurring.dayOfWeek <= 6
      if (!hasValidDay || !recurring.startTime || !recurring.endTime) return
      upsert({
        ...recurring,
        startTime: normalizeTimeString(recurring.startTime),
        endTime: normalizeTimeString(recurring.endTime)
      }, 'syllabus')
    })

    meetingEvents.forEach((event) => {
      if (!event?.startTime || !event?.endTime) return
      const dayOfWeek = event.startTime.getDay()
      const startTime = formatTime(event.startTime)
      const endTime = formatTime(event.endTime)

      upsert({
        dayOfWeek,
        startTime,
        endTime,
        type: 'lecture',
        location: event.location || event.locationName
      }, 'canvas')
    })

    return Array.from(merged.values()).map(({ source, ...rest }) => rest)
  }

  const checkForOverdueTasksAndComplete = () => {
    // Get current tasks from store
    const currentTasks = useScheduleStore.getState().tasks

    // Filter for overdue tasks
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const overdueTasksList = currentTasks.filter(task => {
      const dueDate = typeof task.dueDate === 'string' ? new Date(task.dueDate) : task.dueDate
      return isBefore(dueDate, today) && task.status !== 'completed'
    })

    console.log('📊 Overdue check:', {
      totalTasks: currentTasks.length,
      overdueTasks: overdueTasksList.length,
      overdueTaskNames: overdueTasksList.map(t => t.title)
    })

    if (overdueTasksList.length > 0) {
      // Show modal for user to decide
      setOverdueTasks(overdueTasksList)
      setShowOverdueModal(true)
    } else {
      // No overdue tasks, proceed to dashboard
      onComplete()
    }
  }

  const handleNext = async () => {
    setError(null)

    // Handle Canvas connection step (now combined with university setup)
    if (activeStep === 1 && formData.canvasUrl && formData.canvasToken) {
      await connectToCanvas()
    }

    // When moving from Study Preferences (step 2) to Final (step 3)
    if (activeStep === 2) {
      // Save preferences with university config
      const universityConfig = getUniversityConfig(formData.university)
      localStorage.setItem('onboarding_preferences', JSON.stringify({
        ...formData,
        universityConfig
      }))

      const preferredStudyTimes = {
        earlyMorning: formData.preferredTimes.includes('Early Morning'),
        morning: formData.preferredTimes.includes('Morning'),
        afternoon: formData.preferredTimes.includes('Afternoon'),
        evening: formData.preferredTimes.includes('Evening'),
        night: formData.preferredTimes.includes('Night'),
      }

      updatePreferences({
        studyHours: {
          start: formData.studyHoursStart,
          end: formData.studyHoursEnd,
        },
        sessionDuration: formData.sessionDuration,
        preferredStudyTimes,
        hoursPerWeekday: Math.max(1, Number(formData.studyHoursEnd.split(':')[0]) - Number(formData.studyHoursStart.split(':')[0])),
        hoursPerWeekend: formData.weekendStudyHours,
        studyDays: formData.studyDays,
        allowWeekendStudy: Boolean(formData.weekendStudyHours > 0 && (formData.studyDays.saturday || formData.studyDays.sunday)),
        maxDailyStudyHours: Math.max(
          Math.max(1, Number(formData.studyHoursEnd.split(':')[0]) - Number(formData.studyHoursStart.split(':')[0])),
          formData.weekendStudyHours
        ),
        useAutoEstimation: formData.useAutoEstimation,
        defaultHoursPerType: formData.taskDurations,
      })
    }

    // When moving from Additional Context (step 3) to Final (step 4)
    if (activeStep === 3) {
      // Move to final step
      setActiveStep((prevActiveStep) => prevActiveStep + 1)

      // Auto-start import after showing success briefly
      setTimeout(async () => {
        const coursesToImport = selectedCoursesRef.current  // Use ref to get current value
        console.log('🚦 Auto-import check:', {
          selectedCoursesLength: coursesToImport.length,
          selectedCourses: coursesToImport,
          canvasConnected,
          shouldImport: coursesToImport.length > 0 && canvasConnected
        })

        if (coursesToImport.length > 0 && canvasConnected) {
          console.log('🚀 Starting auto-import of courses...')
          await importCanvasCourses()
          // Check for overdue tasks before completing
          setTimeout(() => checkForOverdueTasksAndComplete(), 1500)
        } else {
          console.log('⏭️ Skipping import - no courses selected or not connected')
          // No courses, just complete
          setTimeout(() => onComplete(), 2000)
        }
      }, 1500)
      return  // Don't automatically move to next step
    } else if (activeStep === steps.length - 1) {
      // Already on final step, shouldn't get here with new flow
      onComplete()
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep + 1)
    }
  }

  const connectToCanvas = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/canvas/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          canvasUrl: formData.canvasUrl,
          canvasToken: formData.canvasToken
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to connect to Canvas')
      }

      const data = await response.json()
      setCanvasConnected(true)

      // Store Canvas credentials for auto-sync feature
      localStorage.setItem('canvas-credentials', JSON.stringify({
        url: formData.canvasUrl,
        token: formData.canvasToken,
        connectedAt: new Date().toISOString()
      }))

      // Fetch courses
      await fetchCanvasCourses()

    } catch (error: any) {
      setError(error.message)
      console.error('Canvas connection error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCanvasCourses = async () => {
    try {
      const response = await fetch('/api/canvas/courses', {
        headers: {
          'x-canvas-url': formData.canvasUrl,
          'x-canvas-token': formData.canvasToken
        }
      })

      if (!response.ok) throw new Error('Failed to fetch courses')

      const data = await response.json()
      console.log('🔍 Canvas GET response:', {
        coursesCount: data.courses?.length,
        sampleCourse: data.courses?.[0],
        allCourseIds: data.courses?.map((c: any) => ({ id: c.id, canvasId: c.canvasId, name: c.name }))
      })
      setCanvasCourses(data.courses || [])
      // Don't auto-select courses - let user choose
      setSelectedCourses([])

    } catch (error: any) {
      console.error('Failed to fetch courses:', error)
    }
  }

  
  const hasExistingTask = (courseId: string, title: string, dueDate?: Date) => {
    return useScheduleStore.getState().tasks.some(task =>
      task.courseId === courseId &&
      task.title === title &&
      (!dueDate || Math.abs(new Date(task.dueDate).getTime() - dueDate.getTime()) < 5 * 60 * 1000)
    )
  }

  const addCanvasAssignmentTasks = (course: any, courseId: string) => {
    ;(course.assignments || []).forEach((assignment: any) => {
      const dueDate = parseDueDateValue(assignment.dueDate)
      if (!dueDate) return
      const title = assignment.name || assignment.title || 'Untitled Assignment'
      if (hasExistingTask(courseId, title, dueDate)) return
      const type = assignment.type || determineAssignmentType(title)
      const priority = type === 'exam' || type === 'quiz' ? 'high' : 'medium'

      // Use estimatedHours from assignment if available (from Canvas import), otherwise calculate
      const estimatedHours = assignment.estimatedHours || getEstimatedHoursForTask(type)
      const { description, descriptionHtml } = buildDescriptionFields(assignment.description)

      console.log(`📝 Creating task "${title}": type=${type}, hours=${estimatedHours}`)

      addTask({
        title,
        courseId,
        courseName: course.name,
        type,
        dueDate,
        estimatedHours,
        priority,
        status: 'pending',
        description,
        descriptionHtml,
        canvasId: assignment.id ? String(assignment.id) : undefined,
        fromCanvas: true,
        points: assignment.points || 0
      } as any)
    })
  }

  const parseExamDueDate = (exam: any) => {
    if (!exam?.date) return null
    const combined = exam.time ? `${exam.date} ${exam.time}` : exam.date
    return parseDueDateValue(combined)
  }

  const addParsedExamTasks = (parsedSchedule: any, courseId: string, courseName: string) => {
    ;(parsedSchedule?.exams || []).forEach((exam: any, index: number) => {
      const dueDate = parseExamDueDate(exam)
      if (!dueDate) return
      const title = exam.title || `Exam ${index + 1}`
      if (hasExistingTask(courseId, title, dueDate)) return
      addTask({
        title,
        courseId,
        courseName,
        type: 'exam',
        dueDate,
        estimatedHours: getEstimatedHoursForTask('exam'),
        priority: 'high',
        status: 'pending',
        description: [
          exam.location ? `Location: ${exam.location}` : undefined,
          exam.topics ? `Topics: ${exam.topics}` : undefined
        ].filter(Boolean).join(' | '),
        canvasId: `${courseId}-exam-${index}`,
        fromCanvas: true
      } as any)
    })
  }

  const runContextExtractionForCourse = async (course: any, courseId: string) => {
    const hasSourceText = course.syllabus || (course.announcements?.length || 0) > 0 || (course.discussions?.length || 0) > 0 || (course.modules?.length || 0) > 0
    if (!hasSourceText) return

    try {
      const existingAssignments = useScheduleStore.getState().tasks
        .filter(task => task.courseId === courseId)
        .map(task => ({
          name: task.title,
          dueDate: new Date(task.dueDate).toISOString()
        }))

      const existingEvents = useScheduleStore.getState().events
        .filter(event => event.courseId === courseId)
        .map(event => ({
          title: event.title,
          type: event.type,
          startTime: event.startTime,
          endTime: event.endTime,
          location: (event as any).location
        }))

      const moduleDescriptions = (course.modules || []).map((module: any) => ({
        name: module.name,
        description: module.description || module.items?.map((item: any) => item.title).join(' ') || ''
      }))

      // Combine Canvas syllabus with user-provided additional context
      const combinedSyllabus = [
        course.syllabus,
        additionalContext[course.canvasId] || additionalContext[course.id]
      ].filter(Boolean).join('\n\n---USER PROVIDED ADDITIONAL CONTEXT---\n\n')

      const response = await fetch('/api/canvas/extract-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseName: course.name,
          syllabus: combinedSyllabus || null,
          announcements: course.announcements || [],
          discussions: course.discussions || [],
        moduleDescriptions,
        assignmentDescriptions: (course.assignments || []).map((assignment: any) => ({
          name: assignment.name,
          description: assignment.description || ''
        })),
        pages: (course.pages || []).map((p: any) => ({ title: p.title, body: p.body || p.content || '' })),
        additionalContext: additionalContext[course.canvasId] || additionalContext[course.id],
        existingAssignments,
        existingEvents,
        calendarEvents: course.calendarEvents || []
      })
    })

      if (!response.ok) {
        console.warn('Context extraction skipped for', course.name)
        return
      }

      const data = await response.json()
      ;(data.extracted?.tasks || []).forEach((task: any, index: number) => {
        const dueDate = task.dueDate ? parseDueDateValue(task.dueDate) : null
        const title = task.title || `Context Task ${index + 1}`
        const normalizedType = determineAssignmentType(task.type || title)
        const { description, descriptionHtml } = buildDescriptionFields(task.description)
        const action = task.action || 'add'
        const matching = useScheduleStore.getState().tasks.filter(t => t.courseId === courseId && t.title === title)

        if (action === 'update' && matching.length > 0) {
          matching.forEach(m => {
            updateTask(m.id, {
              dueDate: dueDate || m.dueDate,
              description: [description, task.source ? `Source: ${task.source}` : undefined].filter(Boolean).join(' | '),
              descriptionHtml
            })
          })
          return
        }

        if (dueDate && hasExistingTask(courseId, title, dueDate)) return

        addTask({
          title,
          courseId,
          courseName: course.name,
          type: normalizedType,
          dueDate: dueDate || new Date(),
          estimatedHours: task.estimatedHours || getEstimatedHoursForTask(normalizedType),
          priority: mapConfidenceToPriority(task.confidence),
          status: 'pending',
          description: [description, task.source ? `Source: ${task.source}` : undefined].filter(Boolean).join(' | '),
          descriptionHtml,
          canvasId: `${courseId}-ctx-${index}`,
          fromContext: true
        } as any)
      })

      ;(data.extracted?.examUpdates || []).forEach((examUpdate: any) => {
        const targetTitle = (examUpdate.title || '').trim()
        const examEvents = useScheduleStore.getState().events.filter(e =>
          e.courseId === courseId && (e.type === 'exam' || (e.title || '').toLowerCase().includes('exam'))
        )
        const match = examEvents.find(e => (e.title || '').toLowerCase().includes(targetTitle.toLowerCase()))
        if (match) {
          updateEvent(match.id as string, {
            startTime: examUpdate.startTime ? new Date(examUpdate.startTime) : match.startTime,
            endTime: examUpdate.endTime ? new Date(examUpdate.endTime) : match.endTime,
            location: examUpdate.location || (match as any).location
          } as any)
        }
      })

      // Non-destructive suggestions (e.g., video durations, chapter splits)
      ;(data.extracted?.suggestions || []).forEach((suggestion: any, index: number) => {
        const title = suggestion.title || `Suggested Task ${index + 1}`
        const normalizedType = determineAssignmentType(suggestion.type || title)
        const dueDate = suggestion.dueDate ? parseDueDateValue(suggestion.dueDate) : undefined
        if (dueDate && hasExistingTask(courseId, title, dueDate)) return

        addTask({
          title,
          courseId,
          courseName: course.name,
          type: normalizedType,
          dueDate: dueDate || new Date(),
          estimatedHours: suggestion.estimatedHours || getEstimatedHoursForTask(normalizedType),
          priority: 'low',
          status: 'pending',
          description: [suggestion.description, 'Needs review'].filter(Boolean).join(' | '),
          canvasId: `${courseId}-suggestion-${index}`,
          fromContext: true,
          needsReview: true,
          source: suggestion.source || 'context-augmentor'
        } as any)
      })
    } catch (error) {
      console.error('Context extraction error for', course.name, error)
    }
  }

const importCanvasCourses = async () => {
    let messageInterval: ReturnType<typeof setInterval> | null = null
    try {
      setImportingCourses(true)
      setProcessedCount(0)

      // Fun loading messages
      const loadingMessages = [
        "🚀 Launching course rockets...",
        "📚 Gathering syllabi from the academic cosmos...",
        "🧙‍♂️ Consulting the Canvas oracle...",
        "🔮 Decoding assignment mysteries...",
        "🎯 Pinpointing due dates with laser precision...",
        "🌟 Sprinkling some study magic...",
        "📝 Translating professor speak...",
        "⚡ Supercharging your schedule...",
        "🎨 Painting your academic masterpiece...",
        "🔥 Heating up the knowledge furnace..."
      ]

      let messageIndex = 0
      messageInterval = setInterval(() => {
        setImportStatus(loadingMessages[messageIndex % loadingMessages.length])
        messageIndex++
      }, 2000)

      // Use ref to get the most current selected courses
      const currentSelectedCourses = selectedCoursesRef.current.length > 0
        ? selectedCoursesRef.current
        : selectedCourses  // Fallback to state if ref is empty

      // Only import courses that were selected
      const coursesToImport = canvasCourses.filter(c =>
        currentSelectedCourses.includes(c.id.toString())
      )

      // Debug logging
      console.log('🔍 Import Debug:', {
        selectedCoursesFromState: selectedCourses,
        selectedCoursesFromRef: selectedCoursesRef.current,
        currentSelectedCourses,
        canvasCoursesCount: canvasCourses.length,
        canvasCourseIds: canvasCourses.map(c => c.id),
        coursesToImportCount: coursesToImport.length,
        coursesToImport: coursesToImport.map(c => ({ id: c.id, name: c.name }))
      })

      // Don't import if no courses selected
      if (coursesToImport.length === 0) {
        console.log('❌ No courses selected for import')
        if (messageInterval) {
          clearInterval(messageInterval)
        }
        setImportingCourses(false)
        setImportStatus('No courses selected. Please select courses to import.')
        return
      }

      setImportStatus(`📦 Importing ${coursesToImport.length} courses...`)

      // Ensure courses have canvasId field for the API
      const coursesForAPI = coursesToImport.map(course => ({
        ...course,
        canvasId: course.canvasId || course.id // Ensure canvasId is set
      }))

      // Get existing task IDs for duplicate detection
      const { tasks: existingTasks, courses: existingCourses } = useScheduleStore.getState()
      const existingTaskIds = existingTasks.map(t => t.canvasId || t.id).filter(Boolean)
      const existingCourseIds = existingCourses.map(c => c.canvasId || c.id).filter(Boolean)

      console.log('📤 Sending courses to API:', coursesForAPI)
      console.log('📤 Existing task IDs for dedup:', existingTaskIds.length)

      const response = await fetch('/api/canvas/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courses: coursesForAPI,
          canvasUrl: formData.canvasUrl,
          canvasToken: formData.canvasToken,
          existingTaskIds,
          existingCourseIds
        })
      })

      if (response.ok) {
        const data = await response.json()

        // Clear any existing courses first to avoid duplicates
        const { courses: existingCourses } = useScheduleStore.getState()

        // Process only the selected courses that were imported
        // The server returns all courses, but we only process the ones the user selected
        const selectedImportedCourses = data.importedCourses.filter((course: any) => {
          // Check if this course was in our selected list
          const courseId = course.canvasId?.toString() || course.id?.toString()
          return currentSelectedCourses.includes(courseId)
        })

        // Extract import stats from API response
        const importStats = data.importStats || {
          coursesImported: selectedImportedCourses.length,
          assignmentsImported: 0,
          assignmentsSkipped: 0
        }

        console.log('📊 Import Results:', {
          selectedCoursesCount: currentSelectedCourses.length,
          selectedCourseIds: currentSelectedCourses,
          importedCoursesCount: data.importedCourses?.length || 0,
          selectedImportedCount: selectedImportedCourses.length,
          importStats,
          importedCourses: data.importedCourses?.map((c: any) => ({
            id: c.id,
            canvasId: c.canvasId,
            name: c.name
          }))
        })

        let courseIndex = 0
        for (const course of selectedImportedCourses) {
          courseIndex++
          setProcessedCount(courseIndex)
          setImportStatus(`📘 Processing ${course.name} (${courseIndex}/${selectedImportedCourses.length})`)
          // Parse schedule if we have syllabus or calendar events
          let parsedSchedule = null
          if (course.syllabus || course.calendarEvents?.length > 0) {
            try {
              const parseResponse = await fetch('/api/canvas/parse-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  syllabus: course.syllabus,
                  calendarEvents: course.calendarEvents,
                  courseFiles: course.courseFiles,
                  courseName: course.name
                })
              })

              if (parseResponse.ok) {
                const parseData = await parseResponse.json()
                parsedSchedule = parseData.schedule
              }
            } catch (error) {
              console.error('Failed to parse schedule for', course.name, error)
            }
          }

          const normalizedCalendarEvents = (course.calendarEvents || [])
            .map(normalizeCanvasEvent)
            .filter((event): event is any => Boolean(event))

          const meetingLikeEvents = normalizedCalendarEvents.filter(evt => evt.isMeeting)
          const lectureSchedule = parsedSchedule?.lectures || []
          const mergedSchedule = mergeScheduleWithCanvasMeetings(lectureSchedule, meetingLikeEvents)

          course.schedule = mergedSchedule
          course.calendarEvents = normalizedCalendarEvents

          // Check if course already exists to prevent duplicates
          const { courses: currentCourses, addTask } = useScheduleStore.getState()
          const existingCourse = currentCourses.find(c =>
            c.canvasId === course.canvasId?.toString() ||
            c.id === (course.canvasId?.toString() || course.id?.toString())
          ) || currentCourses.find(c => c.name === course.name || c.code === course.code)

          const canonicalCourseId =
            existingCourse?.id ||
            course.canvasId?.toString() ||
            course.id?.toString() ||
            `canvas-${courseIndex}`

          console.log(`📚 Processing course: ${course.name} (exists: ${Boolean(existingCourse)})`)

          if (!existingCourse) {
            // Add course to store with parsed schedule
            console.log(`✅ Adding course: ${course.name}`)
            const draft = meetingDrafts[canonicalCourseId]
            const draftSlots = draft?.slots || []
            const meetingSchedule = draftSlots
              .filter((slot: any) => slot?.start || slot?.end)
              .map((slot: any) => ({
                dayOfWeek: Number(slot.dayOfWeek),
                startTime: slot.start || '',
                endTime: slot.end || '',
                type: 'lecture',
                location: draft?.location || course.location || ''
              }))

            addCourse({
              id: canonicalCourseId,
              name: course.name,
              code: course.code,
              instructor: course.instructor,
              schedule: meetingSchedule.length > 0 ? meetingSchedule : lectureSchedule,
              color: getCourseColor(courseIndex - 1),
              credits: 3,
              location: draft?.location || 'TBA',
              canvasId: course.canvasId?.toString(),
              canvasCourseId: course.canvasId?.toString(),
              pages: course.pages,
              // Store additional data for later use
              canvasData: {
                assignments: course.assignments,
                exams: parsedSchedule?.exams || [],
                importantDates: parsedSchedule?.importantDates || [],
                officeHours: parsedSchedule?.officeHours,
                courseSchedule: parsedSchedule?.courseSchedule,
                calendarEvents: course.calendarEvents,
                modules: course.modules,
                pages: course.pages
              }
            } as any)

            // Create tasks from assignments
          }

          if (course.assignments && course.assignments.length > 0) {
            course.assignments.forEach((assignment: any) => {
              if (assignment.dueDate) {
                const taskType = assignment.type || determineAssignmentType(assignment.name)
                const estimatedHours = assignment.estimatedHours || getEstimatedHoursForTask(taskType)

                addTask({
                  title: assignment.name,
                  courseId: canonicalCourseId,
                  courseName: course.name,
                  type: taskType,
                  dueDate: new Date(assignment.dueDate),
                  estimatedHours: estimatedHours,
                  priority: assignment.name.toLowerCase().includes('exam') ? 'high' : 'medium',
                  status: 'pending',
                  description: assignment.description || '',
                  points: assignment.points || 0,
                  fromCanvas: true
                } as any)
              }
            })
            console.log(`Created ${course.assignments.length} tasks for ${course.name}`)
          }

          // Convert Canvas calendar events to Event objects
          if (course.calendarEvents && course.calendarEvents.length > 0) {
            const { addEvent } = useScheduleStore.getState()
            let eventsAdded = 0

            course.calendarEvents.forEach((canvasEvent: any) => {
              // Determine event type from Canvas event
              const lowerTitle = (canvasEvent.title || '').toLowerCase()
              const eventType = lowerTitle.includes('exam') || lowerTitle.includes('test') || lowerTitle.includes('final')
                ? 'exam'
                : lowerTitle.includes('quiz')
                ? 'quiz'
                : isMeetingLikeEvent(canvasEvent)
                ? 'lecture'
                : 'lecture'

              // Only add events that have valid dates
              if (canvasEvent.startTime) {
                try {
                  const startTime = canvasEvent.startTime instanceof Date ? canvasEvent.startTime : new Date(canvasEvent.startTime)
                  const endTime = canvasEvent.endTime instanceof Date ? canvasEvent.endTime : new Date(canvasEvent.endTime)

                  // Skip if the event is invalid or in the far past
                  if (isNaN(startTime.getTime()) || startTime < new Date('2020-01-01')) {
                    return
                  }

                  addEvent({
                    title: canvasEvent.title || 'Canvas Event',
                    startTime,
                    endTime,
                    type: eventType,
                    courseId: canonicalCourseId,
                    description: canvasEvent.description || '',
                    location: canvasEvent.locationName || canvasEvent.location_name || canvasEvent.location,
                    fromCanvas: true,
                    source: 'canvas'
                  } as any)

                  eventsAdded++
                } catch (error) {
                  console.warn(`Skipping invalid calendar event: ${canvasEvent.title}`, error)
                }
              }
            })

            if (eventsAdded > 0) {
              console.log(`✅ Added ${eventsAdded} calendar events for ${course.name}`)
            }
          }
        }

        if (messageInterval) {
          clearInterval(messageInterval)
        }

        // Check final state
        const { courses: finalCourses } = useScheduleStore.getState()
        console.log('🏁 Import complete. Final state:', {
          coursesInStore: finalCourses.length,
          courseNames: finalCourses.map(c => c.name),
          selectedCount: selectedCourses.length,
          importedCount: selectedImportedCourses.length
        })

        const coursesNeedingMeetings = selectedImportedCourses.filter((course: any) => {
          const hasRecurring = Array.isArray(course.schedule) && course.schedule.length > 0
          const meetingEvents = Array.isArray(course.calendarEvents)
            ? course.calendarEvents.filter((evt: any) => evt.isMeeting)
            : []
          const hasMeetingEvents = meetingEvents.length > 0
          return !hasRecurring && !hasMeetingEvents
        })

        // Build detailed status message with import stats
        const buildImportMessage = (prefix: string) => {
          let msg = `${prefix} ${selectedImportedCourses.length} courses`
          if (importStats.assignmentsImported > 0) {
            msg += `, ${importStats.assignmentsImported} assignments`
          }
          if (importStats.assignmentsSkipped > 0) {
            msg += ` (${importStats.assignmentsSkipped} duplicates skipped)`
          }
          return msg
        }

        if (coursesNeedingMeetings.length > 0) {
          setPendingMeetingCourses(coursesNeedingMeetings)
          const first = coursesNeedingMeetings[0]
          const firstId = first?.canvasId?.toString() || first?.id?.toString()
          const defaultSlots = [{ dayOfWeek: 1, startTime: '09:00', endTime: '10:00', type: 'lecture', location: '' }]
          setMeetingDrafts(firstId ? { [firstId]: { slots: defaultSlots } } : {})
          setMeetingDialogOpen(true)
          setImportStatus(`📅 ${buildImportMessage('Imported')}. Add class meeting times to block your calendar.`)
        } else {
          generateSmartSchedule()
          setImportStatus(`✅ ${buildImportMessage('Successfully imported')} and scheduled!`)
          console.log('Successfully imported courses with enhanced data')
        }
      }
    } catch (error) {
      console.error('Failed to import courses:', error)
      if (messageInterval) {
        clearInterval(messageInterval)
      }
      setImportStatus('❌ Import failed. Please try again.')
    } finally {
      if (messageInterval) {
        clearInterval(messageInterval)
      }
      setTimeout(() => {
        setImportingCourses(false)
        setImportStatus('')
      }, 2000)
    }
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1)
  }

  const startNextMeetingCourse = (remaining: any[]) => {
    if (remaining.length > 0) {
      setPendingMeetingCourses(remaining)
      const next = remaining[0]
      const nextId = next?.canvasId?.toString() || next?.id?.toString()
      const defaultSlots = [{ dayOfWeek: 1, startTime: '09:00', endTime: '10:00', type: 'lecture', location: '' }]
      setMeetingDrafts(nextId ? { [nextId]: { slots: defaultSlots } } : {})
      setMeetingDialogOpen(true)
    } else {
      setPendingMeetingCourses([])
      setMeetingDialogOpen(false)
      setImportStatus((prev) => prev || '✅ Courses imported')
      generateSmartSchedule()
    }
  }

  const handleSaveMeetingSchedule = () => {
    const currentCourse = pendingMeetingCourses[0]
    if (!currentCourse) return

    const courseId = currentCourse.canvasId?.toString() || currentCourse.id?.toString() || currentCourse.id
    const draft = Array.isArray(meetingDrafts) ? undefined : meetingDrafts[courseId]
    const cleanedSlots = (draft?.slots || [])
      .filter((item: any) => item?.start || item?.end)
      .map((item: any) => ({
        dayOfWeek: Number(item.dayOfWeek),
        startTime: item.start || '',
        endTime: item.end || '',
        type: 'lecture',
        location: draft?.location || currentCourse.location || ''
      }))

    if (cleanedSlots.length > 0 && courseId) {
      updateCourse(courseId, { schedule: cleanedSlots })
      console.log(`✅ Added meeting schedule for ${currentCourse.name || courseId}`, cleanedSlots)
    }

    startNextMeetingCourse(pendingMeetingCourses.slice(1))
  }

  const handleSkipMeetingSchedule = () => {
    startNextMeetingCourse(pendingMeetingCourses.slice(1))
  }

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ textAlign: 'center', py: isMobile ? 2 : 4 }}>
            <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700} gutterBottom>
              Welcome{isMobile ? '!' : `, ${session?.user?.name || 'Student'}!`}
            </Typography>
            {!isMobile && (
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Let's set up your personalized academic workspace in just a few steps.
              </Typography>
            )}
            {isMobile && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Let's get you set up.
              </Typography>
            )}

            <Stack spacing={2} sx={{ mt: isMobile ? 2 : 3 }}>
              <Card sx={{ textAlign: 'left' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: isMobile ? 1.5 : 2 }}>
                  <School sx={{ fontSize: isMobile ? 32 : 40, color: 'primary.main' }} />
                  <Box>
                    <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={600}>
                      Smart Scheduling
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      AI-powered study blocks
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ textAlign: 'left' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: isMobile ? 1.5 : 2 }}>
                  <AutoAwesome sx={{ fontSize: isMobile ? 32 : 40, color: 'secondary.main' }} />
                  <Box>
                    <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={600}>
                      AI Notes
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Generate notes from any source
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              <Card sx={{ textAlign: 'left' }}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: isMobile ? 1.5 : 2 }}>
                  <CloudUpload sx={{ fontSize: isMobile ? 32 : 40, color: 'success.main' }} />
                  <Box>
                    <Typography variant={isMobile ? 'subtitle1' : 'h6'} fontWeight={600}>
                      Canvas Sync
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Auto-import from Canvas LMS
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          </Box>
        )

      case 1:
        return (
          <Box sx={{ py: 4 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              University & Canvas Setup
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select your university and connect Canvas LMS for automatic course import
            </Typography>

            {/* University Selection */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>University</InputLabel>
              <Select
                value={formData.university}
                onChange={(e) => {
                  const universityId = e.target.value
                  const canvasUrl = getCanvasUrl(universityId)
                  const config = getUniversityConfig(universityId)

                  setFormData({
                    ...formData,
                    university: universityId,
                    canvasUrl: canvasUrl || formData.canvasUrl
                  })
                }}
                label="University"
              >
                {getUniversityList().map(uni => (
                  <MenuItem key={uni.id} value={uni.id}>
                    <Box>
                      <Typography variant="body2">{uni.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {uni.system === 'quarter' ? 'Quarter' : uni.system === 'trimester' ? 'Trimester' : 'Semester'} System
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
                <MenuItem value="other">Other / Not Listed</MenuItem>
              </Select>
            </FormControl>

            {formData.university && formData.university !== 'other' && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>Canvas URL auto-configured:</strong> {getCanvasUrl(formData.university)}
                </Typography>
                {getUniversityConfig(formData.university)?.system === 'quarter' && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Quarter system detected - scheduling will adapt to 10-week terms
                  </Typography>
                )}
                {getUniversityConfig(formData.university)?.system === 'trimester' && (
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    Trimester system detected - scheduling will adapt to 15-week terms
                  </Typography>
                )}
              </Alert>
            )}

            {/* Canvas Integration */}
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 4 }}>
              Connect Canvas LMS (Optional)
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Canvas integration allows automatic import of assignments and deadlines.
              You can skip this and add it later in settings.
            </Alert>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {!canvasConnected ? (
              <>
                <TextField
                  fullWidth
                  label="Canvas URL"
                  placeholder={formData.university === 'other' ? "https://your-school.instructure.com" : ""}
                  value={formData.canvasUrl}
                  onChange={(e) => setFormData({ ...formData, canvasUrl: e.target.value })}
                  sx={{ mb: 3 }}
                  helperText={
                    formData.university && formData.university !== 'other'
                      ? `Auto-configured for ${getUniversityConfig(formData.university)?.name}`
                      : "Your school's Canvas URL"
                  }
                  disabled={loading || (formData.university && formData.university !== 'other')}
                  InputProps={{
                    readOnly: formData.university && formData.university !== 'other'
                  }}
                />

                <TextField
                  fullWidth
                  label="Canvas Access Token"
                  placeholder="Your Canvas API token"
                  value={formData.canvasToken}
                  onChange={(e) => setFormData({ ...formData, canvasToken: e.target.value })}
                  type="password"
                  sx={{ mb: 3 }}
                  helperText="Generate this in Canvas: Account → Settings → New Access Token"
                  disabled={loading}
                />

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    onClick={connectToCanvas}
                    disabled={!formData.canvasUrl || !formData.canvasToken || loading}
                  >
                    {loading ? 'Connecting...' : 'Connect to Canvas'}
                  </Button>
                  <Button variant="outlined" size="small">
                    How to get Canvas token?
                  </Button>
                </Stack>
              </>
            ) : (
              <Box>
                <Alert severity="success" sx={{ mb: 3 }}>
                  <Typography variant="body2">
                    ✅ Successfully connected to Canvas!
                  </Typography>
                </Alert>

                {canvasCourses.length > 0 && (
                  <>
                    <Typography variant="h6" gutterBottom>
                      Select Courses to Import
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Found {canvasCourses.length} active courses • {selectedCourses.length} selected
                    </Typography>

                    <Stack spacing={2}>
                      {canvasCourses.map((course) => {
                        const courseId = course.id.toString()
                        const isSelected = selectedCourses.includes(courseId)

                        const courseMeetings = meetingDrafts[courseId]?.slots || []
                        const updateMeeting = (dayIdx: number, field: 'start' | 'end', value: string) => {
                          const updated = Array.isArray(courseMeetings) ? [...courseMeetings] : []
                          updated[dayIdx] = {
                            ...(updated[dayIdx] || { dayOfWeek: dayIdx }),
                            start: field === 'start' ? value : updated[dayIdx]?.start || '',
                            end: field === 'end' ? value : updated[dayIdx]?.end || ''
                          }
                          setMeetingDrafts({
                            ...meetingDrafts,
                            [courseId]: { ...meetingDrafts[courseId], slots: updated }
                          })
                        }

                        const updateMeta = (field: 'format' | 'location', value: string) => {
                          setMeetingDrafts({
                            ...meetingDrafts,
                            [courseId]: { ...(meetingDrafts[courseId] || {}), [field]: value }
                          })
                        }

                        const toggleSelection = () => {
                          setSelectedCourses(prev => {
                            const newSelection = prev.includes(courseId)
                              ? prev.filter(id => id !== courseId)
                              : [...prev, courseId]
                            selectedCoursesRef.current = newSelection
                            return newSelection
                          })
                        }

                        return (
                          <Paper
                            key={course.id}
                            sx={{
                              p: 2,
                              border: isSelected ? 2 : 1,
                              borderColor: isSelected ? 'primary.main' : 'divider',
                              backgroundColor: isSelected ? 'action.selected' : 'transparent',
                              transition: 'all 0.2s'
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="center" onClick={toggleSelection} sx={{ cursor: 'pointer' }}>
                              <Box>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {course.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {course.code} • {course.term}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Instructor: {course.instructor}
                                </Typography>
                              </Box>
                              {isSelected ? (
                                <Chip
                                  icon={<Check />}
                                  label="Selected"
                                  color="primary"
                                  size="small"
                                />
                              ) : (
                                <Chip
                                  label="Click to select"
                                  size="small"
                                  variant="outlined"
                                />
                              )}
                            </Stack>

                            {isSelected && (
                              <Box sx={{ mt: 2 }} data-stop-select onClick={(e) => e.stopPropagation()}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Meeting Times (optional but recommended)
                                </Typography>
                                <Stack spacing={0.75} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
                                  {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, idx) => (
                                    <Box
                                      key={`${course.id}-${day}`}
                                      sx={{
                                        display: 'grid',
                                        gridTemplateColumns: '64px repeat(2, minmax(140px, 1fr))',
                                        alignItems: 'center',
                                        gap: 1
                                      }}
                                    >
                                      <Typography variant="body2" fontWeight={600} color="text.secondary">
                                        {day}
                                      </Typography>
                                      <TextField
                                        label="Start"
                                        type="time"
                                        size="small"
                                        value={(meetingDrafts[courseId]?.slots?.[idx]?.start) || ''}
                                        onChange={(e) => updateMeeting(idx, 'start', e.target.value)}
                                        inputProps={{ step: 300 }}
                                      />
                                      <TextField
                                        label="End"
                                        type="time"
                                        size="small"
                                        value={(meetingDrafts[courseId]?.slots?.[idx]?.end) || ''}
                                        onChange={(e) => updateMeeting(idx, 'end', e.target.value)}
                                        inputProps={{ step: 300 }}
                                      />
                                    </Box>
                                  ))}
                                </Stack>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }} alignItems="center">
                                  <TextField
                                    select
                                    label="Format"
                                    size="small"
                                    value={meetingDrafts[courseId]?.format || 'in-person'}
                                    onChange={(e) => updateMeta('format', e.target.value)}
                                    sx={{ minWidth: 180 }}
                                  >
                                    <MenuItem value="in-person">In person</MenuItem>
                                    <MenuItem value="online-sync">Online synchronous</MenuItem>
                                    <MenuItem value="online-async">Online asynchronous</MenuItem>
                                    <MenuItem value="hybrid">Hybrid</MenuItem>
                                  </TextField>
                                  <TextField
                                    label="Location / Link"
                                    fullWidth
                                    size="small"
                                    value={meetingDrafts[courseId]?.location || ''}
                                    onChange={(e) => updateMeta('location', e.target.value)}
                                    placeholder="Room number or Zoom link"
                                  />
                                </Stack>
                              </Box>
                            )}
                          </Paper>
                        )
                      })}
                    </Stack>
                  </>
                )}
              </Box>
            )}
          </Box>
        )

      case 2:
        return (
          <Box sx={{ py: 4 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Set Your Study Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              We'll use these to create your personalized study schedule
            </Typography>

            <Grid container spacing={3}>
              <Grid item sm={12} md={6}>
                <TextField
                  fullWidth
                  label="Weekday Start Time"
                  type="time"
                  value={formData.studyHoursStart}
                  onChange={(e) => setFormData({ ...formData, studyHoursStart: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item sm={12} md={6}>
                <TextField
                  fullWidth
                  label="Weekday End Time"
                  type="time"
                  value={formData.studyHoursEnd}
                  onChange={(e) => setFormData({ ...formData, studyHoursEnd: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Weekend Study Hours (per day)"
                  type="number"
                  value={formData.weekendStudyHours}
                  onChange={(e) => setFormData({ ...formData, weekendStudyHours: Number(e.target.value) })}
                  inputProps={{ min: 0, max: 16, step: 0.5 }}
                  helperText="Hours you want to study on Sat/Sun. Weekday window applies Mon–Fri."
                />
              </Grid>
            </Grid>

            <FormControl fullWidth sx={{ mt: 3, mb: 3 }}>
              <InputLabel>Session Duration</InputLabel>
              <Select
                value={formData.sessionDuration}
                onChange={(e) => setFormData({ ...formData, sessionDuration: Number(e.target.value) })}
                label="Session Duration"
              >
                <MenuItem value={25}>25 minutes (Pomodoro)</MenuItem>
                <MenuItem value={45}>45 minutes</MenuItem>
                <MenuItem value={60}>60 minutes</MenuItem>
                <MenuItem value={90}>90 minutes</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="subtitle1" gutterBottom>
              Preferred Study Times (within your weekday window)
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              {['Early Morning', 'Morning', 'Afternoon', 'Evening', 'Night'].map((time) => (
                <Chip
                  key={time}
                  label={time}
                  onClick={() => {
                    const newTimes = formData.preferredTimes.includes(time)
                      ? formData.preferredTimes.filter(t => t !== time)
                      : [...formData.preferredTimes, time]
                    setFormData({ ...formData, preferredTimes: newTimes })
                  }}
                  color={formData.preferredTimes.includes(time) ? 'primary' : 'default'}
                  sx={{ mb: 1 }}
                />
              ))}
            </Stack>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Weekend Availability
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Weekend study hours (per day)"
                    type="number"
                    value={formData.weekendStudyHours}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      setFormData({
                        ...formData,
                        weekendStudyHours: Math.max(0, isNaN(value) ? 0 : value)
                      })
                    }}
                    InputProps={{ inputProps: { min: 0, max: 16 } }}
                    helperText="Hours you want to study on Sat/Sun."
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Study Days
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {studyDayOptions.map((day) => {
                  const isActive = formData.studyDays[day.key]
                  return (
                    <Chip
                      key={day.key}
                      label={day.label}
                      clickable
                      color={isActive ? 'primary' : 'default'}
                      variant={isActive ? 'filled' : 'outlined'}
                      onClick={() => setFormData({
                        ...formData,
                        studyDays: {
                          ...formData.studyDays,
                          [day.key]: !isActive
                        }
                      })}
                    />
                  )
                })}
              </Stack>
            </Box>

            {/* Task Duration Defaults */}
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle1" gutterBottom>
                Task Duration Defaults
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Set study time per task type. {isMobile ? 'Tap +/- to adjust.' : 'These defaults auto-fill when Canvas data is missing.'}
              </Typography>

              {/* Mobile: 2-column grid of steppers, Desktop: 3-column */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
                  gap: isMobile ? 1.5 : 2,
                  mt: 2,
                }}
              >
                <NumberStepper
                  label="Assignment"
                  value={formData.taskDurations.assignment}
                  onChange={(v) => setFormData({
                    ...formData,
                    taskDurations: { ...formData.taskDurations, assignment: v }
                  })}
                  min={0.5}
                  max={20}
                  step={0.5}
                  size={isMobile ? 'small' : 'medium'}
                />
                <NumberStepper
                  label="Exam Prep"
                  value={formData.taskDurations.exam}
                  onChange={(v) => setFormData({
                    ...formData,
                    taskDurations: { ...formData.taskDurations, exam: v }
                  })}
                  min={0.5}
                  max={20}
                  step={0.5}
                  size={isMobile ? 'small' : 'medium'}
                />
                <NumberStepper
                  label="Project"
                  value={formData.taskDurations.project}
                  onChange={(v) => setFormData({
                    ...formData,
                    taskDurations: { ...formData.taskDurations, project: v }
                  })}
                  min={0.5}
                  max={40}
                  step={0.5}
                  size={isMobile ? 'small' : 'medium'}
                />
                <NumberStepper
                  label="Reading"
                  value={formData.taskDurations.reading}
                  onChange={(v) => setFormData({
                    ...formData,
                    taskDurations: { ...formData.taskDurations, reading: v }
                  })}
                  min={0.5}
                  max={10}
                  step={0.5}
                  size={isMobile ? 'small' : 'medium'}
                />
                <NumberStepper
                  label="Quiz"
                  value={formData.taskDurations.quiz}
                  onChange={(v) => setFormData({
                    ...formData,
                    taskDurations: { ...formData.taskDurations, quiz: v }
                  })}
                  min={0.5}
                  max={10}
                  step={0.5}
                  size={isMobile ? 'small' : 'medium'}
                />
                <NumberStepper
                  label="Lab/Skills"
                  value={formData.taskDurations.lab}
                  onChange={(v) => setFormData({
                    ...formData,
                    taskDurations: { ...formData.taskDurations, lab: v }
                  })}
                  min={0.5}
                  max={10}
                  step={0.5}
                  size={isMobile ? 'small' : 'medium'}
                />
                <NumberStepper
                  label="Video"
                  value={formData.taskDurations.video}
                  onChange={(v) => setFormData({
                    ...formData,
                    taskDurations: { ...formData.taskDurations, video: v }
                  })}
                  min={0.25}
                  max={6}
                  step={0.25}
                  size={isMobile ? 'small' : 'medium'}
                />
                <NumberStepper
                  label="Prep/Misc"
                  value={formData.taskDurations.prep}
                  onChange={(v) => setFormData({
                    ...formData,
                    taskDurations: { ...formData.taskDurations, prep: v }
                  })}
                  min={0.25}
                  max={6}
                  step={0.25}
                  size={isMobile ? 'small' : 'medium'}
                />
                <NumberStepper
                  label="Lecture"
                  value={formData.taskDurations.lecture}
                  onChange={(v) => setFormData({
                    ...formData,
                    taskDurations: { ...formData.taskDurations, lecture: v }
                  })}
                  min={0.5}
                  max={6}
                  step={0.25}
                  size={isMobile ? 'small' : 'medium'}
                />
              </Box>
            </Box>
          </Box>
        )

      case 3:
        // Use ref to get current selected courses (more reliable than state)
        const currentSelectedCourses = selectedCoursesRef.current || selectedCourses
        console.log('📋 Additional Context step - Debug:', {
          canvasCoursesCount: canvasCourses.length,
          selectedCoursesFromState: selectedCourses,
          selectedCoursesFromRef: selectedCoursesRef.current,
          usingCourses: currentSelectedCourses
        })

        return (
          <Box sx={{ py: 4 }}>
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Additional Context (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              If your syllabus wasn't in Canvas or you have additional course information, paste it here.
              Our AI will extract hidden tasks, deadlines, and requirements.
            </Typography>

            {canvasCourses.length === 0 ? (
              <Alert severity="info">
                Connect Canvas in the previous step to see your courses here.
              </Alert>
            ) : (
              <Box>
                {canvasCourses
                  .filter(course => currentSelectedCourses.includes(course.id.toString()))
                  .map((course) => (
                    <Accordion key={course.id} sx={{ mb: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                          <Typography variant="h6" sx={{ flex: 1 }}>
                            {course.name}
                          </Typography>
                          {additionalContext[course.id] && (
                            <Chip
                              label="Context Added"
                              color="success"
                              size="small"
                            />
                          )}
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TextField
                          fullWidth
                          multiline
                          rows={8}
                          placeholder={`Paste syllabus, schedule, or any additional information for ${course.name}...\n\nExamples:\n- Full syllabus text\n- Weekly schedule from professor\n- Email announcements about deadlines\n- Assignment requirements not in Canvas\n- Participation/attendance policies`}
                          value={additionalContext[course.id] || ''}
                          onChange={(e) => setAdditionalContext({
                            ...additionalContext,
                            [course.id]: e.target.value
                          })}
                          variant="outlined"
                          sx={{
                            '& .MuiInputBase-root': {
                              fontFamily: 'monospace',
                              fontSize: '0.875rem'
                            }
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          Our AI will look for: recurring tasks, informal deadlines, participation requirements,
                          hidden prerequisites, and prep work mentioned casually.
                        </Typography>
                        {Array.isArray(course.pages) && course.pages.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Canvas Pages detected (preview)
                            </Typography>
                            <Stack spacing={1}>
                              {course.pages.slice(0, 5).map((page: any) => (
                                <Paper key={page.id || page.url} sx={{ p: 1.5 }} variant="outlined">
                                  <Typography variant="subtitle2">{page.title || 'Untitled page'}</Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 0.5, maxHeight: 72, overflow: 'hidden' }}
                                  >
                                    {getPageSnippet(page.body, 400)}
                                  </Typography>
                                  {page.url && (
                                    <Button href={page.url} target="_blank" rel="noreferrer" size="small">
                                      Open in Canvas
                                    </Button>
                                  )}
                                </Paper>
                              ))}
                            </Stack>
                          </Box>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}

                {currentSelectedCourses.length === 0 && (
                  <Alert severity="info">
                    No courses selected. Go back to select courses from Canvas.
                  </Alert>
                )}
              </Box>
            )}
          </Box>
        )

      case 4:
        return (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            {importingCourses ? (
              <>
                <CircularProgress size={80} sx={{ mb: 3 }} />
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  Importing Your Courses...
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {importStatus || 'Setting up your academic workspace...'}
                </Typography>

                {processedCount > 0 && selectedCourses.length > 0 && (
                  <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto', mb: 3 }}>
                    <LinearProgress
                      variant="determinate"
                      value={(processedCount / selectedCourses.length) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      {processedCount} of {selectedCourses.length} courses processed
                    </Typography>
                  </Box>
                )}
              </>
            ) : (
              <>
                <Check sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  You're All Set!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  Your personalized academic workspace is ready.
                </Typography>

                <Stack spacing={2} sx={{ mt: 4 }}>
                  <Alert severity="success">
                    <strong>✓ Account created</strong> - Connected with {session?.user?.email}
                  </Alert>
                  <Alert severity="success">
                    <strong>✓ University set</strong> - {formData.university || 'Your university'} configured for Canvas
                  </Alert>
                  {formData.canvasToken && (
                    <Alert severity="success">
                      <strong>✓ Canvas connected</strong> - {canvasCourses.length} courses found, {selectedCourses.length} selected
                    </Alert>
                  )}
                  {selectedCourses.length > 0 && !importingCourses && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={async () => {
                        console.log('🔄 Manual import triggered')
                        await importCanvasCourses()
                      }}
                      sx={{ mt: 2 }}
                    >
                      Import Selected Courses Now
                    </Button>
                  )}
                  <Alert severity="success">
                    <strong>✓ Study preferences</strong> - {formData.sessionDuration} min sessions, {formData.preferredTimes.length > 0 ? formData.preferredTimes.join(', ') : 'flexible schedule'}
                  </Alert>
                </Stack>
              </>
            )}
          </Box>
        )

      default:
        return null
    }
  }

  return (
    <>
    <Box sx={{ minHeight: '100vh', bgcolor: '#f7f9fb' }}>
      {/* Hero - hidden on mobile */}
      {!isMobile && (
        <Box
          sx={{
            background: 'linear-gradient(120deg, #0ea5e9 0%, #7c3aed 70%)',
            color: '#fff',
            py: 5,
            mb: 4,
            textAlign: 'center',
          }}
        >
          <Container maxWidth="md">
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Welcome to Studiora.io
            </Typography>
            <Typography sx={{ opacity: 0.9 }}>
              Connect your courses, set preferences, and let deterministic scheduling + AI notes keep you aligned.
            </Typography>
          </Container>
        </Box>
      )}

      {/* Mobile header */}
      {isMobile && (
        <Box
          sx={{
            background: 'linear-gradient(120deg, #0ea5e9 0%, #7c3aed 70%)',
            color: '#fff',
            py: 1.5,
            px: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Studiora Setup
          </Typography>
        </Box>
      )}

      {/* Edge-to-edge on mobile, contained on desktop */}
      <Box
        sx={{
          maxWidth: isMobile ? '100%' : 'md',
          mx: 'auto',
          pb: isMobile ? 2 : 6,
          px: isMobile ? 0 : 3,
          pt: isMobile ? 0 : 0,
        }}
      >
        <Paper
          sx={{
            p: isMobile ? 1.5 : 4,
            borderRadius: isMobile ? 0 : 2,
            boxShadow: isMobile ? 'none' : '0 8px 24px rgba(0,0,0,0.06)',
            minHeight: isMobile ? 'calc(100vh - 52px)' : 'auto',
          }}
        >
          {/* Stepper - vertical on mobile, horizontal on desktop */}
          <Stepper
            activeStep={activeStep}
            orientation={isMobile ? 'vertical' : 'horizontal'}
            sx={{ mb: isMobile ? 2 : 4 }}
          >
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontSize: isMobile ? '0.75rem' : '0.875rem',
                    },
                  }}
                >
                  {isMobile ? (index === activeStep ? label : '') : label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {getStepContent(activeStep)}

          {/* Navigation buttons - full width on mobile */}
          <Stack
            direction="row"
            justifyContent="space-between"
            spacing={2}
            sx={{ mt: isMobile ? 3 : 4 }}
          >
            <Button
              disabled={activeStep === 0 || activeStep === steps.length - 1}
              onClick={handleBack}
              variant="outlined"
              fullWidth={isMobile}
              size={isMobile ? 'large' : 'medium'}
            >
              Back
            </Button>

            {activeStep < steps.length - 1 && (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={importingCourses}
                fullWidth={isMobile}
                size={isMobile ? 'large' : 'medium'}
              >
                {activeStep === steps.length - 2 ? 'Finish Setup' : 'Next'}
              </Button>
            )}
          </Stack>
        </Paper>
      </Box>
    </Box>

      {/* Reconcile Tasks Modal */}
      <ReconcileTasksModal
        open={showOverdueModal}
        onClose={() => {
          setShowOverdueModal(false)
          // Complete onboarding after modal closes
          onComplete()
        }}
        overdueTasks={overdueTasks}
      />

      {/* Quick meeting schedule capture for courses without calendar data */}
      <Dialog open={meetingDialogOpen} onClose={handleSkipMeetingSchedule} fullWidth maxWidth="sm">
        <DialogTitle>Add class meeting times</DialogTitle>
        <DialogContent>
          {pendingMeetingCourses.length > 0 ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                We couldn't find lecture times for <strong>{pendingMeetingCourses[0].name}</strong>. Add recurring times so study blocks don't overlap class.
              </Typography>
              {(() => {
                const current = pendingMeetingCourses[0]
                const courseId = current?.canvasId?.toString() || current?.id?.toString() || ''
                const draft = (Array.isArray(meetingDrafts) ? {} : meetingDrafts[courseId]) || { slots: [], format: 'in-person', location: '' }
                const slots = draft.slots || []
                return (
              <Stack spacing={1}>
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((day, idx) => {
                  const slot = slots[idx] || { dayOfWeek: idx, startTime: '', endTime: '' }
                  return (
                    <Box
                      key={day}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ minWidth: 42 }}>{day}</Typography>
                      <TextField
                        size="small"
                        type="time"
                        label="Start"
                        value={slot.startTime}
                        onChange={(e) => {
                          const value = e.target.value
                          const updatedSlots = [...slots]
                          updatedSlots[idx] = { ...(updatedSlots[idx] || { dayOfWeek: idx }), startTime: value }
                          setMeetingDrafts({
                            ...(Array.isArray(meetingDrafts) ? {} : meetingDrafts),
                            [courseId]: { ...(draft || {}), slots: updatedSlots }
                          })
                        }}
                        inputProps={{ step: 300 }}
                      />
                      <TextField
                        size="small"
                        type="time"
                        label="End"
                        value={slot.endTime}
                        onChange={(e) => {
                          const value = e.target.value
                          const updatedSlots = [...slots]
                          updatedSlots[idx] = { ...(updatedSlots[idx] || { dayOfWeek: idx }), endTime: value }
                          setMeetingDrafts({
                            ...(Array.isArray(meetingDrafts) ? {} : meetingDrafts),
                            [courseId]: { ...(draft || {}), slots: updatedSlots }
                          })
                        }}
                        inputProps={{ step: 300 }}
                      />
                    </Box>
                  )
                })}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    select
                    size="small"
                    label="Format"
                    value={draft.format || 'in-person'}
                    onChange={(e) => setMeetingDrafts({
                      ...(Array.isArray(meetingDrafts) ? {} : meetingDrafts),
                      [courseId]: { ...(draft || {}), format: e.target.value, slots }
                    })}
                    sx={{ minWidth: 180 }}
                  >
                    <MenuItem value="in-person">In person</MenuItem>
                    <MenuItem value="online-sync">Online synchronous</MenuItem>
                    <MenuItem value="online-async">Online asynchronous</MenuItem>
                  </TextField>
                  <TextField
                    fullWidth
                    size="small"
                    label="Location / Link"
                    value={draft.location || ''}
                    onChange={(e) => setMeetingDrafts({
                      ...(Array.isArray(meetingDrafts) ? {} : meetingDrafts),
                      [courseId]: { ...(draft || {}), location: e.target.value, slots }
                    })}
                  />
                </Box>
              </Stack>
                )
              })()}
              <FormHelperText sx={{ mt: 1 }}>
                You can edit these later from Courses, but adding now prevents study blocks from overlapping class.
              </FormHelperText>
            </>
          ) : (
            <Typography variant="body2">No courses need meeting times.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSkipMeetingSchedule}>Skip</Button>
          <Button variant="contained" onClick={handleSaveMeetingSchedule}>Save & Continue</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
