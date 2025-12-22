const { verifyAccessToken } = require('../utils/generateToken');
const User = require('../models/User');
const { cacheHelpers } = require('../config/redis');

/**
 * ========================================================
 * AUTHENTICATION MIDDLEWARE - DEEP DIVE
 * ========================================================
 * 
 * WHAT IS MIDDLEWARE?
 * ------------------
 * Middleware functions are functions that have access to:
 * - req (request object)
 * - res (response object)
 * - next (next middleware function)
 * 
 * They can:
 * - Execute code
 * - Modify req/res objects
 * - End request-response cycle
 * - Call next middleware in stack
 * 
 * MIDDLEWARE EXECUTION ORDER:
 * -------------------------
 * app.use(middleware1);        // Runs for all routes
 * app.use(middleware2);
 * app.get('/api/route', middleware3, handler);  // Route-specific
 * 
 * Flow: middleware1 → middleware2 → middleware3 → handler
 * 
 * 
 * AUTHENTICATION FLOW:
 * -------------------
 * 1. Client sends request with token (header or cookie)
 * 2. Middleware extracts token
 * 3. Verifies token signature and expiration
 * 4. Checks if user still exists and is active
 * 5. Attaches user data to req.user
 * 6. Calls next() to proceed to route handler
 * 7. If any step fails, send 401 error
 */

/**
 * Protect Routes - Require Authentication
 * This middleware ensures user is logged in
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Extract token from Authorization header
    // Format: "Bearer <token>"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Alternative: Get token from cookies
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    // No token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized. Please log in.'
      });
    }

    // 3. Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please log in again.',
        error: error.message
      });
    }

    // 4. Check cache first for user data (performance optimization)
    let user = await cacheHelpers.get(`user:${decoded.userId}`);
    
    if (!user) {
      // 5. Get user from database if not in cache
      user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
      }

      // Store in cache for 1 hour
      await cacheHelpers.set(`user:${decoded.userId}`, user, 3600);
    }

    // 6. Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // 7. Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(401).json({
        success: false,
        message: 'Account is locked due to too many failed login attempts. Try again later.'
      });
    }

    // 8. Attach user to request object
    req.user = user;
    req.userId = user._id;

    // 9. Proceed to next middleware/route handler
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

/**
 * Optional Authentication
 * Attaches user if token is valid, but doesn't block request
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        const decoded = verifyAccessToken(token);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
          req.userId = user._id;
        }
      } catch (error) {
        // Token invalid, but don't block request
        console.log('Optional auth: Invalid token');
      }
    }

    next();
  } catch (error) {
    // Don't block on error
    next();
  }
};

/**
 * Check if user is logged in (for views)
 */
const isAuthenticated = (req, res, next) => {
  if (req.user) {
    return next();
  }
  // Redirect to login page
  res.redirect('/login');
};

/**
 * Check if user is NOT logged in (for login/register pages)
 */
const isNotAuthenticated = (req, res, next) => {
  if (!req.user) {
    return next();
  }
  // Already logged in, redirect to dashboard
  res.redirect('/dashboard');
};

module.exports = {
  protect,
  optionalAuth,
  isAuthenticated,
  isNotAuthenticated
};

