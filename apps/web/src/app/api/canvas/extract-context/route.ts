import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'
import { augmentContextTasks } from '@/lib/contextAugmentor'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const allowMock = process.env.MOCK_EXTRACTION === 'true'

    if (!allowMock && !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      syllabus,
      announcements,
      discussions,
      moduleDescriptions,
      assignmentDescriptions,
      pages,
      additionalContext,
      courseName,
      existingAssignments = [],
      existingEvents = []
    } = body

    // Build context for AI

    let context = `Course: ${courseName}\n\n`

    // List existing assignments so AI knows what NOT to duplicate
    if (existingAssignments?.length > 0) {
      context += `ALREADY IMPORTED ASSIGNMENTS (DO NOT DUPLICATE UNLESS DATE/LOCATION CHANGED):\n`
      existingAssignments.forEach((a: any) => {
        context += `- ${a.name} (Due: ${a.dueDate})\n`
      })
      context += '\n'
    }

    // List existing events (exams/lectures) so AI can flag date/location changes
    if (existingEvents?.length > 0) {
      context += `EXISTING CALENDAR EVENTS (EXAMS/QUIZZES/MEETINGS):\n`
      existingEvents.forEach((e: any) => {
        context += `- ${e.title} (${e.type || 'event'}) start: ${e.startTime} end: ${e.endTime} location: ${e.location || 'n/a'}\n`
      })
      context += '\n'
    }

    // Add all unstructured text sources
    if (syllabus) {
      context += `SYLLABUS:\n${syllabus.substring(0, 10000)}\n\n`
    }

    if (announcements?.length > 0) {
      context += `RECENT ANNOUNCEMENTS:\n`
      announcements.slice(0, 10).forEach((announcement: any) => {
        context += `[${announcement.date}] ${announcement.title}\n${announcement.message}\n\n`
      })
    }

    if (discussions?.length > 0) {
      context += `PROFESSOR DISCUSSION POSTS:\n`
      discussions.slice(0, 10).forEach((post: any) => {
        context += `[${post.date}] ${post.message}\n\n`
      })
    }

    if (moduleDescriptions?.length > 0) {
      context += `MODULE DESCRIPTIONS:\n`
      moduleDescriptions.forEach((module: any) => {
        context += `${module.name}: ${module.description}\n`
      })
    }

    if (assignmentDescriptions?.length > 0) {
      context += `ASSIGNMENT DETAILED DESCRIPTIONS:\n`
      assignmentDescriptions.forEach((desc: any) => {
        context += `[${desc.name}]: ${desc.description}\n\n`
      })
    }

    if (pages?.length > 0) {
      context += `COURSE PAGES:\n`
      pages.slice(0, 15).forEach((page: any) => {
        context += `[${page.title}]: ${page.body}\n\n`
      })
    }

    if (additionalContext) {
      context += `USER PROVIDED CONTEXT:\n${additionalContext}\n\n`
    }

    const prompt = `You are an expert at finding hidden assignments, date/location changes, and recurring requirements that professors mention informally.

${context}

Extract ANY tasks, deadlines, or requirements mentioned, and also detect updates to existing assignments/exams. Look for:

1. Recurring tasks mentioned in syllabus (e.g., "Weekly reflections due Fridays", "Lab notebooks checked monthly")
2. Assignments mentioned only in announcements (e.g., "Don't forget to submit your reading response by Tuesday")
3. Hidden requirements in assignment descriptions (e.g., "Also submit a peer review" mentioned in an essay assignment)
4. Informal deadlines (e.g., "I expect you to have read Chapter 5 by next week")
5. Participation requirements (e.g., "Post to discussion board twice weekly")
6. Pre-work or prep mentioned casually (e.g., "Make sure to review the slides before class")
7. Date or location changes for existing assignments/exams (e.g., "Exam moved to Dec 12 at 3pm", "Now in Room 101")

Return JSON EXACTLY in this shape (no extra fields):
{
  "extractedTasks": [
    {
      "action": "add" | "update",
      "title": "Task name",
      "type": "assignment|reading|discussion|participation|review|preparation|exam|project|quiz",
      "dueDate": "ISO string or null",
      "location": "string or null",
      "recurring": true/false,
      "recurringPattern": "weekly|biweekly|monthly|null",
      "recurringDay": "Monday|Tuesday|...|null",
      "description": "What needs to be done",
      "source": "syllabus|announcement|page|discussion|user-context|assignment-detail",
      "confidence": "high|medium|low",
      "estimatedHours": number
    }
  ],
  "examUpdates": [
    {
      "title": "Exam name (match existing if possible)",
      "startTime": "ISO string",
      "endTime": "ISO string",
      "location": "string or null",
      "note": "what changed"
    }
  ],
  "hiddenPatterns": [
    {
      "pattern": "Description of recurring requirement",
      "frequency": "How often",
      "importance": "high|medium|low"
    }
  ],
  "warnings": [
    "Any important notes about workload or hidden expectations"
  ]
}

Rules:
- If you see a date/location change for an existing assignment/exam, emit an "update" task or an item in "examUpdates".
- Do NOT duplicate existing assignments unless date/location changes.
- Use ISO 8601 with timezone offsets intact from the source text.`

    let parsed: any = {}

    // If mocking, skip OpenAI and return empty extracted tasks (augmentations will still run)
    if (allowMock || !openai) {
      parsed = { extractedTasks: [], examUpdates: [], hiddenPatterns: [], warnings: [] }
    } else {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at finding hidden academic requirements and informal deadlines that professors mention but don’t formalize in Canvas. Respond ONLY with valid JSON matching the requested schema.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.2,
        response_format: { type: "json_object" }
      })

      const rawContent = completion.choices[0]?.message?.content || '{}'
      try {
        parsed = JSON.parse(rawContent)
      } catch (e) {
        parsed = {}
      }
    }

    // Validate and sanitize fields
    const coerceString = (v: any) => (typeof v === 'string' ? v : v ? String(v) : '')
    const coerceIso = (v: any) => {
      if (!v) return null
      const d = new Date(v)
      return isNaN(d.getTime()) ? null : d.toISOString()
    }
    const coerceBoolean = (v: any) => Boolean(v)
    const coerceNumber = (v: any, fallback = 0) => {
      const n = Number(v)
      return isNaN(n) ? fallback : n
    }

    const extractedTasks = Array.isArray(parsed.extractedTasks) ? parsed.extractedTasks.map((t: any) => ({
      action: t.action === 'update' ? 'update' : 'add',
      title: coerceString(t.title),
      type: coerceString(t.type),
      dueDate: coerceIso(t.dueDate),
      location: coerceString(t.location) || null,
      recurring: coerceBoolean(t.recurring),
      recurringPattern: coerceString(t.recurringPattern) || null,
      recurringDay: coerceString(t.recurringDay) || null,
      description: coerceString(t.description),
      source: coerceString(t.source),
      confidence: (['high','medium','low'].includes(coerceString(t.confidence)) ? coerceString(t.confidence) : 'medium'),
      estimatedHours: coerceNumber(t.estimatedHours, 2)
    })) : []

    const examUpdates = Array.isArray(parsed.examUpdates) ? parsed.examUpdates.map((e: any) => ({
      title: coerceString(e.title),
      startTime: coerceIso(e.startTime),
      endTime: coerceIso(e.endTime),
      location: coerceString(e.location) || null,
      note: coerceString(e.note)
    })) : []

    // Process recurring tasks into individual instances
    const processedTasks = []
    const today = new Date()

    for (const task of extractedTasks) {
      if (task.recurring && task.recurringPattern) {
        const instances = generateRecurringInstances(task, today, 12)
        processedTasks.push(...instances)
      } else {
        processedTasks.push(task)
      }
    }

    // Augment with deterministic suggestions (video durations, chapter splits) without overwriting anything
    const augmentationSourceText = [
      syllabus,
      additionalContext,
      moduleDescriptions?.map((m: any) => `${m.name}: ${m.description}`).join('\n'),
      assignmentDescriptions?.map((a: any) => `${a.name}: ${a.description}`).join('\n'),
      pages?.map((p: any) => `${p.title}: ${p.body || p.content || ''}`).join('\n'),
    ].filter(Boolean).join('\n')

    const augmentations = augmentContextTasks(augmentationSourceText)

    return NextResponse.json({
      success: true,
      extracted: {
        tasks: processedTasks,
        patterns: parsed.hiddenPatterns || [],
        warnings: parsed.warnings || [],
        examUpdates,
        suggestions: augmentations.suggestions || []
      },
      summary: `Found ${processedTasks.length} tasks and ${examUpdates.length} exam updates; ${augmentations.suggestions?.length || 0} additional suggestions`
    })

  } catch (error) {
    console.error('Context extraction error:', error)
    return NextResponse.json(
      { error: 'Failed to extract context' },
      { status: 500 }
    )
  }
}

function generateRecurringInstances(task: any, startDate: Date, weeks: number) {
  const instances = []
  const dayMap: { [key: string]: number } = {
    'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4,
    'Friday': 5, 'Saturday': 6, 'Sunday': 0
  }

  for (let week = 0; week < weeks; week++) {
    const dueDate = new Date(startDate)

    if (task.recurringPattern === 'weekly') {
      dueDate.setDate(startDate.getDate() + (week * 7))

      if (task.recurringDay) {
        const targetDay = dayMap[task.recurringDay]
        const currentDay = dueDate.getDay()
        const daysToAdd = (targetDay - currentDay + 7) % 7
        dueDate.setDate(dueDate.getDate() + daysToAdd)
      }
    } else if (task.recurringPattern === 'biweekly') {
      dueDate.setDate(startDate.getDate() + (week * 14))
    } else if (task.recurringPattern === 'monthly') {
      dueDate.setMonth(startDate.getMonth() + week)
    }

    instances.push({
      ...task,
      title: `${task.title} (Week ${week + 1})`,
      dueDate: dueDate.toISOString(),
      recurring: false,
      isGenerated: true,
      originalPattern: task.recurringPattern
    })
  }

  return instances
}
