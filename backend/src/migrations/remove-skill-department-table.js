'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if table exists before trying to drop it
    const tableExists = await queryInterface.tableExists('skill_departments');
    
    if (tableExists) {
      console.log('🗑️  Dropping skill_departments table...');
      
      // Drop the table (this will automatically drop all indexes and constraints)
      await queryInterface.dropTable('skill_departments');
      
      console.log('✅ Successfully dropped skill_departments table');
    } else {
      console.log('ℹ️  skill_departments table does not exist, skipping...');
    }
  },

  async down(queryInterface, Sequelize) {
    // Recreate the skill_departments table if rollback is needed
    const tableExists = await queryInterface.tableExists('skill_departments');
    
    if (!tableExists) {
      console.log('🔄 Recreating skill_departments table...');
      
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

      // Add indexes
      await queryInterface.addIndex('skill_departments', ['skillId', 'departmentId'], {
        unique: true,
        name: 'skill_departments_skill_department_unique'
      });
      
      await queryInterface.addIndex('skill_departments', ['skillId'], {
        name: 'skill_departments_skill_id_index'
      });
      
      await queryInterface.addIndex('skill_departments', ['departmentId'], {
        name: 'skill_departments_department_id_index'
      });
      
      console.log('✅ skill_departments table recreated successfully');
    } else {
      console.log('ℹ️  skill_departments table already exists, skipping...');
    }
  }
};