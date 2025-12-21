'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useScheduleStore } from '@/stores/useScheduleStore'
import { useAcademicTermStore } from '@/stores/academicTermStore'
import { addDays, isAfter, differenceInDays } from 'date-fns'

const ARCHIVE_DELAY_DAYS = 10 // Archive courses 10 days after semester ends
const ARCHIVE_CHECK_KEY = 'semester-archive-check'
const ARCHIVE_DISMISSED_KEY = 'semester-archive-dismissed'

interface ArchiveStatus {
  shouldPrompt: boolean
  daysAfterEnd: number
  termName: string
  courseCount: number
}

export function useAutoArchive() {
  const hasChecked = useRef(false)
  const [archiveStatus, setArchiveStatus] = useState<ArchiveStatus | null>(null)
  const [showArchivePrompt, setShowArchivePrompt] = useState(false)

  const checkForArchive = useCallback(() => {
    const { currentTerm } = useAcademicTermStore.getState()
    const { courses, removeHistoricalCourses } = useScheduleStore.getState()

    if (!currentTerm || courses.length === 0) {
      console.log('📦 Auto-archive: No term or courses found')
      return null
    }

    const now = new Date()
    const termEnd = currentTerm.endDate instanceof Date
      ? currentTerm.endDate
      : new Date(currentTerm.endDate)

    const archiveDate = addDays(termEnd, ARCHIVE_DELAY_DAYS)

    // Check if we're past the archive date
    if (!isAfter(now, archiveDate)) {
      const daysUntilArchive = differenceInDays(archiveDate, now)
      console.log(`📦 Auto-archive: ${daysUntilArchive} days until archive prompt`)
      return null
    }

    // Check if user already dismissed this term's prompt
    const dismissedKey = `${ARCHIVE_DISMISSED_KEY}-${currentTerm.name}`
    if (localStorage.getItem(dismissedKey)) {
      console.log('📦 Auto-archive: User dismissed prompt for this term')
      return null
    }

    const daysAfterEnd = differenceInDays(now, termEnd)

    // Count courses that would be archived
    const coursesToArchive = courses.filter(course => {
      // Check if course has an end date that's in the past
      const courseEnd = course.endDate
        ? (course.endDate instanceof Date ? course.endDate : new Date(course.endDate))
        : termEnd
      return isAfter(now, addDays(courseEnd, ARCHIVE_DELAY_DAYS))
    })

    if (coursesToArchive.length === 0) {
      console.log('📦 Auto-archive: No courses to archive')
      return null
    }

    const status: ArchiveStatus = {
      shouldPrompt: true,
      daysAfterEnd,
      termName: currentTerm.name,
      courseCount: coursesToArchive.length
    }

    console.log(`📦 Auto-archive: ${status.courseCount} courses ready for archive (${daysAfterEnd} days after semester end)`)
    return status
  }, [])

  const performArchive = useCallback(() => {
    const { removeHistoricalCourses } = useScheduleStore.getState()
    const cutoffDate = addDays(new Date(), -ARCHIVE_DELAY_DAYS)

    console.log('📦 Auto-archive: Performing archive...')
    removeHistoricalCourses(cutoffDate)

    setShowArchivePrompt(false)
    setArchiveStatus(null)

    // Mark as archived
    localStorage.setItem(ARCHIVE_CHECK_KEY, new Date().toISOString())
  }, [])

  const dismissArchive = useCallback(() => {
    const { currentTerm } = useAcademicTermStore.getState()
    if (currentTerm) {
      const dismissedKey = `${ARCHIVE_DISMISSED_KEY}-${currentTerm.name}`
      localStorage.setItem(dismissedKey, new Date().toISOString())
    }
    setShowArchivePrompt(false)
    setArchiveStatus(null)
  }, [])

  useEffect(() => {
    if (hasChecked.current) return
    hasChecked.current = true

    // Delay check to let app load
    const timeout = setTimeout(() => {
      const status = checkForArchive()
      if (status) {
        setArchiveStatus(status)
        setShowArchivePrompt(true)
      }
    }, 5000) // 5 second delay

    return () => clearTimeout(timeout)
  }, [checkForArchive])

  return {
    archiveStatus,
    showArchivePrompt,
    performArchive,
    dismissArchive
  }
}
