require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function fixUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/connecthub');
        console.log('Connected to MongoDB');

        // Update all users to ensure experience and education are arrays
        const result = await User.updateMany(
            {
                $or: [
                    { experience: { $type: 'string' } },
                    { education: { $type: 'string' } },
                    { experience: { $exists: false } },
                    { education: { $exists: false } }
                ]
            },
            {
                $set: {
                    experience: [],
                    education: []
                }
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} users`);
        console.log('🎉 All users fixed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing users:', error);
        process.exit(1);
    }
}

fixUsers();
