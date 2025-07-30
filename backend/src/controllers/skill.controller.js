const { Skill, SkillCategory, UserSkill, Job, JobSkill, User, Department, SkillPrerequisite } = require('../models');
const { Op, sequelize } = require('sequelize');
const { sequelize: dbInstance } = require('../models');

// Get user's skill progress with job level organization
exports.getUserSkills = async (req, res, next) => {
  try {
    const userId = req.userId; // Set by auth middleware
    
    const userSkills = await UserSkill.findAll({
      where: { userId },
      include: [
        {
          model: Skill,
          attributes: ['id', 'name', 'categoryId', 'learningMethod', 'assessmentMethod', 'syllabus'],
          include: [{
            model: SkillCategory,
            as: 'category',
            attributes: ['id', 'name', 'color', 'icon']
          }]
        },
        {
          model: User,
          as: 'evaluator',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [
        ['updatedAt', 'DESC']
      ]
    });

    // Get all job-skill relationships to organize by job level
    const allJobSkills = await JobSkill.findAll({
      include: [
        {
          model: Job,
          attributes: ['id', 'name']
        },
        {
          model: Skill,
          attributes: ['id', 'name']
        }
      ]
    });

    // Create a map of skill to job level
    const skillToJobMap = {};
    allJobSkills.forEach(jobSkill => {
      skillToJobMap[jobSkill.skillId] = jobSkill.Job.name;
    });

    // Add job level information to user skills
    const skillsWithJobLevel = userSkills.map(userSkill => ({
      ...userSkill.toJSON(),
      jobLevel: skillToJobMap[userSkill.skillId] || 'Unknown'
    }));
    
    return res.status(200).json({ userSkills: skillsWithJobLevel });
  } catch (error) {
    next(error);
  }
};

// Get department-based job progression for skill roadmap
exports.getDepartmentProgression = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Get user's job and department
    const user = await User.findByPk(userId, {
      include: [
        { model: Job, attributes: ['id', 'name', 'level', 'nextJobId'] },
        { model: Department, attributes: ['id', 'name'] }
      ]
    });
    
    if (!user || !user.Job || !user.Department) {
      return res.status(404).json({ message: 'User job or department not found' });
    }
    
    // Get all jobs in the same department, ordered by level
    const departmentJobs = await Job.findAll({
      where: { departmentId: user.Department.id },
      order: [['level', 'ASC']],
      include: [
        {
          model: JobSkill,
          include: [
            {
              model: Skill,
              attributes: ['id', 'name', 'categoryId', 'learningMethod', 'assessmentMethod', 'syllabus'],
              include: [{
                model: SkillCategory,
                as: 'category',
                attributes: ['id', 'name', 'color', 'icon']
              }]
            }
          ]
        }
      ]
    });
    
    // Get user's progress for all skills in department
    const allSkillIds = departmentJobs.flatMap(job => 
      job.JobSkills?.map(js => js.skillId) || []
    );
    const userProgress = await UserSkill.findAll({
      where: { 
        userId,
        skillId: { [Op.in]: allSkillIds }
      }
    });
    
    // Create progress map for quick lookup
    const progressMap = {};
    userProgress.forEach(up => {
      progressMap[up.skillId] = up;
    });
    
    // Format the response with job progression
    const jobProgression = departmentJobs.map(job => {
      const skillsWithProgress = job.JobSkills?.map(jobSkill => ({
        ...jobSkill.toJSON(),
        userProgress: progressMap[jobSkill.skillId] || null
      })) || [];
      
      return {
        id: job.id,
        name: job.name,
        level: job.level,
        isCurrentJob: job.id === user.Job.id,
        skillsWithProgress
      };
    });
    
    return res.status(200).json({ 
      department: user.Department.name,
      currentJob: user.Job.name,
      jobProgression
    });
  } catch (error) {
    next(error);
  }
};

