const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('\n🔍 Verifying Data Integrity')
    console.log('==========================\n')

    // Check courses
    const courses = await prisma.course.findMany({
      include: {
        tasks: true
      }
    })

    console.log('📚 COURSES:')
    courses.forEach(course => {
      console.log(`\n  ${course.name}`)
      console.log(`    ID: ${course.id}`)
      console.log(`    canvasId: ${course.canvasId || '❌ MISSING'}`)
      console.log(`    Tasks: ${course.tasks.length}`)

      // Check if tasks reference this course correctly
      const orphanedTasks = course.tasks.filter(t => t.courseId !== course.id)
      if (orphanedTasks.length > 0) {
        console.log(`    ⚠️  WARNING: ${orphanedTasks.length} tasks have wrong courseId!`)
      }
    })

    // Check for orphaned tasks
    const allTasks = await prisma.task.findMany()
    const orphanedTasks = allTasks.filter(task => {
      return !courses.some(c => c.id === task.courseId)
    })

    if (orphanedTasks.length > 0) {
      console.log(`\n❌ ORPHANED TASKS: ${orphanedTasks.length} tasks reference non-existent courses!`)
      orphanedTasks.forEach(task => {
        console.log(`   - "${task.title}" references courseId: ${task.courseId}`)
      })
    } else {
      console.log(`\n✅ All ${allTasks.length} tasks correctly reference existing courses`)
    }

    // Summary
    console.log('\n📊 SUMMARY:')
    console.log(`  Courses: ${courses.length}`)
    console.log(`  Tasks: ${allTasks.length}`)
    console.log(`  Courses with canvasId: ${courses.filter(c => c.canvasId).length}`)
    console.log(`  Orphaned tasks: ${orphanedTasks.length}`)

    const allGood = orphanedTasks.length === 0 &&
                     courses.every(c => c.canvasId) &&
                     courses.every(c => c.tasks.every(t => t.courseId === c.id))

    if (allGood) {
      console.log('\n✅ DATA INTEGRITY: PERFECT')
      console.log('All relationships are correct!')
    } else {
      console.log('\n⚠️  DATA INTEGRITY: ISSUES FOUND')
      console.log('See details above.')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
