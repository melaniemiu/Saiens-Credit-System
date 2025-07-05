#!/usr/bin/env node

require("dotenv").config();
const { User, UserSkill, Department, Job } = require("./src/models");
const { Op } = require('sequelize');

async function resetUserSkills() {
  console.log("🔄 Reset User Skills Script");
  console.log("============================");

  try {
    // Find all users
    const allUsers = await User.findAll({
      include: [
        { model: Department, attributes: ['id', 'name'] },
        { model: Job, attributes: ['id', 'name'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    if (allUsers.length === 0) {
      console.log("❌ No users found in database!");
      return;
    }

    console.log("👥 Available users:");
    allUsers.forEach((user, index) => {
      const lineStatus = user.lineUserId ? "📱 LINE" : "❌ No LINE";
      const roleStatus = user.role === 'admin' ? "👑 Admin" : "👤 User";
      console.log(`${index + 1}. ${user.name} (${user.employeeId}) - ${user.Department?.name || 'No dept'} - ${user.Job?.name || 'No job'} [${lineStatus}] [${roleStatus}]`);
    });

    // Let user choose which user to reset (default to first regular user)
    const targetUser = process.argv[2] || null;
    let selectedUser;

    if (targetUser) {
      // Find user by employee ID or name
      selectedUser = allUsers.find(user => 
        user.employeeId === targetUser || 
        user.name === targetUser ||
        user.id === targetUser
      );
      
      if (!selectedUser) {
        console.log(`❌ User not found: ${targetUser}`);
        console.log("💡 Usage: node reset-user-skills.js [employeeId|name|userId]");
        console.log("💡 Or run without arguments to reset the first regular user");
        return;
      }
    } else {
      // Default to first regular user
      selectedUser = allUsers.find(user => user.role === 'user') || allUsers[0];
    }

    console.log(`\n🎯 Selected user: ${selectedUser.name} (${selectedUser.employeeId})`);
    console.log(`📋 Current job: ${selectedUser.Job?.name || 'No job assigned'}`);

    // Get current skill progress
    const currentSkills = await UserSkill.findAll({
      where: { userId: selectedUser.id },
      attributes: ['id', 'skillId', 'status', 'score', 'attempts']
    });

    console.log(`\n📊 Current skill status:`);
    console.log(`   - Total skills: ${currentSkills.length}`);
    console.log(`   - Certified: ${currentSkills.filter(s => s.status === 'certified').length}`);
    console.log(`   - Completed: ${currentSkills.filter(s => s.status === 'completed').length}`);
    console.log(`   - In Progress: ${currentSkills.filter(s => s.status === 'in_progress').length}`);
    console.log(`   - Not Started: ${currentSkills.filter(s => s.status === 'not_started').length}`);

    const hasSkillsToReset = currentSkills.length > 0;

    // Confirm reset
    console.log(`\n⚠️  This will RESET career progress for ${selectedUser.name}`);
    if (hasSkillsToReset) {
      console.log("   - All UserSkill records will be deleted");
    } else {
      console.log("   - No skill records to delete (already clean)");
    }
    console.log("   - Job title will be reset to entry-level");
    console.log("   - User will start completely fresh");
    console.log("   - This action cannot be undone");

    // Auto-confirm for script usage (add 'confirm' as second argument to skip prompt)
    const autoConfirm = process.argv[3] === 'confirm';
    
    if (!autoConfirm) {
      console.log("\n💡 To proceed, run the script with 'confirm' as the second argument:");
      console.log(`   node reset-user-skills.js "${selectedUser.employeeId}" confirm`);
      return;
    }

    // Find entry-level job for user's department
    console.log(`\n🔍 Finding entry-level job for department: ${selectedUser.Department?.name || 'No department'}`);
    
    let entryLevelJob = null;
    if (selectedUser.departmentId) {
      // Find all jobs in the user's department, ordered by hierarchy
      const departmentJobs = await Job.findAll({
        where: { departmentId: selectedUser.departmentId },
        attributes: ['id', 'name', 'nextJobId'],
        order: [['name', 'ASC']]
      });

      console.log(`📋 Available jobs in ${selectedUser.Department?.name}:`);
      departmentJobs.forEach((job, index) => {
        console.log(`   ${index + 1}. ${job.name} (ID: ${job.id})`);
      });

      // Find entry-level job (jobs that are not referenced as nextJobId by other jobs)
      const nextJobIds = departmentJobs.map(job => job.nextJobId).filter(Boolean);
      const entryLevelJobs = departmentJobs.filter(job => !nextJobIds.includes(job.id));
      
      if (entryLevelJobs.length > 0) {
        entryLevelJob = entryLevelJobs[0]; // Take the first entry-level job
        console.log(`🎯 Found entry-level job: ${entryLevelJob.name}`);
      } else {
        // Fallback: look for common entry-level job names
        entryLevelJob = departmentJobs.find(job => 
          job.name.includes('新手') || 
          job.name.includes('初階') || 
          job.name.includes('助理') ||
          job.name.includes('新人')
        ) || departmentJobs[0]; // Last resort: first job in department
        
        if (entryLevelJob) {
          console.log(`🔄 Using fallback entry-level job: ${entryLevelJob.name}`);
        }
      }
    }

    // If no specific entry-level job found, look for global entry-level job
    if (!entryLevelJob) {
      console.log(`🔍 Looking for global entry-level job...`);
      entryLevelJob = await Job.findOne({
        where: {
          name: {
            [Op.or]: [
              { [Op.like]: '%新手%' },
              { [Op.like]: '%初階%' },
              { [Op.like]: '%助理%' }
            ]
          }
        },
        attributes: ['id', 'name']
      });
      
      if (entryLevelJob) {
        console.log(`🎯 Found global entry-level job: ${entryLevelJob.name}`);
      }
    }

    // Perform the reset
    console.log(`\n🔄 Resetting career for ${selectedUser.name}...`);
    
    // Reset skills (if any exist)
    let deletedCount = 0;
    if (hasSkillsToReset) {
      deletedCount = await UserSkill.destroy({
        where: { userId: selectedUser.id },
        force: true // Permanently delete (bypass soft delete)
      });
      console.log(`✅ Successfully deleted ${deletedCount} skill records`);
    } else {
      console.log(`ℹ️  No skill records to delete`);
    }

    // Reset job title
    let jobResetMessage = "";
    if (entryLevelJob) {
      const previousJob = selectedUser.Job?.name || 'No job';
      await selectedUser.update({ jobId: entryLevelJob.id });
      jobResetMessage = `\n✅ Job title updated: ${previousJob} → ${entryLevelJob.name}`;
    } else {
      jobResetMessage = `\n⚠️  Could not find suitable entry-level job - job title unchanged`;
    }

    console.log(jobResetMessage);
    console.log(`🎉 ${selectedUser.name} now has a clean slate to start their career journey!`);
    
    console.log(`\n📋 Reset Summary:`);
    if (hasSkillsToReset) {
      console.log(`   - Skills: All ${deletedCount} skill records deleted`);
    } else {
      console.log(`   - Skills: No records to delete (already clean)`);
    }
    console.log(`   - Job Title: ${entryLevelJob ? entryLevelJob.name : 'Unchanged'}`);
    console.log(`   - Department: ${selectedUser.Department?.name || 'No department'} (unchanged)`);
    
    console.log(`\n📋 Next steps:`);
    console.log(`   1. User can now start fresh on the skill roadmap`);
    console.log(`   2. All skills will show as 'not_started'`);
    console.log(`   3. User can begin learning from entry-level: ${entryLevelJob?.name || 'Current job'}`);
    console.log(`   4. Progress through job hierarchy as skills are completed`);

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

// Show usage if no arguments
if (process.argv.length === 2) {
  console.log("🔄 Reset User Skills Script");
  console.log("============================");
  console.log("");
  console.log("Usage:");
  console.log("  node reset-user-skills.js                              # Show available users");
  console.log("  node reset-user-skills.js [employeeId] confirm         # Reset specific user");
  console.log("  node reset-user-skills.js [name] confirm               # Reset by name");
  console.log("");
  console.log("Examples:");
  console.log("  node reset-user-skills.js EMP002 confirm               # Reset user EMP002");
  console.log("  node reset-user-skills.js '李大華' confirm              # Reset by name");
  console.log("");
}

// Run the script
resetUserSkills();