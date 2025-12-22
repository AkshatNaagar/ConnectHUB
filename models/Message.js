const mongoose = require('mongoose');

/**
 * =====================================================
 * MESSAGE MODEL - Real-time Chat System
 * =====================================================
 */

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    minlength: [1, 'Message cannot be empty'],
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'link'],
    default: 'text'
  },
  
  attachment: {
    url: String,
    filename: String,
    size: Number,
    mimeType: String
  },
  
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  readAt: {
    type: Date
  },
  
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  conversationId: {
    type: String,
    required: true,
    index: true
  }

}, {
  timestamps: true
});

/**
 * INDEXES FOR MESSAGE QUERIES
 */

// Compound index for conversation queries
messageSchema.index({ conversationId: 1, createdAt: -1 });

// Compound index for unread messages
messageSchema.index({ receiver: 1, isRead: 1 });

// Compound index for user's conversations
messageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

/**
 * STATIC METHOD - Generate Conversation ID
 * Creates consistent ID for conversation between two users
 */
messageSchema.statics.getConversationId = function(user1Id, user2Id) {
  // Sort IDs to ensure same conversation ID regardless of order
  const ids = [user1Id.toString(), user2Id.toString()].sort();
  return `${ids[0]}_${ids[1]}`;
};

/**
 * STATIC METHOD - Get Conversation
 */
messageSchema.statics.getConversation = function(user1Id, user2Id, options = {}) {
  const { page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;
  
  const conversationId = this.getConversationId(user1Id, user2Id);
  
  return this.find({ 
    conversationId,
    deletedBy: { $nin: [user1Id] } // Don't show messages deleted by current user
  })
  .sort({ createdAt: 1 })
  .skip(skip)
  .limit(limit)
  .populate('sender receiver', 'name profilePicture');
};

/**
 * STATIC METHOD - Get User's Conversations List
 */
messageSchema.statics.getUserConversations = async function(userId) {
  const conversations = await this.aggregate([
    {
      $match: {
        $or: [{ sender: mongoose.Types.ObjectId(userId) }, { receiver: mongoose.Types.ObjectId(userId) }],
        deletedBy: { $nin: [mongoose.Types.ObjectId(userId)] }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $first: '$$ROOT' },
        unreadCount: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$receiver', mongoose.Types.ObjectId(userId)] },
                { $eq: ['$isRead', false] }
              ]},
              1,
              0
            ]
          }
        }
      }
    },
    {
      $sort: { 'lastMessage.createdAt': -1 }
    }
  ]);
  
  return conversations;
};

/**
 * STATIC METHOD - Mark Messages as Read
 */
messageSchema.statics.markAsRead = function(conversationId, userId) {
  return this.updateMany(
    {
      conversationId,
      receiver: userId,
      isRead: false
    },
    {
      $set: {
        isRead: true,
        readAt: new Date()
      }
    }
  );
};

/**
 * STATIC METHOD - Delete Message for User
 */
messageSchema.statics.deleteForUser = function(messageId, userId) {
  return this.findByIdAndUpdate(
    messageId,
    {
      $addToSet: { deletedBy: userId }
    }
  );
};

/**
 * STATIC METHOD - Get Unread Count
 */
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    receiver: userId,
    isRead: false,
    deletedBy: { $nin: [userId] }
  });
};

/**
 * STATIC METHOD - Search Messages
 */
