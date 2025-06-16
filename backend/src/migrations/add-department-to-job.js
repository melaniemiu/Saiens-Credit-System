'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if the column already exists
    const tableDescription = await queryInterface.describeTable('jobs');
    
    if (!tableDescription.departmentId) {
      console.log('Adding departmentId column to jobs table...');
      await queryInterface.addColumn('jobs', 'departmentId', {
        type: Sequelize.UUID,
        allowNull: true, // Allow null initially for existing jobs
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });

      // Add index for better query performance
      await queryInterface.addIndex('jobs', ['departmentId'], {
        name: 'jobs_department_id_index'
      });
      
      console.log('✓ departmentId column and index added successfully');
    } else {
      console.log('✓ departmentId column already exists, skipping...');
    }
  },

  async down(queryInterface, Sequelize) {
    // Check if the column exists before trying to remove it
    const tableDescription = await queryInterface.describeTable('jobs');
    
    if (tableDescription.departmentId) {
      console.log('Removing departmentId column from jobs table...');
      
      // Remove index first
      try {
        await queryInterface.removeIndex('jobs', 'jobs_department_id_index');
      } catch (error) {
        console.log('Index may not exist, continuing...');
      }
      
      await queryInterface.removeColumn('jobs', 'departmentId');
      console.log('✓ departmentId column removed successfully');
    } else {
      console.log('✓ departmentId column does not exist, skipping...');
    }
  }
};