/**
 * View and Archive Courses Script
 *
 * This script helps you:
 * 1. View all your courses with their status
 * 2. Identify which courses to archive
 * 3. Archive courses by ID
 */

import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('📚 Course Status Manager')
  console.log('=' .repeat(80))

  // Fetch all courses
  const courses = await prisma.course.findMany({
    orderBy: [
      { year: 'desc' },
      { semester: 'asc' },
      { name: 'asc' }
    ],
    select: {
      id: true,
      code: true,
      name: true,
      semester: true,
      year: true,
      status: true,
      canvasId: true,
      _count: {
        select: {
          tasks: true,
          notes: true
        }
      }
    }
  })

  if (courses.length === 0) {
    console.log('\n⚠️  No courses found in the database.')
    return
  }

  console.log(`\n📊 Total Courses: ${courses.length}`)
  console.log('=' .repeat(80))

  // Group by status
  const byStatus = {
    ACTIVE: courses.filter(c => c.status === 'ACTIVE'),
    COMPLETED: courses.filter(c => c.status === 'COMPLETED'),
    ARCHIVED: courses.filter(c => c.status === 'ARCHIVED'),
    UPCOMING: courses.filter(c => c.status === 'UPCOMING')
  }

  console.log(`\n✅ ACTIVE: ${byStatus.ACTIVE.length}`)
  console.log(`✔️  COMPLETED: ${byStatus.COMPLETED.length}`)
  console.log(`📦 ARCHIVED: ${byStatus.ARCHIVED.length}`)
  console.log(`🔜 UPCOMING: ${byStatus.UPCOMING.length}`)
  console.log('=' .repeat(80))

  // Display all courses
  console.log('\n📋 All Courses:\n')

  courses.forEach((course, index) => {
    const statusEmoji = {
      ACTIVE: '✅',
      COMPLETED: '✔️',
      ARCHIVED: '📦',
      UPCOMING: '🔜'
    }[course.status || 'ACTIVE']

    console.log(`${index + 1}. ${statusEmoji} [${course.status || 'ACTIVE'}]`)
    console.log(`   ID: ${course.id}`)
    console.log(`   Code: ${course.code}`)
    console.log(`   Name: ${course.name}`)
    console.log(`   Term: ${course.semester || 'N/A'} ${course.year || ''}`)
    console.log(`   Canvas ID: ${course.canvasId || 'N/A'}`)
    console.log(`   Tasks: ${course._count.tasks} | Notes: ${course._count.notes}`)
    console.log()
  })

  console.log('=' .repeat(80))
  console.log('\n💡 Next Steps:')
  console.log('\n1️⃣  Identify which 5 courses are duplicates/old semester')
  console.log('2️⃣  Copy their IDs from above')
  console.log('3️⃣  Run the archive command:\n')
  console.log('   npx tsx scripts/view-and-archive-courses.ts archive <course-id-1> <course-id-2> ...\n')
  console.log('   Example:')
  console.log('   npx tsx scripts/view-and-archive-courses.ts archive clxxx1 clxxx2 clxxx3\n')
  console.log('4️⃣  Or use the UI: npm run dev -> /courses -> click "Archive" button\n')
  console.log('=' .repeat(80))
}

// Archive courses by ID
async function archiveCourses(courseIds: string[]) {
  console.log('📦 Archiving Courses')
  console.log('=' .repeat(80))
  console.log(`\nCourse IDs to archive: ${courseIds.length}`)
  console.log(courseIds.join(', '))
  console.log()

  let successCount = 0
  let errorCount = 0

  for (const courseId of courseIds) {
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { code: true, name: true, status: true }
      })

      if (!course) {
        console.log(`❌ Course not found: ${courseId}`)
        errorCount++
        continue
      }

      await prisma.course.update({
        where: { id: courseId },
        data: { status: 'ARCHIVED' }
      })

      console.log(`✅ Archived: ${course.code} - ${course.name} (was: ${course.status})`)
      successCount++
    } catch (error) {
      console.error(`❌ Error archiving ${courseId}:`, error.message)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`\n✨ Done! ${successCount} archived, ${errorCount} failed.\n`)

  // Show updated status
  const statusCounts = await prisma.course.groupBy({
    by: ['status'],
    _count: true
  })

  console.log('📊 Updated Status Distribution:')
  statusCounts.forEach(({ status, _count }) => {
    console.log(`  ${status}: ${_count}`)
  })
  console.log()
}

// Parse command line arguments
const args = process.argv.slice(2)

if (args.length === 0) {
  // View mode
  main()
    .catch((error) => {
      console.error('❌ Error:', error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
} else if (args[0] === 'archive' && args.length > 1) {
  // Archive mode
  const courseIds = args.slice(1)
  archiveCourses(courseIds)
    .catch((error) => {
      console.error('❌ Error:', error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
} else {
  console.error('❌ Invalid arguments.')
  console.error('\nUsage:')
  console.error('  View courses:    npx tsx scripts/view-and-archive-courses.ts')
  console.error('  Archive courses: npx tsx scripts/view-and-archive-courses.ts archive <id1> <id2> ...')
  process.exit(1)
}
