const User = require('../models/User');
const { cacheHelpers } = require('../config/redis');
const CacheManager = require('../utils/cacheManager');
const { asyncHandler, NotFoundError, ConflictError } = require('../middlewares/errorMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get user profile
const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const currentUserId = req.user._id;
  
  // Check cache first using CacheManager with logging
  let user = await CacheManager.get(`user:${userId}`);
  
  if (!user) {
    user = await User.findById(userId)
      .select('-password')
      .populate('connections', 'name profilePicture headline');
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    await CacheManager.set(`user:${userId}`, user, 1800); // 30 minutes cache
  }
  
  // Check connection status with current user
  let connectionStatus = 'none';
  
  if (currentUserId.toString() !== userId) {
    const currentUser = await User.findById(currentUserId);
    
    // Check if already connected
    const isConnected = currentUser.connections.some(
      conn => conn.toString() === userId
    );
    
    if (isConnected) {
      connectionStatus = 'connected';
    } else {
      // Check if request already sent
      const hasSentRequest = currentUser.sentRequests.some(
        req => req.to.toString() === userId
      );
      
      if (hasSentRequest) {
        connectionStatus = 'pending';
      } else {
        // Check if received request from this user
        const hasReceivedRequest = currentUser.pendingRequests.some(
          req => req.from.toString() === userId
        );
        
        if (hasReceivedRequest) {
          connectionStatus = 'received';
        }
      }
    }
  }
  
  res.json({ success: true, data: { user, connectionStatus } });
});

// Update user profile
const updateProfile = async (req, res) => {
  try {
    console.log('=== Update Profile Request ===');
    console.log('User ID:', req.user?._id);
    console.log('File:', req.file ? req.file.filename : 'No file');
    console.log('Body:', req.body);
    
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }
    
    const updates = {};
    
    // Only add fields that are present in the request
    if (req.body.name) updates.name = req.body.name;
    if (req.body.headline !== undefined) updates.headline = req.body.headline;
    if (req.body.bio !== undefined) updates.bio = req.body.bio;
    if (req.body.location !== undefined) updates.location = req.body.location;
    
    // Handle skills (can be JSON string or array)
    if (req.body.skills) {
      try {
        updates.skills = typeof req.body.skills === 'string' 
          ? JSON.parse(req.body.skills) 
          : req.body.skills;
      } catch (e) {
        updates.skills = req.body.skills.split(',').map(s => s.trim()).filter(s => s);
      }
    }
    
    // Handle profile picture upload
    if (req.file) {
      console.log('Processing file upload:', req.file.filename);
      
      // Get current user to check for old profile picture
      const currentUser = await User.findById(req.user._id);
      
      if (currentUser && currentUser.profilePicture && !currentUser.profilePicture.includes('default-avatar')) {
        const oldPath = path.join(__dirname, '..', currentUser.profilePicture);
        try {
          await fs.unlink(oldPath);
          console.log('Deleted old profile picture');
        } catch (err) {
          console.error('Error deleting old profile picture:', err.message);
        }
      }
      
      updates.profilePicture = `/uploads/profiles/${req.file.filename}`;
    }
    
    console.log('Updates to apply:', updates);
    
    // Only update if there are changes
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No updates provided'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: false }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('Profile updated successfully');
    
    // Invalidate cache
    try {
      await cacheHelpers.del(`user:${req.user._id}`);
    } catch (cacheError) {
      console.error('Cache deletion error:', cacheError.message);
    }
    
    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('=== Error in updateProfile ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile'
    });
  }
};

