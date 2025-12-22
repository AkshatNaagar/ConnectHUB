/**
 * =====================================================
 * FIX DATABASE - Clean corrupted data and reseed
 * =====================================================
 */

require('dotenv').config();
const mongoose = require('mongoose');

const fixDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Drop all collections to start fresh
    const collections = await mongoose.connection.db.collections();
    
    console.log('\n🗑️  Dropping all collections...');
    for (const collection of collections) {
      await collection.drop();
      console.log(`   Dropped: ${collection.collectionName}`);
    }

    console.log('\n✅ Database cleaned successfully!');
    console.log('\n💡 Now run: node scripts/seedSearchData.js');
    
  } catch (error) {
    console.error('❌ Error fixing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

fixDatabase();
