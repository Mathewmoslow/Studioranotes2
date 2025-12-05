import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { estimateTaskHours, determineAssignmentType } from '@/lib/taskHours'
import { isAfter } from 'date-fns'

type CanvasTaskType =
  | 'assignment'
  | 'quiz'
  | 'exam'
  | 'project'
  | 'reading'
  | 'study'
  | string

const TASK_TYPE_MAP: Record<string, string> = {
  assignment: 'ASSIGNMENT',
  quiz: 'QUIZ',
  exam: 'EXAM',
  project: 'PROJECT',
  reading: 'READING',
  study: 'STUDY',
  homework: 'ASSIGNMENT',
  discussion: 'DISCUSSION'
}

const TASK_STATUS_MAP: Record<string, string> = {
  pending: 'NOT_STARTED',
  'not-started': 'NOT_STARTED',
  'in-progress': 'IN_PROGRESS',
  completed: 'COMPLETED'
}

const TASK_PRIORITY_MAP: Record<string, string> = {
  low: 'LOW',
  medium: 'MEDIUM',
  high: 'HIGH'
}

const normalizeTaskType = (type?: CanvasTaskType) => {
  if (!type) return 'ASSIGNMENT'
  const key = String(type).toLowerCase()
  return TASK_TYPE_MAP[key] || 'ASSIGNMENT'
}

const normalizeTaskStatus = (status?: string) => {
  if (!status) return 'NOT_STARTED'
  const key = String(status).toLowerCase()
  return TASK_STATUS_MAP[key] || 'NOT_STARTED'
}

const normalizeTaskPriority = (priority?: string) => {
  if (!priority) return 'MEDIUM'
  const key = String(priority).toLowerCase()
  return TASK_PRIORITY_MAP[key] || 'MEDIUM'
}

