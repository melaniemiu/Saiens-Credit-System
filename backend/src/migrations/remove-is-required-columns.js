'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove isRequired from job_skills table
    try {
      await queryInterface.removeColumn('job_skills', 'isRequired');
      console.log('✅ Removed isRequired column from job_skills table');
    } catch (error) {
      console.log('⚠️  isRequired column may not exist in job_skills table:', error.message);
    }
    
    // Remove isRequired from skill_prerequisites table  
    try {
      await queryInterface.removeColumn('skill_prerequisites', 'isRequired');
      console.log('✅ Removed isRequired column from skill_prerequisites table');
    } catch (error) {
      console.log('⚠️  isRequired column may not exist in skill_prerequisites table:', error.message);
    }

    // Remove isRequired from skills table (if it still exists)
    try {
      await queryInterface.removeColumn('skills', 'isRequired');
      console.log('✅ Removed isRequired column from skills table');
    } catch (error) {
      console.log('⚠️  isRequired column may not exist in skills table:', error.message);
    }
  },

  async down(queryInterface, Sequelize) {
    // Add back isRequired to job_skills table
    await queryInterface.addColumn('job_skills', 'isRequired', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this skill is required for this specific job'
    });
    
    // Add back isRequired to skill_prerequisites table
    await queryInterface.addColumn('skill_prerequisites', 'isRequired', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this prerequisite is mandatory or optional'
    });

    // Add back isRequired to skills table
    await queryInterface.addColumn('skills', 'isRequired', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this skill is required (必修) or optional (選修)'
    });
  }
};