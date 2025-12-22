/**
 * ========================================================
 * ERROR HANDLING MIDDLEWARE
 * ========================================================
 * 
 * ERROR TYPES:
 * -----------
 * 1. Operational Errors (Expected):
 *    - Invalid user input
 *    - Database connection failed
 *    - Resource not found
 *    - Authentication failed
 *    → Should be handled gracefully
 * 
 * 2. Programmer Errors (Bugs):
 *    - Undefined variable
 *    - Type errors
 *    - Syntax errors
 *    → Should be fixed in code
 * 
 * 
 * ERROR HANDLING STRATEGY:
 * -----------------------
 * 1. Try-catch in async functions
 * 2. Custom error classes for different types
 * 3. Central error handling middleware
 * 4. Different responses for dev vs production
 * 5. Logging for debugging
 */

/**
 * Custom Error Classes
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * Handle Mongoose Validation Errors
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new ValidationError(message);
};

/**
 * Handle Mongoose Duplicate Key Errors
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field} '${value}' already exists`;
  return new ConflictError(message);
};

/**
 * Handle Mongoose Cast Errors (Invalid ObjectId)
 */
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new ValidationError(message);
};

/**
 * Handle JWT Errors
 */
const handleJWTError = () => {
  return new AuthenticationError('Invalid token. Please log in again.');
};

const handleJWTExpiredError = () => {
  return new AuthenticationError('Your token has expired. Please log in again.');
};

/**
 * Send Error Response (Development)
 */
const sendErrorDev = (err, req, res) => {
  // API Error
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  }
  
  // Rendered Website Error
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).render('error', {
    title: 'Error',
    message: err.message,
    error: err
  });
};

/**
 * Send Error Response (Production)
 */
const sendErrorProd = (err, req, res) => {
  // API Error
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        status: err.status,
        message: err.message
      });
    }
    
    // Programming or unknown error: don't leak error details
    console.error('ERROR 💥', err);
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong'
    });
  }
  
  // Rendered Website Error
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Error',
      message: err.message
    });
  }
  
  // Programming or unknown error
  console.error('ERROR 💥', err);
  return res.status(500).render('error', {
    title: 'Error',
    message: 'Please try again later'
  });
};

/**
 * Global Error Handler
 * Must be defined AFTER all routes
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Always log errors to console
  console.error('ERROR 💥', err);
  console.error('Error stack:', err.stack);

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.name === 'ValidationError') error = handleValidationError(err);
    if (err.code === 11000) error = handleDuplicateKeyError(err);
    if (err.name === 'CastError') error = handleCastError(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};

/**
 * Handle Not Found Routes
 */
const notFound = (req, res, next) => {
  const err = new NotFoundError(`Cannot find ${req.originalUrl} on this server`);
  next(err);
};

