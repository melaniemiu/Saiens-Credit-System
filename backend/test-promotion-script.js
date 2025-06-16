#!/usr/bin/env node

require("dotenv").config();
const { User, Job, Department } = require("./src/models");
const { io } = require("socket.io-client");

async function testPromotionSystem() {
  console.log("🚀 Promotion System Test Script");
  console.log("===============================");

  try {
    // Find all users with jobs
    const allUsers = await User.findAll({
      include: [
        { model: Department, attributes: ['id', 'name'] },
        { model: Job, attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Filter users with LINE accounts and jobs
    const lineUsers = allUsers.filter(user => user.lineUserId && user.Job);
    const allUsersWithJobs = allUsers.filter(user => user.Job);

    console.log("👥 All users in database:");
    allUsers.forEach((user, index) => {
      const lineStatus = user.lineUserId ? "📱 LINE" : "❌ No LINE";
      const jobStatus = user.Job ? `💼 ${user.Job.name}` : "❌ No Job";
      console.log(`${index + 1}. ${user.name} (${user.employeeId}) - ${user.Department?.name || 'No dept'} [${lineStatus}] [${jobStatus}]`);
    });

    if (lineUsers.length === 0) {
      console.log("❌ No users with LINE accounts and jobs found!");
      console.log("💡 Make sure you have:");
      console.log("   1. Logged in with LINE to bind your account");
      console.log("   2. Been assigned a job position");
      return;
    }

    if (allUsersWithJobs.length === 0) {
      console.log("❌ No users with job assignments found!");
      console.log("💡 Make sure users have been assigned job positions");
      return;
    }

    // Select a LINE user to "promote" (you!)
    const userToPromote = lineUsers[0];
    
    console.log(`\n📱 Selected user for promotion test: ${userToPromote.name} (${userToPromote.employeeId})`);
    console.log(`💼 Current job: ${userToPromote.Job.name}`);
    console.log(`🏢 Department: ${userToPromote.Department?.name || 'No department'}`);
    console.log(`✅ You should receive promotion notification on your phone!`);

    // Get current job details and next job
    const currentJob = await Job.findByPk(userToPromote.Job.id, {
      include: [
        {
          model: Job,
          as: 'NextJob',
          include: [{ model: Department, attributes: ['id', 'name'] }]
        }
      ]
    });

    let nextJobName = "資深專家"; // Default fake next job
    let nextJobDepartment = userToPromote.Department?.name;

    if (currentJob && currentJob.NextJob) {
      nextJobName = currentJob.NextJob.name;
      nextJobDepartment = currentJob.NextJob.Department?.name || nextJobDepartment;
    } else {
      console.log(`⚠️  No next job defined for ${currentJob.name}, using fake next job for testing`);
    }

    console.log(`🎯 Next job level: ${nextJobName}`);

    // Create promotion notification data
    const promotionData = {
      id: `${userToPromote.id}-${Date.now()}`, // Unique promotion ID
      userId: userToPromote.id,
      userName: userToPromote.name,
      employeeId: userToPromote.employeeId,
      previousJob: userToPromote.Job.name,
      newJob: nextJobName,
      department: nextJobDepartment,
      promotedAt: new Date().toISOString()
    };

    console.log(`🎉 Test promotion data:`, {
      user: promotionData.userName,
      promotion: `${promotionData.previousJob} → ${promotionData.newJob}`,
      department: promotionData.department
    });

    // Try to emit socket notification (if socket server is running)
    console.log(`\n🔌 Attempting to send socket notification...`);
    
    const socketClient = io(process.env.BACKEND_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    socketClient.on('connect', () => {
      console.log('✅ Connected to socket server');
      
      // Emit promotion notification to user
      socketClient.emit('user-promoted-test', {
        room: `user-${userToPromote.id}`,
        data: promotionData
      });

      console.log(`📡 Socket promotion notification sent to room: user-${userToPromote.id}`);
      console.log(`🎊 Check your browser/phone for confetti and toast notification!`);
      
      setTimeout(() => {
        socketClient.disconnect();
        console.log('🔌 Disconnected from socket server');
        console.log('\n🎉 Promotion test completed!');
        console.log('💡 The user was NOT actually promoted in the database - this was just a notification test');
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
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n👋 Promotion test script terminated');
  process.exit(0);
});

// Display usage information
console.log("🎯 Promotion Notification Test");
console.log("This script will send a test promotion notification to a LINE user");
console.log("without actually promoting them in the database.\n");

// Run the test
testPromotionSystem();