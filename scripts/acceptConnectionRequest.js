require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

// Usage: node scripts/acceptConnectionRequest.js <fromUserEmail> <toUserEmail>
// Example: node scripts/acceptConnectionRequest.js akshatnaagar755@gmail.com arpit@example.com

async function acceptConnection() {
    try {
        const [fromEmail, toEmail] = process.argv.slice(2);
        
        if (!fromEmail || !toEmail) {
            console.error('Usage: node scripts/acceptConnectionRequest.js <fromUserEmail> <toUserEmail>');
            console.error('Example: node scripts/acceptConnectionRequest.js akshatnaagar755@gmail.com arpit@example.com');
            process.exit(1);
        }
        
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/connecthub');
        console.log('Connected to MongoDB');

        // Find both users
        const [fromUser, toUser] = await Promise.all([
            User.findOne({ email: fromEmail }),
            User.findOne({ email: toEmail })
        ]);
        
        if (!fromUser) {
            console.error(`User with email ${fromEmail} not found`);
            process.exit(1);
        }
        
        if (!toUser) {
            console.error(`User with email ${toEmail} not found`);
            process.exit(1);
        }
        
        console.log(`\nAccepting connection from ${fromUser.name} to ${toUser.name}...`);
        
        // Find the pending request
        const requestIndex = toUser.pendingRequests.findIndex(
            req => req.from.toString() === fromUser._id.toString()
        );
        
        if (requestIndex === -1) {
            console.error(`No pending request found from ${fromUser.name} to ${toUser.name}`);
            console.log(`\nPending requests for ${toUser.name}:`, toUser.pendingRequests);
            process.exit(1);
        }
        
        // Remove from pending requests
        toUser.pendingRequests.splice(requestIndex, 1);
        
        // Add to connections if not already connected
        if (!toUser.connections.includes(fromUser._id)) {
            toUser.connections.push(fromUser._id);
        }
        
        if (!fromUser.connections.includes(toUser._id)) {
            fromUser.connections.push(toUser._id);
        }
        
        // Remove from sent requests
        fromUser.sentRequests = fromUser.sentRequests.filter(
            req => req.to.toString() !== toUser._id.toString()
        );
        
        // Save both users
        await Promise.all([fromUser.save(), toUser.save()]);
        
        console.log(`✅ Connection accepted!`);
        console.log(`${fromUser.name} now has ${fromUser.connections.length} connection(s)`);
        console.log(`${toUser.name} now has ${toUser.connections.length} connection(s)`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

acceptConnection();
