const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * ========================================================
 * PASSWORD HASHING & ENCRYPTION - COMPLETE GUIDE
 * ========================================================
 * 
 * HASHING vs ENCRYPTION:
 * ----------------------
 * HASHING:
 * - One-way function (cannot be reversed)
 * - Same input = same output
 * - Used for: Passwords, data integrity
 * - Examples: MD5, SHA-256, bcrypt, Argon2
 * 
 * ENCRYPTION:
 * - Two-way function (can be decrypted)
 * - Requires key
 * - Used for: Sensitive data transmission
 * - Examples: AES, RSA, DES
 * 
 * 
 * WHY NOT MD5 OR SHA FOR PASSWORDS?
 * ---------------------------------
 * ✗ MD5: Broken, fast (allows brute force)
 * ✗ SHA-1: Deprecated, collision attacks
 * ✗ SHA-256: Too fast (allows brute force)
 * 
 * ✓ bcrypt: Slow by design, includes salt, adjustable work factor
 * ✓ Argon2: Modern, memory-hard, best choice
 * ✓ PBKDF2: Slow, widely supported
 * 
 * SALT: Random data added to password before hashing
 * - Prevents rainbow table attacks
 * - Each password has unique hash even if same
 * - bcrypt includes salt automatically
 */

/**
 * Hash password using bcrypt (RECOMMENDED FOR PRODUCTION)
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  // Higher salt rounds = more secure but slower
  // 12 rounds ≈ 0.3 seconds
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password with hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Hashed password from database
 * @returns {Promise<boolean>} True if match
 */
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Generate random token (for email verification, password reset)
 * @param {number} length - Token length in bytes
 * @returns {string} Hex string token
 */
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash data using SHA-256 (for data integrity, NOT passwords)
 * @param {string} data - Data to hash
 * @returns {string} SHA-256 hash
 */
const sha256Hash = (data) => {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
};

/**
 * MD5 Hash (EDUCATIONAL ONLY - DO NOT USE FOR PASSWORDS)
 * @param {string} data - Data to hash
 * @returns {string} MD5 hash
 */
const md5Hash = (data) => {
  return crypto
    .createHash('md5')
    .update(data)
    .digest('hex');
};

/**
 * AES-256 Encryption (for sensitive data)
 * @param {string} text - Text to encrypt
 * @param {string} secretKey - Encryption key (32 bytes for AES-256)
 * @returns {string} Encrypted text
 */
const encrypt = (text, secretKey = process.env.ENCRYPTION_KEY) => {
  if (!secretKey || secretKey.length !== 32) {
    throw new Error('Encryption key must be 32 characters for AES-256');
  }

  const iv = crypto.randomBytes(16); // Initialization vector
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV + encrypted data (IV needed for decryption)
  return iv.toString('hex') + ':' + encrypted;
};

/**
 * AES-256 Decryption
 * @param {string} encryptedText - Encrypted text (with IV)
 * @param {string} secretKey - Encryption key
 * @returns {string} Decrypted text
 */
const decrypt = (encryptedText, secretKey = process.env.ENCRYPTION_KEY) => {
  if (!secretKey || secretKey.length !== 32) {
    throw new Error('Encryption key must be 32 characters for AES-256');
  }

  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey), iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

/**
 * Hash password using PBKDF2 (alternative to bcrypt)
 * @param {string} password - Plain text password
 * @param {string} salt - Salt (optional, will generate if not provided)
 * @returns {Object} Hash and salt
 */
const pbkdf2Hash = (password, salt = null) => {
  if (!salt) {
    salt = crypto.randomBytes(16).toString('hex');
  }
  
  const hash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
  
  return { hash, salt };
};

/**
 * Verify PBKDF2 hash
 * @param {string} password - Plain text password
 * @param {string} hash - Stored hash
 * @param {string} salt - Stored salt
 * @returns {boolean} True if match
 */
const pbkdf2Verify = (password, hash, salt) => {
  const verifyHash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');
  
  return hash === verifyHash;
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  sha256Hash,
  md5Hash,
  encrypt,
  decrypt,
  pbkdf2Hash,
  pbkdf2Verify
};

