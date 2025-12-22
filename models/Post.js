const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  content: {
    type: String,
    required: [true, 'Post content is required'],
    maxlength: [5000, 'Post content cannot exceed 5000 characters'],
    trim: true
  },
  
  images: [{
    type: String
  }],
  
  postType: {
    type: String,
    enum: ['text', 'achievement', 'article', 'poll'],
    default: 'text'
  },
  
  achievement: {
    title: String,
    description: String,
    date: Date,
    organization: String
  },
  
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  shares: {
    type: Number,
    default: 0
  },
  
  visibility: {
    type: String,
    enum: ['public', 'connections', 'private'],
    default: 'public'
  }
  
}, {
  timestamps: true
});

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });

// Virtual for like count
postSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Static method to get feed posts
postSchema.statics.getFeedPosts = async function(userId, options = {}) {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;
  
  const user = await mongoose.model('User').findById(userId);
  const connectionIds = user.connections || [];
  
  const posts = await this.find({
    $or: [
      { author: userId },
      { author: { $in: connectionIds }, visibility: { $in: ['public', 'connections'] } },
      { visibility: 'public' }
    ]
  })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .populate('author', 'name profilePicture headline')
  .populate('likes', 'name profilePicture')
  .populate('comments.user', 'name profilePicture')
  .lean();
  
  return posts;
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
