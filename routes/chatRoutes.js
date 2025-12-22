const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  getUnreadCount
} = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');
const { messageValidation } = require('../utils/validate');

// All routes protected
router.post('/', protect, messageValidation, sendMessage);
router.get('/', protect, getConversations);
router.get('/unread-count', protect, getUnreadCount);
router.get('/:userId', protect, getConversation);
router.put('/:userId/read', protect, markAsRead);

module.exports = router;
