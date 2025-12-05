const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  try {
    // Get Canvas tokens
    const tokens = await prisma.canvasToken.findMany({
      include: {
        user: {
          select: { email: true }
        }
      }
    })

    console.log('\n🔐 Canvas Tokens in Database:')
    console.log('=============================')

    if (tokens.length === 0) {
      console.log('❌ No Canvas tokens found in database')
      console.log('\nThis means:')
      console.log('- Token was not saved during onboarding')
      console.log('- Or encryption/storage failed silently')
      console.log('\nNext steps:')
      console.log('1. Go through onboarding again')
      console.log('2. Connect Canvas account')
      console.log('3. Check console for encryption errors')
    } else {
      tokens.forEach((token, index) => {
        console.log(`\nToken ${index + 1}:`)
        console.log(`  User: ${token.user.email}`)
        console.log(`  Domain: ${token.domain}`)
        console.log(`  Encrypted: ${token.token.substring(0, 50)}...`)
        console.log(`  Length: ${token.token.length} chars`)
        console.log(`  Last Sync: ${token.lastSync || 'Never'}`)
        console.log(`  Expires: ${token.expiresAt || 'No expiration set'}`)
      })

      console.log(`\n✅ Found ${tokens.length} encrypted Canvas token(s)`)
      console.log('Token storage is working correctly!')
    }

  } catch (error) {
    console.error('❌ Error querying database:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
