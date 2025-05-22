#!/usr/bin/env node

require("dotenv").config();
const { User, Credit, Department } = require("./src/models");
const { io } = require("socket.io-client");

async function testCreditSystem() {
  console.log("🚀 Credit System Test Script");
  console.log("==============================");

  try {
    // Find all users
    const allUsers = await User.findAll({
      include: [{ model: Department, attributes: ['id', 'name'] }],
      order: [['createdAt', 'ASC']]
    });

    // Separate users with and without LINE accounts
    const lineUsers = allUsers.filter(user => user.lineUserId);
    const nonLineUsers = allUsers.filter(user => !user.lineUserId);

    console.log("👥 All users in database:");
    allUsers.forEach((user, index) => {
      const lineStatus = user.lineUserId ? "📱 LINE" : "❌ No LINE";
      console.log(`${index + 1}. ${user.name} (${user.employeeId}) - ${user.Department?.name || 'No dept'} [${lineStatus}]`);
    });

    if (lineUsers.length === 0) {
      console.log("❌ No users with LINE accounts found!");
      console.log("💡 Make sure you have logged in with LINE to bind your account");
      return;
    }

    if (allUsers.length < 2) {
      console.log("❌ Need at least 2 users total in database to test credit giving");
      console.log("Available users:", allUsers.length);
      return;
    }

    // Select receiver: prioritize LINE users (you!)
    const receiver = lineUsers[0]; // First LINE user as receiver (you)
    
    // Select sender: use non-LINE user if available, otherwise use different LINE user
    let sender;
    if (nonLineUsers.length > 0) {
      sender = nonLineUsers[0]; // Use non-LINE user as sender
    } else if (lineUsers.length > 1) {
      sender = lineUsers[1]; // Use different LINE user as sender
    } else {
      console.log("❌ Need at least one other user besides the LINE receiver");
      return;
    }

    console.log(`\n📱 Selected LINE receiver (you): ${receiver.name} (${receiver.employeeId})`);
    console.log(`📤 Selected sender: ${sender.name} (${sender.employeeId}) ${sender.lineUserId ? '[LINE user]' : '[Non-LINE user]'}`);
    console.log(`✅ You should receive notification on your phone!`);

    // Check sender's remaining credits (for display only)
    await sender.checkAndResetDailyCredits();
    console.log(`💰 Sender has ${sender.remainingDailyCredits} credits remaining (test won't consume any)`);

    // Create the credit
    const reason = `🧪 TEST credit from script at ${new Date().toLocaleString()}`;
    
    const credit = await Credit.create({
      senderId: sender.id,
      receiverId: receiver.id,
      reason: reason,
      status: "approved",
      approvedAt: new Date(),
    });

    // Update receiver's credits (but don't deduct from sender for testing)
    receiver.creditsReceived += 1;
    await receiver.save();
    
    // Note: We intentionally DON'T deduct from sender's remainingDailyCredits
    // This allows unlimited testing without consuming real credits
    console.log(`🆓 Test credit created without consuming sender's daily limit`);
    console.log(`📈 Receiver's total credits increased to: ${receiver.creditsReceived}`);

    console.log(`✅ Credit created successfully!`);
    console.log(`📝 Reason: "${reason}"`);
    console.log(`🆔 Credit ID: ${credit.id}`);

    // Try to emit socket notification (if socket server is running)
    console.log(`\n🔌 Attempting to send socket notification...`);
    
    const socketClient = io(process.env.BACKEND_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    socketClient.on('connect', () => {
      console.log('✅ Connected to socket server');
      
      // Emit credit notification to receiver
      socketClient.emit('credit-received-test', {
        room: `user-${receiver.id}`,
        data: {
          id: credit.id,
          senderId: sender.id,
          senderName: sender.name,
          senderDepartment: sender.Department?.name,
          reason: credit.reason,
          createdAt: credit.createdAt
        }
      });

      console.log(`📡 Socket notification sent to room: user-${receiver.id}`);
      
      setTimeout(() => {
        socketClient.disconnect();
        console.log('🔌 Disconnected from socket server');
        process.exit(0);
      }, 1000);
    });

    socketClient.on('connect_error', (error) => {
      console.log('❌ Socket connection failed:', error.message);
      console.log('💡 Make sure the backend server is running');
      process.exit(1);
    });

    // Fallback timeout
    setTimeout(() => {
      console.log('⏰ Socket connection timeout');
      socketClient.disconnect();
      process.exit(0);
    }, 5000);

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n👋 Script terminated');
  process.exit(0);
});

// Run the test
testCreditSystem();