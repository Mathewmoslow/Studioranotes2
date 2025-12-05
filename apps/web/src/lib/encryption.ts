import crypto from 'crypto'

/**
 * Secure encryption utility for Canvas tokens using AES-256-GCM
 *
 * Security features:
 * - AES-256-GCM authenticated encryption
 * - Random IV for each encryption
 * - Authentication tag to prevent tampering
 * - Base64 encoding for safe storage
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16 // 16 bytes for GCM
const AUTH_TAG_LENGTH = 16 // 16 bytes authentication tag
const KEY_LENGTH = 32 // 32 bytes = 256 bits

/**
 * Get encryption key from environment variable
 * Must be 32 bytes (64 hex characters)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.CANVAS_TOKEN_ENCRYPTION_KEY

  if (!key) {
    throw new Error('CANVAS_TOKEN_ENCRYPTION_KEY environment variable is not set')
  }

  // Ensure key is 32 bytes (64 hex chars)
  if (key.length !== 64) {
    throw new Error('CANVAS_TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes)')
  }

  return Buffer.from(key, 'hex')
}

/**
 * Encrypt a Canvas token
 * @param token - Plain text Canvas API token
 * @returns Encrypted token as base64 string (format: iv:authTag:encryptedData)
 */
export function encryptToken(token: string): string {
  try {
    const key = getEncryptionKey()

    // Generate random IV (initialization vector)
    const iv = crypto.randomBytes(IV_LENGTH)

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Encrypt the token
    let encrypted = cipher.update(token, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Get authentication tag
    const authTag = cipher.getAuthTag()

    // Combine IV + authTag + encrypted data
    // Format: iv:authTag:encryptedData (all base64 encoded)
    const result = `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`

    return result
  } catch (error) {
    console.error('Token encryption failed:', error)
    throw new Error('Failed to encrypt Canvas token')
  }
}

/**
 * Decrypt a Canvas token
 * @param encryptedToken - Encrypted token string (format: iv:authTag:encryptedData)
 * @returns Decrypted plain text token
 */
export function decryptToken(encryptedToken: string): string {
  try {
    const key = getEncryptionKey()

    // Parse the encrypted data
    const parts = encryptedToken.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted token format')
    }

    const iv = Buffer.from(parts[0], 'base64')
    const authTag = Buffer.from(parts[1], 'base64')
    const encryptedData = parts[2]

    // Validate lengths
    if (iv.length !== IV_LENGTH) {
      throw new Error('Invalid IV length')
    }
    if (authTag.length !== AUTH_TAG_LENGTH) {
      throw new Error('Invalid auth tag length')
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    // Decrypt the token
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('Token decryption failed:', error)
    throw new Error('Failed to decrypt Canvas token')
  }
}

/**
 * Generate a new encryption key (for initial setup)
 * This should be run once and the result stored in .env
 * @returns 64 character hex string (32 bytes)
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString('hex')
}

/**
 * Validate an encryption key
 * @param key - The key to validate
 * @returns true if valid, false otherwise
 */
export function isValidEncryptionKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false
  if (key.length !== 64) return false
  if (!/^[0-9a-f]+$/i.test(key)) return false
  return true
}
