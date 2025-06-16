const { User, Job, UserSkill, JobSkill } = require('../models');

async function testPromotionSystem() {
  try {
    console.log('🧪 Testing Job Promotion System...\n');

    // Find a user in 新手村 (entry level)
    const user = await User.findOne({
      include: [
        {
          model: Job,
          where: { name: '新手村' }
        }
      ]
    });

    if (!user) {
      console.log('❌ No user found in 新手村 position');
      return;
    }

    console.log(`👤 Testing with user: ${user.name} (${user.employeeId})`);
    console.log(`📋 Current job: ${user.Job.name}\n`);

    // Check current job's next job
    const currentJob = await Job.findByPk(user.Job.id, {
      include: [
        {
          model: Job,
          as: 'NextJob'
        }
      ]
    });

    if (!currentJob.NextJob) {
      console.log('❌ No next job available for this position');
      return;
    }

    console.log(`⬆️  Next job level: ${currentJob.NextJob.name}\n`);

    // Check required skills for current job
    const requiredSkills = await JobSkill.findAll({
      where: {
        jobId: user.Job.id,
        isRequired: true
      },
      include: [
        {
          model: require('../models').Skill,
          attributes: ['id', 'name', 'category']
        }
      ]
    });

    console.log(`📚 Required skills for ${user.Job.name}:`);
    requiredSkills.forEach(js => {
      console.log(`   - ${js.Skill.name} (${js.Skill.category})`);
    });

    // Check user's completed skills
    const userSkills = await UserSkill.findAll({
      where: {
        userId: user.id,
        skillId: { $in: requiredSkills.map(rs => rs.skillId) },
        status: { $in: ['completed', 'certified'] }
      },
      include: [
        {
          model: require('../models').Skill,
          attributes: ['id', 'name', 'category']
        }
      ]
    });

    console.log(`\n✅ User's completed required skills:`);
    userSkills.forEach(us => {
      console.log(`   - ${us.Skill.name} (Status: ${us.status}, Score: ${us.score || 'N/A'})`);
    });

    const completedCount = userSkills.length;
    const requiredCount = requiredSkills.length;
    const canPromote = completedCount >= requiredCount;

    console.log(`\n📊 Promotion Status:`);
    console.log(`   Required skills: ${requiredCount}`);
    console.log(`   Completed skills: ${completedCount}`);
    console.log(`   Can promote: ${canPromote ? '✅ YES' : '❌ NO'}`);

    if (canPromote) {
      console.log(`\n🎉 User ${user.name} is eligible for promotion to ${currentJob.NextJob.name}!`);
    } else {
      console.log(`\n⏳ User ${user.name} needs to complete ${requiredCount - completedCount} more skills before promotion.`);
      
      const missingSkills = requiredSkills.filter(rs => 
        !userSkills.some(us => us.skillId === rs.skillId)
      );
      
      console.log(`\n❓ Missing skills:`);
      missingSkills.forEach(ms => {
        console.log(`   - ${ms.Skill.name} (${ms.Skill.category})`);
      });
    }

    console.log('\n✅ Promotion system test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing promotion system:', error);
  }
}

// Export for use in other scripts
module.exports = testPromotionSystem;

// Run test if called directly
if (require.main === module) {
  require('dotenv').config();
  const { sequelize } = require('../models');
  
  testPromotionSystem().finally(() => {
    sequelize.close();
  });
}