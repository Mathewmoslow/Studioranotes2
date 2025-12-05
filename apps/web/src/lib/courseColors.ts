/**
 * Professional course color palette for better visual distinction
 * Using colors that are visually pleasing and accessible
 */
export const COURSE_COLOR_PALETTE = [
  '#2563eb', // Blue - Professional blue
  '#059669', // Emerald - Deep green
  '#7c3aed', // Violet - Rich purple
  '#0ea5e9', // Sky - soft blue
  '#0891b2', // Cyan - Ocean blue
  '#0d9488', // Teal - Turquoise
  '#1d4ed8', // Deeper blue
  '#22c55e', // Green
  '#475569', // Slate - neutral
  '#8b5cf6', // Indigo - accent
];

/**
 * Get a course color by index
 */
export function getCourseColor(index: number): string {
  return COURSE_COLOR_PALETTE[index % COURSE_COLOR_PALETTE.length];
}

/**
 * Generate a course color based on course ID or name
 */
export function generateCourseColor(courseIdOrName: string): string {
  let hash = 0;
  for (let i = 0; i < courseIdOrName.length; i++) {
    hash = courseIdOrName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COURSE_COLOR_PALETTE.length;
  return COURSE_COLOR_PALETTE[index];
}
