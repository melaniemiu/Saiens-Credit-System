'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create skill_prerequisites table
    await queryInterface.createTable('skill_prerequisites', {
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
      prerequisiteSkillId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'skills',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      isRequired: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Whether this prerequisite is mandatory or optional'
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
    await queryInterface.addIndex('skill_prerequisites', ['skillId', 'prerequisiteSkillId'], {
      unique: true,
      name: 'skill_prerequisites_unique',
      where: {
        deletedAt: null
      }
    });
    
    await queryInterface.addIndex('skill_prerequisites', ['skillId']);
    await queryInterface.addIndex('skill_prerequisites', ['prerequisiteSkillId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('skill_prerequisites');
  }
};