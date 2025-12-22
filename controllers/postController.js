const Post = require('../models/Post');
const User = require('../models/User');
const { asyncHandler, NotFoundError, ForbiddenError } = require('../middlewares/errorMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/posts');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'post-' + uniqueSuffix + path.extname(file.originalname));
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

// Create a new post
const createPost = asyncHandler(async (req, res) => {
  const { content, postType, visibility, achievement } = req.body;
  
  const postData = {
    author: req.user._id,
    content,
    postType: postType || 'text',
    visibility: visibility || 'public'
  };
  
  // Handle achievement posts
  if (postType === 'achievement' && achievement) {
    postData.achievement = JSON.parse(achievement);
  }
  
  // Handle uploaded images
  if (req.files && req.files.length > 0) {
    postData.images = req.files.map(file => `/uploads/posts/${file.filename}`);
  }
  
  const post = await Post.create(postData);
  await post.populate('author', 'name profilePicture headline');
  
  res.status(201).json({
    success: true,
    message: 'Post created successfully',
    data: { post }
  });
});

// Get feed posts
const getFeedPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const posts = await Post.getFeedPosts(req.user._id, { page, limit });
  
  res.json({
    success: true,
    data: { posts, page, limit }
  });
});

// Get user's posts
const getUserPosts = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const posts = await Post.find({ author: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('author', 'name profilePicture headline')
    .populate('likes', 'name profilePicture')
    .populate('comments.user', 'name profilePicture');
  
  res.json({
    success: true,
    data: { posts, page, limit }
  });
});

// Like/Unlike a post
const toggleLike = asyncHandler(async (req, res) => {
  const postId = req.params.postId;
  const post = await Post.findById(postId);
  
  if (!post) {
    throw new NotFoundError('Post not found');
  }
  
  const likeIndex = post.likes.indexOf(req.user._id);
  
  if (likeIndex > -1) {
    // Unlike
    post.likes.splice(likeIndex, 1);
  } else {
    // Like
    post.likes.push(req.user._id);
  }
  
  await post.save();
  await post.populate('likes', 'name profilePicture');
  
  res.json({
    success: true,
    data: { 
      liked: likeIndex === -1,
      likeCount: post.likes.length,
      likes: post.likes
    }
  });
});

// Add comment to post
const addComment = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;
  
  const post = await Post.findById(postId);
  
  if (!post) {
    throw new NotFoundError('Post not found');
  }
  
  post.comments.push({
    user: req.user._id,
    content
  });
  
  await post.save();
  await post.populate('comments.user', 'name profilePicture');
  
  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: { comments: post.comments }
  });
});

// Delete post
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.postId);
  
  if (!post) {
    throw new NotFoundError('Post not found');
  }
  
  if (post.author.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You can only delete your own posts');
  }
  
  // Delete associated images
  if (post.images && post.images.length > 0) {
    for (const imagePath of post.images) {
      const fullPath = path.join(__dirname, '..', imagePath);
      try {
        await fs.unlink(fullPath);
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }
  }
  
  await post.deleteOne();
  
  res.json({
    success: true,
    message: 'Post deleted successfully'
  });
});

// Delete comment
const deleteComment = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;
  
  const post = await Post.findById(postId);
  
  if (!post) {
    throw new NotFoundError('Post not found');
  }
  
  const comment = post.comments.id(commentId);
  
  if (!comment) {
    throw new NotFoundError('Comment not found');
  }
  
  // Check if user owns the comment or the post
  if (comment.user.toString() !== req.user._id.toString() && 
      post.author.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('You can only delete your own comments or comments on your posts');
  }
  
  comment.deleteOne();
  await post.save();
  
  res.json({
    success: true,
    message: 'Comment deleted successfully'
  });
});

// Get suggested connections
const getSuggestedConnections = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 5;
  
  const user = await User.findById(req.user._id);
  const connectionIds = user.connections || [];
  const sentRequestIds = user.sentRequests.map(r => r.to);
  
  // Find users not in connections and not sent requests
  const suggestions = await User.find({
    _id: { 
      $nin: [...connectionIds, ...sentRequestIds, req.user._id] 
    },
    isActive: true
  })
  .select('name profilePicture headline location skills')
  .limit(limit);
  
  res.json({
    success: true,
    data: { suggestions }
  });
});

module.exports = {
  createPost,
  getFeedPosts,
  getUserPosts,
  toggleLike,
  addComment,
  deletePost,
  deleteComment,
  getSuggestedConnections,
  upload
};
