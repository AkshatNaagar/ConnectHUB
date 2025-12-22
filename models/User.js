const mongoose = require('mongoose');

/**
 * =====================================================
 * USER MODEL - COMPLETE SCHEMA WITH DETAILED COMMENTS
 * =====================================================
 * 
 * Mongoose Schema: Defines the structure of documents in MongoDB
 * 
 * Schema Options:
 * - timestamps: Adds createdAt and updatedAt fields automatically
 * - toJSON: Transforms document when converting to JSON
 * 
 * Indexes: Improve query performance
 * - Single field index: { field: 1 }
 * - Compound index: { field1: 1, field2: -1 }
 * - Text index: { field: 'text' }
 * - Unique index: { field: 1, unique: true }
 */

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    index: true // Single field index for faster email lookups
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },
  
  role: {
    type: String,
    enum: {
      values: ['user', 'company', 'admin'],
      message: '{VALUE} is not a valid role'
    },
    default: 'user',
    index: true
  },
  
  bio: {
    type: String,
    maxlength: [5000, 'Bio cannot exceed 5000 characters'],
    default: ''
  },
  
  profilePicture: {
    type: String,
    default: '/images/default-avatar.png'
  },
  
  coverPhoto: {
    type: String,
    default: ''
  },
  
  skills: [{
    type: String,
    trim: true
  }],
  
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters'],
    default: ''
  },
  
  headline: {
    type: String,
    maxlength: [120, 'Headline cannot exceed 120 characters'],
    default: ''
  },
  
  experience: {
    type: [{
      title: {
        type: String,
        required: true
      },
      company: {
        type: String,
        required: true
      },
      location: String,
      startDate: {
        type: Date,
        required: true
      },
      endDate: Date,
      current: {
        type: Boolean,
        default: false
      },
      description: String
    }],
    default: []
  },
  
  education: {
    type: [{
      school: {
        type: String,
        required: true
      },
      degree: {
        type: String,
        required: true
      },
      field: String,
      startDate: {
        type: Date,
        required: true
      },
      endDate: Date,
      current: {
        type: Boolean,
        default: false
      },
      description: String
    }],
    default: []
  },
  
  connections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  pendingRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  sentRequests: [{
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // For company accounts
  companyInfo: {
    companyName: String,
    industry: String,
    companySize: String,
    website: String,
    description: String
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verificationToken: String,
  
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  
  // Token version for invalidation
  tokenVersion: {
    type: Number,
    default: 0
  },
  
  lastLogin: {
    type: Date
  },
  
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  lockUntil: Date

}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: {
    transform: function(doc, ret) {
      // Remove sensitive fields when converting to JSON
      delete ret.password;
      delete ret.verificationToken;
      delete ret.resetPasswordToken;
      delete ret.tokenVersion;
      return ret;
    }
  }
});

/**
 * INDEXES FOR PERFORMANCE OPTIMIZATION
 * 
 * Why indexes?
 * - Speed up queries significantly
 * - Trade-off: Slower writes, more storage
 * - Use for frequently queried fields
 * 
 * Types of indexes:
 * 1. Single Field: Fast lookup on one field
 * 2. Compound: Queries on multiple fields together
 * 3. Text: Full-text search capabilities
 * 4. Geospatial: Location-based queries
 */

// Text index for search functionality
userSchema.index({ 
  name: 'text', 
  headline: 'text', 
  bio: 'text',
  skills: 'text'
});

// Compound index for role-based queries with location
userSchema.index({ role: 1, location: 1 });

// Index for connection lookups
userSchema.index({ connections: 1 });

/**
 * VIRTUAL FIELDS
 * Fields that are computed but not stored in database
 */
userSchema.virtual('connectionCount').get(function() {
  return this.connections ? this.connections.length : 0;
});

userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

/**
 * INSTANCE METHODS
 * Methods available on document instances
 */

// Increment login attempts and lock account if needed
userSchema.methods.incLoginAttempts = function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  // Lock account after max attempts
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

/**
 * STATIC METHODS
 * Methods available on the model itself
 */

// Find users by skill
userSchema.statics.findBySkill = function(skill) {
  return this.find({ skills: skill });
};

// Search users with text search
userSchema.statics.searchUsers = function(query, options = {}) {
  const { limit = 20, page = 1 } = options;
  const skip = (page - 1) * limit;
  
  return this.find(
    { $text: { $search: query } },
    { score: { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } })
  .skip(skip)
  .limit(limit)
  .select('-password');
};

/**
 * MIDDLEWARE (HOOKS)
 * Functions that run before/after certain operations
 */

// Pre-save middleware example (password hashing done in controller)
userSchema.pre('save', function(next) {
  // Update lastLogin only when explicitly set
  if (this.isModified('lastLogin')) {
    console.log(`User ${this.email} logged in`);
  }
  next();
});

