import { prisma } from '@/lib/prisma'
import { decryptToken } from '@/lib/encryption'

/**
 * Retrieve and decrypt a user's Canvas token from the database
 * @param userEmail - The user's email address
 * @returns Object with token and domain, or null if not found
 */
export async function getCanvasToken(userEmail: string): Promise<{
  token: string
  domain: string
  expiresAt: Date | null
  lastSync: Date | null
} | null> {
  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) {
      console.warn(`User not found: ${userEmail}`)
      return null
    }

    // Get the most recent Canvas token for this user
    const canvasToken = await prisma.canvasToken.findFirst({
      where: { userId: user.id },
      orderBy: { lastSync: 'desc' }
    })

    if (!canvasToken) {
      console.warn(`No Canvas token found for user: ${userEmail}`)
      return null
    }

    // Decrypt the token
    try {
      const decryptedToken = decryptToken(canvasToken.token)

      return {
        token: decryptedToken,
        domain: canvasToken.domain,
        expiresAt: canvasToken.expiresAt,
        lastSync: canvasToken.lastSync
      }
    } catch (decryptError) {
      console.error('Failed to decrypt Canvas token:', decryptError)
      return null
    }
  } catch (error) {
    console.error('Error retrieving Canvas token:', error)
    return null
  }
}

/**
 * Check if a user has a Canvas token stored
 * @param userEmail - The user's email address
 * @returns true if token exists, false otherwise
 */
export async function hasCanvasToken(userEmail: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) return false

    const count = await prisma.canvasToken.count({
      where: { userId: user.id }
    })

    return count > 0
  } catch (error) {
    console.error('Error checking for Canvas token:', error)
    return false
  }
}

/**
 * Update the last sync time for a Canvas token
 * @param userEmail - The user's email address
 */
export async function updateCanvasTokenSyncTime(userEmail: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) return

    await prisma.canvasToken.updateMany({
      where: { userId: user.id },
      data: { lastSync: new Date() }
    })
  } catch (error) {
    console.error('Error updating Canvas token sync time:', error)
  }
}
