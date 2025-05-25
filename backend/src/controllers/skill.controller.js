const { Skill, UserSkill, Job, JobSkill, User } = require('../models');
const { Op } = require('sequelize');

// Get user's skill progress with job level organization
exports.getUserSkills = async (req, res, next) => {
  try {
    const userId = req.userId; // Set by auth middleware
    
    const userSkills = await UserSkill.findAll({
      where: { userId },
      include: [
        {
          model: Skill,
          attributes: ['id', 'name', 'category', 'isRequired', 'learningMethod', 'assessmentMethod']
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
          attributes: ['id', 'name', 'category', 'isRequired', 'learningMethod', 'assessmentMethod']
        }
      ],
      order: [
        [Skill, 'category', 'ASC'],
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
          attributes: ['id', 'name', 'category', 'isRequired', 'learningMethod', 'assessmentMethod']
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
          attributes: ['id', 'name', 'category', 'isRequired', 'learningMethod', 'assessmentMethod']
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