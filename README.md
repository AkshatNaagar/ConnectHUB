# 🚀 ConnectHub - Professional Networking Platform

A full-stack LinkedIn-like professional networking platform built with Node.js, Express, MongoDB, and EJS.

![ConnectHub](https://img.shields.io/badge/Node.js-v18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-v7+-green)
![Express](https://img.shields.io/badge/Express-v4.18+-blue)
![Socket.IO](https://img.shields.io/badge/Socket.IO-v4.7+-orange)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Docker Setup](#docker-setup)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database Design](#database-design)
- [Authentication](#authentication)
- [Real-time Features](#real-time-features)
- [Caching Strategy](#caching-strategy)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

### User Features
- 🔐 **Authentication & Authorization**
  - JWT-based authentication with access & refresh tokens
  - Role-based access control (User, Company, Admin)
  - Password hashing with bcrypt
  - Account lockout after failed attempts
  - Token refresh mechanism

- 👤 **User Profiles**
  - Complete profile management
  - Skills, experience, and education sections
  - Profile pictures and cover photos
  - Connection system
  - Activity feed

- 🤝 **Networking**
  - Send/accept connection requests
  - View connections and mutual connections
  - Connection recommendations

- 💼 **Job Portal**
  - Browse job listings with advanced filters
  - Apply for jobs with cover letter
  - Company accounts can post jobs
  - Job application tracking
  - Job recommendations based on skills

- 💬 **Real-time Chat**
  - One-on-one messaging
  - WebSocket-based real-time updates
  - Typing indicators
  - Read receipts
  - Message history
  - Online/offline status

- 🔍 **Search System**
  - Full-text search for users and jobs
  - Advanced filtering options
  - Search result caching

### Technical Features
- **RESTful API** with comprehensive documentation
- **Real-time communication** using Socket.IO
- **Redis caching** for performance optimization
- **MongoDB indexing** for fast queries
- **Rate limiting** to prevent abuse
- **Error handling** with custom error classes
- **Input validation** using express-validator
- **Security headers** with Helmet
- **CORS** configuration
- **Compression** for responses
- **Logging** with Morgan

## 🛠 Tech Stack

### Backend
- **Runtime:** Node.js v18+
- **Framework:** Express.js v4.18+
- **Database:** MongoDB v7+
- **ODM:** Mongoose v7+
- **Cache:** Redis v7+
- **Real-time:** Socket.IO v4.7+

### Frontend
- **Template Engine:** EJS
- **CSS Framework:** Bootstrap 5
- **Icons:** Bootstrap Icons

### Security
- **Authentication:** JSON Web Tokens (JWT)
- **Password Hashing:** bcrypt
- **Security Headers:** Helmet
- **Rate Limiting:** express-rate-limit

### DevOps
- **Containerization:** Docker & Docker Compose
- **Process Manager:** PM2 (production)
- **Version Control:** Git

## 📦 Prerequisites

- Node.js >= 18.0.0
- MongoDB >= 7.0.0
- Redis >= 7.0.0 (via Docker or local installation)
- npm or yarn
- Git

## 🚀 Installation

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/yourusername/connecthub.git
cd connecthub
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Set Up Environment Variables

Copy the example environment file and configure it:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` with your configuration (see [Environment Variables](#environment-variables))

### 4. Set Up Redis with Docker

\`\`\`bash
# Start Redis container
docker-compose up -d redis

# Verify Redis is running
docker ps
\`\`\`

### 5. Set Up MongoDB

**Option A: Local MongoDB**
\`\`\`bash
# Make sure MongoDB is running
mongod
\`\`\`

**Option B: MongoDB via Docker**
\`\`\`bash
# Start MongoDB container
docker-compose up -d mongodb

# Create database
docker exec -it connecthub_mongodb mongosh
> use connecthub
\`\`\`

**Option C: MongoDB Atlas (Cloud)**
- Create account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
- Create cluster and get connection string
- Update `MONGODB_URI` in `.env`

### 6. Create Required Directories

\`\`\`bash
mkdir -p uploads
mkdir -p logs
\`\`\`

### 7. Start the Application

**Development Mode:**
\`\`\`bash
npm run dev
\`\`\`

**Production Mode:**
\`\`\`bash
npm start
\`\`\`

The server will start at `http://localhost:3000`

## 🐳 Docker Setup

### Using Docker Compose (Recommended)

Start all services (MongoDB + Redis):

\`\`\`bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
\`\`\`

### Redis Only

\`\`\`bash
# Start Redis
docker-compose up -d redis

# Connect to Redis CLI
docker exec -it connecthub_redis redis-cli

# Test Redis
127.0.0.1:6379> PING
PONG
127.0.0.1:6379> SET test "Hello"
OK
127.0.0.1:6379> GET test
"Hello"
\`\`\`

### MongoDB Only

\`\`\`bash
# Start MongoDB
docker-compose up -d mongodb

# Connect to MongoDB
docker exec -it connecthub_mongodb mongosh

# Create database and user
> use connecthub
> db.createUser({
  user: "admin",
  pwd: "password123",
  roles: [{ role: "readWrite", db: "connecthub" }]
})
\`\`\`

### Docker Commands Cheat Sheet

\`\`\`bash
# View running containers
docker ps

# View all containers (including stopped)
docker ps -a

# View logs for specific service
docker-compose logs redis
docker-compose logs mongodb

# Restart a service
docker-compose restart redis

# Remove all stopped containers
docker container prune

# Remove unused volumes
docker volume prune

# View Redis data
docker exec -it connecthub_redis redis-cli KEYS '*'

# Check MongoDB collections
docker exec -it connecthub_mongodb mongosh connecthub --eval "db.getCollectionNames()"
\`\`\`

## 🔐 Environment Variables

Create a `.env` file in the root directory:

\`\`\`env
# Server Configuration
NODE_ENV=development
PORT=3000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/connecthub

# JWT Secret Keys (Generate strong keys!)
JWT_ACCESS_SECRET=your_very_long_random_access_secret_key_here_change_this
JWT_REFRESH_SECRET=your_very_long_random_refresh_secret_key_here_change_this
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Security
BCRYPT_SALT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
\`\`\`

### Generate Strong Secret Keys

\`\`\`bash
# Generate random secret keys
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
\`\`\`

## 📁 Project Structure

\`\`\`
ConnectHub/
├── config/
│   ├── db.js                 # MongoDB connection
│   └── redis.js              # Redis configuration
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── userController.js     # User management
│   ├── jobController.js      # Job operations
│   ├── chatController.js     # Messaging
│   └── featureController.js  # Search & other features
├── middlewares/
│   ├── authMiddleware.js     # JWT authentication
│   ├── roleMiddleware.js     # Role-based access
│   └── errorMiddleware.js    # Error handling
├── models/
│   ├── User.js               # User schema
│   ├── Job.js                # Job schema
│   └── Message.js            # Message schema
├── routes/
│   ├── authRoutes.js         # Auth endpoints
│   ├── userRoutes.js         # User endpoints
│   ├── jobRoutes.js          # Job endpoints
│   ├── chatRoutes.js         # Chat endpoints
│   └── featureRoutes.js      # Feature endpoints
├── utils/
│   ├── generateToken.js      # JWT utilities
│   ├── encrypt.js            # Encryption helpers
│   └── validate.js           # Validation rules
├── views/
│   ├── partials/
│   │   └── navbar.ejs        # Shared navbar
│   ├── index.ejs             # Landing page
│   ├── login.ejs             # Login page
│   ├── register.ejs          # Registration
│   ├── dashboard.ejs         # User dashboard
│   ├── profile.ejs           # User profile
│   ├── jobs.ejs              # Job listings
│   ├── chat.ejs              # Chat interface
│   └── search.ejs            # Search page
├── app.js                    # Express app setup
├── server.js                 # Server entry point
├── package.json              # Dependencies
├── docker-compose.yml        # Docker configuration
├── .env.example              # Environment template
├── .gitignore               # Git ignore rules
└── README.md                # This file
\`\`\`

## 🔌 API Documentation

### Authentication Endpoints

#### Register
\`\`\`http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "user"
}
\`\`\`

#### Login
\`\`\`http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
\`\`\`

#### Refresh Token
\`\`\`http
POST /api/auth/refresh
Cookie: refreshToken=<token>
\`\`\`

#### Logout
\`\`\`http
POST /api/auth/logout
Authorization: Bearer <access_token>
\`\`\`

#### Get Current User
\`\`\`http
GET /api/auth/me
Authorization: Bearer <access_token>
\`\`\`

### User Endpoints

#### Get User Profile
\`\`\`http
GET /api/users/:id
Authorization: Bearer <access_token>
\`\`\`

#### Update Profile
\`\`\`http
PUT /api/users/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "John Updated",
  "bio": "Software Developer",
  "skills": ["JavaScript", "Node.js", "MongoDB"],
  "location": "New York"
}
\`\`\`

#### Send Connection Request
\`\`\`http
POST /api/users/connect
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "userId": "user_id_here",
  "message": "Let's connect!"
}
\`\`\`

#### Accept Connection Request
\`\`\`http
POST /api/users/connect/accept
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "userId": "user_id_here"
}
\`\`\`

### Job Endpoints

#### Get All Jobs
\`\`\`http
GET /api/jobs?query=developer&type=full-time&location=New York&page=1&limit=20
\`\`\`

#### Get Single Job
\`\`\`http
GET /api/jobs/:id
\`\`\`

#### Create Job (Company Only)
\`\`\`http
POST /api/jobs
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Software Developer",
  "description": "We are looking for...",
  "company": "Tech Corp",
  "location": "New York",
  "type": "full-time",
  "salary": {
    "min": 80000,
    "max": 120000,
    "currency": "USD",
    "period": "yearly"
  },
  "requirements": ["3+ years experience", "JavaScript"],
  "skills": ["JavaScript", "React", "Node.js"]
}
\`\`\`

#### Apply for Job
\`\`\`http
POST /api/jobs/:id/apply
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "coverLetter": "I am interested in this position..."
}
\`\`\`

### Chat Endpoints

#### Send Message
\`\`\`http
POST /api/messages
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "receiverId": "user_id_here",
  "content": "Hello!",
  "messageType": "text"
}
\`\`\`

#### Get Conversation
\`\`\`http
GET /api/messages/:userId?page=1&limit=50
Authorization: Bearer <access_token>
\`\`\`

#### Get All Conversations
\`\`\`http
GET /api/messages
Authorization: Bearer <access_token>
\`\`\`

#### Mark Messages as Read
\`\`\`http
PUT /api/messages/:userId/read
Authorization: Bearer <access_token>
\`\`\`

### Search Endpoint

\`\`\`http
GET /api/search?q=software&type=all&page=1&limit=20
Authorization: Bearer <access_token>
\`\`\`

## 📚 Additional Documentation

See the `/docs` directory for detailed documentation on:

- [Database Design](./docs/DATABASE.md)
- [Authentication Guide](./docs/AUTHENTICATION.md)
- [Caching Strategy](./docs/CACHING.md)
- [Scaling Guide](./docs/SCALING.md)
- [Git Workflow](./docs/GIT_WORKFLOW.md)
- [Security Best Practices](./docs/SECURITY.md)

## 🧪 Testing

\`\`\`bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test.js
\`\`\`

## 🚀 Deployment

### Production Checklist

- [ ] Update `.env` with production values
- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets (64+ characters)
- [ ] Enable HTTPS/SSL
- [ ] Set up MongoDB replica set
- [ ] Configure Redis persistence
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Enable compression
- [ ] Set up backup strategy
- [ ] Configure firewall rules
- [ ] Use process manager (PM2)

### Deploy with PM2

\`\`\`bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name connecthub

# View logs
pm2 logs connecthub

# Restart
pm2 restart connecthub

# Stop
pm2 stop connecthub

# Startup on boot
pm2 startup
pm2 save
\`\`\`

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Your Name - [@yourhandle](https://twitter.com/yourhandle)

## 🙏 Acknowledgments

- Node.js and Express.js communities
- MongoDB documentation
- Socket.IO team
- Bootstrap contributors

---

**Built with ❤️ for educational purposes**
# Connect_HUB
