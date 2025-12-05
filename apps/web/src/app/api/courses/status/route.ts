import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/courses/status - Update course status
// Body: { courseId: string, status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'UPCOMING' }
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { courseId, status } = await request.json()

    if (!courseId || !status) {
      return NextResponse.json(
        { error: 'Course ID and status are required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['ACTIVE', 'COMPLETED', 'ARCHIVED', 'UPCOMING']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify ownership
    const existingCourse = await prisma.course.findFirst({
      where: {
        id: courseId,
        userId: user.id
      }
    })

    if (!existingCourse) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Update status
    const course = await prisma.course.update({
      where: { id: courseId },
      data: { status },
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
            dueDate: true
          }
        },
        modules: {
          select: {
            id: true,
            completed: true
          }
        }
      }
    })

    return NextResponse.json(course)
  } catch (error) {
    console.error('Error updating course status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/courses/status/bulk - Update multiple course statuses
// Body: { updates: Array<{ courseId: string, status: string }> }
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { updates } = await request.json()

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Updates array is required' },
        { status: 400 }
      )
    }

    // Validate all updates
    const validStatuses = ['ACTIVE', 'COMPLETED', 'ARCHIVED', 'UPCOMING']
    for (const update of updates) {
      if (!update.courseId || !update.status) {
        return NextResponse.json(
          { error: 'Each update must have courseId and status' },
          { status: 400 }
        )
      }
      if (!validStatuses.includes(update.status)) {
        return NextResponse.json(
          { error: `Invalid status: ${update.status}` },
          { status: 400 }
        )
      }
    }

    // Verify ownership of all courses
    const courseIds = updates.map(u => u.courseId)
    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
        userId: user.id
      }
    })

    if (courses.length !== courseIds.length) {
      return NextResponse.json(
        { error: 'One or more courses not found' },
        { status: 404 }
      )
    }

    // Update all courses
    const updatePromises = updates.map(update =>
      prisma.course.update({
        where: { id: update.courseId },
        data: { status: update.status }
      })
    )

    await Promise.all(updatePromises)

    // Fetch updated courses
    const updatedCourses = await prisma.course.findMany({
      where: {
        id: { in: courseIds },
        userId: user.id
      },
      include: {
        tasks: {
          select: {
            id: true,
            status: true,
            dueDate: true
          }
        },
        modules: {
          select: {
            id: true,
            completed: true
          }
        }
      }
    })

    return NextResponse.json({ courses: updatedCourses, updated: updates.length })
  } catch (error) {
    console.error('Error bulk updating course statuses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
