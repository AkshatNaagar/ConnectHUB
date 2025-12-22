# 📊 Database Documentation - ConnectHub

## Table of Contents
- [Database Overview](#database-overview)
- [MongoDB Deep Dive](#mongodb-deep-dive)
- [Relational Database Alternatives](#relational-database-alternatives)
- [NoSQL Database Comparison](#nosql-database-comparison)
- [Database Optimization](#database-optimization)
- [Scaling Strategies](#scaling-strategies)
- [Redis Caching](#redis-caching)
- [Git Workflow](#git-workflow)

---

## Database Overview

ConnectHub uses **MongoDB** as the primary database, but this document covers alternative databases for educational purposes.

### Why MongoDB for ConnectHub?

✅ **Pros:**
- Flexible schema perfect for evolving user profiles
- Excellent for document-based data (users, jobs, messages)
- Horizontal scaling with sharding
- Rich query language with aggregation pipeline
- Native JSON support
- Good performance for read-heavy applications

❌ **Cons:**
- No ACID transactions across documents (pre-v4.0)
- Higher memory usage
- Eventual consistency by default
- More complex joins compared to SQL

---

## MongoDB Deep Dive

### Data Modeling Strategies

#### 1. Embedded Documents (Denormalization)

Used for: Experience, Education, Skills

```javascript
{
  _id: ObjectId("..."),
  name: "John Doe",
  experience: [
    {
      title: "Developer",
      company: "Tech Corp",
      startDate: ISODate("2020-01-01"),
      endDate: ISODate("2023-01-01")
    }
  ],
  skills: ["JavaScript", "Node.js"]
}
```

**When to use:**
- Data is accessed together
- One-to-few relationships
- Data doesn't grow unbounded

#### 2. References (Normalization)

Used for: Connections, Job Applications

```javascript
// User document
{
  _id: ObjectId("user1"),
  name: "John",
  connections: [ObjectId("user2"), ObjectId("user3")]
}

// Job document
{
  _id: ObjectId("job1"),
  title: "Developer",
  postedBy: ObjectId("user1")
}
```

**When to use:**
- Many-to-many relationships
- Data accessed independently
- Avoid duplication
- Data grows unbounded

### Indexing Strategy

#### Single Field Indexes
```javascript
// Fast email lookups
db.users.createIndex({ email: 1 }, { unique: true })

// Fast job type queries
db.jobs.createIndex({ type: 1 })
```

#### Compound Indexes
```javascript
// Filter by status and sort by date
db.jobs.createIndex({ status: 1, createdAt: -1 })

// Filter by role and location
db.users.createIndex({ role: 1, location: 1 })
```

#### Text Indexes
```javascript
// Full-text search
db.users.createIndex({
  name: "text",
  headline: "text",
  bio: "text",
  skills: "text"
})

db.jobs.createIndex({
  title: "text",
  description: "text",
  company: "text"
})
```

#### Performance Impact

| Operation | Without Index | With Index |
|-----------|--------------|------------|
| Find by email | O(n) scan | O(log n) |
| Sort by date | O(n log n) | O(1) with covered query |
| Text search | Not possible | O(log n) |

### Query Optimization

#### 1. Use Projection
```javascript
// Bad: Returns all fields
db.users.find({ email: "john@example.com" })

// Good: Returns only needed fields
db.users.find(
  { email: "john@example.com" },
  { name: 1, email: 1, profilePicture: 1 }
)
```

#### 2. Use Indexes Effectively
```javascript
// Bad: Full collection scan
db.jobs.find({ salary: { $gte: 50000 } })

// Good: Create index first
db.jobs.createIndex({ salary: 1 })
db.jobs.find({ salary: { $gte: 50000 } })
```

#### 3. Use Lean Queries (Mongoose)
```javascript
// Bad: Returns Mongoose document
const users = await User.find()

// Good: Returns plain JavaScript object (faster)
const users = await User.find().lean()
```

#### 4. Limit Results
```javascript
// Bad: Returns all results
db.jobs.find()

// Good: Paginate results
db.jobs.find().skip(20).limit(20)
```

### Aggregation Pipeline

Complex queries using aggregation:

```javascript
// Get job count by company
db.jobs.aggregate([
  { $match: { status: "active" } },
  { $group: {
    _id: "$company",
    count: { $sum: 1 },
    avgSalary: { $avg: "$salary.max" }
  }},
  { $sort: { count: -1 } },
  { $limit: 10 }
])
```

---

## Relational Database Alternatives

### PostgreSQL

**Connection:**
```javascript
const { Pool } = require('pg')

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'connecthub',
  password: 'password',
  port: 5432,
})

// Query
const result = await pool.query('SELECT * FROM users WHERE email = $1', ['john@example.com'])
```

**Schema Design:**

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Connections table (many-to-many)
CREATE TABLE connections (
  user_id INTEGER REFERENCES users(id),
  connected_user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, connected_user_id)
);

-- Jobs table
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  company VARCHAR(200) NOT NULL,
  posted_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Skills table (many-to-many)
CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE user_skills (
  user_id INTEGER REFERENCES users(id),
  skill_id INTEGER REFERENCES skills(id),
  PRIMARY KEY (user_id, skill_id)
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_jobs_company ON jobs(company);
CREATE INDEX idx_jobs_posted_by ON jobs(posted_by);
```

**Querying with JOINs:**

```sql
-- Get user with their skills
SELECT u.*, s.name as skill
FROM users u
LEFT JOIN user_skills us ON u.id = us.user_id
LEFT JOIN skills s ON us.skill_id = s.id
WHERE u.id = 1;

-- Get jobs with company info
SELECT j.*, u.name as posted_by_name, u.email as company_email
FROM jobs j
JOIN users u ON j.posted_by = u.id
WHERE j.status = 'active'
ORDER BY j.created_at DESC;
```

### MariaDB

**Connection:**
```javascript
const mariadb = require('mariadb')

const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'connecthub',
  connectionLimit: 5
})

// Query
const conn = await pool.getConnection()
const rows = await conn.query('SELECT * FROM users WHERE email = ?', ['john@example.com'])
conn.release()
```

**Schema similar to PostgreSQL, with MariaDB-specific optimizations:**

```sql
-- Use InnoDB engine for ACID compliance
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'company', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Full-text search index
ALTER TABLE jobs ADD FULLTEXT INDEX ft_title_description (title, description);
```

### MongoDB vs SQL Comparison

| Feature | MongoDB | PostgreSQL/MariaDB |
|---------|---------|-------------------|
| **Schema** | Flexible, schemaless | Fixed schema, tables |
| **Queries** | JSON-like queries | SQL |
| **Relationships** | Embedded or references | JOINs with foreign keys |
| **Transactions** | Multi-document (v4.0+) | Full ACID |
| **Scaling** | Horizontal (sharding) | Vertical (mainly) |
| **Speed** | Fast for simple queries | Fast for complex queries |
| **Use Case** | Rapid development, flexible data | Complex relationships, analytics |

---

## NoSQL Database Comparison

### 1. InfluxDB (Time-Series Database)

**Use Case:** Tracking user activity, analytics, metrics

```javascript
const { InfluxDB, Point } = require('@influxdata/influxdb-client')

const client = new InfluxDB({ url: 'http://localhost:8086', token: 'my-token' })
const writeApi = client.getWriteApi('org', 'bucket')

// Write data
const point = new Point('user_activity')
  .tag('user_id', 'user123')
  .tag('action', 'login')
  .floatField('duration', 120.5)
  .timestamp(new Date())

writeApi.writePoint(point)
await writeApi.close()

// Query data
const queryApi = client.getQueryApi('org')
const query = `
  from(bucket: "bucket")
    |> range(start: -1h)
    |> filter(fn: (r) => r._measurement == "user_activity")
`
```

**When to use:**
- User activity tracking
- Application metrics
- Real-time analytics
- IoT data

### 2. Neo4j (Graph Database)

**Use Case:** Connection recommendations, network analysis

```javascript
const neo4j = require('neo4j-driver')

const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'password')
)

const session = driver.session()

// Create relationships
await session.run(`
  MATCH (u1:User {id: $userId1})
  MATCH (u2:User {id: $userId2})
  CREATE (u1)-[:CONNECTED_TO]->(u2)
`, { userId1: 'user1', userId2: 'user2' })

// Find mutual connections
const result = await session.run(`
  MATCH (user:User {id: $userId})-[:CONNECTED_TO]-(connection)-[:CONNECTED_TO]-(mutual)
  WHERE mutual <> user
  RETURN DISTINCT mutual.name, COUNT(mutual) as mutualCount
  ORDER BY mutualCount DESC
  LIMIT 10
`, { userId: 'user1' })

session.close()
```

**When to use:**
- Social networks
- Recommendation engines
- Fraud detection
- Network analysis

### 3. Redis (In-Memory Cache)

**Use Case:** Session storage, caching, real-time features

```javascript
const redis = require('redis')
const client = redis.createClient()

await client.connect()

// String operations
await client.set('user:123:name', 'John Doe')
const name = await client.get('user:123:name')

// Hash operations (object storage)
await client.hSet('user:123', {
  name: 'John Doe',
  email: 'john@example.com',
  age: '30'
})
const user = await client.hGetAll('user:123')

// List operations (message queue)
await client.lPush('notifications:user123', 'New message')
const notifications = await client.lRange('notifications:user123', 0, -1)

// Set operations (online users)
await client.sAdd('online_users', 'user1', 'user2', 'user3')
const isOnline = await client.sIsMember('online_users', 'user1')

// Sorted Set (leaderboard)
await client.zAdd('leaderboard', { score: 100, value: 'user1' })
await client.zAdd('leaderboard', { score: 200, value: 'user2' })
const topUsers = await client.zRange('leaderboard', 0, 9, { REV: true })

// Pub/Sub (real-time notifications)
const publisher = client.duplicate()
const subscriber = client.duplicate()

await subscriber.connect()
await subscriber.subscribe('notifications', (message) => {
  console.log('Received:', message)
})

await publisher.publish('notifications', 'Hello World!')
```

---

## Database Optimization

### 1. Indexing Best Practices

```javascript
// ✅ DO: Index frequently queried fields
db.users.createIndex({ email: 1 }, { unique: true })
db.jobs.createIndex({ status: 1, createdAt: -1 })

// ❌ DON'T: Over-index (slows writes)
db.users.createIndex({ loginAttempts: 1 }) // Rarely queried

// ✅ DO: Use compound indexes wisely
db.jobs.createIndex({ type: 1, location: 1, status: 1 })

// ❌ DON'T: Create redundant indexes
db.jobs.createIndex({ type: 1 })
db.jobs.createIndex({ type: 1, location: 1 }) // Already covered
```

### 2. Query Patterns

```javascript
// ✅ DO: Use covered queries (index-only)
db.users.createIndex({ email: 1, name: 1 })
db.users.find({ email: "john@example.com" }, { email: 1, name: 1, _id: 0 })

// ❌ DON'T: Use $where or $regex without anchors
db.users.find({ $where: "this.name.length > 10" }) // Slow
db.users.find({ name: /john/i }) // Full scan

// ✅ DO: Use proper operators
db.users.find({ name: { $regex: "^John", $options: "i" } }) // Indexed
```

### 3. Connection Pooling

```javascript
// MongoDB connection pool
mongoose.connect(uri, {
  maxPoolSize: 10, // Maximum connections
  minPoolSize: 2,  // Minimum connections
  serverSelectionTimeoutMS: 5000
})

// PostgreSQL connection pool
const pool = new Pool({
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
})
```

---

## Scaling Strategies

### 1. Vertical Scaling (Scale Up)

**Increase server resources:**
- More CPU cores
- More RAM
- Faster storage (SSD)

**Pros:**
- Simple to implement
- No code changes
- Lower latency

**Cons:**
- Hardware limits
- Single point of failure
- Expensive

### 2. Horizontal Scaling (Scale Out)

**Add more servers:**

#### Read Replicas (MongoDB)

```javascript
// Connection with replicas
mongoose.connect('mongodb://primary,replica1,replica2/connecthub', {
  replicaSet: 'rs0',
  readPreference: 'secondaryPreferred'
})

// Read from replicas, write to primary
User.find().read('secondary')
```

#### Sharding (MongoDB)

```javascript
// Shard key selection (immutable, high cardinality)
sh.enableSharding("connecthub")
sh.shardCollection("connecthub.users", { email: "hashed" })

// Range-based sharding
sh.shardCollection("connecthub.messages", { conversationId: 1, createdAt: 1 })
```

**Sharding Strategies:**

1. **Hashed Sharding:** Even distribution
2. **Range Sharding:** Queries on ranges
3. **Zone Sharding:** Geographic distribution

### 3. Caching Layer

```javascript
// Cache-aside pattern
async function getUser(userId) {
  // 1. Check cache
  let user = await redis.get(`user:${userId}`)
  
  if (user) {
    return JSON.parse(user)
  }
  
  // 2. Query database
  user = await User.findById(userId)
  
  // 3. Store in cache
  await redis.setEx(`user:${userId}`, 3600, JSON.stringify(user))
  
  return user
}

// Write-through pattern
async function updateUser(userId, data) {
  // 1. Update database
  const user = await User.findByIdAndUpdate(userId, data, { new: true })
  
  // 2. Update cache
  await redis.setEx(`user:${userId}`, 3600, JSON.stringify(user))
  
  return user
}
```

### 4. Database Partitioning

**Vertical Partitioning:** Split tables by columns
```javascript
// users table → users_basic + users_profile
{
  // users_basic (frequently accessed)
  id, name, email, password
}
{
  // users_profile (less frequently accessed)
  id, bio, location, skills, experience
}
```

**Horizontal Partitioning:** Split tables by rows
```javascript
// messages table → messages_2024 + messages_2023
CREATE TABLE messages_2024 PARTITION OF messages
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

---

## Redis Caching

### Cache Strategies

#### 1. Cache-Aside (Lazy Loading)
```javascript
async function getCachedData(key) {
  const cached = await redis.get(key)
  if (cached) return JSON.parse(cached)
  
  const data = await database.query()
  await redis.setEx(key, 3600, JSON.stringify(data))
  return data
}
```

#### 2. Write-Through
```javascript
async function updateData(key, data) {
  await database.update(data)
  await redis.set(key, JSON.stringify(data))
}
```

#### 3. Write-Behind
```javascript
// Queue writes to Redis, batch to database
await redis.lpush('write_queue', JSON.stringify(data))

// Worker process
setInterval(async () => {
  const items = await redis.lrange('write_queue', 0, 99)
  await database.batchInsert(items.map(JSON.parse))
  await redis.ltrim('write_queue', 100, -1)
}, 5000)
```

### Cache Invalidation

```javascript
// TTL-based
await redis.setEx('key', 300, 'value') // Expires in 5 minutes

// Event-based
async function updateUser(userId, data) {
  await User.findByIdAndUpdate(userId, data)
  await redis.del(`user:${userId}`) // Invalidate cache
}

// Pattern-based
await redis.keys('user:*').then(keys => {
  if (keys.length) redis.del(keys)
})
```

---

## Git Workflow

### Branch Strategy

```bash
main          # Production-ready code
├── develop   # Integration branch
    ├── feature/user-profile
    ├── feature/job-search
    └── bugfix/login-issue
```

### Common Commands

```bash
# Initialize repository
git init
git remote add origin <url>

# Create feature branch
git checkout -b feature/new-feature

# Stage and commit changes
git add .
git commit -m "feat: add user profile feature"

# Push to remote
git push origin feature/new-feature

# Pull latest changes
git pull origin main

# Merge feature to develop
git checkout develop
git merge feature/new-feature

# Resolve merge conflicts
git status
# Edit conflicting files
git add .
git commit -m "fix: resolve merge conflicts"

# Delete branch
git branch -d feature/new-feature
git push origin --delete feature/new-feature

# View history
git log --oneline --graph --all

# Undo changes
git reset --soft HEAD~1  # Undo last commit, keep changes
git reset --hard HEAD~1  # Undo last commit, discard changes
git revert <commit>      # Create new commit that undoes changes
```

### Commit Message Standards

```bash
# Format: <type>: <description>

# Types:
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation
style:    # Formatting, no code change
refactor: # Code change that neither fixes bug nor adds feature
test:     # Adding tests
chore:    # Maintenance

# Examples:
git commit -m "feat: add user authentication"
git commit -m "fix: resolve login redirect issue"
git commit -m "docs: update API documentation"
```

### Pull Request Workflow

1. Create feature branch
2. Make changes and commit
3. Push to remote
4. Create Pull Request on GitHub
5. Code review
6. Resolve comments
7. Merge to main

---

**End of Documentation**

For more information, see:
- [MongoDB Documentation](https://docs.mongodb.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [Git Documentation](https://git-scm.com/doc)
