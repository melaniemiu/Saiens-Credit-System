'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Check if the column already exists
    const tableDescription = await queryInterface.describeTable('jobs');
    
    if (!tableDescription.nextJobId) {
      console.log('Adding nextJobId column to jobs table...');
      await queryInterface.addColumn('jobs', 'nextJobId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'jobs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      
      // Add index for better query performance
      await queryInterface.addIndex('jobs', ['nextJobId'], {
        name: 'jobs_next_job_id_index'
      });
      
      console.log('✓ nextJobId column and index added successfully');
    } else {
      console.log('✓ nextJobId column already exists, skipping...');
    }
  },

  async down (queryInterface, Sequelize) {
    // Check if the column exists before trying to remove it
    const tableDescription = await queryInterface.describeTable('jobs');
    
    if (tableDescription.nextJobId) {
      console.log('Removing nextJobId column from jobs table...');
      
      // Remove index first
      try {
        await queryInterface.removeIndex('jobs', 'jobs_next_job_id_index');
      } catch (error) {
        console.log('Index may not exist, continuing...');
      }
      
      await queryInterface.removeColumn('jobs', 'nextJobId');
      console.log('✓ nextJobId column removed successfully');
    } else {
      console.log('✓ nextJobId column does not exist, skipping...');
    }
  }
};