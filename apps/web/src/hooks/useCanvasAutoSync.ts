'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useScheduleStore } from '@/stores/useScheduleStore'

const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000 // 6 hours
const SYNC_STORAGE_KEY = 'canvas-last-sync'
const CANVAS_CREDENTIALS_KEY = 'canvas-credentials'

interface CanvasCredentials {
  url: string
  token: string
  domain: string
}

interface SyncResult {
  success: boolean
  newAssignmentsCount: number
  newAssignmentNames: string[]
  skippedCount: number
}

export function useCanvasAutoSync() {
  const { data: session, status } = useSession()
  const hasSynced = useRef(false)

  const syncCanvasData = useCallback(async (): Promise<SyncResult | null> => {
    // Get stored Canvas credentials
    const credentialsStr = localStorage.getItem(CANVAS_CREDENTIALS_KEY)
    if (!credentialsStr) {
      console.log('🔄 Auto-sync: No Canvas credentials found')
      return null
    }

    let credentials: CanvasCredentials
    try {
      credentials = JSON.parse(credentialsStr)
    } catch {
      console.log('🔄 Auto-sync: Invalid Canvas credentials format')
      return null
    }

    if (!credentials.url || !credentials.token) {
      console.log('🔄 Auto-sync: Incomplete Canvas credentials')
      return null
    }

    // Check last sync time
    const lastSyncStr = localStorage.getItem(SYNC_STORAGE_KEY)
    const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : 0
    const now = Date.now()

    if (now - lastSync < SYNC_INTERVAL_MS) {
      const hoursAgo = Math.round((now - lastSync) / (60 * 60 * 1000))
      console.log(`🔄 Auto-sync: Skipped, last sync was ${hoursAgo}h ago`)
      return null
    }

    console.log('🔄 Auto-sync: Starting Canvas sync...')

    try {
      // Get existing data for duplicate detection
      const { courses, tasks, addTask, addCourse } = useScheduleStore.getState()
      const existingTaskIds = tasks.map(t => t.canvasId || t.id).filter(Boolean)
      const existingCourseIds = courses.map(c => c.canvasId || c.id).filter(Boolean)

      // Fetch courses from Canvas
      const coursesResponse = await fetch('/api/canvas/courses', {
        headers: {
          'x-canvas-url': credentials.url,
          'x-canvas-token': credentials.token
        }
      })

      if (!coursesResponse.ok) {
        console.error('🔄 Auto-sync: Failed to fetch courses')
        return null
      }

      const coursesData = await coursesResponse.json()

      if (!coursesData.courses || coursesData.courses.length === 0) {
        console.log('🔄 Auto-sync: No courses found')
        localStorage.setItem(SYNC_STORAGE_KEY, now.toString())
        return { success: true, newAssignmentsCount: 0, newAssignmentNames: [], skippedCount: 0 }
      }

      // Filter to only sync existing courses (don't add new ones automatically)
      const coursesToSync = coursesData.courses.filter((c: any) => {
        const courseId = c.canvasId?.toString() || c.id?.toString()
        return existingCourseIds.includes(courseId)
      })

      if (coursesToSync.length === 0) {
        console.log('🔄 Auto-sync: No existing courses to sync')
        localStorage.setItem(SYNC_STORAGE_KEY, now.toString())
        return { success: true, newAssignmentsCount: 0, newAssignmentNames: [], skippedCount: 0 }
      }

      // Import new assignments for existing courses
      const importResponse = await fetch('/api/canvas/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courses: coursesToSync,
          canvasUrl: credentials.url,
          canvasToken: credentials.token,
          existingTaskIds,
          existingCourseIds
        })
      })

      if (!importResponse.ok) {
        console.error('🔄 Auto-sync: Failed to import assignments')
        return null
      }

      const importData = await importResponse.json()
      const stats = importData.importStats || { assignmentsImported: 0, assignmentsSkipped: 0, newAssignmentNames: [] }

      // Add new assignments to the store
      if (importData.importedCourses) {
        for (const course of importData.importedCourses) {
          const existingCourse = courses.find(c =>
            c.canvasId === course.canvasId?.toString() ||
            c.id === course.canvasId?.toString()
          )

          if (existingCourse && course.assignments) {
            for (const assignment of course.assignments) {
              if (assignment.isNew && assignment.dueDate) {
                addTask({
                  title: assignment.name,
                  courseId: existingCourse.id,
                  courseName: existingCourse.name,
                  type: assignment.type || 'assignment',
                  dueDate: new Date(assignment.dueDate),
                  estimatedHours: assignment.estimatedHours || 2,
                  complexity: 3,
                  bufferPercentage: 20,
                  canvasId: String(assignment.id)
                })
              }
            }
          }
        }
      }

      // Update last sync time
      localStorage.setItem(SYNC_STORAGE_KEY, now.toString())

      console.log(`🔄 Auto-sync: Complete. ${stats.assignmentsImported} new, ${stats.assignmentsSkipped} skipped`)

      return {
        success: true,
        newAssignmentsCount: stats.assignmentsImported,
        newAssignmentNames: stats.newAssignmentNames || [],
        skippedCount: stats.assignmentsSkipped
      }
    } catch (error) {
      console.error('🔄 Auto-sync: Error', error)
      return null
    }
  }, [])

  useEffect(() => {
    // Only sync once per session, when user is authenticated
    if (status === 'authenticated' && session?.user && !hasSynced.current) {
      hasSynced.current = true

      // Delay sync slightly to let the app load first
      const timeout = setTimeout(() => {
        syncCanvasData().then(result => {
          if (result && result.newAssignmentsCount > 0) {
            // Show notification for new assignments
            console.log(`📬 Found ${result.newAssignmentsCount} new assignments from Canvas`)

            // Trigger schedule regeneration if new tasks were added
            const { generateSmartSchedule } = useScheduleStore.getState()
            generateSmartSchedule()
          }
        })
      }, 3000) // 3 second delay

      return () => clearTimeout(timeout)
    }
  }, [status, session, syncCanvasData])

  return { syncCanvasData }
}
