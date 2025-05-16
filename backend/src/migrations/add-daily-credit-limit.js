'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add dailyCreditLimit column
    await queryInterface.addColumn('users', 'dailyCreditLimit', {
      type: Sequelize.INTEGER,
      defaultValue: 5,
      allowNull: false
    });

    // Update existing users to have their own dailyCreditLimit
    await queryInterface.sequelize.query(
      `UPDATE users SET "dailyCreditLimit" = 5 WHERE "dailyCreditLimit" IS NULL`
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the column if rolling back
    await queryInterface.removeColumn('users', 'dailyCreditLimit');
  }
};