const { User, Department, Skill, Job, UserSkill, JobSkill } = require('../models');
const CSVUtils = require('../utils/csv-utils');
const { Op } = require('sequelize');

// Import users from CSV
exports.importUsers = async (req, res, next) => {
  try {
    // Check if user is admin
    const currentUser = await User.findByPk(req.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: '只有管理員可以匯入使用者資料' });
    }

    if (!req.file) {
      return res.status(400).json({ error: '請選擇要匯入的 CSV 檔案' });
    }

    // Parse CSV data
    const csvData = await CSVUtils.parseCSVFromBuffer(req.file.buffer);
    
    // Validate CSV structure and data
    CSVUtils.validateUserData(csvData);

    // Get all departments for mapping
    const departments = await Department.findAll();
    const departmentMap = {};
    departments.forEach(dept => {
      departmentMap[dept.name] = dept.id;
    });

    // Get all jobs for mapping
    const jobs = await Job.findAll();
    const jobMap = {};
    jobs.forEach(job => {
      jobMap[job.name] = job.id;
    });

    // Process each user
    const results = {
      success: 0,
      errors: [],
      duplicates: 0,
      created: []
    };

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNum = i + 2;

      try {
        // Clean and validate data
        const userData = {
          name: CSVUtils.cleanString(row.name),
          email: CSVUtils.cleanString(row.email).toLowerCase(),
          employeeId: CSVUtils.cleanString(row.employeeId),
          role: CSVUtils.cleanString(row.role).toLowerCase(),
          departmentId: departmentMap[CSVUtils.cleanString(row.departmentName)]
        };

        // Add job assignment if provided
        if (row.jobName && CSVUtils.cleanString(row.jobName)) {
          const jobName = CSVUtils.cleanString(row.jobName);
          const jobId = jobMap[jobName];
          
          if (jobId) {
            userData.jobId = jobId;
          } else {
            results.errors.push(`Row ${rowNum}: Job '${jobName}' not found`);
            continue;
          }
        }

        // Check if department exists
        if (!userData.departmentId) {
          results.errors.push(`Row ${rowNum}: Department '${row.departmentName}' not found`);
          continue;
        }

        // Check for existing user
        const existingUser = await User.findOne({
          where: {
            [Op.or]: [
              { email: userData.email },
              { employeeId: userData.employeeId }
            ]
          }
        });

        if (existingUser) {
          results.duplicates++;
          results.errors.push(`Row ${rowNum}: User with email '${userData.email}' or employee ID '${userData.employeeId}' already exists`);
          continue;
        }

        // Create user
        const newUser = await User.create(userData);
        results.created.push({
          name: newUser.name,
          email: newUser.email,
          employeeId: newUser.employeeId,
          jobId: newUser.jobId,
          jobName: row.jobName || null
        });
        results.success++;

      } catch (error) {
        results.errors.push(`Row ${rowNum}: ${error.message}`);
      }
    }

    return res.status(200).json({
      message: `CSV import completed. ${results.success} users created, ${results.duplicates} duplicates skipped.`,
      results
    });

  } catch (error) {
    console.error('CSV import error:', error);
    return res.status(400).json({ 
      error: error.message || 'CSV 匯入失敗' 
    });
  }
};

// Import skills from CSV
exports.importSkills = async (req, res, next) => {
  try {
    // Check if user is admin
    const currentUser = await User.findByPk(req.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: '只有管理員可以匯入技能資料' });
    }

    if (!req.file) {
      return res.status(400).json({ error: '請選擇要匯入的 CSV 檔案' });
    }

    // Parse CSV data
    const csvData = await CSVUtils.parseCSVFromBuffer(req.file.buffer);
    
    // Validate CSV structure and data
    CSVUtils.validateSkillData(csvData);

    // Process each skill
    const results = {
      success: 0,
      errors: [],
      duplicates: 0,
      created: []
    };

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNum = i + 2;

      try {
        // Clean and validate data
        const skillData = {
          name: CSVUtils.cleanString(row.name),
          category: CSVUtils.cleanString(row.category),
          learningMethod: CSVUtils.cleanString(row.learningMethod),
          assessmentMethod: CSVUtils.cleanString(row.assessmentMethod),
          syllabus: CSVUtils.cleanString(row.syllabus) || null
        };

        // Check for existing skill
        const existingSkill = await Skill.findOne({
          where: { name: skillData.name }
        });

        if (existingSkill) {
          results.duplicates++;
          // Skip existing skills instead of treating as error
          continue;
        }

        // Create skill
        const newSkill = await Skill.create(skillData);
        results.created.push({
          name: newSkill.name,
          category: newSkill.category
        });
        results.success++;

      } catch (error) {
        results.errors.push(`Row ${rowNum}: ${error.message}`);
      }
    }

    return res.status(200).json({
      message: `CSV import completed. ${results.success} skills created, ${results.duplicates} duplicates skipped.`,
      results
    });

  } catch (error) {
    console.error('CSV import error:', error);
    return res.status(400).json({ 
      error: error.message || 'CSV 匯入失敗' 
    });
  }
};

