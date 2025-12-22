const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation Middleware Helper
 * Returns validation errors in consistent format
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * User Registration Validation Rules
 */
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  
  body('role')
    .optional()
    .isIn(['user', 'company']).withMessage('Role must be user or company'),
  
  validate
];

/**
 * User Login Validation Rules
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  validate
];

/**
 * Profile Update Validation Rules
 */
const profileUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
  
  body('skills')
    .optional()
    .isArray().withMessage('Skills must be an array')
    .custom((skills) => {
      if (skills.some(skill => typeof skill !== 'string')) {
        throw new Error('All skills must be strings');
      }
      return true;
    }),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Location must be less than 100 characters'),
  
  validate
];

/**
 * Job Creation Validation Rules
 */
const jobValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Job title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Job description is required')
    .isLength({ min: 50, max: 5000 }).withMessage('Description must be 50-5000 characters'),
  
  body('company')
    .trim()
    .notEmpty().withMessage('Company name is required'),
  
  body('location')
    .trim()
    .notEmpty().withMessage('Location is required'),
  
  body('type')
    .notEmpty().withMessage('Job type is required')
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'remote']).withMessage('Invalid job type'),
  
  body('salary.min')
    .optional()
    .isNumeric().withMessage('Minimum salary must be a number'),
  
  body('salary.max')
    .optional()
    .isNumeric().withMessage('Maximum salary must be a number'),
  
  body('requirements')
    .optional()
    .isArray().withMessage('Requirements must be an array'),
  
  validate
];

/**
 * Message Validation Rules
 */
const messageValidation = [
  body('receiverId')
    .notEmpty().withMessage('Receiver ID is required')
    .isMongoId().withMessage('Invalid receiver ID'),
  
  body('content')
    .trim()
    .notEmpty().withMessage('Message content is required')
    .isLength({ min: 1, max: 2000 }).withMessage('Message must be 1-2000 characters'),
  
  validate
];

/**
 * Search Query Validation
 */
const searchValidation = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Query must be 1-100 characters'),
  
  query('type')
    .optional()
    .isIn(['all', 'people', 'users', 'jobs', 'companies']).withMessage('Invalid search type'),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
    .toInt(),
  
  validate
];

/**
 * MongoDB ID Validation
 */
const mongoIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),
  
  validate
];

/**
 * Connection Request Validation
 */
const connectionValidation = [
  body('userId')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid user ID'),
  
  body('message')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('Message must be less than 300 characters'),
  
  validate
];

/**
 * Pagination Validation
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
    .toInt(),
  
  validate
];

/**
 * Custom Email Validator (checks against common typos)
 */
const validateEmail = (email) => {
  const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  const domain = email.split('@')[1];
  
  // Check for common typos
  const typos = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'outlok.com': 'outlook.com'
  };
  
  if (typos[domain]) {
    return { valid: false, suggestion: email.replace(domain, typos[domain]) };
  }
  
  return { valid: true };
};

/**
 * Password Strength Checker
 */
const checkPasswordStrength = (password) => {
  let strength = 0;
  const feedback = [];
  
  // Length
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (password.length < 8) feedback.push('Use at least 8 characters');
  
  // Character diversity
  if (/[a-z]/.test(password)) strength++;
  else feedback.push('Include lowercase letters');
  
  if (/[A-Z]/.test(password)) strength++;
  else feedback.push('Include uppercase letters');
  
  if (/\d/.test(password)) strength++;
  else feedback.push('Include numbers');
  
  if (/[@$!%*?&#]/.test(password)) strength++;
  else feedback.push('Include special characters');
  
  // Common patterns
  if (/(.)\1{2,}/.test(password)) {
    strength--;
    feedback.push('Avoid repeated characters');
  }
  
  if (/123|abc|qwerty|password/i.test(password)) {
    strength--;
    feedback.push('Avoid common patterns');
  }
  
  const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const level = levels[Math.min(strength, 5)];
  
  return {
    strength,
    level,
    feedback,
    score: Math.min(100, (strength / 6) * 100)
  };
};

/**
 * Sanitize User Input (prevent XSS)
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  profileUpdateValidation,
  jobValidation,
  messageValidation,
  searchValidation,
  mongoIdValidation,
  connectionValidation,
  paginationValidation,
  validateEmail,
  checkPasswordStrength,
  sanitizeInput
};
