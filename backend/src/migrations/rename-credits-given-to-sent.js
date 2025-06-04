'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if we need to rename from creditsGiven to creditsSent
    const tableDescription = await queryInterface.describeTable('users');
    
    if (tableDescription.creditsGiven && !tableDescription.creditsSent) {
      // Rename column from creditsGiven to creditsSent
      await queryInterface.renameColumn('users', 'creditsGiven', 'creditsSent');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check if we need to rename back from creditsSent to creditsGiven
    const tableDescription = await queryInterface.describeTable('users');
    
    if (tableDescription.creditsSent && !tableDescription.creditsGiven) {
      // Rename column back from creditsSent to creditsGiven
      await queryInterface.renameColumn('users', 'creditsSent', 'creditsGiven');
    }
  }
};