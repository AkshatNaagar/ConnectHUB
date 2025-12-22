const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const jobRoutes = require('./routes/jobRoutes');
const chatRoutes = require('./routes/chatRoutes');
const featureRoutes = require('./routes/featureRoutes');
const postRoutes = require('./routes/postRoutes');

// Import middleware
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');
const { protect, optionalAuth } = require('./middlewares/authMiddleware');

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// Cache test endpoint
app.post('/api/cache/test', async (req, res) => {
  try {
    const CacheManager = require('./utils/cacheManager');
    const { key, value } = req.body;
    
    if (!key || !value) {
      return res.status(400).json({ success: false, message: 'Key and value required' });
    }
    
    await CacheManager.set(`test:${key}`, value, 60);
    const retrieved = await CacheManager.get(`test:${key}`);
    
    res.json({
      success: true,
      message: 'Cache test successful',
      stored: value,
      retrieved: retrieved
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/messages', chatRoutes);
app.use('/api/search', featureRoutes);
app.use('/api/posts', postRoutes);

// View Routes (EJS)
app.get('/', (req, res) => {
  res.render('index', { title: 'ConnectHub - Professional Networking' });
});

app.get('/login', (req, res) => {
  res.render('login', { title: 'Login - ConnectHub' });
});

app.get('/register', (req, res) => {
  res.render('register', { title: 'Register - ConnectHub' });
});

app.get('/dashboard', optionalAuth, (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  res.render('dashboard', { 
    title: 'Dashboard - ConnectHub',
    user: req.user
  });
});

app.get('/profile/:id?', optionalAuth, async (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  
  // If no ID provided, show logged-in user's profile
  const profileUserId = req.params.id || req.user._id.toString();
  
  res.render('profile', { 
    title: 'Profile - ConnectHub',
    user: req.user,
    profileUserId: profileUserId
  });
});

app.get('/jobs', optionalAuth, (req, res) => {
  res.render('jobs', { 
    title: 'Jobs - ConnectHub',
    user: req.user
  });
});

app.get('/chat', optionalAuth, (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  res.render('chat', { 
    title: 'Messages - ConnectHub',
    user: req.user
  });
});

app.get('/connections', optionalAuth, (req, res) => {
  if (!req.user) {
    return res.redirect('/login');
  }
  res.render('connections', { 
    title: 'My Connections - ConnectHub',
    user: req.user
  });
});

app.get('/search', optionalAuth, (req, res) => {
  res.render('search', { 
    title: 'Search - ConnectHub',
    user: req.user
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

// Handle 404
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
