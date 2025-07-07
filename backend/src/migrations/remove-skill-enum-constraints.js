const { QueryInterface, DataTypes } = require('sequelize');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      console.log('🔄 Starting migration: remove-skill-enum-constraints');

      // First, check if the table exists
      const tableExists = await queryInterface.describeTable('skills').catch(() => null);
      if (!tableExists) {
        console.log('⚠️  Skills table does not exist, skipping migration');
        return;
      }

      // Get current table structure
      const tableDescription = await queryInterface.describeTable('skills');
      console.log('📋 Current skills table structure:', Object.keys(tableDescription));

      // Change learningMethod from ENUM to STRING
      if (tableDescription.learningMethod && tableDescription.learningMethod.type === 'USER-DEFINED') {
        console.log('🔧 Changing learningMethod from ENUM to STRING');
        await queryInterface.changeColumn('skills', 'learningMethod', {
          type: DataTypes.STRING,
          allowNull: false,
          comment: 'Learning method from CSV data (flexible values)'
        });
      } else {
        console.log('⚠️  learningMethod is already STRING or not found');
      }

      // Change assessmentMethod from ENUM to STRING  
      if (tableDescription.assessmentMethod && tableDescription.assessmentMethod.type === 'USER-DEFINED') {
        console.log('🔧 Changing assessmentMethod from ENUM to STRING');
        await queryInterface.changeColumn('skills', 'assessmentMethod', {
          type: DataTypes.STRING,
          allowNull: false,
          comment: 'Assessment method from CSV data (flexible values)'
        });
      } else {
        console.log('⚠️  assessmentMethod is already STRING or not found');
      }

      console.log('✅ Migration completed: remove-skill-enum-constraints');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      console.log('🔄 Starting rollback: remove-skill-enum-constraints');

      // Revert learningMethod back to ENUM
      await queryInterface.changeColumn('skills', 'learningMethod', {
        type: DataTypes.ENUM('實體', '線上'),
        allowNull: false,
        comment: 'Learning method: 實體 (physical) or 線上 (online)'
      });

      // Revert assessmentMethod back to ENUM
      await queryInterface.changeColumn('skills', 'assessmentMethod', {
        type: DataTypes.ENUM('考卷考核', '實作考核'),
        allowNull: false,
        comment: 'Assessment method: 考卷考核 (exam) or 實作考核 (practical)'
      });

      console.log('✅ Rollback completed: remove-skill-enum-constraints');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
};