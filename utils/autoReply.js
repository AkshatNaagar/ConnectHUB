const Message = require('../models/Message');
const User = require('../models/User');

/**
 * Auto-reply system for simulating chat responses from sample users
 * This creates a more realistic chat experience by having sample users respond to messages
 */

// Contextual reply templates based on message content
const replyTemplates = {
  greetings: [
    "Hey! How are you doing? 😊",
    "Hi there! Great to hear from you!",
    "Hello! Hope you're having a good day!",
    "Hey! What's up?",
    "Hi! Nice to connect with you!"
  ],
  
  questions: [
    "That's a great question! Let me think about it...",
    "Interesting point! I'd say it depends on the context.",
    "Good question! In my experience, I've found that...",
    "That's something I've been thinking about too!",
    "Great question! From what I know..."
  ],
  
  workRelated: [
    "Yeah, I've been working on some interesting projects lately.",
    "Work has been pretty busy but exciting!",
    "I'm currently focused on expanding my skills in that area.",
    "That's exactly what I've been dealing with at work!",
    "I find that aspect of work really fascinating."
  ],
  
  jobsCareer: [
    "I'm always looking for new opportunities to grow!",
    "Career development is definitely a priority for me.",
    "I think networking is so important for career growth.",
    "That sounds like an interesting opportunity!",
    "I'd love to learn more about that field."
  ],
  
  technology: [
    "Technology is evolving so fast these days!",
    "I've been learning more about that tech stack recently.",
    "That's a really powerful tool, I've used it on several projects.",
    "The tech industry is so exciting right now!",
    "I'm really interested in how that technology works."
  ],
  
  appreciation: [
    "Thanks so much! I really appreciate that! 🙏",
    "Thank you! That means a lot!",
    "I appreciate you saying that!",
    "Thanks! You're too kind! 😊",
    "Thank you! Happy to help!"
  ],
  
  general: [
    "That's really interesting! Tell me more.",
    "I totally understand what you mean.",
    "That makes a lot of sense!",
    "I hadn't thought about it that way before.",
    "That's a good point!",
    "I see what you're saying.",
    "Absolutely! I agree with that.",
    "That's fascinating! How did you get into that?",
    "I'd love to hear more about your experience with that.",
    "Thanks for sharing that perspective!"
  ],
  
  closing: [
    "It was great chatting with you! Let's stay in touch.",
    "Thanks for the conversation! Talk soon! 👋",
    "Really enjoyed our chat! Catch up later?",
    "Let's continue this conversation soon!",
    "Great talking to you! Have a wonderful day!"
  ]
};

/**
 * Determine the category of message and select appropriate reply
 */
function categorizeMessage(content) {
  const lowerContent = content.toLowerCase();
  
  // Greetings
  if (/(hi|hello|hey|good morning|good afternoon|good evening|sup|what's up)/i.test(lowerContent)) {
    return 'greetings';
  }
  
  // Questions
  if (/(what|why|how|when|where|who|can you|could you|would you|\?)/i.test(lowerContent)) {
    return 'questions';
  }
  
  // Work related
  if (/(work|project|team|meeting|deadline|office|colleague)/i.test(lowerContent)) {
    return 'workRelated';
  }
  
  // Jobs/Career
  if (/(job|career|opportunity|position|hiring|interview|resume|skills)/i.test(lowerContent)) {
    return 'jobsCareer';
  }
  
  // Technology
  if (/(tech|code|programming|software|developer|app|api|database|cloud|ai|ml)/i.test(lowerContent)) {
    return 'technology';
  }
  
  // Appreciation
  if (/(thank|thanks|appreciate|grateful|awesome|great|amazing|wonderful)/i.test(lowerContent)) {
    return 'appreciation';
  }
  
  // Closing
  if (/(bye|goodbye|talk later|catch up|see you|ttyl|gotta go)/i.test(lowerContent)) {
    return 'closing';
  }
  
  // Default to general
  return 'general';
}

/**
 * Generate a contextual reply based on the message
 */
function generateReply(messageContent) {
  const category = categorizeMessage(messageContent);
  const templates = replyTemplates[category];
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

/**
 * Check if user is a sample user (created by scripts)
 * Sample users have specific emails or were created recently without verified emails
 */
async function isSampleUser(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return false;
    
    // Check if email follows sample pattern
    const sampleEmailPattern = /@example\.com$/i;
    
    return sampleEmailPattern.test(user.email);
  } catch (error) {
    console.error('Error checking if sample user:', error);
    return false;
  }
}

/**
 * Process auto-replies for messages sent to sample users
 * This should be called after a message is sent
 */
async function processAutoReply(messageId) {
  try {
    // Get the message
    const message = await Message.findById(messageId).populate('sender receiver');
    if (!message) return;
    
    // Only auto-reply if the receiver is a sample user
    const isReceiverSample = await isSampleUser(message.receiver._id);
    if (!isReceiverSample) return;
    
    // Generate contextual reply
    const replyContent = generateReply(message.content);
    
    // Random delay between 2-5 seconds to simulate typing
    const delay = Math.floor(Math.random() * 3000) + 2000;
    
    setTimeout(async () => {
      try {
        // Create reply message
        const conversationId = Message.getConversationId(message.receiver._id, message.sender._id);
        
        await Message.create({
          sender: message.receiver._id,
          receiver: message.sender._id,
          content: replyContent,
          messageType: 'text',
          conversationId
        });
        
        console.log(`Auto-reply sent from ${message.receiver.name} to ${message.sender.name}`);
      } catch (error) {
        console.error('Error creating auto-reply:', error);
      }
    }, delay);
    
  } catch (error) {
    console.error('Error processing auto-reply:', error);
  }
}

/**
 * Initialize conversation with a sample user
 * Sends a welcome message from the sample user
 */
async function initializeConversation(userId, sampleUserId) {
  try {
    const welcomeMessages = [
      "Hey! Thanks for connecting! How have you been?",
      "Hi! Great to connect with you on ConnectHub!",
      "Hello! I saw your profile and thought we might have some common interests!",
      "Hey there! Thanks for the connection request!",
      "Hi! Looking forward to networking with you!"
    ];
    
    const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    const conversationId = Message.getConversationId(userId, sampleUserId);
    
    await Message.create({
      sender: sampleUserId,
      receiver: userId,
      content: randomMessage,
      messageType: 'text',
      conversationId
    });
    
  } catch (error) {
    console.error('Error initializing conversation:', error);
  }
}

module.exports = {
  processAutoReply,
  generateReply,
  isSampleUser,
  initializeConversation
};
