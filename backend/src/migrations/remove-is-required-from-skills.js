'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove the isRequired index first
    try {
      await queryInterface.removeIndex('skills', ['isRequired']);
    } catch (error) {
      console.log('Index on isRequired may not exist, continuing...');
    }
    
    // Remove the isRequired column
    await queryInterface.removeColumn('skills', 'isRequired');
  },

  async down(queryInterface, Sequelize) {
    // Add back the isRequired column
    await queryInterface.addColumn('skills', 'isRequired', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this skill is required (必修) or optional (選修)'
    });
    
    // Add back the index
    await queryInterface.addIndex('skills', ['isRequired']);
  }
};