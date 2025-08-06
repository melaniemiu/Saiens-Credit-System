const { SkillCategory, Skill } = require('../models');
const { Op } = require('sequelize');

// Get all skill categories
const getSkillCategories = async (req, res) => {
  try {
    const { 
      search = '', 
      sortField = 'sortOrder',
      sortOrder = 'ASC',
      includeSkillCount = false
    } = req.query;

    const whereClause = {};
    
    if (search) {
      whereClause.name = {
        [Op.iLike]: `%${search}%`
      };
    }
    

    const include = [];
    if (includeSkillCount) {
      include.push({
        model: Skill,
        as: 'skills',
        attributes: [],
        required: false
      });
    }

    const attributes = includeSkillCount 
      ? [
          'id', 'name', 'description', 'color', 'icon', 'sortOrder', 'createdAt', 'updatedAt',
          [Skill.sequelize.fn('COUNT', Skill.sequelize.col('skills.id')), 'skillCount']
        ]
      : ['id', 'name', 'description', 'color', 'icon', 'sortOrder', 'createdAt', 'updatedAt'];

    const categories = await SkillCategory.findAll({
      where: whereClause,
      include,
      attributes,
      order: [[sortField, sortOrder.toUpperCase()]],
      group: includeSkillCount ? ['SkillCategory.id'] : undefined
    });

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching skill categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch skill categories',
      error: error.message
    });
  }
};

// Get skill category by ID
const getSkillCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await SkillCategory.findByPk(id, {
      include: [{
        model: Skill,
        as: 'skills',
        attributes: ['id', 'name']
      }]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Skill category not found'
      });
    }

    res.json({ category });
  } catch (error) {
    console.error('Error fetching skill category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch skill category',
      error: error.message
    });
  }
};

// Create new skill category
const createSkillCategory = async (req, res) => {
  try {
    const { name, description, color, icon, sortOrder = 0 } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category name already exists
    const existingCategory = await SkillCategory.findOne({
      where: { name: name.trim() }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category name already exists'
      });
    }

    const category = await SkillCategory.create({
      name: name.trim(),
      description: description?.trim() || null,
      color: color?.trim() || null,
      icon: icon?.trim() || null,
      sortOrder
    });

    res.status(201).json({
      message: 'Skill category created successfully',
      category
    });
  } catch (error) {
    console.error('Error creating skill category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create skill category',
      error: error.message
    });
  }
};

// Update skill category
const updateSkillCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon, sortOrder } = req.body;

    const category = await SkillCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Skill category not found'
      });
    }

    // Check if new name already exists (excluding current category)
    if (name && name.trim() !== category.name) {
      const existingCategory = await SkillCategory.findOne({
        where: { 
          name: name.trim(),
          id: { [Op.ne]: id }
        }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Category name already exists'
        });
      }
    }

    // Update category
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (color !== undefined) updateData.color = color?.trim() || null;
    if (icon !== undefined) updateData.icon = icon?.trim() || null;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    await category.update(updateData);

    res.json({
      message: 'Skill category updated successfully',
      category
    });
  } catch (error) {
    console.error('Error updating skill category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update skill category',
      error: error.message
    });
  }
};

// Delete skill category
const deleteSkillCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await SkillCategory.findByPk(id, {
      include: [{
        model: Skill,
        as: 'skills'
      }]
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Skill category not found'
      });
    }

    // Check if category has associated skills
    if (category.skills && category.skills.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${category.skills.length} associated skill(s).`
      });
    }

    await category.destroy();

    res.json({
      message: 'Skill category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting skill category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete skill category',
      error: error.message
    });
  }
};

// Helper function to get or create skill category by name (for internal use)
const getOrCreateSkillCategoryHelper = async (categoryName) => {
  if (!categoryName || categoryName.trim() === '') {
    throw new Error('Category name is required');
  }

  let category = await SkillCategory.findOne({
    where: { name: categoryName.trim() }
  });

  if (!category) {
    // Get the highest sort order and add 1
    const maxSortOrder = await SkillCategory.max('sortOrder') || 0;
    
    // Default colors for auto-created categories
    const defaultColors = ['#6B7280', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#F97316'];
    const defaultColor = defaultColors[Math.floor(Math.random() * defaultColors.length)];
    
    category = await SkillCategory.create({
      name: categoryName.trim(),
      description: `Auto-created category for ${categoryName.trim()}`,
      color: defaultColor,
      sortOrder: maxSortOrder + 1
    });
  }

  return category;
};

// Get or create skill category by name (API endpoint)
const getOrCreateSkillCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const category = await getOrCreateSkillCategoryHelper(name);

    res.json({ category });
  } catch (error) {
    console.error('Error getting or creating skill category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get or create skill category',
      error: error.message
    });
  }
};

module.exports = {
  getSkillCategories,
  getSkillCategoryById,
  createSkillCategory,
  updateSkillCategory,
  deleteSkillCategory,
  getOrCreateSkillCategory,
  getOrCreateSkillCategoryHelper
};