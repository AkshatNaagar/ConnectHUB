/**
 * ========================================================
 * ROLE-BASED ACCESS CONTROL (RBAC) MIDDLEWARE
 * ========================================================
 * 
 * RBAC is an approach to restricting access based on user roles.
 * It defines what actions each role can perform.
 * 
 * ROLE HIERARCHY (in this project):
 * --------------------------------
 * user: Regular user
 * - View profiles
 * - Connect with others
 * - Apply for jobs
 * - Send messages
 * 
 * company: Company account
 * - All user permissions
 * - Post jobs
 * - View applications
 * - Manage job listings
 * 
 * admin: Administrator
 * - All permissions
 * - Manage users
 * - Delete content
 * - View analytics
 * 
 * 
 * PERMISSION MODELS:
 * -----------------
 * 1. Role-Based (This implementation):
 *    - Simple, easy to manage
 *    - Works for most applications
 *    - Limited granularity
 * 
 * 2. Permission-Based:
 *    - Fine-grained control
 *    - Each user has specific permissions
 *    - More complex to manage
 * 
 * 3. Attribute-Based (ABAC):
 *    - Based on attributes (location, time, device)
 *    - Most flexible
 *    - Most complex
 * 
 * 
 * IMPLEMENTATION PATTERNS:
 * -----------------------
 * 
 * Pattern 1: Single Role Check
 * authorize('admin')
 * 
 * Pattern 2: Multiple Roles
 * authorize(['admin', 'company'])
 * 
 * Pattern 3: Custom Logic
 * authorizeOwnerOrAdmin(resourceModel)
 */

/**
 * Authorize based on roles
 * @param  {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    // Ensure user is authenticated (should use protect middleware first)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user's role is in allowed roles
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      });
    }

    next();
  };
};

/**
 * Restrict to company accounts only
 */
const restrictToCompany = (req, res, next) => {
  if (req.user.role !== 'company') {
    return res.status(403).json({
      success: false,
      message: 'This action is only available to company accounts'
    });
  }
  next();
};

/**
 * Restrict to admin only
 */
const restrictToAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

/**
 * Check if user owns the resource or is admin
 * @param {string} resourceUserIdField - Field name containing owner's ID
 */
const authorizeOwnerOrAdmin = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    // Admin can access anything
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.resource ? req.resource[resourceUserIdField] : req.params.userId;
    
    if (!resourceUserId) {
      return res.status(400).json({
        success: false,
        message: 'Resource ownership cannot be determined'
      });
    }

    if (resourceUserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own resources'
      });
    }

    next();
  };
};

/**
 * Check if user can modify a specific resource
 * Loads resource and checks ownership
 */
const canModifyResource = (Model, resourceIdParam = 'id', ownerField = 'postedBy') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      // Admin can modify anything
      if (req.user.role === 'admin') {
        req.resource = resource;
        return next();
      }

      // Check ownership
      const ownerId = resource[ownerField];
      if (!ownerId || ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to modify this resource'
        });
      }

      // Attach resource to request for use in handler
      req.resource = resource;
      next();

    } catch (error) {
      console.error('Authorization error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization failed',
        error: error.message
      });
    }
  };
};

/**
 * Check if users are connected before allowing certain actions
 */
const requireConnection = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.body.receiverId;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID required'
      });
    }

    // Can't check connection with yourself
    if (targetUserId.toString() === req.user._id.toString()) {
      return next();
    }

    // Check if users are connected
    const User = require('../models/User');
    const user = await User.findById(req.user._id);
    
    const isConnected = user.connections.some(
      conn => conn.toString() === targetUserId.toString()
    );

    if (!isConnected && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You must be connected with this user to perform this action'
      });
    }

    next();
  } catch (error) {
    console.error('Connection check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify connection',
      error: error.message
    });
  }
};

/**
 * Rate limiting per role
 * Different limits for different roles
 */
const roleLimits = {
  user: 100,
  company: 500,
  admin: 10000
};

const roleBasedRateLimit = () => {
  const requests = new Map();

  return (req, res, next) => {
    const key = `${req.user._id}_${Date.now() / (15 * 60 * 1000)}`; // 15-minute window
    const limit = roleLimits[req.user.role] || 100;

    const count = requests.get(key) || 0;
    
    if (count >= limit) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded for your role'
      });
    }

    requests.set(key, count + 1);
    next();
  };
};

/**
 * Check if user account is verified
 */
const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address to access this feature'
    });
  }
  next();
};

module.exports = {
  authorize,
  restrictToCompany,
  restrictToAdmin,
  authorizeOwnerOrAdmin,
  canModifyResource,
  requireConnection,
  roleBasedRateLimit,
  requireVerified
};

