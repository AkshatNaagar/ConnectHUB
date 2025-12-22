const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJob,
  updateJob,
  deleteJob,
  applyForJob,
  getMyApplications,
  acceptApplication,
  rejectApplication
} = require('../controllers/jobController');
const { protect, optionalAuth } = require('../middlewares/authMiddleware');
const { restrictToCompany } = require('../middlewares/roleMiddleware');
const { jobValidation, mongoIdValidation } = require('../utils/validate');

// Public routes (with optional auth)
router.get('/', optionalAuth, getJobs);
router.get('/:id', optionalAuth, mongoIdValidation, getJob);

// Protected routes
router.post('/', protect, restrictToCompany, (req, res, next) => {
  console.log('📥 Job POST request body:', req.body);
  next();
}, jobValidation, createJob);
router.put('/:id', protect, mongoIdValidation, updateJob);
router.delete('/:id', protect, mongoIdValidation, deleteJob);
router.post('/:id/apply', protect, mongoIdValidation, applyForJob);

// Application management routes (for recruiters)
router.get('/applications/my', protect, restrictToCompany, getMyApplications);
router.post('/:jobId/applications/:applicationId/accept', protect, restrictToCompany, acceptApplication);
router.post('/:jobId/applications/:applicationId/reject', protect, restrictToCompany, rejectApplication);

module.exports = router;
