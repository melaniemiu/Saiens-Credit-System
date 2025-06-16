const { Department, Skill, SkillDepartment, User } = require('../models');
const { Op } = require('sequelize');

// Get all departments
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.findAll({
      order: [['name', 'ASC']]
    });
    
    return res.status(200).json({ 
      departments
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all departments with pagination and search
exports.getAdminDepartments = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortField = 'name', 
      sortOrder = 'ASC' 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause for search
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: departments } = await Department.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Skill,
          as: 'skills',
          attributes: ['id', 'name', 'category'],
          through: { attributes: [] }
        },
        {
          model: User,
          attributes: ['id'],
          required: false
        }
      ],
      order: [[sortField, sortOrder.toUpperCase()]],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    // Add skill count and user count to each department
    const departmentsWithCounts = departments.map(dept => ({
      ...dept.toJSON(),
      skillCount: dept.skills ? dept.skills.length : 0,
      userCount: dept.Users ? dept.Users.length : 0
    }));

    return res.status(200).json({
      departments: departmentsWithCounts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Create department
exports.createDepartment = async (req, res, next) => {
  try {
    const { name, description, isActive = true } = req.body;

    if (!name) {
      return res.status(400).json({ error: '部門名稱為必填項目' });
    }

    // Check if department name already exists
    const existingDepartment = await Department.findOne({
      where: { name }
    });

    if (existingDepartment) {
      return res.status(400).json({ error: '部門名稱已存在' });
    }

    const department = await Department.create({
      name,
      description,
      isActive
    });

    return res.status(201).json({
      message: '部門創建成功',
      department
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update department
exports.updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ error: '找不到指定的部門' });
    }

    // Check if new name conflicts with existing departments
    if (name && name !== department.name) {
      const existingDepartment = await Department.findOne({
        where: { 
          name,
          id: { [Op.ne]: id }
        }
      });

      if (existingDepartment) {
        return res.status(400).json({ error: '部門名稱已存在' });
      }
    }

    await department.update({
      name: name || department.name,
      description: description !== undefined ? description : department.description,
      isActive: isActive !== undefined ? isActive : department.isActive
    });

    return res.status(200).json({
      message: '部門更新成功',
      department
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete department
exports.deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;

    const department = await Department.findByPk(id, {
      include: [
        { model: User, required: false },
        { model: Skill, as: 'skills', required: false }
      ]
    });

    if (!department) {
      return res.status(404).json({ error: '找不到指定的部門' });
    }

    // Check if department has users
    if (department.Users && department.Users.length > 0) {
      return res.status(400).json({ 
        error: '無法刪除此部門，因為仍有員工隸屬於此部門' 
      });
    }

    // Soft delete the department
    await department.destroy();

    return res.status(200).json({
      message: '部門刪除成功'
    });
  } catch (error) {
    next(error);
  }
};