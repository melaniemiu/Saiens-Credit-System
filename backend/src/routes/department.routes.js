const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Get all departments (requires authentication)
router.get('/', authenticate, departmentController.getDepartments);

module.exports = router;