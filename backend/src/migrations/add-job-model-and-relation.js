'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if jobs table exists
    const tables = await queryInterface.showAllTables();
    if (!tables.includes('jobs')) {
      // Create the jobs table only if it doesn't exist
      await queryInterface.createTable('jobs', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: Sequelize.STRING,
          allowNull: false,
          unique: true
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        deletedAt: {
          type: Sequelize.DATE,
          allowNull: true
        }
      });
    }

    // Check if jobId column exists in users table
    const tableDescription = await queryInterface.describeTable('users');
    if (!tableDescription.jobId) {
      // Add jobId column to users table only if it doesn't exist
      await queryInterface.addColumn('users', 'jobId', {
        type: Sequelize.UUID,
        allowNull: true, // Making it nullable initially
        references: {
          model: 'jobs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });

      // Add index on jobId for better query performance
      try {
        await queryInterface.addIndex('users', ['jobId']);
      } catch (error) {
        // Index might already exist, ignore the error
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Check if index exists before removing
    try {
      await queryInterface.removeIndex('users', ['jobId']);
    } catch (error) {
      // Index might not exist, ignore the error
    }
    
    // Check if jobId column exists before removing
    const tableDescription = await queryInterface.describeTable('users');
    if (tableDescription.jobId) {
      await queryInterface.removeColumn('users', 'jobId');
    }
    
    // Check if jobs table exists before dropping
    const tables = await queryInterface.showAllTables();
    if (tables.includes('jobs')) {
      await queryInterface.dropTable('jobs');
    }
  }
};