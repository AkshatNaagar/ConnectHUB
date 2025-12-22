const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
require('dotenv').config();

/**
 * Initialize chat messages from sample users to real users
 * This creates initial welcome messages to make the chat feature feel more alive
 */

async function initializeChatMessages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/connecthub');
    console.log('✅ MongoDB Connected');
    
    // Get all sample users (users with @example.com emails)
    const sampleUsers = await User.find({
      email: /@example\.com$/i
    }).limit(10);
    
    if (sampleUsers.length === 0) {
      console.log('❌ No sample users found. Run createSampleUsers.js first.');
      process.exit(0);
    }
    
    console.log(`📝 Found ${sampleUsers.length} sample users`);
    
    // Get real users (non-sample users)
    const realUsers = await User.find({
      email: { $not: /@example\.com$/i }
    });
    
    if (realUsers.length === 0) {
      console.log('❌ No real users found. Create an account first.');
      process.exit(0);
    }
    
    console.log(`👥 Found ${realUsers.length} real user(s)`);
    
    // Welcome messages from sample users
    const welcomeMessages = [
      "Hey! Thanks for connecting! I saw your profile and thought we should connect.",
      "Hi there! Great to be connected with you on ConnectHub! 😊",
      "Hello! I noticed we have similar interests. Looking forward to networking!",
      "Hey! Thanks for accepting my connection request!",
      "Hi! Great to connect with you. How's everything going?",
      "Hello! I'm always looking to expand my network. Let's stay in touch!",
      "Hey there! Saw your profile and wanted to reach out. How have you been?",
      "Hi! ConnectHub has been great for networking. Glad to connect with you!",
      "Hello! I think we could benefit from staying connected. What do you think?",
      "Hey! Your background looks impressive! Let's keep in touch."
    ];
    
    let messageCount = 0;
    
    // For each real user, send messages from 2-3 random sample users they're connected to
    for (const realUser of realUsers) {
      // Get user's connections
      const userWithConnections = await User.findById(realUser._id).populate('connections');
      const connectedSampleUsers = userWithConnections.connections.filter(conn => 
        /@example\.com$/i.test(conn.email)
      );
      
      if (connectedSampleUsers.length === 0) {
        console.log(`⚠️  ${realUser.name} has no sample user connections`);
        continue;
      }
      
      // Select 2-3 random connected sample users
      const numMessagesToSend = Math.min(3, connectedSampleUsers.length);
      const shuffled = connectedSampleUsers.sort(() => 0.5 - Math.random());
      const selectedUsers = shuffled.slice(0, numMessagesToSend);
      
      for (const sampleUser of selectedUsers) {
        // Check if conversation already exists
        const conversationId = Message.getConversationId(sampleUser._id, realUser._id);
        const existingMessages = await Message.countDocuments({ conversationId });
        
        if (existingMessages > 0) {
          console.log(`⏭️  Skipping ${sampleUser.name} → ${realUser.name} (conversation exists)`);
          continue;
        }
        
        // Create welcome message
        const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        
        await Message.create({
          sender: sampleUser._id,
          receiver: realUser._id,
          content: randomMessage,
          messageType: 'text',
          conversationId
        });
        
        messageCount++;
        console.log(`✉️  ${sampleUser.name} → ${realUser.name}: "${randomMessage}"`);
      }
    }
    
    console.log(`\n✅ Successfully initialized ${messageCount} chat messages!`);
    console.log('💬 Check the Messages page to see conversations with your connections.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

initializeChatMessages();
