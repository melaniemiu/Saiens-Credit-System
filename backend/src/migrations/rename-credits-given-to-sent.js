'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Rename column from creditsGiven to creditsSent
    await queryInterface.renameColumn('users', 'creditsGiven', 'creditsSent');
  },

  down: async (queryInterface, Sequelize) => {
    // Rename column back from creditsSent to creditsGiven
    await queryInterface.renameColumn('users', 'creditsSent', 'creditsGiven');
  }
};