// Post-save middleware example
userSchema.post('save', function(doc, next) {
  console.log(`User ${doc.name} has been saved`);
  next();
});

// Pre-remove middleware to cleanup related data
userSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  // Remove user from all connections
  await this.model('User').updateMany(
    { connections: this._id },
    { $pull: { connections: this._id } }
  );
  
  // Delete user's jobs
  await this.model('Job').deleteMany({ postedBy: this._id });
  
  // Delete user's messages
  await this.model('Message').deleteMany({
    $or: [{ sender: this._id }, { receiver: this._id }]
  });
  
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;

/**
 * ========================================================
 * MONGODB SCHEMA FEATURES & BEST PRACTICES
 * ========================================================
 * 
 * 1. SCHEMA TYPES:
 * ---------------
 * - String: Text data
 * - Number: Integers and decimals
 * - Date: Timestamps
 * - Boolean: true/false
 * - ObjectId: References to other documents
 * - Array: Lists of values
 * - Mixed: Any data type (use sparingly)
 * - Buffer: Binary data
 * - Map: Key-value pairs
 * 
 * 
 * 2. SCHEMA OPTIONS:
 * -----------------
 * required: [true, 'Error message']
 * unique: true
 * default: value or function
 * validate: Custom validation function
 * enum: Array of allowed values
 * min/max: For numbers
 * minlength/maxlength: For strings
 * match: Regex pattern for strings
 * trim: Remove whitespace
 * lowercase/uppercase: Transform text
 * index: Create index on field
 * select: Include/exclude by default
 * 
 * 
 * 3. VIRTUALS:
 * -----------
 * - Computed properties not stored in DB
 * - Useful for derived data
 * - Can have getters and setters
 * - Not included in toJSON by default (need to enable)
 * 
 * 
 * 4. MIDDLEWARE (HOOKS):
 * ---------------------
 * Document middleware:
 * - save, validate, remove, updateOne, deleteOne
 * 
 * Query middleware:
 * - find, findOne, findOneAndUpdate, etc.
 * 
 * Aggregate middleware:
 * - aggregate
 * 
 * Model middleware:
 * - insertMany
 * 
 * 
 * 5. POPULATION:
 * -------------
 * Load referenced documents
 * 
 * user.populate('connections')
 * 
 * OR in query:
 * User.find().populate('connections')
 * 
 * Populate specific fields:
 * .populate('connections', 'name email profilePicture')
 * 
 * Nested population:
 * .populate({
 *   path: 'connections',
 *   populate: { path: 'company' }
 * })
 * 
 * 
 * 6. INDEXING STRATEGIES:
 * ----------------------
 * 
 * When to index:
 * ✓ Fields used in queries frequently
 * ✓ Fields used in sorting
 * ✓ Fields used for uniqueness
 * ✓ Foreign keys (references)
 * 
 * When NOT to index:
 * ✗ Fields that change frequently
 * ✗ Small collections (< 1000 docs)
 * ✗ Fields with low cardinality (few unique values)
 * 
 * 
 * 7. EMBEDDED vs REFERENCED DATA:
 * ------------------------------
 * 
 * EMBEDDED (Nested documents):
 * Use when:
 * - Data is accessed together
 * - One-to-few relationships
 * - Data doesn't grow unbounded
 * 
 * Example: experience, education in User
 * 
 * REFERENCED (ObjectId references):
 * Use when:
 * - Many-to-many relationships
 * - Data accessed independently
 * - Data grows unbounded
 * - Need to avoid duplication
 * 
 * Example: connections, jobs
 * 
 * 
 * 8. SCHEMA VALIDATION:
 * --------------------
 * Built-in:
 * - required, min, max, enum, match
 * 
 * Custom:
 * validate: {
 *   validator: function(v) {
 *     return v.length > 0;
 *   },
 *   message: 'Array cannot be empty'
 * }
 * 
 * 
 * 9. SELECTING FIELDS:
 * -------------------
 * Include: User.find().select('name email')
 * Exclude: User.find().select('-password -tokenVersion')
 * 
 * Default exclusion in schema:
 * password: { type: String, select: false }
 * 
 * Force include: User.findById(id).select('+password')
 * 
 * 
 * 10. PERFORMANCE TIPS:
 * --------------------
 * ✓ Use lean() for read-only queries (returns plain JS objects)
 * ✓ Use select() to limit fields
 * ✓ Use indexes for frequently queried fields
 * ✓ Use pagination for large result sets
 * ✓ Use projection in queries
 * ✓ Avoid deep population
 * ✓ Use explain() to analyze queries
 * ✓ Monitor slow queries
 * ✓ Use aggregation pipeline for complex queries
 */
