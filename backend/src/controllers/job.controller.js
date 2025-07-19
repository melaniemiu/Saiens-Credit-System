const { Job, Department, Skill, JobSkill, User, SkillCategory } = require('../models');
const { Op } = require('sequelize');

// Get all jobs with pagination, search, and filtering
const getAdminJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      departmentId = '',
      sortField = 'name',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where conditions
    const where = {};
    if (search) {
      where.name = {
        [Op.iLike]: `%${search}%`
      };
    }
    if (departmentId) {
      where.departmentId = departmentId;
    }

    // Build order conditions
    const validSortFields = ['name', 'createdAt', 'updatedAt'];
    const validSortOrders = ['ASC', 'DESC'];
    
    const orderField = validSortFields.includes(sortField) ? sortField : 'name';
    const orderDirection = validSortOrders.includes(sortOrder) ? sortOrder : 'ASC';

    const { count, rows: jobs } = await Job.findAndCountAll({
      where,
      include: [
        {
          model: Department,
          attributes: ['id', 'name']
        },
        {
          model: Skill,
          as: 'skills',
          attributes: ['id', 'name', 'categoryId'],
          include: [{
            model: SkillCategory,
            as: 'category',
            attributes: ['id', 'name', 'color']
          }],
          through: { attributes: ['isRequired'] }
        }
      ],
      order: [[orderField, orderDirection]],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    // Add skill counts and user counts
    const jobsWithCounts = await Promise.all(jobs.map(async (job) => {
      const skillCount = await JobSkill.count({ where: { jobId: job.id } });
      const userCount = await User.count({ where: { jobId: job.id } });
      
      return {
        ...job.toJSON(),
        skillCount,
        userCount
      };
    }));

    res.json({
      success: true,
      data: {
        jobs: jobsWithCounts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
};

// Create a new job
const createJob = async (req, res) => {
  try {
    const { name, departmentId, skillIds = [] } = req.body;

    if (!name || !departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Job name and department are required'
      });
    }

    // Check if department exists
    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Create the job
    const job = await Job.create({
      name,
      departmentId
    });

    // Add skills if provided
    if (skillIds.length > 0) {
      const skillAssociations = skillIds.map(skillId => ({
        jobId: job.id,
        skillId: skillId.id || skillId,
        isRequired: skillId.isRequired || false
      }));
      
      await JobSkill.bulkCreate(skillAssociations);
    }

    // Fetch the created job with associations
    const createdJob = await Job.findByPk(job.id, {
      include: [
        {
          model: Department,
          attributes: ['id', 'name']
        },
        {
          model: Skill,
          as: 'skills',
          attributes: ['id', 'name', 'categoryId'],
          include: [{
            model: SkillCategory,
            as: 'category',
            attributes: ['id', 'name', 'color']
          }],
          through: { attributes: ['isRequired'] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: { job: createdJob }
    });
  } catch (error) {
    console.error('Error creating job:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Job name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create job',
      error: error.message
    });
  }
};

// Update a job
const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, departmentId, skillIds = [] } = req.body;

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if department exists
    if (departmentId) {
      const department = await Department.findByPk(departmentId);
      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }
    }

    // Update job details
    await job.update({
      name: name || job.name,
      departmentId: departmentId || job.departmentId
    });

    // Update skill associations
    if (skillIds.length >= 0) {
      // Remove existing skill associations
      await JobSkill.destroy({
        where: { jobId: id }
      });

      // Add new skill associations
      if (skillIds.length > 0) {
        const skillAssociations = skillIds.map(skillId => ({
          jobId: id,
          skillId: skillId.id || skillId,
          isRequired: skillId.isRequired || false
        }));
        
        await JobSkill.bulkCreate(skillAssociations);
      }
    }

    // Fetch the updated job with associations
    const updatedJob = await Job.findByPk(id, {
      include: [
        {
          model: Department,
          attributes: ['id', 'name']
        },
        {
          model: Skill,
          as: 'skills',
          attributes: ['id', 'name', 'categoryId'],
          include: [{
            model: SkillCategory,
            as: 'category',
            attributes: ['id', 'name', 'color']
          }],
          through: { attributes: ['isRequired'] }
        }
      ]
    });

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: { job: updatedJob }
    });
  } catch (error) {
    console.error('Error updating job:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Job name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update job',
      error: error.message
    });
  }
};

// Delete a job
const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findByPk(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if job has users
    const userCount = await User.count({ where: { jobId: id } });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete job. ${userCount} user(s) are assigned to this job.`
      });
    }

    // Remove skill associations first
    await JobSkill.destroy({
      where: { jobId: id }
    });

    // Delete the job (soft delete)
    await job.destroy();

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message
    });
  }
};

module.exports = {
  getAdminJobs,
  createJob,
  updateJob,
  deleteJob
};