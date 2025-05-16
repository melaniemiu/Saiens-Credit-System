const express = require('express');
const router = express.Router();
const {
  giveCredit,
  giveBulkCredit,
  getReceivedCredits,
  getSentCredits,
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

// Get credits sent by current user
router.get('/sent', getSentCredits);

// Admin: Get all credits
router.get('/all', isAdmin, getAllCredits);

module.exports = router;