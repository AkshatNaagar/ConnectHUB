require('dotenv').config();
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');
const app = require('./app');
const connectDB = require('./config/db');
const { connectRedis, redisClient } = require('./config/redis');
const { verifyAccessToken } = require('./utils/generateToken');
const Message = require('./models/Message');

const PORT = process.env.PORT || 3000;
const HTTPS_ENABLED = process.env.HTTPS_ENABLED === 'true';
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

console.log('🔍 Environment Check:');
console.log('   HTTPS_ENABLED env var:', process.env.HTTPS_ENABLED);
console.log('   HTTPS_ENABLED parsed:', HTTPS_ENABLED);
console.log('   HTTPS_PORT:', HTTPS_PORT);

// Create HTTP server (always available)
const httpServer = http.createServer(app);

// Create HTTPS server (if enabled and certificates available)
let httpsServer = null;
if (HTTPS_ENABLED) {
  try {
    const keyPath = path.resolve(__dirname, process.env.SSL_KEY_PATH || './ssl/key.pem');
    const certPath = path.resolve(__dirname, process.env.SSL_CERT_PATH || './ssl/cert.pem');
    
    console.log('🔍 Looking for SSL certificates...');
    console.log('   Key path:', keyPath);
    console.log('   Cert path:', certPath);
    
    const sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };
    httpsServer = https.createServer(sslOptions, app);
    console.log('🔒 HTTPS/SSL enabled successfully');
  } catch (error) {
    console.error('❌ SSL certificates error:', error.message);
    console.log('📝 Continuing with HTTP only');
    console.log('   Make sure certificate files exist at the specified paths');
  }
}

// Initialize Socket.IO on HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for development
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['polling', 'websocket'], // Try polling first
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
  connectTimeout: 45000
});

