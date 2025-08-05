'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('job_skills');
    
    if (!tableDescription.isRequired) {
      await queryInterface.addColumn('job_skills', 'isRequired', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this skill is required or optional for the job'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDescription = await queryInterface.describeTable('job_skills');
    
    if (tableDescription.isRequired) {
      await queryInterface.removeColumn('job_skills', 'isRequired');
    }
  }
};