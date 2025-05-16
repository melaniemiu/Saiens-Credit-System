const { Department } = require('../models');

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