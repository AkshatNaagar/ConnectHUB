const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

/**
 * Auto-accept all pending connection requests
 * This helps users quickly build their network for testing chat functionality
 */

async function acceptAllPendingRequests() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/connecthub');
    console.log('✅ MongoDB Connected');
    
    // Get all users with pending connection requests
    const usersWithPending = await User.find({
      'pendingRequests.0': { $exists: true }
    }).populate('pendingRequests.from', 'name email');
    
    if (usersWithPending.length === 0) {
      console.log('✅ No pending connection requests found!');
      process.exit(0);
    }
    
    console.log(`📝 Found ${usersWithPending.length} users with pending requests\n`);
    
    let acceptedCount = 0;
    
    for (const user of usersWithPending) {
      console.log(`👤 Processing ${user.name} (${user.email})`);
      console.log(`   Has ${user.pendingRequests.length} pending request(s)`);
      
      for (const request of user.pendingRequests) {
        const requesterId = request.from._id;
        const requesterName = request.from.name;
        
        try {
          // Add to connections (both ways)
          if (!user.connections.includes(requesterId)) {
            user.connections.push(requesterId);
          }
          
          // Remove from pending requests
          user.pendingRequests = user.pendingRequests.filter(
            req => req.from._id.toString() !== requesterId.toString()
          );
          
          // Update the requester's side
          const requester = await User.findById(requesterId);
          if (requester) {
            // Add to requester's connections
            if (!requester.connections.includes(user._id)) {
              requester.connections.push(user._id);
            }
            
            // Remove from requester's sent requests
            requester.sentRequests = requester.sentRequests.filter(
              req => req.to.toString() !== user._id.toString()
            );
            
            await requester.save();
          }
          
          acceptedCount++;
          console.log(`   ✅ Accepted request from ${requesterName}`);
          
        } catch (error) {
          console.error(`   ❌ Error accepting request from ${requesterName}:`, error.message);
        }
      }
      
      await user.save();
      console.log(`   💾 Saved ${user.name}'s connections\n`);
    }
    
    console.log(`\n✅ Successfully accepted ${acceptedCount} connection requests!`);
    console.log('💬 Users can now chat with their connections on the Messages page.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

acceptAllPendingRequests();
