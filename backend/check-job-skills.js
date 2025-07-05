#!/usr/bin/env node

require("dotenv").config();
const { User, Job, Skill, JobSkill, UserSkill } = require("./src/models");

async function checkJobSkills() {
  console.log("🔍 Check Job Skills Script");
  console.log("==========================");

  try {
    const userId = process.argv[2] || 'ea77c914-a02f-4b2c-ae4d-42c583445a87'; // Default to 王小明's ID
    
    // Find the user
    const user = await User.findByPk(userId, {
      include: [
        { model: Job, attributes: ['id', 'name'] }
      ]
    });

    if (!user) {
      console.log("❌ User not found!");
      return;
    }

    console.log(`👤 User: ${user.name} (${user.employeeId})`);
    console.log(`💼 Current Job: ${user.Job?.name || 'No job assigned'}`);
    console.log(`🆔 Job ID: ${user.Job?.id || 'N/A'}`);

    if (!user.Job) {
      console.log("❌ User has no job assigned!");
      return;
    }

    // Find all skills assigned to this job
    const jobSkills = await JobSkill.findAll({
      where: { jobId: user.Job.id },
      include: [
        {
          model: Skill,
          attributes: ['id', 'name', 'category', 'isRequired', 'learningMethod', 'assessmentMethod']
        }
      ],
      order: [
        ['isRequired', 'DESC'], // Required skills first
        [Skill, 'name', 'ASC']
      ]
    });

    console.log(`\n📚 Skills assigned to "${user.Job.name}" (${jobSkills.length} total):`);
    
    if (jobSkills.length === 0) {
      console.log("❌ No skills assigned to this job!");
      console.log("💡 This explains why the roadmap shows no skills to learn.");
      
      // Check if there are skills assigned to other job levels
      console.log("\n🔍 Checking skills for other job levels...");
      
      const allJobSkills = await JobSkill.findAll({
        include: [
          {
            model: Job,
            attributes: ['id', 'name']
          },
          {
            model: Skill,
            attributes: ['id', 'name']
          }
        ]
      });

      const skillsByJob = {};
      allJobSkills.forEach(js => {
        const jobName = js.Job.name;
        if (!skillsByJob[jobName]) {
          skillsByJob[jobName] = [];
        }
        skillsByJob[jobName].push(js.Skill.name);
      });

      console.log("\n📋 Skills by job level:");
      Object.keys(skillsByJob).forEach(jobName => {
        console.log(`   ${jobName}: ${skillsByJob[jobName].length} skills`);
      });
      
    } else {
      jobSkills.forEach((jobSkill, index) => {
        const skill = jobSkill.Skill;
        const required = jobSkill.isRequired ? "📌 必修" : "📘 選修";
        console.log(`   ${index + 1}. ${skill.name} (${skill.category}) [${required}]`);
      });

      // Check user's progress on these skills
      console.log(`\n📊 User's progress on job skills:`);
      
      const userSkills = await UserSkill.findAll({
        where: { 
          userId: user.id,
          skillId: jobSkills.map(js => js.Skill.id)
        },
        include: [
          {
            model: Skill,
            attributes: ['name']
          }
        ]
      });

      const progressMap = {};
      userSkills.forEach(us => {
        progressMap[us.skillId] = us.status;
      });

      jobSkills.forEach((jobSkill, index) => {
        const skill = jobSkill.Skill;
        const status = progressMap[skill.id] || 'not_started';
        const statusIcon = {
          'not_started': '⚪',
          'in_progress': '🔵',
          'completed': '🟢',
          'certified': '🟡'
        }[status] || '⚪';
        
        console.log(`   ${statusIcon} ${skill.name} - ${status}`);
      });
    }

    // Also check if UserSkill records exist but aren't linked to JobSkill
    const allUserSkills = await UserSkill.findAll({
      where: { userId: user.id },
      include: [
        {
          model: Skill,
          attributes: ['id', 'name', 'category']
        }
      ]
    });

    console.log(`\n🎯 All UserSkill records for this user: ${allUserSkills.length}`);
    if (allUserSkills.length > 0) {
      console.log("   (These might be from previous job levels or skills not assigned to current job)");
      allUserSkills.forEach((us, index) => {
        console.log(`   ${index + 1}. ${us.Skill.name} - ${us.status}`);
      });
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
  }
}

// Show usage
console.log("Usage: node check-job-skills.js [userId]");
console.log("Example: node check-job-skills.js ea77c914-a02f-4b2c-ae4d-42c583445a87");
console.log("");

checkJobSkills();