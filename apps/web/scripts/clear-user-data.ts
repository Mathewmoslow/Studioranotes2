import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'mathewmoslow@gmail.com';

  console.log(`🚿 Clearing data for ${email}`);

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.warn('⚠️  No user found with that email. Nothing to clear.');
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.studyBlock.deleteMany({ where: { userId: user.id } });
    await tx.task.deleteMany({ where: { userId: user.id } });
    await tx.note.deleteMany({ where: { userId: user.id } });
    await tx.course.deleteMany({ where: { userId: user.id } });
    await tx.canvasToken.deleteMany({ where: { userId: user.id } });
  });

  console.log('✅ Cleared courses, tasks, blocks, notes, and tokens for user.');
}

main()
  .catch((error) => {
    console.error('❌ Clear user data failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
