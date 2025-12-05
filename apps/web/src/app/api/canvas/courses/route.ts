import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getCanvasToken } from '@/lib/canvas-token'
import { estimateTaskHours, determineAssignmentType } from '@/lib/taskHours'
import { normalizeCanvasCourse } from '@/lib/canvas/normalizeCourse'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get Canvas credentials from request headers (backwards compatible) or database
    let canvasUrl = request.headers.get('x-canvas-url')
    let canvasToken = request.headers.get('x-canvas-token')

    // If not in headers, try to fetch from database
    if (!canvasUrl || !canvasToken) {
      const tokenData = await getCanvasToken(session.user.email)
      if (tokenData) {
        canvasToken = tokenData.token
        canvasUrl = `https://${tokenData.domain}`
        console.log('✅ Retrieved Canvas token from database')
      }
    }

    if (!canvasUrl || !canvasToken) {
      return NextResponse.json(
        { error: 'Canvas credentials not found. Please connect your Canvas account.' },
        { status: 400 }
      )
    }

    // Fetch courses from Canvas
    const coursesUrl = `${canvasUrl}/api/v1/courses?enrollment_state=active&include[]=term&include[]=teachers`
    const response = await fetch(coursesUrl, {
      headers: {
        'Authorization': `Bearer ${canvasToken}`,
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch courses from Canvas' },
        { status: 400 }
      )
    }

    const canvasCourses = await response.json()

    // Transform Canvas courses to our format
    const courses = canvasCourses.map((course: any) => {
      const { cleanCode, cleanName } = normalizeCanvasCourse({
        id: course.id,
        name: course.name,
        course_code: course.course_code
      })
      return {
        id: course.id,  // This will be used as the key in the UI
        name: cleanName,
        code: cleanCode,
        term: course.term?.name || 'Current Term',
        startDate: course.start_at,
        endDate: course.end_at,
        instructor: course.teachers?.[0]?.display_name || 'TBA',
        canvasId: course.id,  // Store Canvas ID for API calls
        enrollmentType: course.enrollments?.[0]?.type || 'student'
      }
    })

    console.log(`📚 Returning ${courses.length} courses from Canvas`)

    return NextResponse.json({ courses })

  } catch (error) {
    console.error('Canvas courses fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { courses, canvasUrl, canvasToken } = body

    console.log('🔍 API: Received courses to import:', {
      count: courses?.length,
      courses: courses?.map((c: any) => ({ id: c.id, canvasId: c.canvasId, name: c.name }))
    })

    if (!courses || courses.length === 0) {
      return NextResponse.json({
        importedCourses: [],
        message: 'No courses to import'
      })
    }

    // Import courses and fetch additional details
    const importedCourses = []

    for (const course of courses) {
      try {
        const courseId = course.canvasId || course.id
        console.log(`📚 API: Processing course ${course.name} (ID: ${courseId})`)

        // Fetch assignments for each course (fetch up to 100 per page)
        const assignmentsUrl = `${canvasUrl}/api/v1/courses/${courseId}/assignments?per_page=100`
        const assignmentsResponse = await fetch(assignmentsUrl, {
          headers: {
            'Authorization': `Bearer ${canvasToken}`,
            'Accept': 'application/json'
          }
        })

        const sanitizeDescription = (value?: string) => {
          if (!value) return ''
          const withoutDangerous = value
            .replace(/<\s*(script|style|link)[^>]*>.*?<\/\s*\1\s*>/gis, '')
            .replace(/<\s*link[^>]*>/gi, '')
          const text = withoutDangerous.replace(/<[^>]+>/g, ' ')
          return text.replace(/\s+/g, ' ').trim()
        }

        let assignments = []
        if (assignmentsResponse.ok) {
          const canvasAssignments = await assignmentsResponse.json()
          assignments = canvasAssignments.map((assignment: any) => {
          // Normalize title for keyword-based type adjustments
          const title = assignment.name || ''
          const titleLower = title.toLowerCase()

          // Conservative type mapping: only tag as exam if explicitly named
          const hasExamWord =
            titleLower.includes('exam') ||
            titleLower.includes('midterm') ||
            titleLower.includes('final exam') ||
            titleLower.includes('hesi') ||
            titleLower.includes('quiz')

          // One-minute nurse and short video case studies -> video
          const isOneMinuteNurse = titleLower.includes('one-minute nurse') || titleLower.includes('one minute nurse')
          const isVideoCaseStudy = titleLower.includes('video case study') || titleLower.includes('video:')

          let taskType = determineAssignmentType(assignment)

          if (isOneMinuteNurse || isVideoCaseStudy) {
            taskType = 'video'
          } else if (!hasExamWord && taskType === 'exam') {
            // Demote to assignment if Canvas guessed exam but title lacks exam markers
            taskType = 'assignment'
          }

            return {
              id: assignment.id,
              name: assignment.name,
              dueDate: assignment.due_at,
              points: assignment.points_possible,
              description: sanitizeDescription(assignment.description),
              descriptionHtml: assignment.description,
              submissionTypes: assignment.submission_types,
              type: taskType,
              // Leave hours unspecified so user/onboarding defaults can take over
              estimatedHours: 0
            }
          })
        }

        // Fetch syllabus if available
        const syllabusUrl = `${canvasUrl}/api/v1/courses/${courseId}?include[]=syllabus_body`
        const syllabusResponse = await fetch(syllabusUrl, {
          headers: {
            'Authorization': `Bearer ${canvasToken}`,
            'Accept': 'application/json'
          }
        })

        let syllabus = null
        if (syllabusResponse.ok) {
          const courseDetails = await syllabusResponse.json()
          syllabus = courseDetails.syllabus_body
        }

        // Fetch calendar events for the course
        const eventsUrl = `${canvasUrl}/api/v1/calendar_events?context_codes[]=course_${courseId}&per_page=100`
        const eventsResponse = await fetch(eventsUrl, {
          headers: {
            'Authorization': `Bearer ${canvasToken}`,
            'Accept': 'application/json'
          }
        })

        let calendarEvents = []
        if (eventsResponse.ok) {
          const canvasEvents = await eventsResponse.json()
          calendarEvents = canvasEvents.map((event: any) => ({
            id: event.id,
            title: event.title,
            startAt: event.start_at,
            endAt: event.end_at,
            description: event.description,
            location: event.location_name,
            type: event.type,
            allDay: event.all_day
          }))
        }

        // Fetch course files to look for schedule documents
        const filesUrl = `${canvasUrl}/api/v1/courses/${courseId}/files?search_term=schedule&search_term=calendar&search_term=syllabus`
        const filesResponse = await fetch(filesUrl, {
          headers: {
            'Authorization': `Bearer ${canvasToken}`,
            'Accept': 'application/json'
          }
        })

        let courseFiles = []
        if (filesResponse.ok) {
          const canvasFiles = await filesResponse.json()
          courseFiles = canvasFiles.map((file: any) => ({
            id: file.id,
            filename: file.filename,
            url: file.url,
            size: file.size,
            contentType: file.content_type,
            createdAt: file.created_at
          }))
        }

        // Fetch course modules/pages that might contain schedule info
        const modulesUrl = `${canvasUrl}/api/v1/courses/${courseId}/modules?include[]=items`
        const modulesResponse = await fetch(modulesUrl, {
          headers: {
            'Authorization': `Bearer ${canvasToken}`,
            'Accept': 'application/json'
          }
        })

        let modules = []
        if (modulesResponse.ok) {
          const canvasModules = await modulesResponse.json()
          modules = canvasModules.map((module: any) => ({
            id: module.id,
            name: module.name,
            position: module.position,
            items: module.items?.map((item: any) => ({
              title: item.title,
              type: item.type,
              contentId: item.content_id
            }))
          }))
        }

        // Fetch course pages (e.g., Start Here, Course Outline, Calendar)
        const pagesUrl = `${canvasUrl}/api/v1/courses/${courseId}/pages?per_page=50&include[]=body`
        const pagesResponse = await fetch(pagesUrl, {
          headers: {
            'Authorization': `Bearer ${canvasToken}`,
            'Accept': 'application/json'
          }
        })

        let pages = []
        if (pagesResponse.ok) {
          const canvasPages = await pagesResponse.json()
          pages = canvasPages.map((page: any) => ({
            id: page.page_id || page.id,
            url: page.html_url,
            title: page.title,
            body: page.body,
            updatedAt: page.updated_at,
            createdAt: page.created_at
          }))
        }

        // Fetch announcements for context extraction
        const announcementsUrl = `${canvasUrl}/api/v1/courses/${courseId}/discussion_topics?only_announcements=true&per_page=20`
        const announcementsResponse = await fetch(announcementsUrl, {
          headers: {
            'Authorization': `Bearer ${canvasToken}`,
            'Accept': 'application/json'
          }
        })

        let announcements = []
        if (announcementsResponse.ok) {
          const canvasAnnouncements = await announcementsResponse.json()
          announcements = canvasAnnouncements.map((announcement: any) => ({
            id: announcement.id,
            title: announcement.title,
            message: announcement.message,
            postedAt: announcement.posted_at,
            author: announcement.author?.display_name
          }))
        }

        // Fetch discussion topics for context extraction
        const discussionsUrl = `${canvasUrl}/api/v1/courses/${courseId}/discussion_topics?per_page=20`
        const discussionsResponse = await fetch(discussionsUrl, {
          headers: {
            'Authorization': `Bearer ${canvasToken}`,
            'Accept': 'application/json'
          }
        })

        let discussions = []
        if (discussionsResponse.ok) {
          const canvasDiscussions = await discussionsResponse.json()
          discussions = canvasDiscussions
            .filter((topic: any) => !topic.is_announcement) // Exclude announcements
            .map((topic: any) => ({
              id: topic.id,
              title: topic.title,
              message: topic.message,
              postedAt: topic.posted_at,
              author: topic.author?.display_name
            }))
        }

        const importedCourse = {
          ...course,
          id: courseId,
          canvasId: courseId,
          assignments,
          syllabus,
          calendarEvents,
          courseFiles,
          modules,
          pages,
          announcements,
          discussions,
          imported: true
        }

        console.log(`✅ API: Successfully imported ${course.name} with ${assignments.length} assignments`)
        importedCourses.push(importedCourse)

      } catch (error) {
        console.error(`Failed to import details for course ${course.id}:`, error)
        importedCourses.push({
          ...course,
          assignments: [],
          syllabus: null,
          pages: [],
          imported: false,
          error: 'Failed to import some course details'
        })
      }
    }

    console.log(`🎯 API: Import complete. Returning ${importedCourses.length} courses`)

    // Store imported courses in database
    // For now, return the imported data

    return NextResponse.json({
      success: true,
      importedCourses,
      message: `Successfully imported ${importedCourses.filter(c => c.imported).length} courses`
    })

  } catch (error) {
    console.error('Canvas import error:', error)
    return NextResponse.json(
      { error: 'Failed to import courses' },
      { status: 500 }
    )
  }
}
