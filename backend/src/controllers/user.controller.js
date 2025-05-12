const { User, Department } = require('../models');
const { Op } = require('sequelize');

// Get current user profile
exports.getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.userId; // Set by auth middleware
    
    const user = await User.findByPk(userId, {
      attributes: { 
        exclude: ['deletedAt'] 
      },
      include: [{
        model: Department,
        attributes: ['id', 'name']
      }]
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check and reset daily credits if needed
    await user.checkAndResetDailyCredits();
    
    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};

// Get list of users (for giving credit)
exports.getUsers = async (req, res, next) => {
  try {
    const userId = req.userId; // Set by auth middleware
    const { departmentId, searchTerm } = req.query;
    
    const whereClause = {
      id: { [Op.ne]: userId }, // Exclude current user
      isActive: true
    };
    
    // Add department filter if provided
    if (departmentId) {
      whereClause.DepartmentId = departmentId;
    }
    
    // Add search filter if provided
    if (searchTerm) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { employeeId: { [Op.iLike]: `%${searchTerm}%` } }
      ];
    }
    
    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'employeeId', 'profilePicture'],
      include: [{
        model: Department,
        attributes: ['id', 'name']
      }],
      order: [['name', 'ASC']]
    });
    
    return res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all users
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, departmentId, searchTerm, role } = req.query;
    
    const offset = (page - 1) * limit;
    const whereClause = {};
    
    // Add department filter if provided
    if (departmentId) {
      whereClause.DepartmentId = departmentId;
    }
    
    // Add role filter if provided
    if (role) {
      whereClause.role = role;
    }
    
    // Add search filter if provided
    if (searchTerm) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { employeeId: { [Op.iLike]: `%${searchTerm}%` } },
        { email: { [Op.iLike]: `%${searchTerm}%` } }
      ];
    }
    
    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      attributes: { 
        exclude: ['deletedAt'] 
      },
      include: [{
        model: Department,
        attributes: ['id', 'name']
      }],
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset
    });
    
    return res.status(200).json({
      totalItems: count,
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Create user
exports.createUser = async (req, res, next) => {
  try {
    const { employeeId, name, email, departmentId, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [
          { employeeId },
          { email }
        ]
      } 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists with this employee ID or email'
      });
    }
    
    // Create new user
    const user = await User.create({
      employeeId,
      name,
      email,
      departmentId,
      role: role || 'user',
      remainingDailyCredits: process.env.DAILY_CREDIT_LIMIT || 5,
      dailyCreditResetDate: new Date()
    });
    
    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Update user
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, departmentId, isActive, role } = req.body;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (departmentId) user.departmentId = departmentId;
    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (role) user.role = role;
    
    await user.save();
    
    return res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete user (soft delete)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.destroy(); // Soft delete
    
    return res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};