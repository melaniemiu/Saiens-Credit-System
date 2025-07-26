module.exports = (sequelize, DataTypes) => {
  const Config = sequelize.define('Config', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Configuration key identifier'
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Configuration value (stored as JSON string for complex values)'
    },
    type: {
      type: DataTypes.ENUM('string', 'number', 'boolean', 'json'),
      defaultValue: 'string',
      comment: 'Data type of the configuration value'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of what this configuration controls'
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Category for grouping related configurations'
    },
    isEditable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether this configuration can be edited via admin interface'
    }
  }, {
    timestamps: true,
    tableName: 'configs',
    indexes: [
      {
        unique: true,
        fields: ['key']
      },
      {
        fields: ['category']
      }
    ]
  });

  // Instance method to get parsed value based on type
  Config.prototype.getParsedValue = function() {
    switch (this.type) {
      case 'number':
        return Number(this.value);
      case 'boolean':
        return this.value === 'true';
      case 'json':
        try {
          return JSON.parse(this.value);
        } catch (e) {
          return null;
        }
      default:
        return this.value;
    }
  };

  // Class method to get configuration value by key
  Config.getConfigValue = async function(key, defaultValue = null) {
    try {
      const config = await this.findOne({ where: { key } });
      return config ? config.getParsedValue() : defaultValue;
    } catch (error) {
      console.error('Error getting config value:', error);
      return defaultValue;
    }
  };

  // Class method to set configuration value
  Config.setConfigValue = async function(key, value, type = 'string', description = null, category = null) {
    try {
      let stringValue = value;
      if (type === 'json') {
        stringValue = JSON.stringify(value);
      } else if (type === 'boolean') {
        stringValue = value ? 'true' : 'false';
      } else if (type === 'number') {
        stringValue = String(value);
      }

      const [config, created] = await this.findOrCreate({
        where: { key },
        defaults: {
          key,
          value: stringValue,
          type,
          description,
          category
        }
      });

      if (!created) {
        config.value = stringValue;
        config.type = type;
        if (description !== null) config.description = description;
        if (category !== null) config.category = category;
        await config.save();
      }

      return config;
    } catch (error) {
      console.error('Error setting config value:', error);
      throw error;
    }
  };

  return Config;
};