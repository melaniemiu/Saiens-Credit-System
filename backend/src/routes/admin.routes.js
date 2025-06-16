const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const departmentController = require('../controllers/department.controller');
const skillController = require('../controllers/skill.controller');
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');

// All admin routes require authentication and admin role
router.use(authenticate, isAdmin);

// User management
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Credit management
router.get('/credits', adminController.getCredits);
router.get('/credits/export', adminController.exportCredits);

// Department management
router.get('/departments', departmentController.getAdminDepartments);
router.post('/departments', departmentController.createDepartment);
router.put('/departments/:id', departmentController.updateDepartment);
router.delete('/departments/:id', departmentController.deleteDepartment);

// Skill management
router.get('/skills', skillController.getAdminSkills);
router.post('/skills', skillController.createSkill);
router.put('/skills/:id', skillController.updateSkill);
router.delete('/skills/:id', skillController.deleteSkill);

module.exports = router;