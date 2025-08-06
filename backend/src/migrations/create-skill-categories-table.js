module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('skill_categories', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Category name like: 山恩DNA, 產品知識, 工具使用, etc.'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Optional description of the skill category'
      },
      color: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Hex color code for UI theming (e.g., #3B82F6)'
      },
      icon: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Icon name or code for UI display'
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Sort order for display purposes'
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
    await queryInterface.addIndex('skill_categories', ['name'], {
      unique: true,
      name: 'skill_categories_name_unique'
    });
    
    await queryInterface.addIndex('skill_categories', ['sortOrder'], {
      name: 'skill_categories_sort_order_idx'
    });

    // Enable uuid-ossp extension if not already enabled
    try {
      await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    } catch (error) {
      console.log('UUID extension may already exist or no permissions to create');
    }

    // Insert existing categories from CSV data
    const categories = [
      { name: '山恩DNA', description: '公司核心價值與文化相關技能', color: '#EF4444', sortOrder: 1 },
      { name: '產品知識', description: '產品相關知識與技能', color: '#3B82F6', sortOrder: 2 },
      { name: '工具使用', description: '工具與技術相關技能', color: '#10B981', sortOrder: 3 },
      { name: '安全操作', description: '安全操作與規範相關技能', color: '#F59E0B', sortOrder: 4 },
      { name: '安裝知識', description: '安裝相關知識與技能', color: '#8B5CF6', sortOrder: 5 }
    ];

    const { v4: uuidv4 } = require('uuid');
    
    for (const category of categories) {
      await queryInterface.bulkInsert('skill_categories', [{
        id: uuidv4(),
        name: category.name,
        description: category.description,
        color: category.color,
        icon: null,
        sortOrder: category.sortOrder,
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('skill_categories');
  }
};