const User = require('../models/User');
const Job = require('../models/Job');
const { asyncHandler } = require('../middlewares/errorMiddleware');
const { cacheHelpers } = require('../config/redis');

// Search users, jobs, or all
const search = asyncHandler(async (req, res) => {
  const { q, type = 'all', page = 1, limit = 20 } = req.query;
  
  if (!q || q.trim().length === 0) {
    return res.json({
      success: true,
      data: { users: [], jobs: [], companies: [], total: 0 }
    });
  }
  
  const cacheKey = `search:${type}:${q}:${page}:${limit}`;
  
  // Check cache
  let result = await cacheHelpers.get(cacheKey);
  
  if (!result) {
    result = { users: [], jobs: [], companies: [] };
    
    if (type === 'people' || type === 'all') {
      result.users = await User.searchUsers(q, {
        limit: parseInt(limit),
        page: parseInt(page)
      });
    }
    
    if (type === 'jobs' || type === 'all') {
      result.jobs = await Job.searchJobs({}, {
        query: q,
        limit: parseInt(limit),
        page: parseInt(page)
      });
      
      // Populate company info for each job
      await Job.populate(result.jobs, {
        path: 'postedBy',
        select: 'name companyInfo profilePicture'
      });
    }
    
    if (type === 'companies' || type === 'all') {
      // Search for users with role='company'
      result.companies = await User.find({
        role: 'company',
        $or: [
          { name: new RegExp(q, 'i') },
          { 'companyInfo.companyName': new RegExp(q, 'i') },
          { 'companyInfo.industry': new RegExp(q, 'i') },
          { 'companyInfo.description': new RegExp(q, 'i') }
        ]
      })
      .select('name email companyInfo profilePicture location')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    }
    
    result.total = result.users.length + result.jobs.length + result.companies.length;
    
    // Cache for 2 minutes
    await cacheHelpers.set(cacheKey, result, 120);
  }
  
  res.json({
    success: true,
    data: result
  });
});

// Get recommendations (suggested people, jobs, companies)
const getRecommendations = asyncHandler(async (req, res) => {
  const cacheKey = 'recommendations:default';
  
  // Check cache
  let recommendations = await cacheHelpers.get(cacheKey);
  
  if (!recommendations) {
    // Get random/featured people (non-company users)
    const people = await User.find({ role: 'user' })
      .select('name email headline bio location skills profilePicture')
      .sort({ createdAt: -1 })
      .limit(6);
    
    // Get recent/active jobs
    const jobs = await Job.find({ status: 'active' })
      .populate('postedBy', 'name companyInfo profilePicture')
      .sort({ createdAt: -1 })
      .limit(6);
    
    // Get featured companies
    const companies = await User.find({ role: 'company' })
      .select('name email companyInfo profilePicture location')
      .sort({ createdAt: -1 })
      .limit(6);
    
    recommendations = {
      people,
      jobs,
      companies
    };
    
    // Cache for 10 minutes
    await cacheHelpers.set(cacheKey, recommendations, 600);
  }
  
  res.json({
    success: true,
    data: recommendations
  });
});

module.exports = {
  search,
  getRecommendations
};