/**
 * =================================================
 * CRYPTOGRAPHIC HASH FUNCTIONS - DETAILED GUIDE
 * =================================================
 * 
 * 1. MD5 (Message Digest 5):
 * --------------------------
 * ✗ Output: 128-bit (32 hex characters)
 * ✗ Speed: Very fast (~350 MB/s)
 * ✗ Status: BROKEN - collision attacks found
 * ✗ Use Case: Checksums ONLY, never passwords
 * 
 * Example:
 * Password: "hello"
 * MD5: 5d41402abc4b2a76b9719d911017c592
 * 
 * Why broken?
 * - Two different inputs can produce same hash
 * - Rainbow tables available for common passwords
 * - Too fast for password hashing (allows brute force)
 * 
 * 
 * 2. SHA (Secure Hash Algorithm):
 * ------------------------------
 * SHA-1 (Deprecated):
 * ✗ Output: 160-bit
 * ✗ Status: BROKEN - collision attacks
 * 
 * SHA-256:
 * ✓ Output: 256-bit (64 hex characters)
 * ✓ Speed: Fast
 * ✗ Not suitable for passwords (too fast)
 * ✓ Good for: File integrity, certificates
 * 
 * SHA-512:
 * ✓ Output: 512-bit
 * ✓ More secure than SHA-256
 * ✓ Slightly slower
 * 
 * Example:
 * Password: "hello"
 * SHA-256: 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
 * 
 * 
 * 3. bcrypt (RECOMMENDED):
 * ------------------------
 * ✓ Designed specifically for passwords
 * ✓ Built-in salt generation
 * ✓ Adjustable work factor (cost)
 * ✓ Slow by design (prevents brute force)
 * 
 * Work Factor (Cost):
 * - 10 = ~0.07 seconds
 * - 12 = ~0.3 seconds (recommended)
 * - 15 = ~2.5 seconds
 * 
 * Format: $2b$[cost]$[salt][hash]
 * Example: $2b$12$Ke4XcMqN.../uzlD3VR3bz6
 * 
 * 
 * 4. Argon2 (BEST CHOICE):
 * -----------------------
 * ✓ Winner of Password Hashing Competition (2015)
 * ✓ Memory-hard (resistant to GPU/ASIC attacks)
 * ✓ Three variants: Argon2d, Argon2i, Argon2id
 * ✓ Configurable: Memory, iterations, parallelism
 * 
 * 
 * 5. PBKDF2:
 * ----------
 * ✓ Standard (NIST approved)
 * ✓ Configurable iterations
 * ✓ Widely supported
 * ✗ Not memory-hard (GPU attacks possible)
 * 
 * 
 * =================================================
 * ATTACK METHODS & DEFENSES
 * =================================================
 * 
 * 1. BRUTE FORCE:
 * --------------
 * Attack: Try every possible password
 * Defense:
 * - Slow hash function (bcrypt, Argon2)
 * - Account lockout after failed attempts
 * - Rate limiting
 * 
 * 
 * 2. DICTIONARY ATTACK:
 * --------------------
 * Attack: Try common passwords from list
 * Defense:
 * - Password complexity requirements
 * - Check against known breached passwords
 * 
 * 
 * 3. RAINBOW TABLE:
 * ----------------
 * Attack: Pre-computed hash tables
 * Defense:
 * - Salt (makes rainbow tables useless)
 * - Unique salt per password
 * 
 * 
 * 4. TIMING ATTACK:
 * ----------------
 * Attack: Measure comparison time to guess password
 * Defense:
 * - Constant-time comparison
 * - bcrypt.compare() uses constant-time
 * 
 * 
 * =================================================
 * HTTPS & TLS - SECURE COMMUNICATION
 * =================================================
 * 
 * HTTP vs HTTPS:
 * -------------
 * HTTP: Unencrypted (plaintext)
 * - Anyone can intercept and read data
 * - Vulnerable to man-in-the-middle attacks
 * 
 * HTTPS: Encrypted using TLS/SSL
 * - Data encrypted in transit
 * - Server authentication (certificate)
 * - Data integrity
 * 
 * 
 * TLS (Transport Layer Security):
 * ------------------------------
 * - Cryptographic protocol for secure communication
 * - Successor to SSL (Secure Sockets Layer)
 * - TLS 1.3 is current standard
 * 
 * TLS Handshake:
 * 1. Client Hello (supported ciphers)
 * 2. Server Hello (chosen cipher, certificate)
 * 3. Key Exchange
 * 4. Encrypted communication
 * 
 * 
 * Certificate:
 * -----------
 * - Digital certificate from Certificate Authority (CA)
 * - Contains public key
 * - Verifies server identity
 * 
 * 
 * Setting up HTTPS in Express:
 * ---------------------------
 * const https = require('https');
 * const fs = require('fs');
 * 
 * const options = {
 *   key: fs.readFileSync('private-key.pem'),
 *   cert: fs.readFileSync('certificate.pem')
 * };
 * 
 * https.createServer(options, app).listen(443);
 * 
 * 
 * Getting Free SSL Certificate:
 * ----------------------------
 * - Let's Encrypt (free, automated)
 * - Use Certbot for setup
 * - Auto-renewal every 90 days
 * 
 * 
 * =================================================
 * PASSWORD SECURITY BEST PRACTICES
 * =================================================
 * 
 * 1. Storage:
 * ✓ Never store plaintext passwords
 * ✓ Use bcrypt or Argon2
 * ✓ Use unique salt per password
 * ✓ Use sufficient work factor
 * 
 * 2. Transmission:
 * ✓ Always use HTTPS
 * ✓ Never log passwords
 * ✓ Clear password from memory after use
 * 
 * 3. Password Policy:
 * ✓ Minimum length (12+ characters)
 * ✓ Complexity requirements
 * ✓ Check against breach databases
 * ✓ Prevent password reuse
 * 
 * 4. Additional Security:
 * ✓ Two-factor authentication (2FA)
 * ✓ Account lockout
 * ✓ Rate limiting
 * ✓ Password strength meter
 * ✓ Secure password reset flow
 */