// If HTTPS is enabled, also initialize Socket.IO on HTTPS server
let httpsIo = null;
if (httpsServer) {
  httpsIo = new Server(httpsServer, {
    cors: {
      origin: "*", // Allow all origins for development
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['polling', 'websocket'], // Try polling first
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    connectTimeout: 45000
  });
}

/**
 * ========================================================
 * SOCKET.IO AUTHENTICATION & SETUP
 * ========================================================
 */

// Function to setup socket authentication middleware
function setupSocketAuth(socketServer) {
  socketServer.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        console.log('⚠️  Socket connection without token');
        return next(new Error('Authentication error: No token provided'));
      }
      
      const decoded = verifyAccessToken(token);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      
      console.log(`✅ Socket authenticated: User ${socket.userId}`);
      next();
    } catch (error) {
      console.error('❌ Socket authentication failed:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });
}

// Apply authentication to both HTTP and HTTPS Socket.IO
setupSocketAuth(io);
if (httpsIo) {
  setupSocketAuth(httpsIo);
}

/**
 * ========================================================
 * SOCKET.IO CONNECTION HANDLING
 * ========================================================
 */

// Store online users in memory
const onlineUsers = new Map();

// Function to setup socket event handlers
function setupSocketHandlers(socketServer) {
  socketServer.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId}`);
    
    // Add user to online users
    onlineUsers.set(socket.userId, socket.id);
    
    // Store in Redis (using modern v4 API)
    redisClient.sAdd('online_users', socket.userId.toString())
      .catch(err => console.error('Redis error:', err));
    
    // Join user's personal room
    socket.join(`user:${socket.userId}`);
    
    // Broadcast user online status
    socketServer.emit('user:online', { userId: socket.userId });
    
    /**
     * Send message event
     */
    socket.on('send:message', async (data) => {
      try {
        console.log(`📨 Message from ${socket.userId}:`, data);
        
        const { receiverId, content, messageType, attachment } = data;
        
        // Validate data
        if (!receiverId || !content) {
          socket.emit('message:error', { message: 'Receiver ID and content are required' });
          return;
        }
        
        // Create message in database
        const message = await Message.create({
          sender: socket.userId,
          receiver: receiverId,
          content,
          messageType: messageType || 'text',
          attachment,
          conversationId: Message.getConversationId(socket.userId, receiverId)
        });
        
        await message.populate('sender receiver', 'name profilePicture');
        
        console.log(`✅ Message saved:`, message._id);
        
        // Send to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          socketServer.to(receiverSocketId).emit('receive:message', {
            _id: message._id,
            sender: message.sender,
            receiver: message.receiver,
            content: message.content,
            messageType: message.messageType,
            attachment: message.attachment,
            isRead: message.isRead,
            createdAt: message.createdAt,
            conversationId: message.conversationId
          });
          console.log(`✅ Sent to receiver ${receiverId}`);
        } else {
          console.log(`⚠️  Receiver ${receiverId} is offline`);
        }
        
        // Send confirmation to sender
        socket.emit('message:sent', {
          _id: message._id,
          sender: message.sender,
          receiver: message.receiver,
          content: message.content,
          messageType: message.messageType,
          attachment: message.attachment,
          isRead: message.isRead,
          createdAt: message.createdAt,
          conversationId: message.conversationId
        });
        
        // Cache in Redis (using modern v4 API)
        try {
          const cacheKey = `messages:${message.conversationId}`;
          await redisClient.lPush(cacheKey, JSON.stringify(message));
          await redisClient.lTrim(cacheKey, 0, 49);
          await redisClient.expire(cacheKey, 3600);
        } catch (redisError) {
          console.error('Redis cache error:', redisError);
        }
        
      } catch (error) {
        console.error('❌ Send message error:', error);
        socket.emit('message:error', { message: 'Failed to send message', error: error.message });
      }
    });
    
    /**
     * Typing indicator
     */
    socket.on('typing:start', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        socketServer.to(receiverSocketId).emit('user:typing', { 
          userId: socket.userId 
        });
      }
    });
    
    socket.on('typing:stop', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        socketServer.to(receiverSocketId).emit('user:stopped_typing', { 
          userId: socket.userId 
        });
      }
    });
    
    /**
     * Mark messages as read
     */
    socket.on('messages:read', async ({ conversationId, senderId }) => {
      try {
        await Message.markAsRead(conversationId, socket.userId);
        
        // Notify sender
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          socketServer.to(senderSocketId).emit('messages:read', {
            conversationId,
            readBy: socket.userId
          });
        }
      } catch (error) {
        console.error('Mark as read error:', error);
      }
    });
    
    /**
     * Get online status
     */
    socket.on('get:online_users', () => {
      socket.emit('online:users', {
        users: Array.from(onlineUsers.keys())
      });
    });
    
    /**
     * Disconnect event
     */
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
      
      // Remove from online users
      onlineUsers.delete(socket.userId);
      
      // Remove from Redis (using modern v4 API)
      redisClient.sRem('online_users', socket.userId.toString())
        .catch(err => console.error('Redis error:', err));
      
      // Broadcast user offline status
      socketServer.emit('user:offline', { userId: socket.userId });
    });
    
    /**
     * Error handling
     */
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
}

// Apply handlers to both HTTP and HTTPS Socket.IO
setupSocketHandlers(io);
if (httpsIo) {
  setupSocketHandlers(httpsIo);
}

/**
 * ========================================================
 * START SERVER
 * ========================================================
 */

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Connect to Redis
    await connectRedis();
    
    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`✅ HTTP server running on http://localhost:${PORT}`);
    });
    
    // Start HTTPS server if available
    if (httpsServer) {
      httpsServer.listen(HTTPS_PORT, () => {
        console.log(`✅ HTTPS server running on https://localhost:${HTTPS_PORT}`);
      });
    }
    
    console.log(`
╔════════════════════════════════════════════╗
║                                            ║
║     🚀 ConnectHub Server Running 🚀       ║
║                                            ║
║     Environment: ${process.env.NODE_ENV || 'development'}                  ║
║     HTTP:  http://localhost:${PORT}              ║
║     HTTPS: ${httpsServer ? `https://localhost:${HTTPS_PORT}` : 'Not configured'}         ║
║                                            ║
╚════════════════════════════════════════════╝
      `);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('❌ UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);
  httpServer.close(() => {
    if (httpsServer) httpsServer.close();
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully...');
  httpServer.close(() => {
    if (httpsServer) httpsServer.close();
    console.log('✅ Process terminated');
  });
});

// Start the server
startServer();

module.exports = { httpServer, httpsServer, io };
