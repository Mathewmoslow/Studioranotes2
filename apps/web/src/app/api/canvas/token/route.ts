import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encryptToken, decryptToken } from '@/lib/encryption'

/**
 * GET /api/canvas/token
 * Retrieve and decrypt the user's Canvas token
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get the most recent Canvas token for this user
    const canvasToken = await prisma.canvasToken.findFirst({
      where: { userId: user.id },
      orderBy: { lastSync: 'desc' }
    })

    if (!canvasToken) {
      return NextResponse.json({
        hasToken: false,
        token: null,
        domain: null
      })
    }

    // Decrypt the token
    try {
      const decryptedToken = decryptToken(canvasToken.token)

      return NextResponse.json({
        hasToken: true,
        token: decryptedToken,
        domain: canvasToken.domain,
        expiresAt: canvasToken.expiresAt,
        lastSync: canvasToken.lastSync
      })
    } catch (decryptError) {
      console.error('Failed to decrypt Canvas token:', decryptError)
      return NextResponse.json(
        { error: 'Failed to decrypt token' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error retrieving Canvas token:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve token' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/canvas/token
 * Store an encrypted Canvas token for the user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token, domain, universityId, expiresAt } = body

    if (!token || !domain) {
      return NextResponse.json(
        { error: 'Token and domain are required' },
        { status: 400 }
      )
    }

    // Validate token format (basic check)
    if (typeof token !== 'string' || token.length < 10) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      )
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name,
          image: session.user.image
        }
      })
    }

    // Encrypt the token
    let encryptedToken: string
    try {
      encryptedToken = encryptToken(token)
    } catch (encryptError) {
      console.error('Failed to encrypt Canvas token:', encryptError)
      return NextResponse.json(
        { error: 'Failed to encrypt token' },
        { status: 500 }
      )
    }

    // Check if a token already exists for this domain
    const existingToken = await prisma.canvasToken.findFirst({
      where: {
        userId: user.id,
        domain: domain
      }
    })

    if (existingToken) {
      // Update existing token
      await prisma.canvasToken.update({
        where: { id: existingToken.id },
        data: {
          token: encryptedToken,
          universityId: universityId || existingToken.universityId,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          lastSync: new Date()
        }
      })

      console.log(`✅ Updated Canvas token for ${user.email} (domain: ${domain})`)
    } else {
      // Create new token
      await prisma.canvasToken.create({
        data: {
          userId: user.id,
          token: encryptedToken,
          domain: domain,
          universityId: universityId || null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          lastSync: new Date()
        }
      })

      console.log(`✅ Stored new Canvas token for ${user.email} (domain: ${domain})`)
    }

    return NextResponse.json({
      success: true,
      message: 'Token stored securely'
    })
  } catch (error) {
    console.error('Error storing Canvas token:', error)
    return NextResponse.json(
      { error: 'Failed to store token' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/canvas/token
 * Delete the user's Canvas token
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Delete all Canvas tokens for this user
    await prisma.canvasToken.deleteMany({
      where: { userId: user.id }
    })

    console.log(`🗑️ Deleted Canvas tokens for ${user.email}`)

    return NextResponse.json({
      success: true,
      message: 'Token deleted'
    })
  } catch (error) {
    console.error('Error deleting Canvas token:', error)
    return NextResponse.json(
      { error: 'Failed to delete token' },
      { status: 500 }
    )
  }
}
