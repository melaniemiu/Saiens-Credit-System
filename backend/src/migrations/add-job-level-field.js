const { QueryInterface, DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🔄 Starting migration: add-job-level-field');

      // Check if the table exists
      const tableExists = await queryInterface.describeTable('jobs').catch(() => null);
      if (!tableExists) {
        console.log('⚠️  Jobs table does not exist, skipping migration');
        return;
      }

      // Check if level field already exists
      const tableDescription = await queryInterface.describeTable('jobs');
      if (tableDescription.level) {
        console.log('⚠️  Level field already exists, skipping migration');
        return;
      }

      // Add level field
      console.log('🔧 Adding level field to jobs table');
      await queryInterface.addColumn('jobs', 'level', {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Job level for career progression (1=entry, higher=senior)'
      });

      console.log('✅ Migration completed: add-job-level-field');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log('🔄 Starting rollback: add-job-level-field');

      // Remove level field
      await queryInterface.removeColumn('jobs', 'level');

      console.log('✅ Rollback completed: add-job-level-field');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};