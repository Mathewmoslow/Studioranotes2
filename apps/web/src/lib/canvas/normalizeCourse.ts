export interface CanvasRawCourse {
  id: number | string
  name: string
  course_code?: string
}

const COURSE_CODE_REGEX = /([A-Z]{2,}[A-Z]?\s?-?\s?\d{2,3}[A-Z]?)/i

const TERM_TOKENS = [
  'fall', 'spring', 'summer', 'winter', 'autumn', 'session', 'term', 'semester', 'trimester',
  'a', 'b', 'c', 'd', 'q1', 'q2', 'q3', 'q4'
]

const JUNK_TOKENS = [
  'online', 'hybrid', 'lecture', 'class', 'sec', 'section', 'lec', 'lab', 'tutorial', 'discussion',
  'distance', 'asynchronous', 'synchronous', 'campus'
]

const YEAR_REGEX = /(20\d{2}|\d{4}|\d{6})/

export function normalizeCanvasCourse(raw: CanvasRawCourse) {
  const name = raw.name || ''
  const codeFromField = raw.course_code || ''

  const cleaned = (value: string) => value.replace(/\s+/g, ' ').trim()

  // Try course_code first
  let cleanCode = cleaned(codeFromField)

  // If course_code is missing, attempt to extract from name
  if (!cleanCode) {
    const match = name.match(COURSE_CODE_REGEX)
    if (match) cleanCode = match[1].replace(/\s+/g, '').toUpperCase()
  }

  // Remove redundant code text from the name if duplicated
  const tokens = cleaned(name)
    .replace(/[()|[\]_]/g, ' ')
    .split(/[\s/:-]+/)
    .filter(Boolean)
    .filter(token => {
      const lower = token.toLowerCase()
      if (YEAR_REGEX.test(token)) return false
      if (TERM_TOKENS.includes(lower)) return false
      if (JUNK_TOKENS.includes(lower)) return false
      return true
    })

  // Remove code fragments from tokens
  const filteredTokens = cleanCode
    ? tokens.filter(tok => !tok.toUpperCase().includes(cleanCode.replace(/\s+/g, '').toUpperCase()))
    : tokens

  let cleanName = filteredTokens.join(' ').trim()
  if (cleanCode) {
    const nameNoCode = cleanName.replace(cleanCode, '').replace(codeFromField, '').trim()
    if (nameNoCode.length > 0) cleanName = nameNoCode
  }

  return {
    cleanCode: cleanCode || raw.id?.toString() || 'COURSE',
    cleanName: cleanName || name || 'Course',
  }
}
