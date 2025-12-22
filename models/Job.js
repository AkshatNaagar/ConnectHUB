const mongoose = require('mongoose');

/**
 * =====================================================
 * JOB MODEL - Professional Job Postings
 * =====================================================
 */

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [100, 'Title cannot exceed 100 characters'],
    index: true
  },
  
  description: {
    type: String,
    required: [true, 'Job description is required'],
    minlength: [50, 'Description must be at least 50 characters'],
    maxlength: [5000, 'Description cannot exceed 5000 characters']
  },
  
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    index: true
  },
  
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    index: true
  },
  
  type: {
    type: String,
    required: true,
    enum: {
      values: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
      message: '{VALUE} is not a valid job type'
    },
    index: true
  },
  
  experienceLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'lead', 'executive'],
    default: 'entry'
  },
  
  salary: {
    min: {
      type: Number,
      min: 0
    },
    max: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    period: {
      type: String,
      enum: ['hourly', 'monthly', 'yearly'],
      default: 'yearly'
    }
  },
  
  requirements: [{
    type: String,
    trim: true
  }],
  
  responsibilities: [{
    type: String,
    trim: true
  }],
  
  benefits: [{
    type: String,
    trim: true
  }],
  
  skills: [{
    type: String,
    trim: true
  }],
  
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  applications: [{
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'shortlisted', 'rejected', 'accepted'],
      default: 'pending'
    },
    coverLetter: String,
    resume: String
  }],
  
  status: {
    type: String,
    enum: ['active', 'closed', 'filled', 'draft'],
    default: 'active',
    index: true
  },
  
  deadline: {
    type: Date
  },
  
  views: {
    type: Number,
    default: 0
  },
  
  isRemote: {
    type: Boolean,
    default: false,
    index: true
  },
  
  industry: {
    type: String,
    trim: true
  },
  
  tags: [{
    type: String,
    trim: true
  }]

}, {
  timestamps: true
});

/**
 * INDEXES FOR JOB SEARCH OPTIMIZATION
 */

// Text index for full-text search
jobSchema.index({
  title: 'text',
  description: 'text',
  company: 'text',
  skills: 'text',
  tags: 'text'
});

// Compound indexes for common queries
jobSchema.index({ status: 1, createdAt: -1 }); // Active jobs, newest first
jobSchema.index({ type: 1, location: 1 }); // Filter by type and location
jobSchema.index({ company: 1, status: 1 }); // Company's active jobs
jobSchema.index({ postedBy: 1, createdAt: -1 }); // User's posted jobs

/**
 * VIRTUAL FIELDS
 */
jobSchema.virtual('applicationCount').get(function() {
  return this.applications ? this.applications.length : 0;
});

jobSchema.virtual('isExpired').get(function() {
  return this.deadline && this.deadline < Date.now();
});

/**
 * INSTANCE METHODS
 */

// Check if user has applied
jobSchema.methods.hasUserApplied = function(userId) {
  return this.applications.some(
    app => app.applicant.toString() === userId.toString()
  );
};

// Increment view count
jobSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

/**
 * STATIC METHODS
 */

// Search jobs with filters
jobSchema.statics.searchJobs = function(filters, options = {}) {
  const {
    query,
    type,
    location,
    isRemote,
    minSalary,
    maxSalary,
    experienceLevel,
    status = 'active',
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = -1
  } = options;

  const searchQuery = { status };

  // Text search
  if (query) {
    searchQuery.$text = { $search: query };
  }

  // Filters
  if (type) searchQuery.type = type;
  if (location) searchQuery.location = new RegExp(location, 'i');
  if (isRemote !== undefined) searchQuery.isRemote = isRemote;
  if (experienceLevel) searchQuery.experienceLevel = experienceLevel;
  
  // Salary range
  if (minSalary) searchQuery['salary.min'] = { $gte: minSalary };
  if (maxSalary) searchQuery['salary.max'] = { $lte: maxSalary };

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };

  return this.find(searchQuery)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('postedBy', 'name email companyInfo.companyName');
};

// Get recommended jobs for user based on skills
jobSchema.statics.getRecommendedJobs = function(userSkills, limit = 10) {
  return this.find({
    status: 'active',
    skills: { $in: userSkills }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('postedBy', 'name companyInfo.companyName');
};

/**
 * MIDDLEWARE
 */

// Update status to closed if deadline passed
jobSchema.pre('save', function(next) {
  if (this.deadline && this.deadline < Date.now() && this.status === 'active') {
    this.status = 'closed';
  }
  next();
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;

/**
 * ========================================================
 * JOB SEARCH & FILTERING OPTIMIZATION
 * ========================================================
 * 
 * 1. TEXT SEARCH:
 * --------------
 * Text indexes allow full-text search across multiple fields
 * 
 * Usage:
 * Job.find({ $text: { $search: 'software engineer' } })
 * 
 * Text Score (relevance):
 * Job.find(
 *   { $text: { $search: 'developer' } },
 *   { score: { $meta: 'textScore' } }
 * ).sort({ score: { $meta: 'textScore' } })
 * 
 * 
 * 2. COMPOUND INDEXES:
 * -------------------
 * Multiple fields indexed together for common queries
 * 
 * Example: { type: 1, location: 1 }
 * Optimizes: Job.find({ type: 'full-time', location: 'New York' })
 * 
 * Index order matters:
 * - Put equality filters first
 * - Then sort fields
 * - Then range filters
 * 
 * 
 * 3. FILTER OPTIMIZATION:
 * ----------------------
 * Use indexes for filters:
 * ✓ type (indexed)
 * ✓ location (indexed)
 * ✓ isRemote (indexed)
 * ✓ status (indexed)
 * 
 * Use $in for multiple values:
 * { type: { $in: ['full-time', 'contract'] } }
 * 
 * Use $gte/$lte for ranges:
 * { 'salary.min': { $gte: 50000, $lte: 100000 } }
 * 
 * 
 * 4. PAGINATION:
 * -------------
 * Always use skip() and limit() for large result sets
 * 
 * const page = 2;
 * const limit = 20;
 * const skip = (page - 1) * limit;
 * 
 * Job.find().skip(skip).limit(limit)
 * 
 * 
 * 5. SORTING:
 * ----------
 * Common sort options:
 * - Newest first: { createdAt: -1 }
 * - Relevance: { score: { $meta: 'textScore' } }
 * - Salary high to low: { 'salary.max': -1 }
 * - Most viewed: { views: -1 }
 * 
 * 
 * 6. QUERY PERFORMANCE TIPS:
 * -------------------------
 * ✓ Use lean() for read-only: .lean()
 * ✓ Select only needed fields: .select('title company location')
 * ✓ Use indexes for all filters
 * ✓ Avoid $where and $regex without anchors
 * ✓ Use aggregation for complex queries
 * ✓ Cache frequently accessed data (Redis)
 * 
 * 
 * 7. AGGREGATION PIPELINE EXAMPLE:
 * -------------------------------
 * For complex queries like "jobs grouped by company":
 * 
 * Job.aggregate([
 *   { $match: { status: 'active' } },
 *   { $group: {
 *     _id: '$company',
 *     count: { $sum: 1 },
 *     jobs: { $push: { title: '$title', _id: '$_id' } }
 *   }},
 *   { $sort: { count: -1 } },
 *   { $limit: 10 }
 * ])
 */
