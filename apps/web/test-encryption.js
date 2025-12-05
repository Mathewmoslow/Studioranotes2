// Test encryption/decryption
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

// Load .env file
const envPath = path.join(__dirname, '.env')
const envFile = fs.readFileSync(envPath, 'utf8')
const envVars = {}
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})
Object.assign(process.env, envVars)

// Simulated encryption (matches our encryption.ts implementation)
const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const KEY_LENGTH = 32

function encryptToken(token, key) {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const authTag = cipher.getAuthTag()

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`
}

function decryptToken(encryptedToken, key) {
  const parts = encryptedToken.split(':')
  const iv = Buffer.from(parts[0], 'base64')
  const authTag = Buffer.from(parts[1], 'base64')
  const encryptedData = parts[2]

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

// Test
const key = Buffer.from(process.env.CANVAS_TOKEN_ENCRYPTION_KEY, 'hex')
const testToken = 'test_canvas_token_12345_abcdefg'

console.log('\n🔐 Testing Canvas Token Encryption')
console.log('==================================')
console.log('Original token:', testToken)

const encrypted = encryptToken(testToken, key)
console.log('\n✅ Encrypted:', encrypted.substring(0, 50) + '...')
console.log('Length:', encrypted.length, 'characters')

const decrypted = decryptToken(encrypted, key)
console.log('\n✅ Decrypted:', decrypted)

if (decrypted === testToken) {
  console.log('\n🎉 SUCCESS: Encryption/decryption working correctly!\n')
} else {
  console.log('\n❌ ERROR: Decryption failed! Tokens do not match.\n')
  process.exit(1)
}