/**
 * ========================================================
 * MIDDLEWARE BEST PRACTICES & PATTERNS
 * ========================================================
 * 
 * 1. ERROR HANDLING IN MIDDLEWARE:
 * -------------------------------
 * Always wrap in try-catch and pass errors to next()
 * 
 * try {
 *   // ... middleware logic
 * } catch (error) {
 *   next(error);  // Pass to error handling middleware
 * }
 * 
 * 
 * 2. ASYNC MIDDLEWARE:
 * -------------------
 * Use async/await with proper error handling
 * 
 * const asyncMiddleware = async (req, res, next) => {
 *   try {
 *     await someAsyncOperation();
 *     next();
 *   } catch (error) {
 *     next(error);
 *   }
 * };
 * 
 * 
 * 3. MIDDLEWARE COMPOSITION:
 * -------------------------
 * Combine multiple middleware for complex logic
 * 
 * app.get('/protected',
 *   protect,              // Check authentication
 *   authorize('admin'),   // Check authorization
 *   rateLimit,           // Rate limiting
 *   validateRequest,     // Validate input
 *   handler              // Route handler
 * );
 * 
 * 
 * 4. TOKEN STORAGE STRATEGIES:
 * ---------------------------
 * 
 * a) Authorization Header (RECOMMENDED for APIs):
 *    Pros:
 *    ✓ Explicit token management
 *    ✓ Works with CORS
 *    ✓ Client controls storage
 *    
 *    Cons:
 *    ✗ Client must add header to every request
 *    ✗ Vulnerable to XSS if stored in localStorage
 * 
 * b) HttpOnly Cookie (RECOMMENDED for web apps):
 *    Pros:
 *    ✓ Automatic inclusion in requests
 *    ✓ Protected from XSS (httpOnly)
 *    ✓ Can set Secure and SameSite flags
 *    
 *    Cons:
 *    ✗ Vulnerable to CSRF (need CSRF protection)
 *    ✗ CORS complications
 * 
 * 
 * 5. TOKEN REFRESH STRATEGY:
 * -------------------------
 * 
 * Client-side pseudo-code:
 * 
 * async function apiRequest(url, options) {
 *   let response = await fetch(url, {
 *     ...options,
 *     headers: {
 *       'Authorization': `Bearer ${accessToken}`
 *     }
 *   });
 *   
 *   if (response.status === 401) {
 *     // Token expired, try to refresh
 *     const refreshResponse = await fetch('/auth/refresh', {
 *       method: 'POST',
 *       credentials: 'include' // Send refresh token cookie
 *     });
 *     
 *     if (refreshResponse.ok) {
 *       const { accessToken: newToken } = await refreshResponse.json();
 *       accessToken = newToken;
 *       
 *       // Retry original request
 *       response = await fetch(url, {
 *         ...options,
 *         headers: {
 *           'Authorization': `Bearer ${accessToken}`
 *         }
 *       });
 *     } else {
 *       // Refresh failed, redirect to login
 *       window.location.href = '/login';
 *     }
 *   }
 *   
 *   return response;
 * }
 * 
 * 
 * 6. SECURITY HEADERS:
 * -------------------
 * Essential security middleware using Helmet
 * 
 * const helmet = require('helmet');
 * app.use(helmet());
 * 
 * Headers set by Helmet:
 * - Content-Security-Policy: Prevents XSS
 * - X-Frame-Options: Prevents clickjacking
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - Strict-Transport-Security: Enforces HTTPS
 * - X-XSS-Protection: Browser XSS protection
 * 
 * 
 * 7. RATE LIMITING:
 * ----------------
 * Prevent brute force attacks
 * 
 * const rateLimit = require('express-rate-limit');
 * 
 * const loginLimiter = rateLimit({
 *   windowMs: 15 * 60 * 1000, // 15 minutes
 *   max: 5, // 5 attempts
 *   message: 'Too many login attempts, please try again later'
 * });
 * 
 * app.post('/auth/login', loginLimiter, loginHandler);
 * 
 * 
 * 8. CORS CONFIGURATION:
 * ---------------------
 * For API accessible from different domains
 * 
 * const cors = require('cors');
 * 
 * app.use(cors({
 *   origin: ['https://yourdomain.com'],
 *   credentials: true, // Allow cookies
 *   methods: ['GET', 'POST', 'PUT', 'DELETE'],
 *   allowedHeaders: ['Content-Type', 'Authorization']
 * }));
 * 
 * 
 * 9. LOGGING MIDDLEWARE:
 * ---------------------
 * Log all requests for monitoring
 * 
 * const morgan = require('morgan');
 * app.use(morgan('combined'));
 * 
 * Custom logger:
 * app.use((req, res, next) => {
 *   console.log(`${req.method} ${req.path} - ${req.ip}`);
 *   next();
 * });
 * 
 * 
 * 10. MIDDLEWARE ORDER MATTERS:
 * ----------------------------
 * Correct order:
 * 
 * 1. Body parsing (express.json())
 * 2. Cookie parsing (cookie-parser)
 * 3. Security headers (helmet)
 * 4. CORS
 * 5. Logging (morgan)
 * 6. Session/Auth
 * 7. Rate limiting
 * 8. Routes
 * 9. Error handling (last)
 */
