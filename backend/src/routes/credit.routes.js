const express = require('express');
const router = express.Router();
const {
  giveCredit,
  giveBulkCredit,
  getReceivedCredits,
  getGivenCredits,
  getAllCredits
} = require('../controllers/credit.controller');
const { authenticate, isAdmin } = require('../middlewares/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticate);

// Give credit to another user
router.post('/', giveCredit);

// Give credit to multiple users (bulk operation)
router.post('/bulk', giveBulkCredit);

// Get credits received by current user
router.get('/received', getReceivedCredits);

// Get credits given by current user
router.get('/given', getGivenCredits);

// Admin: Get all credits
router.get('/all', isAdmin, getAllCredits);

module.exports = router;