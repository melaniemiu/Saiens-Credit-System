'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get departments
    const [departments] = await queryInterface.sequelize.query(
      "SELECT id, name FROM departments WHERE \"deletedAt\" IS NULL;"
    );
    
    if (departments.length === 0) {
      console.log('No departments found, skipping job department assignment');
      return;
    }

    const deptMap = {};
    departments.forEach(dept => {
      deptMap[dept.name] = dept.id;
    });

    const engineeringDeptId = deptMap["工程部"];

    // Update engineering jobs
    if (engineeringDeptId) {
      const engineeringJobs = ["新手村", "助理工程師", "正式工程師", "資深工程師"];
      
      for (const jobName of engineeringJobs) {
        await queryInterface.sequelize.query(
          `UPDATE jobs SET "departmentId" = :departmentId WHERE name = :jobName AND "deletedAt" IS NULL;`,
          {
            replacements: { departmentId: engineeringDeptId, jobName }
          }
        );
      }
    }

    // Update other department jobs
    for (const [deptName, deptId] of Object.entries(deptMap)) {
      if (deptName === "工程部") continue;
      
      const deptNameBase = deptName.replace("部", "");
      const jobSuffixes = ["初心者", "玩家", "大師"];
      
      for (const suffix of jobSuffixes) {
        const jobName = `${deptNameBase}${suffix}`;
        await queryInterface.sequelize.query(
          `UPDATE jobs SET "departmentId" = :departmentId WHERE name = :jobName AND "deletedAt" IS NULL;`,
          {
            replacements: { departmentId: deptId, jobName }
          }
        );
      }
    }

    console.log('Updated existing jobs with department assignments');
  },

  async down(queryInterface, Sequelize) {
    // Remove department assignments
    await queryInterface.sequelize.query(
      `UPDATE jobs SET "departmentId" = NULL WHERE "deletedAt" IS NULL;`
    );
  }
};