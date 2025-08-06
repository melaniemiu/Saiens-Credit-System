'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove isActive column from skill_categories table
    await queryInterface.removeColumn('skill_categories', 'isActive');
  },

  down: async (queryInterface, Sequelize) => {
    // Add back isActive column if we need to rollback
    await queryInterface.addColumn('skill_categories', 'isActive', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this category is active and available for use'
    });
  }
};