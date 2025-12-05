export interface CanvasRawCourse {
  id: number | string
  name: string
  course_code?: string
}

const COURSE_CODE_REGEX = /([A-Z]{2,}\s?-?\s?\d{2,}[A-Z]?)/i

export function normalizeCanvasCourse(raw: CanvasRawCourse) {
  const name = raw.name || ''
  const codeFromField = raw.course_code || ''

  // Try course_code first
  let cleanCode = codeFromField.trim()

  // If course_code is missing, attempt to extract from name
  if (!cleanCode) {
    const match = name.match(COURSE_CODE_REGEX)
    if (match) cleanCode = match[1].replace(/\s+/g, '')
  }

  // Remove redundant code text from the name if duplicated
  let cleanName = name
  if (cleanCode) {
    const nameNoCode = name.replace(cleanCode, '').replace(codeFromField, '').trim()
    if (nameNoCode.length > 0) cleanName = nameNoCode
  }

  return {
    cleanCode: cleanCode || raw.id?.toString() || 'COURSE',
    cleanName: cleanName || name || 'Course',
  }
}