/**
 * ========================================================
 * AUTHORIZATION PATTERNS & BEST PRACTICES
 * ========================================================
 * 
 * 1. AUTHENTICATION vs AUTHORIZATION:
 * ----------------------------------
 * AUTHENTICATION (AuthN):
 * - Who are you?
 * - Verifying identity
 * - Login, JWT verification
 * 
 * AUTHORIZATION (AuthZ):
 * - What can you do?
 * - Verifying permissions
 * - Role checks, resource ownership
 * 
 * 
 * 2. ROUTE PROTECTION PATTERNS:
 * ----------------------------
 * 
 * Public Route (no auth):
 * app.get('/api/jobs', getJobs);
 * 
 * Protected Route (auth required):
 * app.get('/api/profile', protect, getProfile);
 * 
 * Role-based Route:
 * app.post('/api/jobs', protect, authorize('company', 'admin'), createJob);
 * 
 * Owner or Admin:
 * app.delete('/api/jobs/:id', protect, canModifyResource(Job), deleteJob);
 * 
 * 
 * 3. COMBINING MIDDLEWARE:
 * -----------------------
 * Correct order matters!
 * 
 * app.put('/api/jobs/:id',
 *   protect,                    // 1. Authenticate
 *   authorize('company', 'admin'), // 2. Check role
 *   canModifyResource(Job),     // 3. Check ownership
 *   validateRequest,            // 4. Validate input
 *   updateJob                   // 5. Handle request
 * );
 * 
 * 
 * 4. RESOURCE OWNERSHIP PATTERNS:
 * ------------------------------
 * 
 * Pattern 1: Check in Handler
 * - Simple for one-off checks
 * - Less reusable
 * 
 * const deletePost = async (req, res) => {
 *   const post = await Post.findById(req.params.id);
 *   if (post.author.toString() !== req.user._id.toString()) {
 *     return res.status(403).json({ message: 'Not authorized' });
 *   }
 *   // ... delete logic
 * };
 * 
 * Pattern 2: Middleware (RECOMMENDED)
 * - Reusable across routes
 * - Cleaner separation of concerns
 * - Easier to test
 * 
 * app.delete('/posts/:id',
 *   protect,
 *   canModifyResource(Post),
 *   deletePost
 * );
 * 
 * 
 * 5. PERMISSION CHECKING STRATEGIES:
 * ---------------------------------
 * 
 * Strategy 1: Fail Fast
 * - Check permissions first
 * - Avoid unnecessary database queries
 * - Better performance
 * 
 * Strategy 2: Fetch Then Check
 * - Get resource first
 * - Check permissions
 * - Can return resource in same request
 * 
 * 
 * 6. COMMON AUTHORIZATION SCENARIOS:
 * ---------------------------------
 * 
 * a) User can only edit own profile:
 * app.put('/api/users/:id',
 *   protect,
 *   authorizeOwnerOrAdmin('_id'),
 *   updateProfile
 * );
 * 
 * b) Company can post jobs:
 * app.post('/api/jobs',
 *   protect,
 *   restrictToCompany,
 *   createJob
 * );
 * 
 * c) Only connected users can message:
 * app.post('/api/messages',
 *   protect,
 *   requireConnection,
 *   sendMessage
 * );
 * 
 * d) Admin can access everything:
 * app.get('/api/admin/users',
 *   protect,
 *   restrictToAdmin,
 *   getAllUsers
 * );
 * 
 * 
 * 7. ERROR RESPONSES:
 * ------------------
 * 
 * 401 Unauthorized:
 * - Not authenticated
 * - Missing/invalid token
 * - "Please log in"
 * 
 * 403 Forbidden:
 * - Authenticated but not authorized
 * - Insufficient permissions
 * - "Access denied"
 * 
 * 404 Not Found:
 * - Resource doesn't exist
 * - Or: Hide unauthorized resources
 * 
 * 
 * 8. SECURITY BEST PRACTICES:
 * --------------------------
 * 
 * ✓ Always authenticate before authorizing
 * ✓ Use least privilege principle
 * ✓ Log authorization failures
 * ✓ Never expose role logic to client
 * ✓ Validate on both client and server
 * ✓ Use middleware for consistency
 * ✓ Test permission combinations
 * ✓ Consider resource visibility
 * ✓ Implement rate limiting per role
 * ✓ Regular permission audits
 * 
 * 
 * 9. ADVANCED: PERMISSION MATRIX:
 * ------------------------------
 * 
 * const permissions = {
 *   user: {
 *     profile: ['read', 'update'],
 *     jobs: ['read', 'apply'],
 *     messages: ['read', 'create']
 *   },
 *   company: {
 *     profile: ['read', 'update'],
 *     jobs: ['read', 'create', 'update', 'delete'],
 *     applications: ['read'],
 *     messages: ['read', 'create']
 *   },
 *   admin: {
 *     '*': ['*'] // All permissions
 *   }
 * };
 * 
 * const hasPermission = (role, resource, action) => {
 *   const rolePerms = permissions[role];
 *   if (rolePerms['*']?.includes('*')) return true;
 *   return rolePerms[resource]?.includes(action);
 * };
 * 
 * 
 * 10. TESTING AUTHORIZATION:
 * -------------------------
 * 
 * Test cases to include:
 * ✓ Unauthenticated access denied
 * ✓ Wrong role denied
 * ✓ Correct role allowed
 * ✓ Owner can access
 * ✓ Non-owner denied
 * ✓ Admin can access everything
 * ✓ Deleted/inactive user denied
 * ✓ Token expiration handled
 */
