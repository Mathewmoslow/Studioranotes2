/**
 * iCal Export Utility
 * Generates .ics files for calendar import
 */

import { format } from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  location?: string
  type?: string
  courseId?: string
  courseName?: string
}

interface CalendarTask {
  id: string
  title: string
  description?: string
  dueDate: Date
  courseName?: string
  type?: string
}

/**
 * Format date to iCal format (YYYYMMDDTHHMMSSZ)
 */
function formatICalDate(date: Date): string {
  return format(date, "yyyyMMdd'T'HHmmss'Z'")
}

/**
 * Escape special characters in iCal text
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}

/**
 * Generate a unique iCal UID
 */
function generateUID(id: string): string {
  return `${id}@studiora.io`
}

/**
 * Format a single event for iCal
 */
function formatEvent(event: CalendarEvent): string {
  const lines: string[] = [
    'BEGIN:VEVENT',
    `UID:${generateUID(event.id)}`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART:${formatICalDate(event.startTime)}`,
    `DTEND:${formatICalDate(event.endTime)}`,
    `SUMMARY:${escapeICalText(event.title)}`,
  ]

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICalText(event.description)}`)
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICalText(event.location)}`)
  }

  if (event.courseName) {
    lines.push(`CATEGORIES:${escapeICalText(event.courseName)}`)
  }

  // Add color based on event type
  const colorMap: Record<string, string> = {
    lecture: '1', // Blue
    exam: '11', // Red
    quiz: '6', // Orange
    lab: '10', // Green
    clinical: '2', // Cyan
  }
  if (event.type && colorMap[event.type]) {
    lines.push(`X-APPLE-CALENDAR-COLOR:${colorMap[event.type]}`)
  }

  lines.push('END:VEVENT')
  return lines.join('\r\n')
}

/**
 * Format a task deadline as an all-day event
 */
function formatTaskDeadline(task: CalendarTask): string {
  const dueDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate)
  const dateOnly = format(dueDate, 'yyyyMMdd')

  const lines: string[] = [
    'BEGIN:VEVENT',
    `UID:${generateUID(`task-${task.id}`)}`,
    `DTSTAMP:${formatICalDate(new Date())}`,
    `DTSTART;VALUE=DATE:${dateOnly}`,
    `DTEND;VALUE=DATE:${dateOnly}`,
    `SUMMARY:DUE: ${escapeICalText(task.title)}`,
  ]

  const description = [
    task.courseName ? `Course: ${task.courseName}` : '',
    task.type ? `Type: ${task.type}` : '',
    task.description || '',
  ].filter(Boolean).join('\\n')

  if (description) {
    lines.push(`DESCRIPTION:${escapeICalText(description)}`)
  }

  // Mark as deadline with red color
  lines.push('X-APPLE-CALENDAR-COLOR:11')
  lines.push('END:VEVENT')

  return lines.join('\r\n')
}

/**
 * Generate complete iCal file content
 */
export function generateICalFile(
  events: CalendarEvent[],
  tasks: CalendarTask[],
  calendarName: string = 'Studiora Schedule'
): string {
  const header = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Studiora//Schedule Export//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
  ].join('\r\n')

  const eventContent = events.map(formatEvent).join('\r\n')
  const taskContent = tasks.map(formatTaskDeadline).join('\r\n')

  const footer = 'END:VCALENDAR'

  return [header, eventContent, taskContent, footer].filter(Boolean).join('\r\n')
}

/**
 * Download iCal file
 */
export function downloadICalFile(
  events: CalendarEvent[],
  tasks: CalendarTask[],
  filename: string = 'studiora-schedule.ics'
): void {
  const content = generateICalFile(events, tasks)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Convert store events to iCal format
 */
export function convertEventsForExport(events: any[]): CalendarEvent[] {
  return events
    .filter(e => e.startTime && e.endTime)
    .map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: event.startTime instanceof Date ? event.startTime : new Date(event.startTime),
      endTime: event.endTime instanceof Date ? event.endTime : new Date(event.endTime),
      location: event.location,
      type: event.type,
      courseId: event.courseId,
      courseName: event.courseName,
    }))
}

/**
 * Convert store tasks to iCal format
 */
export function convertTasksForExport(tasks: any[]): CalendarTask[] {
  return tasks
    .filter(t => t.dueDate && t.status !== 'completed')
    .map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate),
      courseName: task.courseName,
      type: task.type,
    }))
}
