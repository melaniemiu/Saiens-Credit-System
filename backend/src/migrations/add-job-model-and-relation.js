'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create the jobs table
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

    // Add jobId column to users table
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
    await queryInterface.addIndex('users', ['jobId']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the index
    await queryInterface.removeIndex('users', ['jobId']);
    
    // Remove the jobId column from users table
    await queryInterface.removeColumn('users', 'jobId');
    
    // Drop the jobs table
    await queryInterface.dropTable('jobs');
  }
};