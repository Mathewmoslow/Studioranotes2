/**
 * Block Visual Utilities
 * Determines visual styling for study blocks based on StudentLife legacy system
 */

import type { BlockCategory, BlockVisualStyle } from '@studioranotes/types'
// Export styles constant from monorepo types
export { BLOCK_VISUAL_STYLES } from '@studioranotes/types'

/**
 * Determine block category based on task type
 * @param taskType Type of task (assignment, exam, lab, etc.)
 * @param isHardDeadline Whether this is a hard deadline vs study time
 * @returns Block category for visual styling
 */
export function determineBlockCategory(
  taskType: string,
  isHardDeadline: boolean = false
): BlockCategory {
  const type = taskType.toLowerCase()

  // CLINICAL - Clinical rotations and practical sessions
  if (type === 'clinical' || type.includes('clinical')) {
    return 'CLINICAL'
  }

  // CLASS - Scheduled classes and attendance-required events
  if (type === 'lecture' || type === 'lab' || type === 'tutorial' ||
      type === 'seminar' || type === 'class') {
    return 'CLASS'
  }

  // DUE - Hard deadlines (actual exam times, submission deadlines)
  if (isHardDeadline) {
    return 'DUE'
  }

  // Exam study time is DUE if it's the actual exam, DO if it's prep
  if (type === 'exam' || type === 'quiz' || type === 'midterm' || type === 'final') {
    // If it's the actual test time, it's DUE
    // If it's study prep, it's DO
    // We determine this by isHardDeadline flag
    return isHardDeadline ? 'DUE' : 'DO'
  }

  // DO - Everything else (work to be done)
  // Assignments, readings, projects, studying, etc.
  return 'DO'
}

/**
 * Get visual style for a block
 * @param category Block category
 * @returns Visual styling properties
 */
export function getBlockVisualStyle(category: BlockCategory): BlockVisualStyle {
  // Note: BLOCK_VISUAL_STYLES is imported from @repo/types
  // We can't directly use it here due to module loading, so we define it inline
  const styles: Record<BlockCategory, BlockVisualStyle> = {
    DO: {
      category: 'DO',
      pattern: 'solid',
      opacity: 0.9,
      borderStyle: 'solid',
      borderWidth: 2,
      icon: '📚',
      gradient: true
    },
    DUE: {
      category: 'DUE',
      pattern: 'solid',
      opacity: 0.80,
      borderStyle: 'solid',
      borderWidth: 3,
      icon: '⏰',
      gradient: true
    },
    CLASS: {
      category: 'CLASS',
      pattern: 'cross-hatch',
      opacity: 0.50,
      borderStyle: 'dashed',
      borderWidth: 2,
      icon: '🎓',
      gradient: false
    },
    CLINICAL: {
      category: 'CLINICAL',
      pattern: 'dots',
      opacity: 0.33,
      borderStyle: 'double',
      borderWidth: 4,
      icon: '🏥',
      gradient: false
    }
  }

  return styles[category]
}

/**
 * Generate CSS class names for block styling
 * @param category Block category
 * @param courseColor Base color from course
 * @returns CSS classes and inline styles
 */
export function getBlockStyling(
  category: BlockCategory,
  courseColor: string
): {
  className: string
  style: React.CSSProperties
} {
  const visualStyle = getBlockVisualStyle(category)

  // Base classes
  const classes = [
    'study-block',
    `block-${category.toLowerCase()}`,
    `pattern-${visualStyle.pattern}`
  ]

  // Inline styles
  const style: React.CSSProperties = {
    opacity: visualStyle.opacity,
    borderStyle: visualStyle.borderStyle,
    borderWidth: `${visualStyle.borderWidth}px`,
    borderColor: courseColor,
  }

  // Pattern-specific backgrounds
  if (visualStyle.pattern === 'diagonal-stripes') {
    style.backgroundImage = `repeating-linear-gradient(
      45deg,
      ${courseColor},
      ${courseColor} 10px,
      transparent 10px,
      transparent 20px
    )`
  } else if (visualStyle.pattern === 'cross-hatch') {
    style.backgroundImage = `
      repeating-linear-gradient(0deg, ${courseColor}, ${courseColor} 2px, transparent 2px, transparent 10px),
      repeating-linear-gradient(90deg, ${courseColor}, ${courseColor} 2px, transparent 2px, transparent 10px)
    `
  } else if (visualStyle.pattern === 'dots') {
    style.backgroundImage = `radial-gradient(circle, ${courseColor} 2px, transparent 2px)`
    style.backgroundSize = '10px 10px'
  } else if (visualStyle.pattern === 'solid') {
    style.backgroundColor = courseColor
    if (visualStyle.gradient) {
      style.backgroundImage = `linear-gradient(135deg, ${courseColor}, ${adjustBrightness(courseColor, -20)})`
    }
  }

  return {
    className: classes.join(' '),
    style
  }
}

/**
 * Adjust color brightness
 * @param color Hex color code
 * @param percent Percentage to adjust (-100 to 100)
 * @returns Adjusted hex color
 */
function adjustBrightness(color: string, percent: number): string {
  // Remove # if present
  const hex = color.replace('#', '')

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Adjust brightness
  const adjust = (value: number) => {
    const adjusted = value + (value * percent / 100)
    return Math.max(0, Math.min(255, Math.round(adjusted)))
  }

  // Convert back to hex
  const toHex = (value: number) => {
    const hex = value.toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }

  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`
}

/**
 * Get icon for block category
 * @param category Block category
 * @returns Emoji icon
 */
export function getBlockIcon(category: BlockCategory): string {
  const style = getBlockVisualStyle(category)
  return style.icon || '📅'
}

/**
 * Get human-readable label for category
 * @param category Block category
 * @returns Display label
 */
export function getCategoryLabel(category: BlockCategory): string {
  const labels: Record<BlockCategory, string> = {
    DO: 'Study Session',
    DUE: 'Deadline',
    CLASS: 'Scheduled Class',
    CLINICAL: 'Clinical Rotation'
  }
  return labels[category]
}
