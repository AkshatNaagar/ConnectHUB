const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateProfile,
  sendConnectionRequest,
  acceptConnectionRequest,
  getConnections,
  upload
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const { profileUpdateValidation, connectionValidation } = require('../utils/validate');

// Add logging middleware for debugging
router.use((req, res, next) => {
  console.log(`[USER ROUTE] ${req.method} ${req.path}`);
  next();
});

// Connection routes - MUST come before /:id routes
router.post('/connect', protect, connectionValidation, sendConnectionRequest);
router.post('/connect/accept', protect, acceptConnectionRequest);
router.post('/connect/reject', protect, require('../controllers/userController').rejectConnectionRequest);
router.get('/connections/pending', protect, require('../controllers/userController').getPendingRequests);
router.get('/connections/sent', protect, require('../controllers/userController').getSentRequests);
router.get('/connections', protect, getConnections);

// Profile update with file upload
router.put('/profile', (req, res, next) => {
  console.log('[PROFILE UPDATE] Starting...');
  next();
}, protect, (req, res, next) => {
  console.log('[PROFILE UPDATE] After protect middleware');
  next();
}, upload.single('profilePicture'), (req, res, next) => {
  console.log('[PROFILE UPDATE] After multer middleware');
  console.log('[PROFILE UPDATE] File:', req.file);
  next();
}, updateProfile);

// Dynamic routes - MUST come after specific routes
router.get('/:id', protect, getUserProfile);
router.get('/:id/connections', protect, getConnections);

module.exports = router;
