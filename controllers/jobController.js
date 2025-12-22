const Job = require('../models/Job');
const { cacheHelpers } = require('../config/redis');
const { asyncHandler, NotFoundError, AuthorizationError, ConflictError } = require('../middlewares/errorMiddleware');

// Create job posting
const createJob = asyncHandler(async (req, res) => {
  console.log('📥 Received job data:', req.body);
  
  const jobData = {
    ...req.body,
    postedBy: req.user._id
  };
  
  console.log('📝 Creating job with data:', jobData);
  
  try {
    const job = await Job.create(jobData);
    
    // Invalidate jobs cache
    await cacheHelpers.delPattern('jobs:*');
    
    console.log('✅ Job created successfully:', job._id);
    
    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: { job }
    });
  } catch (error) {
    console.error('❌ Error creating job:', error.message);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      console.error('Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: errors.join(', ')
      });
    }
    throw error;
  }
});

// Get all jobs with filters
const getJobs = asyncHandler(async (req, res) => {
  const { query, type, location, page = 1, limit = 20 } = req.query;
  
  const cacheKey = `jobs:${JSON.stringify(req.query)}`;
  
  // Check cache
  let result = await cacheHelpers.get(cacheKey);
  
  if (!result) {
    const jobs = await Job.searchJobs({}, {
      query,
      type,
      location,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    const total = await Job.countDocuments({ status: 'active' });
    
    result = { jobs, total, page: parseInt(page), limit: parseInt(limit) };
    
    // Cache for 5 minutes
    await cacheHelpers.set(cacheKey, result, 300);
  }
  
  res.json({
    success: true,
    data: result
  });
});

// Get single job
const getJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id)
    .populate('postedBy', 'name email companyInfo');
  
  if (!job) {
    throw new NotFoundError('Job not found');
  }
  
  // Increment view count
  await job.incrementViews();
  
  res.json({
    success: true,
    data: { job }
  });
});

// Update job
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  
  if (!job) {
    throw new NotFoundError('Job not found');
  }
  
  if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AuthorizationError('Not authorized to update this job');
  }
  
  Object.assign(job, req.body);
  await job.save();
  
  await cacheHelpers.delPattern('jobs:*');
  
  res.json({
    success: true,
    message: 'Job updated successfully',
    data: { job }
  });
});

// Delete job
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  
  if (!job) {
    throw new NotFoundError('Job not found');
  }
  
  if (job.postedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AuthorizationError('Not authorized to delete this job');
  }
  
  await job.deleteOne();
  await cacheHelpers.delPattern('jobs:*');
  
  res.json({
    success: true,
    message: 'Job deleted successfully'
  });
});

// Apply for job
const applyForJob = asyncHandler(async (req, res) => {
  const { coverLetter } = req.body;
  const job = await Job.findById(req.params.id);
  
  if (!job) {
    throw new NotFoundError('Job not found');
  }
  
  // Check if already applied
  if (job.hasUserApplied(req.user._id)) {
    throw new ConflictError('You have already applied for this job');
  }
  
  job.applications.push({
    applicant: req.user._id,
    coverLetter,
    status: 'pending'
  });
  
  await job.save();
  
  res.json({
    success: true,
    message: 'Application submitted successfully'
  });
});

// Get all applications for recruiter's jobs
const getMyApplications = asyncHandler(async (req, res) => {
  const jobs = await Job.find({ postedBy: req.user._id })
    .select('title applications')
    .populate('applications.applicant', 'name email profile');
  
  const allApplications = [];
  jobs.forEach(job => {
    job.applications.forEach(app => {
      allApplications.push({
        _id: app._id,
        jobId: job._id,
        jobTitle: job.title,
        applicant: app.applicant,
        appliedAt: app.appliedAt,
        status: app.status,
        coverLetter: app.coverLetter
      });
    });
  });
  
  res.json({
    success: true,
    data: { applications: allApplications }
  });
});

// Accept application
const acceptApplication = asyncHandler(async (req, res) => {
  const { jobId, applicationId } = req.params;
  const Message = require('../models/Message');
  
  const job = await Job.findById(jobId).populate('applications.applicant', 'name');
  
  if (!job) {
    throw new NotFoundError('Job not found');
  }
  
  if (job.postedBy.toString() !== req.user._id.toString()) {
    throw new AuthorizationError('Not authorized');
  }
  
  const application = job.applications.id(applicationId);
  if (!application) {
    throw new NotFoundError('Application not found');
  }
  
  application.status = 'accepted';
  await job.save();
  
  // Send notification message
  const conversationId = Message.getConversationId(req.user._id, application.applicant._id);
  await Message.create({
    sender: req.user._id,
    receiver: application.applicant._id,
    content: `🎉 Congratulations! Your application for "${job.title}" has been accepted. We will contact you soon with next steps.`,
    conversationId
  });
  
  res.json({
    success: true,
    message: 'Application accepted and notification sent'
  });
});

// Reject application
const rejectApplication = asyncHandler(async (req, res) => {
  const { jobId, applicationId } = req.params;
  const Message = require('../models/Message');
  
  const job = await Job.findById(jobId).populate('applications.applicant', 'name');
  
  if (!job) {
    throw new NotFoundError('Job not found');
  }
  
  if (job.postedBy.toString() !== req.user._id.toString()) {
    throw new AuthorizationError('Not authorized');
  }
  
  const application = job.applications.id(applicationId);
  if (!application) {
    throw new NotFoundError('Application not found');
  }
  
  application.status = 'rejected';
  await job.save();
  
  // Send notification message
  const conversationId = Message.getConversationId(req.user._id, application.applicant._id);
  await Message.create({
    sender: req.user._id,
    receiver: application.applicant._id,
    content: `Sorry, your application for "${job.title}" has been rejected. Thank you for your interest.`,
    conversationId
  });
  
  res.json({
    success: true,
    message: 'Application rejected and notification sent'
  });
});

module.exports = {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  applyForJob,
  getMyApplications,
  acceptApplication,
  rejectApplication
};
