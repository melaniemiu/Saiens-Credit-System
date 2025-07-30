const { User, Job, Department } = require('../models');
const { Op } = require('sequelize');

/**
 * Fix user-job mapping issues by assigning default jobs to users without job assignments
 */
async function fixUserJobMapping() {
  console.log('🔧 Starting user-job mapping fix...');
  
  try {
    // Get all users without job assignments
    const usersWithoutJobs = await User.findAll({
      where: {
        jobId: null
      },
      include: [
        {
          model: Department,
          attributes: ['id', 'name']
        }
      ]
    });

    console.log(`📋 Found ${usersWithoutJobs.length} users without job assignments`);

    if (usersWithoutJobs.length === 0) {
      console.log('✅ All users already have job assignments');
      return;
    }

    // Get all available jobs grouped by department
    const jobsByDepartment = await Job.findAll({
      include: [
        {
          model: Department,
          attributes: ['id', 'name']
        }
      ],
      order: [['level', 'ASC']]
    });

    console.log(`📊 Available jobs:`, jobsByDepartment.map(j => `${j.name} (Level ${j.level}) - ${j.Department?.name || 'No Department'}`));

    // Create a map of departments to their entry-level jobs
    const departmentToDefaultJob = {};
    jobsByDepartment.forEach(job => {
      const deptId = job.departmentId;
      if (deptId && (!departmentToDefaultJob[deptId] || job.level < departmentToDefaultJob[deptId].level)) {
        departmentToDefaultJob[deptId] = job;
      }
    });

    // Find a global default job (lowest level job available)
    const globalDefaultJob = jobsByDepartment.reduce((lowest, current) => {
      if (!lowest || current.level < lowest.level) {
        return current;
      }
      return lowest;
    }, null);

    console.log(`🎯 Global default job: ${globalDefaultJob?.name} (Level ${globalDefaultJob?.level})`);

    // Assign jobs to users
    let fixedCount = 0;
    for (const user of usersWithoutJobs) {
      let jobToAssign = null;
      
      // Try to assign department-specific default job first
      if (user.Department && departmentToDefaultJob[user.Department.id]) {
        jobToAssign = departmentToDefaultJob[user.Department.id];
        console.log(`👤 ${user.name} (${user.employeeId}) -> Department default: ${jobToAssign.name}`);
      } 
      // Fallback to global default job
      else if (globalDefaultJob) {
        jobToAssign = globalDefaultJob;
        console.log(`👤 ${user.name} (${user.employeeId}) -> Global default: ${jobToAssign.name}`);
      }

      if (jobToAssign) {
        await user.update({ jobId: jobToAssign.id });
        fixedCount++;
      } else {
        console.warn(`⚠️  No suitable job found for user: ${user.name} (${user.employeeId})`);
      }
    }

    console.log(`✅ Successfully assigned jobs to ${fixedCount} users`);
    
    // Verify the fix
    const remainingUsersWithoutJobs = await User.count({
      where: { jobId: null }
    });
    
    console.log(`📈 Users without jobs remaining: ${remainingUsersWithoutJobs}`);
    
  } catch (error) {
    console.error('❌ Error fixing user-job mapping:', error);
    throw error;
  }
}

/**
 * Create missing default jobs if needed
 */
async function createDefaultJobs() {
  console.log('🏗️  Creating default jobs if needed...');
  
  try {
    // Get all departments
    const departments = await Department.findAll();
    
    // Default job hierarchy
    const defaultJobs = [
      { name: '新手村', level: 1 },
      { name: '助理工程師', level: 2 },
      { name: '正式工程師', level: 3 },
      { name: '資深工程師', level: 4 }
    ];

    for (const dept of departments) {
      console.log(`🏢 Processing department: ${dept.name}`);
      
      for (const jobData of defaultJobs) {
        const existingJob = await Job.findOne({
          where: {
            name: jobData.name
            // Remove departmentId check since names are globally unique
          }
        });

        if (!existingJob) {
          const newJob = await Job.create({
            name: jobData.name,
            level: jobData.level,
            departmentId: dept.id
          });
          console.log(`  ➕ Created job: ${newJob.name} (Level ${newJob.level})`);
        } else {
          console.log(`  ✓ Job already exists: ${existingJob.name}`);
        }
      }
    }

    // Create department-independent jobs if no departments exist
    const departmentCount = await Department.count();
    if (departmentCount === 0) {
      console.log('🏢 No departments found, creating global jobs...');
      
      for (const jobData of defaultJobs) {
        const existingJob = await Job.findOne({
          where: {
            name: jobData.name,
            departmentId: null
          }
        });

        if (!existingJob) {
          const newJob = await Job.create({
            name: jobData.name,
            level: jobData.level,
            departmentId: null
          });
          console.log(`  ➕ Created global job: ${newJob.name} (Level ${newJob.level})`);
        }
      }
    }
    
    console.log('✅ Default jobs creation completed');
    
  } catch (error) {
    console.error('❌ Error creating default jobs:', error);
    throw error;
  }
}

/**
 * Main function to fix all user-job mapping issues
 */
async function fixAllUserJobIssues() {
  console.log('🚀 Starting comprehensive user-job mapping fix...\n');
  
  try {
    // Step 1: Create default jobs if needed
    await createDefaultJobs();
    console.log('');
    
    // Step 2: Fix user job assignments
    await fixUserJobMapping();
    console.log('');
    
    // Step 3: Show final statistics
    const totalUsers = await User.count();
    const usersWithJobs = await User.count({ where: { jobId: { [Op.not]: null } } });
    const usersWithoutJobs = totalUsers - usersWithJobs;
    
    console.log('📊 Final Statistics:');
    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Users with jobs: ${usersWithJobs}`);
    console.log(`   Users without jobs: ${usersWithoutJobs}`);
    console.log(`   Success rate: ${((usersWithJobs / totalUsers) * 100).toFixed(1)}%`);
    
    if (usersWithoutJobs === 0) {
      console.log('🎉 All users now have job assignments!');
    } else {
      console.log('⚠️  Some users still need manual job assignment');
    }
    
  } catch (error) {
    console.error('💥 Failed to fix user-job mapping issues:', error);
    process.exit(1);
  }
}

// Export functions for use in other scripts
module.exports = {
  fixUserJobMapping,
  createDefaultJobs,
  fixAllUserJobIssues
};

// Run the fix if this script is executed directly
if (require.main === module) {
  fixAllUserJobIssues()
    .then(() => {
      console.log('\n✅ User-job mapping fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ User-job mapping fix failed:', error);
      process.exit(1);
    });
}