/**
 * Async Handler Wrapper
 * Wraps async functions to catch errors automatically
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  errorHandler,
  notFound,
  asyncHandler
};

/**
 * ========================================================
 * ERROR HANDLING BEST PRACTICES
 * ========================================================
 * 
 * 1. USING ASYNC HANDLER:
 * ----------------------
 * 
 * Without asyncHandler:
 * const getUser = async (req, res, next) => {
 *   try {
 *     const user = await User.findById(req.params.id);
 *     res.json(user);
 *   } catch (error) {
 *     next(error);
 *   }
 * };
 * 
 * With asyncHandler:
 * const getUser = asyncHandler(async (req, res, next) => {
 *   const user = await User.findById(req.params.id);
 *   if (!user) throw new NotFoundError('User not found');
 *   res.json(user);
 * });
 * 
 * 
 * 2. THROWING ERRORS:
 * ------------------
 * 
 * Validation:
 * if (!email) throw new ValidationError('Email is required');
 * 
 * Authentication:
 * if (!user) throw new AuthenticationError('Invalid credentials');
 * 
 * Authorization:
 * if (user.role !== 'admin') throw new AuthorizationError();
 * 
 * Not Found:
 * if (!resource) throw new NotFoundError('Resource not found');
 * 
 * Conflict:
 * if (existingUser) throw new ConflictError('Email already exists');
 * 
 * 
 * 3. ERROR LOGGING:
 * ----------------
 * 
 * Use proper logging library (Winston, Bunyan):
 * 
 * const winston = require('winston');
 * 
 * const logger = winston.createLogger({
 *   level: 'error',
 *   format: winston.format.json(),
 *   transports: [
 *     new winston.transports.File({ filename: 'error.log', level: 'error' }),
 *     new winston.transports.File({ filename: 'combined.log' })
 *   ]
 * });
 * 
 * if (process.env.NODE_ENV !== 'production') {
 *   logger.add(new winston.transports.Console({
 *     format: winston.format.simple()
 *   }));
 * }
 * 
 * Then in error handler:
 * logger.error(err.message, { stack: err.stack });
 * 
 * 
 * 4. CLIENT ERROR HANDLING:
 * ------------------------
 * 
 * Frontend should handle different status codes:
 * 
 * async function apiCall() {
 *   try {
 *     const response = await fetch('/api/resource');
 *     
 *     if (!response.ok) {
 *       const error = await response.json();
 *       
 *       switch (response.status) {
 *         case 400:
 *           // Validation error - show to user
 *           showValidationErrors(error.message);
 *           break;
 *         case 401:
 *           // Unauthorized - redirect to login
 *           redirectToLogin();
 *           break;
 *         case 403:
 *           // Forbidden - show permission error
 *           showAccessDenied();
 *           break;
 *         case 404:
 *           // Not found - show not found page
 *           showNotFound();
 *           break;
 *         case 500:
 *           // Server error - show generic error
 *           showServerError();
 *           break;
 *       }
 *     }
 *     
 *     return await response.json();
 *   } catch (error) {
 *     // Network error
 *     showNetworkError();
 *   }
 * }
 * 
 * 
 * 5. UNHANDLED REJECTIONS & EXCEPTIONS:
 * ------------------------------------
 * 
 * In server.js:
 * 
 * // Unhandled Promise Rejections
 * process.on('unhandledRejection', (err) => {
 *   console.log('UNHANDLED REJECTION! 💥 Shutting down...');
 *   console.log(err.name, err.message);
 *   server.close(() => {
 *     process.exit(1);
 *   });
 * });
 * 
 * // Uncaught Exceptions
 * process.on('uncaughtException', (err) => {
 *   console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
 *   console.log(err.name, err.message);
 *   process.exit(1);
 * });
 * 
 * 
 * 6. VALIDATION ERRORS:
 * --------------------
 * 
 * Multiple field errors:
 * const errors = [];
 * if (!name) errors.push('Name is required');
 * if (!email) errors.push('Email is required');
 * if (errors.length > 0) {
 *   throw new ValidationError(errors.join(', '));
 * }
 * 
 * 
 * 7. DATABASE ERRORS:
 * ------------------
 * 
 * Common MongoDB errors:
 * - E11000: Duplicate key (handled above)
 * - ValidationError: Schema validation failed
 * - CastError: Invalid ObjectId
 * - MongoNetworkError: Connection failed
 * - MongoTimeoutError: Operation timeout
 * 
 * 
 * 8. HTTP STATUS CODES:
 * --------------------
 * 
 * 2xx Success:
 * 200 OK - Successful GET, PUT, PATCH
 * 201 Created - Successful POST
 * 204 No Content - Successful DELETE
 * 
 * 4xx Client Errors:
 * 400 Bad Request - Validation error
 * 401 Unauthorized - Authentication required
 * 403 Forbidden - No permission
 * 404 Not Found - Resource doesn't exist
 * 409 Conflict - Duplicate resource
 * 422 Unprocessable Entity - Validation failed
 * 429 Too Many Requests - Rate limit exceeded
 * 
 * 5xx Server Errors:
 * 500 Internal Server Error - Generic error
 * 503 Service Unavailable - Server overloaded
 * 
 * 
 * 9. ERROR MESSAGES:
 * -----------------
 * 
 * Good error messages:
 * ✓ "Email is required"
 * ✓ "Password must be at least 8 characters"
 * ✓ "User not found"
 * ✓ "Invalid credentials"
 * 
 * Bad error messages:
 * ✗ "Error"
 * ✗ "Something went wrong"
 * ✗ "Cannot read property 'x' of undefined"
 * ✗ Exposing stack traces in production
 * 
 * 
 * 10. TESTING ERROR HANDLING:
 * --------------------------
 * 
 * Test cases:
 * ✓ Invalid input returns 400
 * ✓ Unauthorized returns 401
 * ✓ Forbidden returns 403
 * ✓ Not found returns 404
 * ✓ Server error returns 500
 * ✓ Error messages are user-friendly
 * ✓ Stack traces hidden in production
 * ✓ Errors are logged correctly
 */
