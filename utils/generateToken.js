const jwt = require('jsonwebtoken');

/**
 * =====================================================
 * JWT (JSON Web Token) - COMPLETE EXPLANATION
 * =====================================================
 * 
 * WHAT IS JWT?
 * ------------
 * JWT is a compact, URL-safe token format for securely transmitting
 * information between parties as a JSON object. It's digitally signed
 * so it can be verified and trusted.
 * 
 * JWT STRUCTURE (3 parts separated by dots):
 * ------------------------------------------
 * xxxxx.yyyyy.zzzzz
 * 
 * 1. HEADER (xxxxx):
 *    {
 *      "alg": "HS256",  // Signing algorithm
 *      "typ": "JWT"     // Token type
 *    }
 * 
 * 2. PAYLOAD (yyyyy):
 *    {
 *      "userId": "123",
 *      "role": "user",
 *      "iat": 1516239022,  // Issued at
 *      "exp": 1516242622   // Expiration time
 *    }
 * 
 * 3. SIGNATURE (zzzzz):
 *    HMACSHA256(
 *      base64UrlEncode(header) + "." + base64UrlEncode(payload),
 *      secret
 *    )
 * 
 * 
 * ACCESS TOKEN vs REFRESH TOKEN:
 * ------------------------------
 * ACCESS TOKEN:
 * - Short-lived (15 minutes typical)
 * - Used for API requests
 * - Stored in memory or short-lived cookie
 * - Contains user info and permissions
 * 
 * REFRESH TOKEN:
 * - Long-lived (7 days to months)
 * - Used to get new access tokens
 * - Stored securely (httpOnly cookie)
 * - Should be rotated on use
 * - Can be revoked/blacklisted
 * 
 * 
 * FLOW:
 * -----
 * 1. User logs in
 * 2. Server issues access + refresh tokens
 * 3. Client uses access token for requests
 * 4. When access token expires, use refresh token to get new access token
 * 5. If refresh token expires, user must log in again
 */

/**
 * Generate Access Token
 * @param {Object} payload - User data to encode
 * @returns {string} JWT access token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      issuer: 'ConnectHub',
      audience: 'connecthub-users'
    }
  );
};

/**
 * Generate Refresh Token
 * @param {Object} payload - User data to encode
 * @returns {string} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: 'ConnectHub',
      audience: 'connecthub-users'
    }
  );
};

/**
 * Verify Access Token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      issuer: 'ConnectHub',
      audience: 'connecthub-users'
    });
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify Refresh Token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: 'ConnectHub',
      audience: 'connecthub-users'
    });
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Decode Token Without Verification (for inspection)
 * @param {string} token - JWT token
 * @returns {Object} Decoded token
 */
const decodeToken = (token) => {
  return jwt.decode(token, { complete: true });
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken
};

/**
 * ================================================
 * JWT BEST PRACTICES & SECURITY
 * ================================================
 * 
 * 1. TOKEN STORAGE:
 * -----------------
 * ✓ Access Token: Memory (React state) or sessionStorage
 * ✓ Refresh Token: httpOnly cookie (prevents XSS)
 * ✗ NEVER store sensitive tokens in localStorage (XSS vulnerable)
 * 
 * 
 * 2. TOKEN TRANSMISSION:
 * ---------------------
 * Access Token Methods:
 * 
 * a) Authorization Header (RECOMMENDED):
 *    Authorization: Bearer <token>
 * 
 * b) Cookie-based:
 *    Set-Cookie: accessToken=<token>; HttpOnly; Secure; SameSite=Strict
 * 
 * Cookie Attributes:
 * - HttpOnly: Prevents JavaScript access (XSS protection)
 * - Secure: Only sent over HTTPS
 * - SameSite: CSRF protection (Strict/Lax/None)
 * 
 * 
 * 3. TOKEN EXPIRATION STRATEGY:
 * ----------------------------
 * Short-lived access tokens reduce risk if compromised
 * Long-lived refresh tokens allow seamless user experience
 * 
 * Recommended:
 * - Access Token: 15 minutes
 * - Refresh Token: 7 days
 * 
 * 
 * 4. TOKEN REFRESH FLOW:
 * ---------------------
 * Client Side:
 * - Intercept 401 responses
 * - Call refresh endpoint with refresh token
 * - Get new access token
 * - Retry original request
 * - If refresh fails, redirect to login
 * 
 * 
 * 5. TOKEN REVOCATION:
 * -------------------
 * Since JWT is stateless, revocation requires:
 * 
 * a) Blacklist (Redis):
 *    - Store revoked tokens until expiration
 *    - Check on each request (performance cost)
 * 
 * b) Token Version:
 *    - Add version number to user record
 *    - Increment on logout/password change
 *    - Validate version in token matches database
 * 
 * c) Short Expiration:
 *    - Keep access tokens short-lived
 *    - Limits revocation window
 * 
 * 
 * 6. SECURITY CONSIDERATIONS:
 * --------------------------
 * ✓ Use strong secret keys (256-bit minimum)
 * ✓ Rotate secrets regularly
 * ✓ Use HTTPS in production
 * ✓ Validate token signature
 * ✓ Check token expiration
 * ✓ Verify issuer and audience claims
 * ✓ Implement rate limiting
 * ✓ Log authentication attempts
 * ✓ Use refresh token rotation
 * ✓ Implement logout blacklist
 * 
 * 
 * 7. COMMON VULNERABILITIES:
 * -------------------------
 * 
 * XSS (Cross-Site Scripting):
 * - Attacker injects malicious scripts
 * - Can steal tokens from localStorage
 * - Prevention: Use httpOnly cookies, sanitize inputs
 * 
 * CSRF (Cross-Site Request Forgery):
 * - Attacker tricks user into making requests
 * - Prevention: SameSite cookies, CSRF tokens
 * 
 * Token Replay:
 * - Stolen token used by attacker
 * - Prevention: Short expiration, HTTPS, secure storage
 * 
 * Man-in-the-Middle:
 * - Attacker intercepts communication
 * - Prevention: HTTPS/TLS encryption
 * 
 * 
 * 8. EXAMPLE IMPLEMENTATION:
 * -------------------------
 * 
 * Login:
 * const accessToken = generateAccessToken({ userId, role });
 * const refreshToken = generateRefreshToken({ userId });
 * res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true });
 * res.json({ accessToken });
 * 
 * Protected Route:
 * const token = req.headers.authorization?.split(' ')[1];
 * const decoded = verifyAccessToken(token);
 * req.user = decoded;
 * 
 * Refresh:
 * const refreshToken = req.cookies.refreshToken;
 * const decoded = verifyRefreshToken(refreshToken);
 * const newAccessToken = generateAccessToken({ userId: decoded.userId });
 * res.json({ accessToken: newAccessToken });
 * 
 * 
 * 9. JWT vs SESSION-BASED AUTH:
 * ----------------------------
 * 
 * JWT (Stateless):
 * ✓ Scalable (no server storage)
 * ✓ Works across domains
 * ✓ Mobile-friendly
 * ✗ Hard to revoke
 * ✗ Larger payload size
 * 
 * Sessions (Stateful):
 * ✓ Easy revocation
 * ✓ Smaller overhead
 * ✓ More control
 * ✗ Server storage required
 * ✗ Scaling complexity
 * ✗ CSRF vulnerable
 */
