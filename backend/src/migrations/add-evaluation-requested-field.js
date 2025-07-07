'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      // Check if table exists
      const tableExists = await queryInterface.describeTable('user_skills').catch(() => null);
      if (!tableExists) {
        console.log('⚠️  user_skills table does not exist, skipping migration');
        return;
      }

      const tableDescription = await queryInterface.describeTable('user_skills');

      // Add evaluationRequestedAt field if it doesn't exist
      if (!tableDescription.evaluationRequestedAt) {
        console.log('🔧 Adding evaluationRequestedAt field');
        await queryInterface.addColumn('user_skills', 'evaluationRequestedAt', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the user requested evaluation for this skill'
        });
      }

      // Add evaluatedBy field if it doesn't exist
      if (!tableDescription.evaluatedBy) {
        console.log('🔧 Adding evaluatedBy field');
        await queryInterface.addColumn('user_skills', 'evaluatedBy', {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id'
          },
          comment: 'ID of the user who evaluated this skill (evaluator/admin)'
        });
      }

      // Add evaluatedAt field if it doesn't exist
      if (!tableDescription.evaluatedAt) {
        console.log('🔧 Adding evaluatedAt field');
        await queryInterface.addColumn('user_skills', 'evaluatedAt', {
          type: Sequelize.DATE,
          allowNull: true,
          comment: 'When the skill was evaluated'
        });
      }

      console.log('✅ Migration completed: add-evaluation-requested-field');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove the new fields
    await queryInterface.removeColumn('user_skills', 'evaluationRequestedAt');
    await queryInterface.removeColumn('user_skills', 'evaluatedBy');
    await queryInterface.removeColumn('user_skills', 'evaluatedAt');

    // Note: Status enum will remain unchanged
  }
};