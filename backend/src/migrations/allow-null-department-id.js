'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Change departmentId column to allow NULL
    await queryInterface.sequelize.query('ALTER TABLE users ALTER COLUMN "departmentId" DROP NOT NULL;');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert departmentId column to NOT NULL
    // First, ensure all users have a department (you might want to assign them to a default department)
    await queryInterface.sequelize.query('ALTER TABLE users ALTER COLUMN "departmentId" SET NOT NULL;');
  }
};