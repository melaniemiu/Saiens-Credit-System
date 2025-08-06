'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove isActive column from departments table
    await queryInterface.removeColumn('departments', 'isActive');
  },

  down: async (queryInterface, Sequelize) => {
    // Add back isActive column if we need to rollback
    await queryInterface.addColumn('departments', 'isActive', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false
    });
  }
};