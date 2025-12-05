/**
 * Bulk Update Course Status Script
 *
 * This script helps you quickly update multiple course statuses after migration.
 *
 * Usage:
 *   1. Update the COURSE_UPDATES array below with your course IDs and desired statuses
 *   2. Run: npx tsx scripts/bulk-update-course-status.ts
 *
 * Example:
 *   const COURSE_UPDATES = [
 *     { courseId: 'abc123', status: 'ACTIVE' },
 *     { courseId: 'def456', status: 'COMPLETED' },
 *     { courseId: 'ghi789', status: 'ARCHIVED' }
 *   ]
 */

import { prisma } from '../src/lib/prisma'

// ============================================
// CONFIGURATION: Update this array
// ============================================
const COURSE_UPDATES: Array<{ courseId: string; status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'UPCOMING' }> = [
  // Example entries - replace with your actual course IDs:
  // { courseId: 'clxxxx1', status: 'ACTIVE' },
  // { courseId: 'clxxxx2', status: 'ACTIVE' },
  // { courseId: 'clxxxx3', status: 'COMPLETED' },
  // { courseId: 'clxxxx4', status: 'COMPLETED' },
  // { courseId: 'clxxxx5', status: 'ARCHIVED' },
]

// ============================================
// Script Logic - Don't modify below this line
// ============================================

async function main() {
  console.log('🔄 Bulk Course Status Update Script')
  console.log('=' .repeat(50))

  if (COURSE_UPDATES.length === 0) {
    console.log('⚠️  No courses configured for update.')
    console.log('   Please edit COURSE_UPDATES array in this script.')
    console.log('\n💡 To find your course IDs, run:')
    console.log('   npx prisma studio')
    console.log('   or query: SELECT id, code, name, semester, year FROM courses;')
    return
  }

  console.log(`\n📋 Found ${COURSE_UPDATES.length} courses to update:\n`)

  // Fetch current course details
  const courseIds = COURSE_UPDATES.map(u => u.courseId)
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: {
      id: true,
      code: true,
      name: true,
      semester: true,
      year: true,
      status: true
    }
  })

  // Display planned changes
  for (const update of COURSE_UPDATES) {
    const course = courses.find(c => c.id === update.courseId)
    if (course) {
      console.log(`  ${course.code} - ${course.name}`)
      console.log(`    ${course.semester || 'N/A'} ${course.year || ''}`)
      console.log(`    Status: ${course.status || 'ACTIVE'} → ${update.status}`)
      console.log()
    } else {
      console.log(`  ❌ Course not found: ${update.courseId}`)
    }
  }

  // Confirm before proceeding
  console.log('=' .repeat(50))
  console.log('\n⚠️  Ready to update courses. Press Ctrl+C to cancel.\n')

  // Wait 3 seconds
  await new Promise(resolve => setTimeout(resolve, 3000))

  // Perform updates
  console.log('🚀 Updating courses...\n')
  let successCount = 0
  let errorCount = 0

  for (const update of COURSE_UPDATES) {
    try {
      await prisma.course.update({
        where: { id: update.courseId },
        data: { status: update.status }
      })
      successCount++
      console.log(`  ✅ Updated ${update.courseId} → ${update.status}`)
    } catch (error) {
      errorCount++
      console.error(`  ❌ Failed to update ${update.courseId}:`, error.message)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`\n✨ Done! ${successCount} updated, ${errorCount} failed.\n`)

  // Display final status summary
  const statusCounts = await prisma.course.groupBy({
    by: ['status'],
    _count: true
  })

  console.log('📊 Current Status Distribution:')
  for (const { status, _count } of statusCounts) {
    console.log(`  ${status}: ${_count}`)
  }
}

main()
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
