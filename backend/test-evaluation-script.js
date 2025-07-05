#!/usr/bin/env node

require("dotenv").config();
const { User, Skill, UserSkill, Department, Job } = require("./src/models");
const { io } = require("socket.io-client");

async function testEvaluationRequest() {
  console.log("🎯 Evaluation Request Test Script");
  console.log("==================================");

  try {
    // Find all users with their departments and jobs
    const allUsers = await User.findAll({
      include: [
        { model: Department, attributes: ['id', 'name'] },
        { model: Job, attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Separate admin users (evaluators) and regular users
    const adminUsers = allUsers.filter(user => user.role === 'admin');
    const regularUsers = allUsers.filter(user => user.role === 'user');
    const lineUsers = allUsers.filter(user => user.lineUserId);

    console.log("👥 All users in database:");
    allUsers.forEach((user, index) => {
      const lineStatus = user.lineUserId ? "📱 LINE" : "❌ No LINE";
      const roleStatus = user.role === 'admin' ? "👑 Admin" : "👤 User";
      console.log(`${index + 1}. ${user.name} (${user.employeeId}) - ${user.Department?.name || 'No dept'} - ${user.Job?.name || 'No job'} [${lineStatus}] [${roleStatus}]`);
    });

    if (adminUsers.length === 0) {
      console.log("❌ No admin users found!");
      console.log("💡 Make sure you have at least one user with role 'admin' to receive evaluation notifications");
      return;
    }

    if (regularUsers.length === 0) {
      console.log("❌ No regular users found!");
      console.log("💡 Make sure you have at least one user with role 'user' to request evaluation");
      return;
    }

    // Find skills available in the system
    const allSkills = await Skill.findAll({
      attributes: ['id', 'name', 'category', 'assessmentMethod'],
      order: [['name', 'ASC']]
    });

    if (allSkills.length === 0) {
      console.log("❌ No skills found in database!");
      console.log("💡 Make sure you have skills seeded in the database");
      return;
    }

    console.log(`\n📚 Available skills (${allSkills.length} total):`);
    allSkills.slice(0, 5).forEach((skill, index) => {
      console.log(`${index + 1}. ${skill.name} (${skill.category}) - ${skill.assessmentMethod}`);
    });
    if (allSkills.length > 5) {
      console.log(`... and ${allSkills.length - 5} more skills`);
    }

    // Select test participants
    const requester = regularUsers[0]; // First regular user as evaluation requester
    const skill = allSkills[0]; // First skill for testing
    const evaluators = adminUsers; // All admin users as evaluators

    console.log(`\n🙋‍♂️ Selected evaluation requester: ${requester.name} (${requester.employeeId})`);
    console.log(`📖 Selected skill: ${skill.name} (${skill.category})`);
    console.log(`👑 Evaluators (${evaluators.length}):`);
    evaluators.forEach((evaluator, index) => {
      const lineStatus = evaluator.lineUserId ? "📱 LINE" : "❌ No LINE";
      console.log(`   ${index + 1}. ${evaluator.name} (${evaluator.employeeId}) [${lineStatus}]`);
    });

    // Check if user already has this skill
    let userSkill = await UserSkill.findOne({
      where: { userId: requester.id, skillId: skill.id }
    });

    if (!userSkill) {
      // Create a user skill record for testing
      userSkill = await UserSkill.create({
        userId: requester.id,
        skillId: skill.id,
        status: 'in_progress',
        startedAt: new Date(),
        attempts: 0
      });
      console.log(`✅ Created test UserSkill record for ${requester.name} - ${skill.name}`);
    } else {
      // Update status to make it ready for evaluation
      if (userSkill.status === 'not_started') {
        userSkill.status = 'in_progress';
        userSkill.startedAt = new Date();
        await userSkill.save();
        console.log(`📝 Updated UserSkill status to 'in_progress' for testing`);
      }
      console.log(`📋 Found existing UserSkill record: ${userSkill.status}`);
    }

    console.log(`\n🔄 Current skill status: ${userSkill.status}`);
    console.log(`📅 Started at: ${userSkill.startedAt ? new Date(userSkill.startedAt).toLocaleString() : 'Not started'}`);

    // Simulate the evaluation request (update status to completed)
    userSkill.status = 'completed';
    userSkill.completedAt = new Date();
    await userSkill.save();

    console.log(`\n🎯 Simulating evaluation request...`);
    console.log(`✅ Updated skill status to 'completed' (waiting for evaluation)`);
    console.log(`📅 Completed at: ${new Date(userSkill.completedAt).toLocaleString()}`);

    // Try to emit socket notifications (if socket server is running)
    console.log(`\n🔌 Attempting to send socket notifications...`);
    
    const socketClient = io(process.env.BACKEND_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling']
    });

    socketClient.on('connect', () => {
      console.log('✅ Connected to socket server');
      
      // Send notifications to all evaluators using the backend server emission pattern
      evaluators.forEach((evaluator, index) => {
        // Use the server's io.to() pattern by emitting to the server's socket handler
        socketClient.emit('evaluation-requested-test', {
          room: `user-${evaluator.id}`,
          data: {
            id: `${requester.id}-${skill.id}-${Date.now()}`,
            userSkillId: userSkill.id,
            skillId: skill.id,
            skillName: skill.name,
            userId: requester.id,
            userName: requester.name,
            requestedAt: new Date().toISOString(),
            evaluatorId: evaluator.id,
            evaluatorName: evaluator.name
          }
        });
        
        console.log(`📡 Evaluation notification sent to evaluator ${index + 1}: ${evaluator.name} (room: user-${evaluator.id})`);
      });

      // Send confirmation to requester
      socketClient.emit('evaluation-request-submitted-test', {
        room: `user-${requester.id}`,
        data: {
          skillId: skill.id,
          skillName: skill.name,
          submittedAt: new Date().toISOString(),
          evaluatorCount: evaluators.length
        }
      });

      console.log(`📨 Confirmation sent to requester: ${requester.name} (room: user-${requester.id})`);
      
      // Add test event listeners to simulate receiving notifications
      socketClient.on('evaluation-requested', (data) => {
        console.log(`🔔 [RECEIVED] Evaluation request notification:`, data);
      });

      socketClient.on('evaluation-request-submitted', (data) => {
        console.log(`✅ [RECEIVED] Evaluation request confirmation:`, data);
      });

      setTimeout(() => {
        socketClient.disconnect();
        console.log('🔌 Disconnected from socket server');
        console.log('\n🎉 Test completed successfully!');
        console.log(`📋 Summary:`);
        console.log(`   - Requester: ${requester.name} requested evaluation for "${skill.name}"`);
        console.log(`   - Skill status: ${userSkill.status}`);
        console.log(`   - Evaluators notified: ${evaluators.length}`);
        console.log(`   - LINE users who should receive notifications: ${evaluators.filter(e => e.lineUserId).length}`);
        process.exit(0);
      }, 2000);
    });

    socketClient.on('connect_error', (error) => {
      console.log('❌ Socket connection failed:', error.message);
      console.log('💡 Make sure the backend server is running');
      console.log(`\n📋 Database changes made:`);
      console.log(`   - UserSkill for ${requester.name} - ${skill.name} updated to 'completed'`);
      process.exit(1);
    });

    // Fallback timeout
    setTimeout(() => {
      console.log('⏰ Socket connection timeout');
      socketClient.disconnect();
      console.log(`\n📋 Database changes made:`);
      console.log(`   - UserSkill for ${requester.name} - ${skill.name} updated to 'completed'`);
      process.exit(0);
    }, 10000);

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n👋 Script terminated');
  process.exit(0);
});

// Run the test
testEvaluationRequest();