// Get skills available for user's job
exports.getJobSkills = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Get user's job
    const user = await User.findByPk(userId, {
      include: [{ model: Job, attributes: ['id', 'name'] }]
    });
    
    if (!user || !user.Job) {
      return res.status(404).json({ message: 'User job not found' });
    }
    
    // Get skills for the user's job
    const jobSkills = await JobSkill.findAll({
      where: { jobId: user.Job.id },
      include: [
        {
          model: Skill,
          attributes: ['id', 'name', 'categoryId', 'learningMethod', 'assessmentMethod', 'syllabus'],
          include: [{
            model: SkillCategory,
            as: 'category',
            attributes: ['id', 'name', 'color', 'icon']
          }]
        }
      ],
      order: [
        [Skill, { model: SkillCategory, as: 'category' }, 'name', 'ASC'],
        [Skill, 'name', 'ASC']
      ]
    });
    
    // Get user's current progress for these skills
    const skillIds = jobSkills.map(js => js.skillId);
    const userProgress = await UserSkill.findAll({
      where: { 
        userId,
        skillId: { [Op.in]: skillIds }
      }
    });
    
    // Create a map of user progress
    const progressMap = {};
    userProgress.forEach(up => {
      progressMap[up.skillId] = up;
    });
    
    // Combine job skills with user progress
    const skillsWithProgress = jobSkills.map(jobSkill => ({
      ...jobSkill.toJSON(),
      userProgress: progressMap[jobSkill.skillId] || null
    }));
    
    return res.status(200).json({ 
      job: user.Job,
      skillsWithProgress 
    });
  } catch (error) {
    next(error);
  }
};

// Get suggested skills (skills from higher job levels)
exports.getSuggestedSkills = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Get user's job
    const user = await User.findByPk(userId, {
      include: [{ model: Job, attributes: ['id', 'name'] }]
    });
    
    if (!user || !user.Job) {
      return res.status(404).json({ message: 'User job not found' });
    }
    
    // Define job progression order
    const jobProgression = ['新手村', '助理工程師', '正式工程師', '資深工程師'];
    const currentJobIndex = jobProgression.indexOf(user.Job.name);
    
    if (currentJobIndex === -1 || currentJobIndex >= jobProgression.length - 1) {
      return res.status(200).json({ suggestedSkills: [] });
    }
    
    // Get next job level
    const nextJobName = jobProgression[currentJobIndex + 1];
    const nextJob = await Job.findOne({ where: { name: nextJobName } });
    
    if (!nextJob) {
      return res.status(200).json({ suggestedSkills: [] });
    }
    
    // Get skills for next job level
    const nextJobSkills = await JobSkill.findAll({
      where: { jobId: nextJob.id },
      include: [
        {
          model: Skill,
          attributes: ['id', 'name', 'categoryId', 'learningMethod', 'assessmentMethod', 'syllabus'],
          include: [{
            model: SkillCategory,
            as: 'category',
            attributes: ['id', 'name', 'color', 'icon']
          }]
        }
      ],
      limit: 4 // Limit to 4 suggestions for UI
    });
    
    return res.status(200).json({ 
      nextJob: nextJob,
      suggestedSkills: nextJobSkills 
    });
  } catch (error) {
    next(error);
  }
};

// Update user skill progress
exports.updateUserSkill = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { skillId } = req.params;
    const { status, score, notes } = req.body;
    
    // Find or create user skill record
    let userSkill = await UserSkill.findOne({
      where: { userId, skillId }
    });
    
    if (!userSkill) {
      userSkill = await UserSkill.create({
        userId,
        skillId,
        status: 'not_started'
      });
    }
    
    // Update fields based on status
    const updateData = { status };
    
    if (status === 'in_progress' && userSkill.status === 'not_started') {
      updateData.startedAt = new Date();
    }
    
    if (status === 'completed' && userSkill.status !== 'completed') {
      updateData.completedAt = new Date();
      if (score) updateData.score = score;
      updateData.attempts = (userSkill.attempts || 0) + 1;
    }
    
    if (status === 'certified' && userSkill.status !== 'certified') {
      updateData.certifiedAt = new Date();
      updateData.certifiedBy = userId; // Self-certification for now
    }
    
    if (notes) updateData.notes = notes;
    
    await userSkill.update(updateData);
    
    // Reload with skill data
    const updatedUserSkill = await UserSkill.findByPk(userSkill.id, {
      include: [
        {
          model: Skill,
          attributes: ['id', 'name', 'categoryId', 'learningMethod', 'assessmentMethod', 'syllabus'],
          include: [{
            model: SkillCategory,
            as: 'category',
            attributes: ['id', 'name', 'color', 'icon']
          }]
        }
      ]
    });
    
    return res.status(200).json({ 
      message: 'Skill progress updated successfully',
      userSkill: updatedUserSkill 
    });
  } catch (error) {
    next(error);
  }
};

