import { Course } from '@studioranotes/types'
import { addWeeks, differenceInDays } from 'date-fns'

const FALLBACK_SEMESTER_WEEKS = 16
const MINIMUM_HORIZON_DAYS = 21

const toDate = (value?: Date | string | null): Date | null => {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  return isNaN(parsed.getTime()) ? null : parsed
}

export const getSemesterEndDate = (courses: Course[]): Date => {
  const now = new Date()
  const endDates = courses
    .map(course => course.endDate || course.canvasData?.endDate)
    .map(toDate)
    .filter(Boolean) as Date[]

  if (endDates.length === 0) {
    return addWeeks(now, FALLBACK_SEMESTER_WEEKS)
  }

  const latest = new Date(Math.max(...endDates.map(date => date.getTime())))
  return latest > now ? latest : addWeeks(now, FALLBACK_SEMESTER_WEEKS)
}

export const getSemesterLengthDays = (courses: Course[]): number => {
  const now = new Date()
  const endDate = getSemesterEndDate(courses)
  const days = differenceInDays(endDate, now)
  return Math.max(days, MINIMUM_HORIZON_DAYS)
}
