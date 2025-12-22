/**
 * Create instant connections with sample users
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const createConnections = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find your user (by email)
    const myEmail = 'akshatnaagar755@gmail.com'; // Update this if different
    const myUser = await User.findOne({ email: myEmail });
    
    if (!myUser) {
      console.log('❌ User not found. Please update the email in the script.');
      return;
    }
    
    console.log(`Found user: ${myUser.name} (${myUser.email})\n`);
    
    // Find sample users
    const sampleUsers = await User.find({
      email: { $regex: /@example\.com$/ }
    });
    
    console.log(`Found ${sampleUsers.length} sample users\n`);
    
    // Connect with all sample users
    for (const sampleUser of sampleUsers) {
      // Check if already connected
      if (myUser.connections.includes(sampleUser._id)) {
        console.log(`  ⏭️  Already connected with ${sampleUser.name}`);
        continue;
      }
      
      // Add bidirectional connection
      myUser.connections.push(sampleUser._id);
      sampleUser.connections.push(myUser._id);
      
      // Clear any pending/sent requests
      myUser.pendingRequests = myUser.pendingRequests.filter(
        req => req.from.toString() !== sampleUser._id.toString()
      );
      myUser.sentRequests = myUser.sentRequests.filter(
        req => req.to.toString() !== sampleUser._id.toString()
      );
      
      sampleUser.pendingRequests = sampleUser.pendingRequests.filter(
        req => req.from.toString() !== myUser._id.toString()
      );
      sampleUser.sentRequests = sampleUser.sentRequests.filter(
        req => req.to.toString() !== myUser._id.toString()
      );
      
      await sampleUser.save();
      console.log(`  ✅ Connected with ${sampleUser.name}`);
    }
    
    await myUser.save();
    
    console.log(`\n✅ Done! You now have ${myUser.connections.length} connections.`);
    console.log('\n🎉 Go to the Messages page to start chatting!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

createConnections();
