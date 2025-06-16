const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table already exists
    const tableExists = await queryInterface.tableExists('skill_departments');
    
    if (!tableExists) {
      console.log('Creating skill_departments table...');
      // Create skill_departments table
      await queryInterface.createTable('skill_departments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      skillId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'skills',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      departmentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'departments',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

      // Add unique constraint for skillId-departmentId combination
      await queryInterface.addIndex('skill_departments', ['skillId', 'departmentId'], {
        unique: true,
        name: 'skill_departments_skill_department_unique'
      });

      // Add individual indexes for foreign keys
      await queryInterface.addIndex('skill_departments', ['skillId'], {
        name: 'skill_departments_skill_id_index'
      });

      await queryInterface.addIndex('skill_departments', ['departmentId'], {
        name: 'skill_departments_department_id_index'
      });
      
      console.log('✓ skill_departments table and indexes created successfully');
    } else {
      console.log('✓ skill_departments table already exists, skipping...');
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableExists = await queryInterface.tableExists('skill_departments');
    
    if (tableExists) {
      console.log('Dropping skill_departments table...');
      await queryInterface.dropTable('skill_departments');
      console.log('✓ skill_departments table dropped successfully');
    } else {
      console.log('✓ skill_departments table does not exist, skipping...');
    }
  }
};