// Get skill statistics (current job level only)
exports.getSkillStats = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Get user's current job
    const user = await User.findByPk(userId, {
      include: [{ model: Job, attributes: ['id', 'name'] }]
    });
    
    if (!user || !user.Job) {
      return res.status(404).json({ message: 'User job not found' });
    }
    
    // Get skill IDs for current job level only
    const currentJobSkills = await JobSkill.findAll({
      where: { jobId: user.Job.id },
      attributes: ['skillId']
    });
    
    const currentJobSkillIds = currentJobSkills.map(js => js.skillId);
    
    const stats = await UserSkill.findAll({
      where: { 
        userId,
        skillId: { [Op.in]: currentJobSkillIds }
      },
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('status')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    // Convert to object format
    const skillStats = {
      not_started: 0,
      in_progress: 0,
      completed: 0,
      certified: 0
    };
    
    stats.forEach(stat => {
      skillStats[stat.status] = parseInt(stat.count);
    });
    
    // Calculate total and completion percentage for current job level only
    const total = Object.values(skillStats).reduce((sum, count) => sum + count, 0);
    const completed = skillStats.completed + skillStats.certified;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return res.status(200).json({
      skillStats,
      total,
      completed,
      completionPercentage,
      currentJobLevel: user.Job.name
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all skills with pagination and search
exports.getAdminSkills = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category = '',
      sortField = 'name', 
      sortOrder = 'ASC' 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause for search
    const whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } }
      ];
    }
    // Build include clause for category and skill relationships
    const includeClause = [
      {
        model: SkillCategory,
        as: 'category',
        attributes: ['id', 'name', 'color', 'icon'],
        where: category ? { name: category } : undefined,
        required: !!category
      },
      {
        model: Job,
        as: 'jobs',
        attributes: ['id', 'name'],
        through: { attributes: [] }
      }
    ];


    // Validate and handle sorting by fields
    const validSortFields = ['name', 'category', 'learningMethod', 'assessmentMethod', 'createdAt', 'updatedAt'];
    const actualSortField = validSortFields.includes(sortField) ? sortField : 'name';
    
    let orderClause;
    if (actualSortField === 'category') {
      orderClause = [['category', 'name', sortOrder.toUpperCase()]];
    } else {
      orderClause = [[actualSortField, sortOrder.toUpperCase()]];
    }

    const { count, rows: skills } = await Skill.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: orderClause,
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    // Add counts to each skill
    const skillsWithCounts = skills.map(skill => ({
      ...skill.toJSON(),
      jobCount: skill.jobs ? skill.jobs.length : 0
    }));

    // Get unique categories for filter
    const categoryRecords = await SkillCategory.findAll({
      attributes: ['name'],
      where: { isActive: true },
      order: [['sortOrder', 'ASC']],
      raw: true
    });
    const categories = categoryRecords.map(cat => ({ category: cat.name }));

    return res.status(200).json({
      skills: skillsWithCounts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      },
      categories: categories.map(c => c.category)
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Create skill
exports.createSkill = async (req, res, next) => {
  try {
    const { 
      name, 
      category, // This can be categoryName for compatibility
      categoryName, // New field name from frontend
      learningMethod, 
      assessmentMethod,
      syllabus,
    } = req.body;

    const categoryNameToUse = categoryName || category;

    if (!name || !categoryNameToUse || !learningMethod || !assessmentMethod) {
      return res.status(400).json({ 
        error: '技能名稱、類別、學習方式、評估方式為必填項目' 
      });
    }

    // Check if skill name already exists
    const existingSkill = await Skill.findOne({
      where: { name }
    });

    if (existingSkill) {
      return res.status(400).json({ error: '技能名稱已存在' });
    }

    // Handle category - get or create the category
    const { getOrCreateSkillCategoryHelper } = require('./skill-category.controller');
    const categoryResult = await getOrCreateSkillCategoryHelper(categoryNameToUse);

    // Create skill
    const skill = await Skill.create({
      name,
      categoryId: categoryResult.id,
      learningMethod,
      assessmentMethod,
      syllabus
    });


    // Reload with associations including the category
    const skillWithAssociations = await Skill.findByPk(skill.id, {
      include: [
        {
          model: SkillCategory,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon']
        }
      ]
    });

    return res.status(201).json({
      message: '技能創建成功',
      skill: skillWithAssociations
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update skill
exports.updateSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      category, // This can be categoryName for compatibility 
      categoryName, // New field name from frontend
      learningMethod, 
      assessmentMethod,
      syllabus,
    } = req.body;

    const skill = await Skill.findByPk(id);
    if (!skill) {
      return res.status(404).json({ error: '找不到指定的技能' });
    }

    // Check if new name conflicts with existing skills
    if (name && name !== skill.name) {
      const existingSkill = await Skill.findOne({
        where: { 
          name,
          id: { [Op.ne]: id }
        }
      });

      if (existingSkill) {
        return res.status(400).json({ error: '技能名稱已存在' });
      }
    }

    // Handle category update - support both old 'category' and new 'categoryName'
    let categoryId = skill.categoryId;
    const categoryNameToUse = categoryName || category;
    
    if (categoryNameToUse) {
      // Import the skill category controller to use getOrCreateSkillCategoryHelper
      const { getOrCreateSkillCategoryHelper } = require('./skill-category.controller');
      
      // Get or create the category
      const categoryResult = await getOrCreateSkillCategoryHelper(categoryNameToUse);
      categoryId = categoryResult.id;
    }

    // Update skill
    await skill.update({
      name: name || skill.name,
      categoryId: categoryId,
      learningMethod: learningMethod || skill.learningMethod,
      assessmentMethod: assessmentMethod || skill.assessmentMethod,
      syllabus: syllabus !== undefined ? syllabus : skill.syllabus
    });


    // Reload with associations including the new category
    const updatedSkill = await Skill.findByPk(skill.id, {
      include: [
        {
          model: SkillCategory,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon']
        }
      ]
    });

    return res.status(200).json({
      message: '技能更新成功',
      skill: updatedSkill
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete skill
exports.deleteSkill = async (req, res, next) => {
  try {
    const { id } = req.params;

    const skill = await Skill.findByPk(id, {
      include: [
        { model: UserSkill, required: false },
        { model: JobSkill, required: false }
      ]
    });

    if (!skill) {
      return res.status(404).json({ error: '找不到指定的技能' });
    }

    // Check if skill is being used
    if (skill.UserSkills && skill.UserSkills.length > 0) {
      return res.status(400).json({ 
        error: '無法刪除此技能，因為有用戶正在學習此技能' 
      });
    }

    if (skill.JobSkills && skill.JobSkills.length > 0) {
      return res.status(400).json({ 
        error: '無法刪除此技能，因為此技能已被工作職位使用' 
      });
    }

    // Soft delete the skill
    await skill.destroy();

    return res.status(200).json({
      message: '技能刪除成功'
    });
  } catch (error) {
    next(error);
  }
};

// Request evaluation for a skill
exports.requestEvaluation = async (req, res, next) => {
  try {
    const { skillId } = req.params;
    const userId = req.userId; // Set by auth middleware
    
    // Check if skill exists
    const skill = await Skill.findByPk(skillId);
    if (!skill) {
      return res.status(404).json({ error: '找不到指定的技能' });
    }
    
    // Check if user has this skill and it's ready for evaluation
    const userSkill = await UserSkill.findOne({
      where: { userId, skillId }
    });
    
    if (!userSkill) {
      return res.status(404).json({ error: '您還未開始學習此技能' });
    }
    
    if (userSkill.status === 'not_started') {
      return res.status(400).json({ error: '請先開始學習此技能' });
    }
    
    if (userSkill.status === 'completed' && userSkill.score && userSkill.score >= 60) {
      return res.status(400).json({ error: '此技能已通過評估' });
    }

    if (userSkill.evaluationRequestedAt && !userSkill.evaluatedAt) {
      return res.status(400).json({ error: '此技能已申請評估，請等待評估員回覆' });
    }
    
    // Update user skill with evaluation request
    const updateData = {
      evaluationRequestedAt: new Date()
    };

    // Only set completedAt and status to 'completed' if user was actually in completed state
    // If they're requesting evaluation from 'in_progress', keep them as 'in_progress'
    if (userSkill.status === 'completed') {
      // User already completed learning, just requesting evaluation
      updateData.completedAt = userSkill.completedAt || new Date();
    } else {
      // User is requesting evaluation while still in progress
      // Keep status as 'in_progress', don't set completedAt
    }

    await userSkill.update(updateData);
    
    // Get user info for notification
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email']
    });
    
    // TODO: Find and notify evaluators
    // For now, we'll just send a notification to admin users
    const evaluators = await User.findAll({
      where: { role: 'admin' },
      attributes: ['id', 'name', 'email']
    });
    
    // Send socket notification to evaluators
    const io = req.app.get('io');
    if (io) {
      // Notify all evaluators about the evaluation request
      evaluators.forEach(evaluator => {
        io.to(`user-${evaluator.id}`).emit('evaluation-requested', {
          id: `${userId}-${skillId}-${Date.now()}`,
          userSkillId: userSkill.id,
          skillId: skillId,
          skillName: skill.name,
          userId: userId,
          userName: user.name,
          requestedAt: new Date().toISOString(),
          evaluatorId: evaluator.id,
          evaluatorName: evaluator.name
        });
      });
      
      // Also notify the user that their request was submitted
      io.to(`user-${userId}`).emit('evaluation-request-submitted', {
        skillId: skillId,
        skillName: skill.name,
        submittedAt: new Date().toISOString(),
        evaluatorCount: evaluators.length
      });
    }
    
    return res.status(200).json({
      message: '評估申請已送出，評估員將收到通知',
      evaluationRequest: {
        skillId: skillId,
        skillName: skill.name,
        userId: userId,
        userName: user.name,
        requestedAt: new Date(),
        evaluators: evaluators.map(e => ({ id: e.id, name: e.name }))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get skill and user details for evaluation by userSkillId (for evaluators)
exports.getEvaluationDetailsByUserSkillId = async (req, res, next) => {
  try {
    const { userSkillId } = req.params;
    const evaluatorId = req.userId; // Set by auth middleware
    
    // Check if the requester is an admin (evaluator)
    const evaluator = await User.findByPk(evaluatorId);
    if (!evaluator || evaluator.role !== 'admin') {
      return res.status(403).json({ error: '只有管理員可以查看評估詳情' });
    }
    
    // Get user skill with related skill and user data
    const userSkill = await UserSkill.findByPk(userSkillId, {
      attributes: ['id', 'status', 'startedAt', 'completedAt', 'certifiedAt', 'score', 'attempts', 'notes', 'userId', 'skillId'],
      include: [
        {
          model: Skill,
          attributes: ['id', 'name', 'categoryId', 'learningMethod', 'assessmentMethod', 'syllabus'],
          include: [{
            model: SkillCategory,
            as: 'category',
            attributes: ['id', 'name', 'color', 'icon']
          }]
        },
        {
          model: User,
          attributes: ['id', 'name', 'employeeId', 'email'],
          include: [
            {
              model: Department,
              attributes: ['id', 'name']
            },
            {
              model: Job,
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });
    
    if (!userSkill) {
      return res.status(404).json({ error: '找不到指定的技能記錄' });
    }
    
    return res.status(200).json({
      skill: userSkill.Skill,
      user: userSkill.User,
      userSkill: {
        id: userSkill.id,
        status: userSkill.status,
        startedAt: userSkill.startedAt,
        completedAt: userSkill.completedAt,
        certifiedAt: userSkill.certifiedAt,
        score: userSkill.score,
        attempts: userSkill.attempts,
        notes: userSkill.notes
      }
    });
  } catch (error) {
    next(error);
  }
};

// Submit evaluation result by userSkillId (for evaluators)
exports.submitEvaluationByUserSkillId = async (req, res, next) => {
  try {
    const { userSkillId } = req.params;
    const { result, score, feedback, evaluatedAt } = req.body;
    const evaluatorId = req.userId; // Set by auth middleware
    
    // Check if the requester is an admin (evaluator)
    const evaluator = await User.findByPk(evaluatorId);
    if (!evaluator || evaluator.role !== 'admin') {
      return res.status(403).json({ error: '只有管理員可以提交評估結果' });
    }
    
    // Validate input
    if (!result || !['pass', 'reject'].includes(result)) {
      return res.status(400).json({ error: '評估結果必須是 pass 或 reject' });
    }
    
    // Get user skill with related data
    const userSkill = await UserSkill.findByPk(userSkillId, {
      include: [
        {
          model: Skill,
          attributes: ['id', 'name']
        },
        {
          model: User,
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!userSkill) {
      return res.status(404).json({ error: '找不到指定的技能記錄' });
    }
    
    if (userSkill.status === 'completed' && userSkill.score && userSkill.score >= 60) {
      return res.status(400).json({ error: '此技能已通過評估，無法重複評估' });
    }
    
    // Update user skill based on evaluation result
    const updateData = {
      score: result === 'pass' ? 100 : 0, // Simple pass/fail scoring
      attempts: userSkill.attempts + 1,
      notes: feedback || '', // Optional feedback
      evaluatedBy: evaluatorId,
      evaluatedAt: new Date(), // Always set evaluation date
      // Don't clear evaluationRequestedAt - keep it for audit trail
      status: result === 'pass' ? 'completed' : 'in_progress'
    };

    // If passed, set completedAt if not already set
    if (result === 'pass' && !userSkill.completedAt) {
      updateData.completedAt = new Date();
    }
    
    await userSkill.update(updateData);
    
    // Send socket notification to the user about evaluation result
    const io = req.app.get('io');
    if (io) {
      const notificationData = {
        id: `${userSkill.userId}-${userSkill.skillId}-${Date.now()}`,
        skillId: userSkill.skillId,
        skillName: userSkill.Skill.name,
        result: result,
        score: updateData.score,
        feedback: feedback,
        evaluatorName: evaluator.name,
        evaluatedAt: evaluatedAt || new Date().toISOString()
      };
      
      io.to(`user-${userSkill.userId}`).emit('evaluation-completed', notificationData);
    }
    
    return res.status(200).json({
      message: result === 'pass' ? '評估通過，技能已認證' : '評估未通過，已提供改進建議',
      userSkill: {
        id: userSkill.id,
        status: updateData.status,
        score: updateData.score,
        attempts: updateData.attempts,
        certifiedAt: updateData.certifiedAt,
        certifiedBy: updateData.certifiedBy
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get all pending evaluations for admin
exports.getPendingEvaluations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, departmentId, sortField = 'evaluationRequestedAt', sortOrder = 'DESC' } = req.query;
    
    // Check if the requester is an admin
    const evaluator = await User.findByPk(req.userId);
    if (!evaluator || evaluator.role !== 'admin') {
      return res.status(403).json({ error: '只有管理員可以查看評估列表' });
    }
    
    // Build where clause for filtering pending evaluations
    const whereClause = {
      evaluationRequestedAt: {
        [Op.not]: null
      },
      // Show evaluations that haven't been evaluated OR where the request is more recent than the evaluation
      [Op.or]: [
        { evaluatedAt: null }, // Never evaluated
        {
          evaluatedAt: {
            [Op.lt]: dbInstance.col('evaluationRequestedAt') // Evaluation is older than request (re-request)
          }
        }
      ]
    };
    
    // Build include clause for user and skill associations
    const includeClause = [
      {
        model: User,
        attributes: ['id', 'name', 'employeeId'],
        include: [
          {
            model: Department,
            attributes: ['id', 'name']
          }
        ],
        where: departmentId ? { departmentId } : undefined
      },
      {
        model: Skill,
        attributes: ['id', 'name', 'categoryId', 'learningMethod', 'assessmentMethod', 'syllabus'],
        include: [{
          model: SkillCategory,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon']
        }]
      }
    ];
    
    // Add search functionality
    if (search) {
      includeClause[0].where = {
        ...includeClause[0].where,
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { employeeId: { [Op.iLike]: `%${search}%` } }
        ]
      };
      
      includeClause[1].where = {
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { '$category.name$': { [Op.iLike]: `%${search}%` } }
        ]
      };
    }
    
    // Calculate offset
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Validate sort field
    const allowedSortFields = ['evaluationRequestedAt', 'userName', 'skillName', 'category'];
    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'evaluationRequestedAt';
    
    // Build order clause
    let orderClause = [];
    if (validSortField === 'userName') {
      orderClause = [[User, 'name', sortOrder]];
    } else if (validSortField === 'skillName') {
      orderClause = [[Skill, 'name', sortOrder]];
    } else if (validSortField === 'category') {
      orderClause = [[Skill, { model: SkillCategory, as: 'category' }, 'name', sortOrder]];
    } else {
      orderClause = [[validSortField, sortOrder]];
    }
    
    // Get pending evaluations with pagination
    const { count, rows: pendingEvaluations } = await UserSkill.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: orderClause,
      limit: parseInt(limit),
      offset: offset,
      distinct: true
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(count / parseInt(limit));
    
    // Format response
    const formattedEvaluations = pendingEvaluations.map(userSkill => ({
      id: userSkill.id,
      userSkillId: userSkill.id,
      userId: userSkill.User.id,
      userName: userSkill.User.name,
      userEmployeeId: userSkill.User.employeeId,
      userDepartment: userSkill.User.Department.name,
      skillId: userSkill.Skill.id,
      skillName: userSkill.Skill.name,
      skillCategory: userSkill.Skill.category,
      learningMethod: userSkill.Skill.learningMethod,
      assessmentMethod: userSkill.Skill.assessmentMethod,
      syllabus: userSkill.Skill.syllabus,
      status: userSkill.status,
      score: userSkill.score,
      attempts: userSkill.attempts,
      startedAt: userSkill.startedAt,
      completedAt: userSkill.completedAt,
      evaluationRequestedAt: userSkill.evaluationRequestedAt,
      notes: userSkill.notes
    }));
    
    return res.status(200).json({
      evaluations: formattedEvaluations,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });
    
  } catch (error) {
    next(error);
  }
};

// Get skill prerequisites
exports.getSkillPrerequisites = async (req, res, next) => {
  try {
    const { skillId } = req.params;
    
    const skill = await Skill.findByPk(skillId, {
      include: [
        {
          model: Skill,
          as: 'prerequisites',
          attributes: ['id', 'name'],
          include: [{
            model: SkillCategory,
            as: 'category',
            attributes: ['id', 'name', 'color']
          }],
          through: { attributes: ['isRequired'] }
        }
      ]
    });
    
    if (!skill) {
      return res.status(404).json({ error: '找不到指定的技能' });
    }
    
    res.json({ prerequisites: skill.prerequisites || [] });
  } catch (error) {
    next(error);
  }
};

// Add skill prerequisite
exports.addSkillPrerequisite = async (req, res, next) => {
  try {
    const { skillId } = req.params;
    const { prerequisiteSkillId } = req.body;
    
    if (!prerequisiteSkillId) {
      return res.status(400).json({ error: '必須提供前置技能ID' });
    }
    
    if (skillId === prerequisiteSkillId) {
      return res.status(400).json({ error: '技能不能設定自己為前置技能' });
    }
    
    // Check if both skills exist
    const skill = await Skill.findByPk(skillId);
    const prerequisiteSkill = await Skill.findByPk(prerequisiteSkillId);
    
    if (!skill) {
      return res.status(404).json({ error: '找不到指定的技能' });
    }
    
    if (!prerequisiteSkill) {
      return res.status(404).json({ error: '找不到指定的前置技能' });
    }
    
    // Check if prerequisite already exists
    const existingPrerequisite = await SkillPrerequisite.findOne({
      where: { skillId, prerequisiteSkillId }
    });
    
    if (existingPrerequisite) {
      return res.status(400).json({ error: '此前置技能已存在' });
    }
    
    // Create prerequisite
    await SkillPrerequisite.create({
      skillId,
      prerequisiteSkillId
    });
    
    res.status(201).json({ message: '前置技能新增成功' });
  } catch (error) {
    next(error);
  }
};

// Remove skill prerequisite
exports.removeSkillPrerequisite = async (req, res, next) => {
  try {
    const { skillId, prerequisiteSkillId } = req.params;
    
    const prerequisite = await SkillPrerequisite.findOne({
      where: { skillId, prerequisiteSkillId }
    });
    
    if (!prerequisite) {
      return res.status(404).json({ error: '找不到指定的前置技能關係' });
    }
    
    await prerequisite.destroy();
    
    res.json({ message: '前置技能移除成功' });
  } catch (error) {
    next(error);
  }
};

// Update skill prerequisite - Disabled
exports.updateSkillPrerequisite = async (req, res, next) => {
  try {
    return res.status(400).json({ error: '前置技能更新功能已停用' });
  } catch (error) {
    next(error);
  }
};