// Import departments from CSV
exports.importDepartments = async (req, res, next) => {
  try {
    // Check if user is admin
    const currentUser = await User.findByPk(req.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: '只有管理員可以匯入部門資料' });
    }

    if (!req.file) {
      return res.status(400).json({ error: '請選擇要匯入的 CSV 檔案' });
    }

    // Parse CSV data
    const csvData = await CSVUtils.parseCSVFromBuffer(req.file.buffer);
    
    // Validate CSV structure and data
    CSVUtils.validateDepartmentData(csvData);

    // Process each department
    const results = {
      success: 0,
      errors: [],
      duplicates: 0,
      created: []
    };

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNum = i + 2;

      try {
        // Clean and validate data
        const deptData = {
          name: CSVUtils.cleanString(row.name),
          description: CSVUtils.cleanString(row.description) || null,
          isActive: row.isActive ? CSVUtils.parseBoolean(row.isActive) : true
        };

        // Check for existing department
        const existingDept = await Department.findOne({
          where: { name: deptData.name }
        });

        if (existingDept) {
          results.duplicates++;
          // Skip existing departments instead of treating as error
          continue;
        }

        // Create department
        const newDept = await Department.create(deptData);
        results.created.push({
          name: newDept.name,
          description: newDept.description
        });
        results.success++;

      } catch (error) {
        results.errors.push(`Row ${rowNum}: ${error.message}`);
      }
    }

    return res.status(200).json({
      message: `CSV import completed. ${results.success} departments created, ${results.duplicates} duplicates skipped.`,
      results
    });

  } catch (error) {
    console.error('CSV import error:', error);
    return res.status(400).json({ 
      error: error.message || 'CSV 匯入失敗' 
    });
  }
};

// Import jobs from CSV
exports.importJobs = async (req, res, next) => {
  try {
    // Check if user is admin
    const currentUser = await User.findByPk(req.userId);
    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ error: '只有管理員可以匯入職位資料' });
    }

    if (!req.file) {
      return res.status(400).json({ error: '請選擇要匯入的 CSV 檔案' });
    }

    // Parse CSV data
    const csvData = await CSVUtils.parseCSVFromBuffer(req.file.buffer);
    
    // Validate CSV structure and data
    CSVUtils.validateJobData(csvData);

    // Get all departments for mapping
    const departments = await Department.findAll();
    const departmentMap = {};
    departments.forEach(dept => {
      departmentMap[dept.name] = dept.id;
    });

    // Process each job
    const results = {
      success: 0,
      errors: [],
      duplicates: 0,
      created: []
    };

    // First pass: Create all jobs without nextJobId relationships
    const createdJobs = [];
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const rowNum = i + 2;

      try {
        // Clean and validate data
        const jobData = {
          name: CSVUtils.cleanString(row.name),
          departmentId: departmentMap[CSVUtils.cleanString(row.departmentName)],
          level: row.level ? parseInt(row.level) : null
        };

        // Check if department exists
        if (!jobData.departmentId) {
          results.errors.push(`Row ${rowNum}: Department '${row.departmentName}' not found`);
          continue;
        }

        // Check for existing job
        const existingJob = await Job.findOne({
          where: { 
            name: jobData.name,
            departmentId: jobData.departmentId
          }
        });

        if (existingJob) {
          results.duplicates++;
          // Skip existing jobs instead of treating as error
          continue;
        }

        // Create job
        const newJob = await Job.create(jobData);
        createdJobs.push({
          job: newJob,
          nextJobName: CSVUtils.cleanString(row.nextJobName),
          row: rowNum
        });
        results.created.push({
          name: newJob.name,
          departmentName: row.departmentName,
          level: newJob.level
        });
        results.success++;

      } catch (error) {
        results.errors.push(`Row ${rowNum}: ${error.message}`);
      }
    }

    // Second pass: Set up job progression relationships
    for (const { job, nextJobName, row } of createdJobs) {
      if (nextJobName) {
        try {
          const nextJob = await Job.findOne({
            where: { 
              name: nextJobName,
              departmentId: job.departmentId
            }
          });

          if (nextJob) {
            await job.update({ nextJobId: nextJob.id });
          } else {
            results.errors.push(`Row ${row}: Next job '${nextJobName}' not found for '${job.name}'`);
          }
        } catch (error) {
          results.errors.push(`Row ${row}: Error setting job progression: ${error.message}`);
        }
      }
    }

    return res.status(200).json({
      message: `CSV import completed. ${results.success} jobs created, ${results.duplicates} duplicates skipped.`,
      results
    });

  } catch (error) {
    console.error('CSV import error:', error);
    return res.status(400).json({ 
      error: error.message || 'CSV 匯入失敗' 
    });
  }
};

// Generate example CSV files
exports.downloadExampleCSV = (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['users', 'skills', 'departments', 'jobs'].includes(type)) {
      return res.status(400).json({ error: 'Invalid CSV type' });
    }

    const csvContent = CSVUtils.generateExampleCSV(type);
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${type}-example.csv"`);
    
    // Add BOM for proper UTF-8 encoding in Excel
    const bom = '\ufeff';
    res.send(bom + csvContent);
    
  } catch (error) {
    console.error('Example CSV generation error:', error);
    return res.status(500).json({ error: 'Failed to generate example CSV' });
  }
};