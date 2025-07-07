const express = require('express');
const router = express.Router();
const multer = require('multer');
const csvImportController = require('../controllers/csv-import.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// Configure multer for file upload (memory storage for CSV files)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow CSV files
    if (file.mimetype === 'text/csv' || 
        file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('只允許上傳 CSV 檔案'), false);
    }
  }
});

// All routes require authentication
router.use(authenticate);

// CSV import routes
router.post('/users', upload.single('csv'), csvImportController.importUsers);
router.post('/skills', upload.single('csv'), csvImportController.importSkills);
router.post('/departments', upload.single('csv'), csvImportController.importDepartments);
router.post('/jobs', upload.single('csv'), csvImportController.importJobs);

// Example CSV download routes
router.get('/example/:type', csvImportController.downloadExampleCSV);

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '檔案大小超過限制 (5MB)' });
    }
  }
  
  if (error.message) {
    return res.status(400).json({ error: error.message });
  }
  
  next(error);
});

module.exports = router;