const { Department, User, Job, Skill, JobSkill } = require('../models');
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

    // Add user count and skill count to each department
    const departmentsWithCounts = await Promise.all(departments.map(async (dept) => {
      // Calculate skill count for this department
      // Count unique skills across all jobs in this department
      const skillCount = await JobSkill.count({
        distinct: true,
        col: 'skillId',
        include: [{
          model: Job,
          where: { departmentId: dept.id },
          attributes: []
        }]
      });

      return {
        ...dept.toJSON(),
        userCount: dept.Users ? dept.Users.length : 0,
        skillCount: skillCount || 0
      };
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
        { model: Job, required: false }
      ]
    });

    if (!department) {
      return res.status(404).json({ error: '找不到指定的部門' });
    }

    // If department has users, move them to no department (null)
    if (department.Users && department.Users.length > 0) {
      console.log(`Moving ${department.Users.length} users from department ${department.name} to no department`);
      try {
        await User.update(
          { departmentId: null },
          { where: { departmentId: id } }
        );
        console.log(`Successfully moved users to no department`);
      } catch (updateError) {
        console.error('Error updating users departmentId:', updateError);
        return res.status(500).json({ 
          error: '無法更新使用者部門設定',
          details: updateError.message 
        });
      }
    }

    // If department has jobs, delete them and handle users assigned to those jobs
    if (department.Jobs && department.Jobs.length > 0) {
      console.log(`Deleting ${department.Jobs.length} jobs from department ${department.name}`);
      try {
        // Get all job IDs in this department
        const jobIds = department.Jobs.map(job => job.id);
        
        // Move users from these jobs to no job (null)
        await User.update(
          { jobId: null },
          { where: { jobId: jobIds } }
        );
        console.log(`Successfully moved users from jobs to no job`);

        // Delete JobSkill relationships for these jobs
        await JobSkill.destroy({
          where: { jobId: jobIds }
        });
        console.log(`Successfully deleted JobSkill relationships`);
        
        // Delete the jobs
        await Job.destroy({
          where: { departmentId: id }
        });
        console.log(`Successfully deleted jobs`);
      } catch (jobError) {
        console.error('Error handling jobs deletion:', jobError);
        return res.status(500).json({ 
          error: '無法刪除部門相關職位',
          details: jobError.message 
        });
      }
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