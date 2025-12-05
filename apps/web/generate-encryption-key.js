const crypto = require('crypto')

// Generate a secure 256-bit encryption key
const key = crypto.randomBytes(32).toString('hex')

console.log('\n🔐 Generated Canvas Token Encryption Key:')
console.log('==========================================')
console.log(key)
console.log('==========================================')
console.log('\nAdd this to your .env files as:')
console.log('CANVAS_TOKEN_ENCRYPTION_KEY=' + key)
console.log('\n⚠️  IMPORTANT: Keep this key secret! Never commit it to git.')
console.log('If you lose this key, all encrypted tokens will be unrecoverable.\n')
