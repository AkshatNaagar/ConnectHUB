const Message = require('../models/Message');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { processAutoReply } = require('../utils/autoReply');

// Send message
const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, content, messageType, attachment } = req.body;
  
  const conversationId = Message.getConversationId(req.user._id, receiverId);
  
  const message = await Message.create({
    sender: req.user._id,
    receiver: receiverId,
    content,
    messageType: messageType || 'text',
    attachment,
    conversationId
  });
  
  await message.populate('sender receiver', 'name profilePicture');
  
  // Trigger auto-reply for sample users (non-blocking)
  processAutoReply(message._id).catch(err => {
    console.error('Auto-reply error:', err);
  });
  
  res.status(201).json({
    success: true,
    data: { message }
  });
});

// Get conversation
const getConversation = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  
  const messages = await Message.getConversation(req.user._id, userId, {
    page: parseInt(page),
    limit: parseInt(limit)
  });
  
  res.json({
    success: true,
    data: { messages }
  });
});

// Get all conversations
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Message.getUserConversations(req.user._id);
  
  res.json({
    success: true,
    data: { conversations }
  });
});

// Mark messages as read
const markAsRead = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const conversationId = Message.getConversationId(req.user._id, userId);
  
  await Message.markAsRead(conversationId, req.user._id);
  
  res.json({
    success: true,
    message: 'Messages marked as read'
  });
});

// Get unread count
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Message.getUnreadCount(req.user._id);
  
  res.json({
    success: true,
    data: { unreadCount: count }
  });
});

module.exports = {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
  getUnreadCount
};
