const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Get all jobs with pagination and filtering (admin only)
router.get('/', authenticate, jobController.getAdminJobs);

// Create new job (admin only)
router.post('/', authenticate, jobController.createJob);

// Update job (admin only)
router.put('/:id', authenticate, jobController.updateJob);

// Delete job (admin only)
router.delete('/:id', authenticate, jobController.deleteJob);

module.exports = router;