// POST /api/sync - Sync all data from client store to database
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name,
          image: session.user.image
        }
      })
    }

    let data: any
    try {
      data = await request.json()
    } catch (parseError) {
      console.error('Error parsing sync payload:', parseError)
      return NextResponse.json({ error: 'Invalid sync payload' }, { status: 400 })
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Invalid sync payload' }, { status: 400 })
    }

    const courses = Array.isArray(data.courses) ? data.courses : []
    const tasks = Array.isArray(data.tasks) ? data.tasks : []
    const notes = Array.isArray(data.notes) ? data.notes : []
    const studyBlocks = Array.isArray(data.studyBlocks) ? data.studyBlocks : []

    data = { ...data, courses, tasks, notes, studyBlocks }

    // Start a transaction to ensure data consistency
    // Allow longer-running syncs (Canvas imports can batch many tasks)
    const result = await prisma.$transaction(async (tx) => {
      // Sync preferences
      if (data.preferences) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            preferences: data.preferences,
            onboardingCompleted: data.onboardingCompleted || true
          }
        })
      }

      // Sync courses
      if (data.courses && data.courses.length > 0) {
        // Delete courses not in the sync data (but only if they actually exist)
        const courseIds = data.courses.map((c: any) => c.id).filter(Boolean)
        if (courseIds.length > 0) {
          await tx.course.deleteMany({
            where: {
              userId: user.id,
              id: {
                notIn: courseIds
              }
            }
          })
        }

        // Upsert courses
        for (const course of data.courses) {
          const courseData = {
            userId: user.id,
            code: course.code,
            name: course.name,
            instructor: course.instructor,
            description: course.description,
            color: course.color || '#667eea',
            creditHours: course.creditHours,
            semester: course.semester,
            year: course.year,
            schedule: course.schedule,
            progress: course.progress || 0,
            completedModules: course.completedModules || [],
            canvasId: course.canvasId,
            canvasCourseCode: course.canvasCourseCode,
            canvasSyncEnabled: course.canvasSyncEnabled || false,
            lastCanvasSync: course.lastCanvasSync ? new Date(course.lastCanvasSync) : undefined
          }

          if (course.id) {
            // Try updating existing course; if it doesn't exist, create instead
            const updated = await tx.course.updateMany({
              where: { id: course.id, userId: user.id },
              data: courseData
            })
            if (updated.count === 0) {
              const newCourse = await tx.course.create({
                data: { ...courseData, id: course.id }
              })
              course.dbId = newCourse.id
            }
          } else {
            // Create new course
            const newCourse = await tx.course.create({
              data: courseData
            })
            // Map the local ID to the database ID for tasks
            course.dbId = newCourse.id
          }
        }
      }

      // Sync tasks
      if (data.tasks && data.tasks.length > 0) {
        // Delete tasks not in the sync data
        const taskIds = data.tasks.map((t: any) => t.id).filter(Boolean)
        if (taskIds.length > 0) {
          await tx.task.deleteMany({
            where: {
              userId: user.id,
              id: {
                notIn: taskIds
              }
            }
          })
        }

        // Upsert tasks
        for (const task of data.tasks) {
          // Find the course ID (might have been mapped from local to DB)
          const course = data.courses?.find((c: any) =>
            c.id === task.courseId ||
            c.localId === task.courseId ||
            c.canvasCourseId === task.courseId
          )
          const rawCourseId = course?.dbId || course?.id || task.courseId
          const normalizedCourseId = rawCourseId ? String(rawCourseId) : undefined

          if (!normalizedCourseId) {
            console.warn('Skipping task because course reference could not be resolved', {
              taskId: task.id,
              title: task.title,
              courseId: task.courseId
            })
            continue
          }

          // Calculate estimated hours if not provided
          const preferredHours = data.preferences?.defaultHoursPerType?.[task.type]
          let estimatedHours = task.estimatedHours

          // Honor user defaults first
          if ((!estimatedHours || estimatedHours <= 0) && preferredHours) {
            estimatedHours = preferredHours
          }

          // Only auto-estimate when explicitly allowed
          if ((!estimatedHours || estimatedHours <= 0) && data.preferences?.useAutoEstimation !== false) {
            estimatedHours = estimateTaskHours({
              type: task.type || 'assignment',
              title: task.title || '',
              points: task.points || 0,
              userPreferences: data.preferences
            })
            console.log(`📊 Estimated hours for "${task.title}": ${estimatedHours}h (type: ${task.type})`)
          }

          // Guardrail against zero/NaN
          if (!estimatedHours || estimatedHours <= 0) {
            estimatedHours = preferredHours || 1
          }

          const taskData = {
            userId: user.id,
            courseId: normalizedCourseId,
            title: task.title,
            description: task.description,
            type: normalizeTaskType(task.type),
            dueDate: new Date(task.dueDate),
            startDate: task.startDate ? new Date(task.startDate) : undefined,
            completedAt: task.completedAt ? new Date(task.completedAt) : undefined,
            estimatedHours: estimatedHours,
            actualHours: task.actualHours,
            complexity: task.complexity || 3,
            priority: normalizeTaskPriority(task.priority),
            isHardDeadline: task.isHardDeadline ?? true,
            canSplit: task.canSplit ?? true,
            preferredTimes: task.preferredTimes || [],
            bufferDays: task.bufferDays,
            status: normalizeTaskStatus(task.status),
            progress: task.progress || 0,
            canvasId: task.canvasId,
            canvasSubmissionId: task.canvasSubmissionId,
            grade: task.grade,
            feedback: task.feedback,
            autoGenerateNotes: task.autoGenerateNotes || false,
            noteGenerationPrompts: task.noteGenerationPrompts || [],
            studyMaterialsGenerated: task.studyMaterialsGenerated || false
          }

          if (task.id && !task.localId) {
            const updated = await tx.task.updateMany({
              where: { id: task.id, userId: user.id },
              data: taskData
            })
            if (updated.count === 0) {
              await tx.task.create({ data: { ...taskData, id: task.id } })
            }
          } else {
            // Create new task
            await tx.task.create({
              data: taskData
            })
          }
        }
      }

      // Sync study blocks
      if (data.studyBlocks && data.studyBlocks.length > 0) {
        const blockTypeMap: Record<string, string> = {
          review: 'REVIEW',
          study: 'PRACTICE',
          work: 'WRITING',
          reading: 'READING',
          break: 'BREAK'
        }

        // Delete old study blocks
        await tx.studyBlock.deleteMany({
          where: {
            userId: user.id,
            startTime: {
              lt: new Date()
            }
          }
        })

        // Create new study blocks
        for (const block of data.studyBlocks) {
          const course = data.courses?.find((c: any) =>
            c.id === block.courseId || c.localId === block.courseId
          )
          const courseId = course?.dbId || course?.id || block.courseId
          const startTime = new Date(block.startTime)
          const endTime = new Date(block.endTime)

          // Skip malformed or zero-length blocks to avoid Prisma validation errors
          if (!(startTime instanceof Date) || !(endTime instanceof Date) || isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            console.warn('Skipping study block with invalid dates', { block })
            continue
          }
          if (!isAfter(endTime, startTime)) {
            console.warn('Skipping study block with non-positive duration', { startTime, endTime })
            continue
          }

          const duration = Math.max(
            1,
            block.duration ||
              Math.round((endTime.getTime() - startTime.getTime()) / 60000)
          )

          const mappedType = blockTypeMap[String(block.type || '').toLowerCase()] || 'PRACTICE'

          await tx.studyBlock.create({
            data: {
              userId: user.id,
              taskId: block.taskId,
              courseId,
              startTime,
              endTime,
              duration,
              type: mappedType as any,
              title: block.title || 'Study Session',
              description: block.description,
              energyLevel: block.energyLevel || 'MEDIUM',
              canReschedule: block.canReschedule ?? true,
              locked: block.locked || false,
              status: block.status || 'SCHEDULED',
              completionRate: block.completionRate || 0,
              notesCreated: block.notesCreated || [],
              suggestedContent: block.suggestedContent
            }
          })
        }
      }

      // Sync notes
      if (data.notes && data.notes.length > 0) {
        for (const note of data.notes) {
          const course = data.courses?.find((c: any) =>
            c.id === note.courseId || c.localId === note.courseId
          )
          const courseId = course?.dbId || course?.id || note.courseId

          // Check if note with this slug exists
          const existingNote = await tx.note.findUnique({
            where: { slug: note.slug }
          })

          const noteData = {
            userId: user.id,
            courseId,
            moduleId: note.moduleId,
            title: note.title,
            content: note.content,
            markdown: note.markdown || note.content,
            html: note.html,
            summary: note.summary,
            tags: note.tags || [],
            category: note.category || 'OTHER',
            type: note.type || 'COMPREHENSIVE',
            aiGenerated: note.aiGenerated || false,
            generationPrompt: note.generationPrompt,
            style: note.style || 'COMPREHENSIVE',
            starred: note.starred || false,
            archived: note.archived || false,
            reviewCount: note.reviewCount || 0,
            comprehensionScore: note.comprehensionScore,
            relatedNotes: note.relatedNotes || [],
            lastAccessedAt: note.lastAccessedAt ? new Date(note.lastAccessedAt) : undefined
          }

          if (existingNote) {
            await tx.note.update({
              where: { id: existingNote.id },
              data: noteData
            })
          } else {
            // Generate unique slug if needed
            let slug = note.slug || note.title.toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '')

            let counter = 1
            while (await tx.note.findUnique({ where: { slug } })) {
              slug = `${note.slug || note.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${counter}`
              counter++
            }

            await tx.note.create({
              data: {
                ...noteData,
                slug
              }
            })
          }
        }
      }

      return {
        success: true,
        coursesCount: data.courses?.length || 0,
        tasksCount: data.tasks?.length || 0,
        notesCount: data.notes?.length || 0,
        blocksCount: data.studyBlocks?.length || 0
      }
    }, {
      timeout: 60000, // Allow up to 60s to avoid P2028 during large imports
      maxWait: 10000  // Wait up to 10s to acquire a transaction
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error syncing data:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'

    // Common Prisma connectivity issue (e.g., wrong DATABASE_URL or no network)
    if (typeof error?.code === 'string' && error.code === 'P1001') {
      return NextResponse.json(
        { error: 'Database unreachable', details: message, hint: 'Check DATABASE_URL/DIRECT_URL and network access.' },
        { status: 503 }
      )
    }

    return NextResponse.json({ error: 'Sync failed', details: message }, { status: 500 })
  }
}

// GET /api/sync - Load all data from database to client store
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        courses: {
          include: {
            modules: true
          }
        },
        tasks: {
          include: {
            studyBlocks: true
          }
        },
        notes: {
          orderBy: {
            updatedAt: 'desc'
          }
        },
        studyBlocks: {
          where: {
            startTime: {
              gte: new Date()
            }
          },
          orderBy: {
            startTime: 'asc'
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({
        user: null,
        courses: [],
        tasks: [],
        notes: [],
        studyBlocks: [],
        preferences: null
      })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        onboardingCompleted: user.onboardingCompleted
      },
      courses: user.courses,
      tasks: user.tasks,
      notes: user.notes,
      studyBlocks: user.studyBlocks,
      preferences: user.preferences
    })
  } catch (error) {
    console.error('Error loading data:', error)
    return NextResponse.json({ error: 'Failed to load data' }, { status: 500 })
  }
}
