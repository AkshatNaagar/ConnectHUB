const mongoose = require('mongoose');

/**
 * MongoDB Connection Configuration
 * 
 * This module handles the connection to MongoDB using Mongoose.
 * Mongoose provides a schema-based solution for modeling application data
 * and includes built-in type casting, validation, query building, and more.
 * 
 * Connection Options Explained:
 * - useNewUrlParser: Uses the new MongoDB connection string parser
 * - useUnifiedTopology: Uses the new Server Discovery and Monitoring engine
 */

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // MongoDB connection options
      maxPoolSize: 10, // Maximum number of connections in the connection pool
      serverSelectionTimeoutMS: 5000, // Timeout for selecting a server
      socketTimeoutMS: 45000, // Timeout for socket operations
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);

    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

/**
 * ===============================================
 * RELATIONAL DATABASE ALTERNATIVES (For Learning)
 * ===============================================
 * 
 * 1. POSTGRESQL CONNECTION EXAMPLE:
 * ----------------------------------
 * const { Pool } = require('pg');
 * 
 * const pool = new Pool({
 *   user: 'your_username',
 *   host: 'localhost',
 *   database: 'connecthub',
 *   password: 'your_password',
 *   port: 5432,
 *   max: 20, // Maximum number of clients in the pool
 *   idleTimeoutMillis: 30000,
 *   connectionTimeoutMillis: 2000,
 * });
 * 
 * // Test connection
 * pool.query('SELECT NOW()', (err, res) => {
 *   if (err) {
 *     console.error('PostgreSQL connection error:', err);
 *   } else {
 *     console.log('PostgreSQL connected:', res.rows[0]);
 *   }
 * });
 * 
 * module.exports = pool;
 * 
 * 
 * 2. MARIADB CONNECTION EXAMPLE:
 * ------------------------------
 * const mariadb = require('mariadb');
 * 
 * const pool = mariadb.createPool({
 *   host: 'localhost',
 *   user: 'your_username',
 *   password: 'your_password',
 *   database: 'connecthub',
 *   connectionLimit: 5,
 *   connectTimeout: 10000,
 * });
 * 
 * async function testConnection() {
 *   let conn;
 *   try {
 *     conn = await pool.getConnection();
 *     const rows = await conn.query('SELECT 1 as val');
 *     console.log('MariaDB connected:', rows);
 *   } catch (err) {
 *     console.error('MariaDB connection error:', err);
 *   } finally {
 *     if (conn) conn.release();
 *   }
 * }
 * 
 * testConnection();
 * module.exports = pool;
 * 
 * 
 * ===============================================
 * MONGODB vs RELATIONAL DB - KEY DIFFERENCES
 * ===============================================
 * 
 * MONGODB (NoSQL - Document Database):
 * - Schema-less (flexible structure)
 * - Documents stored in BSON format (JSON-like)
 * - Horizontal scaling (sharding)
 * - Good for: Unstructured data, rapid development, scalability
 * - Collections contain documents
 * - Supports embedded documents and arrays
 * 
 * POSTGRESQL/MARIADB (SQL - Relational Database):
 * - Fixed schema (structured tables)
 * - Data stored in rows and columns
 * - ACID compliance (strict transactions)
 * - Vertical scaling (typically)
 * - Good for: Complex relationships, data integrity, complex queries
 * - Tables contain rows with foreign key relationships
 * - JOIN operations for related data
 * 
 * 
 * WHEN TO USE EACH:
 * -----------------
 * Use MongoDB when:
 * ✓ Schema changes frequently
 * ✓ Need horizontal scaling
 * ✓ Working with JSON-like documents
 * ✓ Rapid prototyping
 * 
 * Use PostgreSQL/MariaDB when:
 * ✓ Need strong ACID compliance
 * ✓ Complex relationships and joins
 * ✓ Mature, well-understood schema
 * ✓ Require SQL expertise
 */
