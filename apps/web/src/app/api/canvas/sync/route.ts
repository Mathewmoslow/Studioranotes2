import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { courseId, canvasId, canvasUrl, canvasToken } = await request.json()

    if (!courseId || !canvasId || !canvasUrl || !canvasToken) {
      return NextResponse.json({ error: 'Missing Canvas credentials or courseId' }, { status: 400 })
    }

    // Fetch latest announcements
    const announcementsUrl = `${canvasUrl}/api/v1/courses/${canvasId}/discussion_topics?only_announcements=true&per_page=20`
    const announcementsResponse = await fetch(announcementsUrl, {
      headers: {
        'Authorization': `Bearer ${canvasToken}`,
        'Accept': 'application/json'
      }
    })

    let announcements = []
    if (!announcementsResponse.ok) {
      const msg = `Announcements fetch failed: ${announcementsResponse.status} ${announcementsResponse.statusText}`
      console.error(msg)
      return NextResponse.json({ error: msg }, { status: 500 })
    }
    const canvasAnnouncements = await announcementsResponse.json()
    announcements = canvasAnnouncements.map((announcement: any) => ({
      id: announcement.id,
      title: announcement.title,
      message: announcement.message,
      postedAt: announcement.posted_at,
      author: announcement.user_name,
      unread: announcement.unread_count > 0
    }))

    // Fetch new assignments
    const assignmentsUrl = `${canvasUrl}/api/v1/courses/${canvasId}/assignments?per_page=50`
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

    if (!assignmentsResponse.ok) {
      const msg = `Assignments fetch failed: ${assignmentsResponse.status} ${assignmentsResponse.statusText}`
      console.error(msg)
      return NextResponse.json({ error: msg }, { status: 500 })
    }
    const canvasAssignments = await assignmentsResponse.json()

    // Get stored last sync timestamp from localStorage or database
    const lastSync = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Default to 1 week ago

    const newAssignments = canvasAssignments
      .filter((a: any) => new Date(a.created_at) > lastSync || new Date(a.updated_at) > lastSync)
      .map((assignment: any) => ({
        id: assignment.id,
        name: assignment.name,
        dueDate: assignment.due_at,
        points: assignment.points_possible,
        description: sanitizeDescription(assignment.description),
        descriptionHtml: assignment.description,
        submissionTypes: assignment.submission_types,
        isNew: new Date(assignment.created_at) > lastSync,
        wasUpdated: new Date(assignment.updated_at) > lastSync && new Date(assignment.created_at) <= lastSync
      }))

    // Fetch latest calendar events
    const eventsUrl = `${canvasUrl}/api/v1/calendar_events?context_codes[]=course_${canvasId}&start_date=${new Date().toISOString()}&per_page=50`
    const eventsResponse = await fetch(eventsUrl, {
      headers: {
        'Authorization': `Bearer ${canvasToken}`,
        'Accept': 'application/json'
      }
    })

    if (!eventsResponse.ok) {
      const msg = `Events fetch failed: ${eventsResponse.status} ${eventsResponse.statusText}`
      console.error(msg)
      return NextResponse.json({ error: msg }, { status: 500 })
    }
    const canvasEvents = await eventsResponse.json()
    const upcomingEvents = canvasEvents.map((event: any) => ({
      id: event.id,
      title: event.title,
      startAt: event.start_at,
      endAt: event.end_at,
      description: event.description,
      type: event.type
    }))

    // Detect changes and new items
    const changes = {
      newAssignments: newAssignments.filter((a: any) => a.isNew),
      updatedAssignments: newAssignments.filter((a: any) => a.wasUpdated),
      recentAnnouncements: announcements.slice(0, 5),
      upcomingEvents: upcomingEvents.slice(0, 10)
    }

    return NextResponse.json({
      success: true,
      courseId,
      lastSync: new Date().toISOString(),
      changes,
      summary: {
        newAssignmentsCount: changes.newAssignments.length,
        updatedAssignmentsCount: changes.updatedAssignments.length,
        announcementsCount: announcements.length,
        eventsCount: upcomingEvents.length
      }
    })

  } catch (error) {
    console.error('Canvas sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync with Canvas' },
      { status: 500 }
    )
  }
}
