'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column already exists
    const tableDescription = await queryInterface.describeTable('users');
    
    if (!tableDescription.dailyCreditLimit) {
      // Add dailyCreditLimit column only if it doesn't exist
      await queryInterface.addColumn('users', 'dailyCreditLimit', {
        type: Sequelize.INTEGER,
        defaultValue: 5,
        allowNull: false
      });

      // Update existing users to have their own dailyCreditLimit
      await queryInterface.sequelize.query(
        `UPDATE users SET "dailyCreditLimit" = 5 WHERE "dailyCreditLimit" IS NULL`
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check if column exists before trying to remove it
    const tableDescription = await queryInterface.describeTable('users');
    
    if (tableDescription.dailyCreditLimit) {
      await queryInterface.removeColumn('users', 'dailyCreditLimit');
    }
  }
};