// Send connection request
const sendConnectionRequest = asyncHandler(async (req, res) => {
  const { userId, message } = req.body;
  
  if (userId === req.user._id.toString()) {
    throw new ConflictError('Cannot connect with yourself');
  }
  
  // Fetch both users as full Mongoose documents
  const [targetUser, currentUser] = await Promise.all([
    User.findById(userId),
    User.findById(req.user._id)
  ]);
  
  if (!targetUser) {
    throw new NotFoundError('User not found');
  }
  
  if (!currentUser) {
    throw new NotFoundError('Current user not found');
  }
  
  // Check if already connected
  if (currentUser.connections.includes(userId)) {
    throw new ConflictError('Already connected');
  }
  
  // Check if request already sent to target
  const requestExists = targetUser.pendingRequests.some(
    request => request.from.toString() === req.user._id.toString()
  );
  
  // Also check if already in currentUser's sentRequests
  const alreadySent = currentUser.sentRequests.some(
    request => request.to.toString() === userId
  );
  
  if (requestExists || alreadySent) {
    throw new ConflictError('Connection request already sent');
  }
  
  // Check if target already sent request to current user (to avoid duplicate)
  const reverseRequest = currentUser.pendingRequests.some(
    request => request.from.toString() === userId
  );
  
  if (reverseRequest) {
    throw new ConflictError('This user already sent you a connection request. Check your pending requests.');
  }
  
  // Add to pending requests
  targetUser.pendingRequests.push({
    from: req.user._id,
    message: message || ''
  });
  
  // Add to sent requests
  currentUser.sentRequests.push({ to: userId });
  
  // Save both users
  await Promise.all([
    targetUser.save(),
    currentUser.save()
  ]);
  
  res.json({
    success: true,
    message: 'Connection request sent'
  });
});

// Accept connection request
const acceptConnectionRequest = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  
  const user = await User.findById(req.user._id);
  const requestIndex = user.pendingRequests.findIndex(
    req => req.from.toString() === userId
  );
  
  if (requestIndex === -1) {
    throw new NotFoundError('Connection request not found');
  }
  
  // Remove from pending requests
  user.pendingRequests.splice(requestIndex, 1);
  
  // Add to connections
  user.connections.push(userId);
  await user.save();
  
  // Add to other user's connections
  const otherUser = await User.findById(userId);
  otherUser.connections.push(req.user._id);
  
  // Remove from sent requests
  otherUser.sentRequests = otherUser.sentRequests.filter(
    req => req.to.toString() !== user._id.toString()
  );
  await otherUser.save();
  
  // Clear cache for both users
  await Promise.all([
    cacheHelpers.del(`user:${req.user._id}`),
    cacheHelpers.del(`user:${userId}`)
  ]);
  
  res.json({
    success: true,
    message: 'Connection request accepted',
    data: {
      connectionCount: user.connections.length
    }
  });
});

// Get user's connections
const getConnections = asyncHandler(async (req, res) => {
  try {
    // Use req.params.id if provided, otherwise use current user's id
    const userId = req.params.id || req.user._id;
    console.log('[GET CONNECTIONS] UserId:', userId);
    
    const user = await User.findById(userId)
      .populate('connections', 'name profilePicture headline location');
    
    console.log('[GET CONNECTIONS] User found:', user?.name);
    console.log('[GET CONNECTIONS] Connections count:', user?.connections?.length);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: { connections: user.connections || [] }
    });
  } catch (error) {
    console.error('[GET CONNECTIONS] Error:', error);
    throw error;
  }
});

// Get pending connection requests
const getPendingRequests = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('pendingRequests.from', 'name profilePicture headline');
  
  res.json({
    success: true,
    data: { requests: user.pendingRequests }
  });
});

// Get sent connection requests
const getSentRequests = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('sentRequests.to', 'name profilePicture headline');
  
  res.json({
    success: true,
    data: { requests: user.sentRequests }
  });
});

// Reject connection request
const rejectConnectionRequest = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  
  const user = await User.findById(req.user._id);
  const requestIndex = user.pendingRequests.findIndex(
    request => request.from.toString() === userId
  );
  
  if (requestIndex === -1) {
    throw new NotFoundError('Connection request not found');
  }
  
  // Remove from pending requests
  user.pendingRequests.splice(requestIndex, 1);
  await user.save();
  
  // Remove from other user's sent requests
  const otherUser = await User.findById(userId);
  otherUser.sentRequests = otherUser.sentRequests.filter(
    request => request.to.toString() !== req.user._id.toString()
  );
  await otherUser.save();
  
  res.json({
    success: true,
    message: 'Connection request rejected'
  });
});

module.exports = {
  getUserProfile,
  updateProfile,
  sendConnectionRequest,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getPendingRequests,
  getSentRequests,
  getConnections,
  upload
};
