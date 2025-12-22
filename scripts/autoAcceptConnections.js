/**
 * Auto-accept all pending connection requests
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const autoAcceptConnections = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all users with pending requests
    const users = await User.find({ 'pendingRequests.0': { $exists: true } });
    
    console.log(`Found ${users.length} users with pending requests\n`);
    
    for (const user of users) {
      console.log(`Processing ${user.name}...`);
      
      // Accept all pending requests
      for (const request of user.pendingRequests) {
        const senderId = request.from;
        
        // Add to connections
        if (!user.connections.includes(senderId)) {
          user.connections.push(senderId);
          console.log(`  ✓ Accepted connection from ${senderId}`);
        }
        
        // Update sender's connections
        const sender = await User.findById(senderId);
        if (sender && !sender.connections.includes(user._id)) {
          sender.connections.push(user._id);
          
          // Remove from sent requests
          sender.sentRequests = sender.sentRequests.filter(
            req => req.to.toString() !== user._id.toString()
          );
          
          await sender.save();
        }
      }
      
      // Clear pending requests
      user.pendingRequests = [];
      await user.save();
      
      console.log(`  Connections now: ${user.connections.length}\n`);
    }
    
    console.log('✅ All pending requests accepted!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

autoAcceptConnections();
