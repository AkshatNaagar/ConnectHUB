const express = require('express');
const router = express.Router();
const { search, getRecommendations } = require('../controllers/featureController');
const { protect } = require('../middlewares/authMiddleware');
const { searchValidation } = require('../utils/validate');

// Protected search route
router.get('/', protect, searchValidation, search);

// Get recommendations
router.get('/recommendations', protect, getRecommendations);

module.exports = router;
