const express = require('express');
const router = express.Router();
const {
  createPost,
  getFeedPosts,
  getUserPosts,
  toggleLike,
  addComment,
  deletePost,
  deleteComment,
  getSuggestedConnections,
  upload
} = require('../controllers/postController');
const { protect } = require('../middlewares/authMiddleware');
const { body } = require('express-validator');
const { validate } = require('../utils/validate');

// Post validation
const postValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Post content is required')
    .isLength({ max: 5000 }).withMessage('Post content cannot exceed 5000 characters'),
  validate
];

const commentValidation = [
  body('content')
    .trim()
    .notEmpty().withMessage('Comment content is required')
    .isLength({ max: 1000 }).withMessage('Comment cannot exceed 1000 characters'),
  validate
];

// Routes
router.post('/', protect, upload.array('images', 5), postValidation, createPost);
router.get('/feed', protect, getFeedPosts);
router.get('/user/:userId', protect, getUserPosts);
router.post('/:postId/like', protect, toggleLike);
router.post('/:postId/comment', protect, commentValidation, addComment);
router.delete('/:postId', protect, deletePost);
router.delete('/:postId/comment/:commentId', protect, deleteComment);
router.get('/suggestions/connections', protect, getSuggestedConnections);

module.exports = router;
