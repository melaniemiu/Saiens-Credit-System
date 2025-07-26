const { Config } = require("../models");
const { Op } = require("sequelize");

// Get all configurations with filtering and pagination
exports.getConfigs = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      category,
      sortField = 'key',
      sortOrder = 'ASC' 
    } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (search) {
      where[Op.or] = [
        { key: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (category && category !== "all") {
      where.category = category;
    }

    const { count, rows } = await Config.findAndCountAll({
      where,
      order: [[sortField, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Parse values for response
    const configsWithParsedValues = rows.map(config => ({
      ...config.toJSON(),
      parsedValue: config.getParsedValue()
    }));

    res.json({
      configs: configsWithParsedValues,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching configs:', error);
    next(error);
  }
};

// Get single configuration by key
exports.getConfigByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    const config = await Config.findOne({ where: { key } });

    if (!config) {
      return res.status(404).json({ 
        success: false, 
        message: 'Configuration not found' 
      });
    }

    res.json({
      success: true,
      config: {
        ...config.toJSON(),
        parsedValue: config.getParsedValue()
      }
    });
  } catch (error) {
    console.error('Error fetching config:', error);
    next(error);
  }
};

// Get configuration value by key (public endpoint for frontend)
exports.getConfigValue = async (req, res, next) => {
  try {
    const { key } = req.params;
    const value = await Config.getConfigValue(key);

    if (value === null) {
      return res.status(404).json({ 
        success: false, 
        message: 'Configuration not found' 
      });
    }

    res.json({
      success: true,
      key,
      value
    });
  } catch (error) {
    console.error('Error fetching config value:', error);
    next(error);
  }
};

// Create new configuration
exports.createConfig = async (req, res, next) => {
  try {
    const { key, value, type = 'string', description, category, isEditable = true } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Key and value are required' 
      });
    }

    // Check if config already exists
    const existingConfig = await Config.findOne({ where: { key } });
    if (existingConfig) {
      return res.status(409).json({ 
        success: false, 
        message: 'Configuration with this key already exists' 
      });
    }

    const config = await Config.setConfigValue(key, value, type, description, category);
    config.isEditable = isEditable;
    await config.save();

    res.status(201).json({
      success: true,
      message: 'Configuration created successfully',
      config: {
        ...config.toJSON(),
        parsedValue: config.getParsedValue()
      }
    });
  } catch (error) {
    console.error('Error creating config:', error);
    next(error);
  }
};

// Update configuration
exports.updateConfig = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value, type, description, category, isEditable } = req.body;

    const config = await Config.findOne({ where: { key } });
    if (!config) {
      return res.status(404).json({ 
        success: false, 
        message: 'Configuration not found' 
      });
    }

    // Check if configuration is editable
    if (!config.isEditable) {
      return res.status(403).json({ 
        success: false, 
        message: 'This configuration is not editable' 
      });
    }

    // Update fields if provided
    if (value !== undefined) {
      let stringValue = value;
      if (type === 'json' || config.type === 'json') {
        stringValue = JSON.stringify(value);
      } else if (type === 'boolean' || config.type === 'boolean') {
        // Handle both boolean values and string representations
        if (typeof value === 'boolean') {
          stringValue = value ? 'true' : 'false';
        } else if (typeof value === 'string') {
          // Convert string to proper boolean, then to string
          const boolValue = value.toLowerCase() === 'true';
          stringValue = boolValue ? 'true' : 'false';
        } else {
          // Fallback for other types
          stringValue = value ? 'true' : 'false';
        }
      } else if (type === 'number' || config.type === 'number') {
        stringValue = String(value);
      }
      config.value = stringValue;
    }

    if (type !== undefined) config.type = type;
    if (description !== undefined) config.description = description;
    if (category !== undefined) config.category = category;
    if (isEditable !== undefined) config.isEditable = isEditable;

    await config.save();

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      config: {
        ...config.toJSON(),
        parsedValue: config.getParsedValue()
      }
    });
  } catch (error) {
    console.error('Error updating config:', error);
    next(error);
  }
};

// Delete configuration
exports.deleteConfig = async (req, res, next) => {
  try {
    const { key } = req.params;

    const config = await Config.findOne({ where: { key } });
    if (!config) {
      return res.status(404).json({ 
        success: false, 
        message: 'Configuration not found' 
      });
    }

    // Check if configuration is editable
    if (!config.isEditable) {
      return res.status(403).json({ 
        success: false, 
        message: 'This configuration cannot be deleted' 
      });
    }

    await config.destroy();

    res.json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting config:', error);
    next(error);
  }
};

// Get all configuration categories
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Config.findAll({
      attributes: ['category'],
      where: {
        category: {
          [Op.not]: null
        }
      },
      group: ['category'],
      order: [['category', 'ASC']]
    });

    const categoryList = categories.map(c => c.category).filter(Boolean);

    res.json({
      success: true,
      categories: categoryList
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    next(error);
  }
};

// Bulk update configurations
exports.bulkUpdateConfigs = async (req, res, next) => {
  try {
    const { configs } = req.body;

    if (!Array.isArray(configs)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Configs must be an array' 
      });
    }

    const results = [];
    const errors = [];

    for (const configData of configs) {
      try {
        const { key, value, type, description, category } = configData;
        
        if (!key || value === undefined) {
          errors.push({ key, error: 'Key and value are required' });
          continue;
        }

        const config = await Config.findOne({ where: { key } });
        
        if (!config) {
          errors.push({ key, error: 'Configuration not found' });
          continue;
        }

        if (!config.isEditable) {
          errors.push({ key, error: 'Configuration is not editable' });
          continue;
        }

        await Config.setConfigValue(key, value, type || config.type, description, category);
        results.push({ key, success: true });
      } catch (error) {
        errors.push({ key: configData.key, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Updated ${results.length} configurations`,
      results,
      errors
    });
  } catch (error) {
    console.error('Error bulk updating configs:', error);
    next(error);
  }
};