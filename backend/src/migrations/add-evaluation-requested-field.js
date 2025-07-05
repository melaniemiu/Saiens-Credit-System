'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add evaluationRequestedAt field to track when evaluation was requested
    await queryInterface.addColumn('user_skills', 'evaluationRequestedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When the user requested evaluation for this skill'
    });

    // Add evaluatedBy field to replace certifiedBy
    await queryInterface.addColumn('user_skills', 'evaluatedBy', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'ID of the user who evaluated this skill (evaluator/admin)'
    });

    // Add evaluatedAt field to replace certifiedAt
    await queryInterface.addColumn('user_skills', 'evaluatedAt', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'When the skill was evaluated'
    });

    // Note: We'll keep the status enum as is for now since changing enums in PostgreSQL is complex
    // The 'certified' status will simply not be used in the application logic
  },

  async down(queryInterface, Sequelize) {
    // Remove the new fields
    await queryInterface.removeColumn('user_skills', 'evaluationRequestedAt');
    await queryInterface.removeColumn('user_skills', 'evaluatedBy');
    await queryInterface.removeColumn('user_skills', 'evaluatedAt');

    // Note: Status enum will remain unchanged
  }
};