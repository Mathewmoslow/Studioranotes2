const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // Count records in each table
    const userCount = await prisma.user.count()
    const courseCount = await prisma.course.count()
    const taskCount = await prisma.task.count()
    const noteCount = await prisma.note.count()
    const studyBlockCount = await prisma.studyBlock.count()

    console.log('\n📊 Database Record Counts:')
    console.log('==========================')
    console.log(`Users: ${userCount}`)
    console.log(`Courses: ${courseCount}`)
    console.log(`Tasks: ${taskCount}`)
    console.log(`Notes: ${noteCount}`)
    console.log(`Study Blocks: ${studyBlockCount}`)

    // Get sample data if available
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: { id: true, email: true, onboardingCompleted: true },
        take: 3
      })
      console.log('\n👤 Sample Users:')
      users.forEach(u => console.log(`  - ${u.email} (onboarding: ${u.onboardingCompleted})`))
    }

    if (courseCount > 0) {
      const courses = await prisma.course.findMany({
        select: { id: true, name: true, code: true, userId: true },
        take: 5
      })
      console.log('\n📚 Sample Courses:')
      courses.forEach(c => console.log(`  - ${c.code}: ${c.name} (user: ${c.userId})`))
    }

    if (taskCount > 0) {
      const tasks = await prisma.task.findMany({
        select: { id: true, title: true, type: true, dueDate: true, userId: true },
        take: 5
      })
      console.log('\n📝 Sample Tasks:')
      tasks.forEach(t => console.log(`  - ${t.title} (${t.type}) - Due: ${t.dueDate.toISOString().split('T')[0]}`))
    }

  } catch (error) {
    console.error('❌ Error querying database:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