messageSchema.statics.searchMessages = function(userId, query, options = {}) {
  const { limit = 20 } = options;
  
  return this.find({
    $or: [{ sender: userId }, { receiver: userId }],
    content: new RegExp(query, 'i'),
    deletedBy: { $nin: [userId] }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('sender receiver', 'name profilePicture');
};

/**
 * MIDDLEWARE - Auto-delete messages after 30 days if both users deleted
 */
messageSchema.pre('save', function(next) {
  // If both sender and receiver deleted the message, mark for permanent deletion
  if (this.deletedBy && this.deletedBy.length >= 2) {
    this.isDeleted = true;
  }
  next();
});

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;

/**
 * ========================================================
 * REAL-TIME MESSAGING ARCHITECTURE
 * ========================================================
 * 
 * 1. WEBSOCKETS vs HTTP:
 * ---------------------
 * HTTP:
 * - Request-response model
 * - Client initiates every request
 * - Polling required for updates
 * - Higher latency
 * 
 * WebSocket:
 * - Persistent bi-directional connection
 * - Server can push messages
 * - Real-time updates
 * - Lower latency
 * - Better for: Chat, notifications, live feeds
 * 
 * 
 * 2. SOCKET.IO OVERVIEW:
 * ---------------------
 * - Built on top of WebSocket
 * - Fallbacks to HTTP long-polling
 * - Automatic reconnection
 * - Room/namespace support
 * - Event-based communication
 * 
 * 
 * 3. SOCKET.IO EVENTS:
 * -------------------
 * Built-in events:
 * - connect: Client connected
 * - disconnect: Client disconnected
 * - error: Error occurred
 * 
 * Custom events:
 * - send_message: User sends message
 * - receive_message: User receives message
 * - typing: User is typing
 * - read_receipt: Message read
 * 
 * 
 * 4. ROOMS & NAMESPACES:
 * ---------------------
 * ROOMS:
 * - Channels that sockets can join/leave
 * - Used for: Private chats, group chats
 * 
 * socket.join('conversation_123');
 * io.to('conversation_123').emit('message', data);
 * 
 * NAMESPACES:
 * - Separate communication channels
 * - Used for: Different features (chat, notifications)
 * 
 * const chatNamespace = io.of('/chat');
 * const notificationNamespace = io.of('/notifications');
 * 
 * 
 * 5. MESSAGE FLOW:
 * ---------------
 * 
 * Sending Message:
 * 1. Client emits 'send_message' event
 * 2. Server validates and saves to MongoDB
 * 3. Server emits 'receive_message' to receiver's room
 * 4. Both clients update UI
 * 5. Optional: Cache recent messages in Redis
 * 
 * Read Receipt:
 * 1. Receiver views message
 * 2. Client emits 'mark_read' event
 * 3. Server updates isRead in MongoDB
 * 4. Server emits 'read_receipt' to sender
 * 
 * Typing Indicator:
 * 1. Client emits 'typing' event
 * 2. Server broadcasts to receiver only
 * 3. No database save (transient state)
 * 
 * 
 * 6. SOCKET.IO AUTHENTICATION:
 * ---------------------------
 * 
 * Using middleware:
 * io.use((socket, next) => {
 *   const token = socket.handshake.auth.token;
 *   try {
 *     const decoded = verifyAccessToken(token);
 *     socket.userId = decoded.userId;
 *     next();
 *   } catch (err) {
 *     next(new Error('Authentication failed'));
 *   }
 * });
 * 
 * 
 * 7. SCALING SOCKET.IO:
 * --------------------
 * 
 * Problem: Multiple server instances don't share socket connections
 * 
 * Solution: Redis Adapter
 * - Synchronizes events across instances
 * - Allows horizontal scaling
 * 
 * const { createAdapter } = require('@socket.io/redis-adapter');
 * const { createClient } = require('redis');
 * 
 * const pubClient = createClient({ url: 'redis://localhost:6379' });
 * const subClient = pubClient.duplicate();
 * 
 * io.adapter(createAdapter(pubClient, subClient));
 * 
 * 
 * 8. REDIS FOR CHAT:
 * -----------------
 * 
 * Use Cases:
 * 
 * a) Online Users:
 * - Store online users in Redis Set
 * - Fast presence checks
 * redis.sadd('online_users', userId);
 * 
 * b) Recent Messages Cache:
 * - Cache last 50 messages per conversation
 * - Faster loading
 * redis.lpush(`conv:${conversationId}`, JSON.stringify(message));
 * redis.ltrim(`conv:${conversationId}`, 0, 49);
 * 
 * c) Typing Status:
 * - Temporary status with TTL
 * redis.setex(`typing:${conversationId}:${userId}`, 5, '1');
 * 
 * d) Unread Counts:
 * - Quick access to unread counts
 * redis.hincrby(`unread:${userId}`, conversationId, 1);
 * 
 * 
 * 9. MESSAGE OPTIMIZATION:
 * -----------------------
 * 
 * ✓ Lazy Loading: Load messages on scroll
 * ✓ Pagination: 50 messages per page
 * ✓ Caching: Redis for recent messages
 * ✓ Compression: Gzip for message content
 * ✓ Indexing: Conversation ID + timestamp
 * ✓ Cleanup: Delete old messages
 * 
 * 
 * 10. SECURITY CONSIDERATIONS:
 * ---------------------------
 * 
 * ✓ Authenticate socket connections
 * ✓ Validate all incoming events
 * ✓ Sanitize message content (XSS)
 * ✓ Rate limiting on events
 * ✓ Encrypt sensitive messages
 * ✓ Check permissions (can user message this person?)
 * ✓ CORS configuration
 * 
 * 
 * 11. ERROR HANDLING:
 * ------------------
 * 
 * Connection errors:
 * socket.on('connect_error', (err) => {
 *   console.log('Connection error:', err.message);
 *   // Implement retry logic
 * });
 * 
 * Event errors:
 * socket.on('error', (err) => {
 *   console.log('Socket error:', err);
 * });
 * 
 * Graceful disconnection:
 * socket.on('disconnect', (reason) => {
 *   if (reason === 'io server disconnect') {
 *     // Server initiated, attempt reconnect
 *     socket.connect();
 *   }
 * });
 */
