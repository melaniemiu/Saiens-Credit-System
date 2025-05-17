'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Fetch all users and assign them jobs based on their department
    const [departments] = await queryInterface.sequelize.query(
      'SELECT id, name FROM departments'
    );
    
    const [jobs] = await queryInterface.sequelize.query(
      'SELECT id, name FROM jobs'
    );
    
    const [users] = await queryInterface.sequelize.query(
      'SELECT id, "departmentId", role FROM users WHERE "jobId" IS NULL'
    );
    
    // Create a map of job names to IDs
    const jobMap = {};
    jobs.forEach(job => {
      jobMap[job.name] = job.id;
    });
    
    // Create a map of department IDs to names
    const deptMap = {};
    departments.forEach(dept => {
      deptMap[dept.id] = dept.name;
    });
    
    // Update each user with a job
    for (const user of users) {
      if (user.departmentId) {
        const deptName = deptMap[user.departmentId];
        if (deptName) {
          const deptBase = deptName.replace('部', '');
          
          // Assign job level based on some logic (admin gets 大師, others get random)
          let jobLevel;
          if (user.role === 'admin') {
            jobLevel = '大師';
          } else {
            const levels = ['初心者', '玩家', '大師'];
            jobLevel = levels[Math.floor(Math.random() * levels.length)];
          }
          
          const jobName = `${deptBase}${jobLevel}`;
          const jobId = jobMap[jobName];
          
          if (jobId) {
            await queryInterface.sequelize.query(
              'UPDATE users SET "jobId" = :jobId WHERE id = :userId',
              {
                replacements: { jobId, userId: user.id }
              }
            );
            console.log(`Assigned job ${jobName} to user ${user.id}`);
          }
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Set all jobIds back to null
    await queryInterface.sequelize.query(
      'UPDATE users SET "jobId" = NULL'
    );
  }
};