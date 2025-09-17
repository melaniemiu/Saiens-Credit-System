'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update all existing users to have the new daily credit limit of 20
    await queryInterface.sequelize.query(
      `UPDATE users SET "dailyCreditLimit" = 20, "remainingDailyCredits" = 20 WHERE "dailyCreditLimit" = 5`
    );

    console.log('Updated all users with daily credit limit from 5 to 20');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to 5 if needed
    await queryInterface.sequelize.query(
      `UPDATE users SET "dailyCreditLimit" = 5, "remainingDailyCredits" = 5 WHERE "dailyCreditLimit" = 20`
    );

    console.log('Reverted all users daily credit limit from 20 to 5');
  }
};