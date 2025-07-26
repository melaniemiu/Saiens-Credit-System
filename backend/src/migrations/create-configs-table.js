'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create configs table
    await queryInterface.createTable('configs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: 'Configuration key identifier'
      },
      value: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Configuration value (stored as JSON string for complex values)'
      },
      type: {
        type: Sequelize.ENUM('string', 'number', 'boolean', 'json'),
        defaultValue: 'string',
        allowNull: false,
        comment: 'Data type of the configuration value'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Description of what this configuration controls'
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'Category for grouping related configurations'
      },
      isEditable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        comment: 'Whether this configuration can be edited via admin interface'
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
      }
    });

    // Add indexes
    await queryInterface.addIndex('configs', ['key'], {
      unique: true,
      name: 'configs_key_unique'
    });

    await queryInterface.addIndex('configs', ['category'], {
      name: 'configs_category_index'
    });

    // Insert default configurations
    const defaultConfigs = [
      {
        id: Sequelize.literal('gen_random_uuid()'),
        key: 'system_name',
        value: '山恩互動表彰系統',
        type: 'string',
        description: 'System display name shown throughout the application',
        category: 'system',
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        key: 'system_name_en',
        value: 'Saiens Interactive Recognition System',
        type: 'string',
        description: 'English system name for international use',
        category: 'system',
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        key: 'default_daily_credit_limit',
        value: '5',
        type: 'number',
        description: 'Default daily credit limit for new users',
        category: 'credits',
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        key: 'use_mock_api',
        value: 'false',
        type: 'boolean',
        description: 'Whether to use mock API responses for development/testing',
        category: 'development',
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        key: 'enable_real_time_notifications',
        value: 'true',
        type: 'boolean',
        description: 'Enable Socket.IO real-time notifications',
        category: 'features',
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        key: 'max_bulk_credit_recipients',
        value: '10',
        type: 'number',
        description: 'Maximum number of recipients for bulk credit operations',
        category: 'credits',
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        key: 'credit_export_format',
        value: 'csv',
        type: 'string',
        description: 'Default format for credit data exports (csv, xlsx)',
        category: 'admin',
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        key: 'profile_picture_max_size',
        value: '5242880',
        type: 'number',
        description: 'Maximum profile picture size in bytes (5MB)',
        category: 'user',
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        key: 'maintenance_mode',
        value: 'false',
        type: 'boolean',
        description: 'Enable maintenance mode to temporarily disable user access',
        category: 'system',
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        key: 'skill_tree_theme',
        value: 'default',
        type: 'string',
        description: 'Theme for the skill tree visualization (default, dark, colorful)',
        category: 'ui',
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Insert default configurations
    await queryInterface.bulkInsert('configs', defaultConfigs);

    console.log('✅ Created configs table and inserted default configurations');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes first
    await queryInterface.removeIndex('configs', 'configs_category_index');
    await queryInterface.removeIndex('configs', 'configs_key_unique');
    
    // Drop the table
    await queryInterface.dropTable('configs');
    
    console.log('✅ Dropped configs table');
  }
};