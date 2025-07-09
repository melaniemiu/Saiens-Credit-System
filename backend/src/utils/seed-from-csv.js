#!/usr/bin/env node

const dotenv = require("dotenv");
dotenv.config();

const { sequelize } = require("../models");
const CSVUtils = require("./csv-utils");
const fs = require('fs');
const path = require('path');

// Import controllers for CSV processing
const csvImportController = require('../controllers/csv-import.controller');

// Function to create realistic skill progress for users at higher job levels
async function createRealisticSkillProgress() {
  const { User, Job, JobSkill, UserSkill } = require('../models');
  
  try {
    // Get all users with their jobs
    const users = await User.findAll({
      include: [Job],
      where: {
        jobId: { [require('sequelize').Op.ne]: null }
      }
    });
    
    console.log(`📊 Found ${users.length} users with job assignments`);
    
    const userSkillRecords = [];
    
    for (const user of users) {
      if (!user.Job || user.Job.level <= 1) {
        // Skip users at entry level (level 1) or without jobs
        continue;
      }
      
      // Get all jobs in the same department with lower levels
      const lowerLevelJobs = await Job.findAll({
        where: {
          departmentId: user.Job.departmentId,
          level: { [require('sequelize').Op.lt]: user.Job.level }
        }
      });
      
      // Get skills for all lower-level jobs
      const lowerLevelSkills = await JobSkill.findAll({
        where: {
          jobId: { [require('sequelize').Op.in]: lowerLevelJobs.map(j => j.id) }
        }
      });
      
      // Create skill progress records for lower-level job skills
      for (const jobSkill of lowerLevelSkills) {
        const isRequired = jobSkill.isRequired;
        const completionRate = isRequired ? 0.95 : 0.70; // 95% for required, 70% for optional
        
        if (Math.random() < completionRate) {
          const baseScore = isRequired ? 85 : 75; // Higher base score for required skills
          const score = Math.min(100, baseScore + Math.floor(Math.random() * 15));
          
          // Create dates showing progression over time
          const completionDate = new Date();
          completionDate.setMonth(completionDate.getMonth() - Math.floor(Math.random() * 12));
          
          const startDate = new Date(completionDate);
          startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30 + 7));
          
          userSkillRecords.push({
            userId: user.id,
            skillId: jobSkill.skillId,
            status: 'completed',
            score: score,
            attempts: Math.floor(Math.random() * 2) + 1,
            startDate: startDate,
            completionDate: completionDate,
            certificationDate: score >= 80 ? completionDate : null
          });
        }
      }
    }
    
    // Bulk create user skill records
    if (userSkillRecords.length > 0) {
      await UserSkill.bulkCreate(userSkillRecords, { 
        ignoreDuplicates: true 
      });
      
      console.log(`✅ Created ${userSkillRecords.length} realistic skill progress records`);
      
      // Log summary by user
      const userSkillCounts = {};
      for (const record of userSkillRecords) {
        userSkillCounts[record.userId] = (userSkillCounts[record.userId] || 0) + 1;
      }
      
      for (const user of users) {
        const skillCount = userSkillCounts[user.id] || 0;
        if (skillCount > 0) {
          console.log(`   • ${user.name} (${user.Job.name}): ${skillCount} skills completed`);
        }
      }
    } else {
      console.log('ℹ️ No skill progress records needed (all users at entry level)');
    }
    
  } catch (error) {
    console.error('❌ Failed to create realistic skill progress:', error);
    throw error;
  }
}

// Function to create job-skill relationships for demonstration
async function createJobSkillRelationships() {
  const { Job, Skill, JobSkill } = require('../models');
  
  try {
    // Get all jobs and skills
    const jobs = await Job.findAll();
    const skills = await Skill.findAll();
    
    console.log(`📊 Found ${jobs.length} jobs and ${skills.length} skills`);
    
    // Create relationships based on job categories and skill types
    const relationships = [];
    
    for (const job of jobs) {
      // Determine which skills are relevant for this job based on department and level
      const relevantSkills = skills.filter(skill => {
        // Basic skills for all jobs
        if (skill.category === '山恩DNA') return true;
        
        // Department-specific skills
        if (job.name.includes('行銷') && skill.name.includes('行銷')) return true;
        if (job.name.includes('財務') && skill.name.includes('財務')) return true;
        if (job.name.includes('工程') && skill.name.includes('開發')) return true;
        if (job.name.includes('管理') && skill.name.includes('管理')) return true;
        if (job.name.includes('客服') && skill.name.includes('客戶')) return true;
        
        // Level-based skills
        if (job.level >= 3 && skill.name.includes('領導')) return true;
        if (job.level >= 2 && skill.name.includes('專案')) return true;
        
        // General skills for all positions
        if (skill.category === '產品知識') return Math.random() > 0.5;
        if (skill.category === '工具使用') return Math.random() > 0.3;
        if (skill.category === '安全操作') return Math.random() > 0.7;
        
        return false;
      });
      
      // Create job-skill relationships
      for (const skill of relevantSkills) {
        const isRequired = skill.category === '山恩DNA' || skill.category === '安全操作' || Math.random() > 0.6;
        
        relationships.push({
          jobId: job.id,
          skillId: skill.id,
          isRequired: isRequired
        });
      }
    }
    
    // Bulk create relationships
    await JobSkill.bulkCreate(relationships, { 
      ignoreDuplicates: true 
    });
    
    console.log(`✅ Created ${relationships.length} job-skill relationships`);
    
    // Log summary by job
    for (const job of jobs) {
      const jobSkills = relationships.filter(r => r.jobId === job.id);
      const required = jobSkills.filter(r => r.isRequired).length;
      const optional = jobSkills.length - required;
      
      console.log(`   • ${job.name}: ${required} required, ${optional} optional skills`);
    }
    
  } catch (error) {
    console.error('❌ Failed to create job-skill relationships:', error);
    throw error;
  }
}

async function seedFromCSV() {
  try {
    console.log('🌱 Starting CSV-based seeding...');
    
    // For fresh-start-with-data, we assume the database was already reset
    // by reset-database.js, so we just need to sync without force
    console.log("📋 Syncing database schema...");
    await sequelize.sync({ force: false });
    console.log("✅ Database synced successfully");

    // Path to our sample CSV files
    const sampleDataPath = path.join(__dirname, '../../sample-data');
    
    // Check if sample data directory exists
    if (!fs.existsSync(sampleDataPath)) {
      console.error('❌ Sample data directory not found at:', sampleDataPath);
      console.log('💡 Please make sure the sample CSV files exist in the sample-data directory');
      process.exit(1);
    }

    console.log('📂 Found sample data directory:', sampleDataPath);

    // Import order: departments → jobs → skills → users
    const importOrder = [
      { 
        type: 'departments', 
        file: 'departments-sample.csv',
        description: 'departments'
      },
      { 
        type: 'jobs', 
        file: 'jobs-sample.csv',
        description: 'jobs with career progression'
      },
      { 
        type: 'skills', 
        file: 'skills-sample.csv',
        description: 'skills with flexible categories'
      },
      { 
        type: 'users', 
        file: 'users-sample.csv',
        description: 'users with role assignments'
      }
    ];

    // Process each CSV file
    for (const { type, file, description } of importOrder) {
      const filePath = path.join(sampleDataPath, file);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️ Skipping ${type}: ${file} not found`);
        continue;
      }

      console.log(`\n🔄 Importing ${description} from ${file}...`);
      
      try {
        // Read and parse CSV file
        const csvBuffer = fs.readFileSync(filePath);
        const csvData = await CSVUtils.parseCSVFromBuffer(csvBuffer);
        
        console.log(`📊 Found ${csvData.length} records in ${file}`);
        console.log(`🔍 First record headers:`, Object.keys(csvData[0] || {}));

        // Create a mock request object for the import controller
        const mockReq = {
          file: { buffer: csvBuffer },
          userId: 'seed-script' // Mock user ID for seeding
        };

        const mockRes = {
          status: (code) => ({
            json: (data) => {
              if (code === 200) {
                console.log(`✅ ${data.message}`);
                if (data.results) {
                  console.log(`   - Success: ${data.results.success}`);
                  console.log(`   - Duplicates: ${data.results.duplicates}`);
                  if (data.results.errors.length > 0) {
                    console.log(`   - Errors: ${data.results.errors.length}`);
                    data.results.errors.slice(0, 3).forEach(error => {
                      console.log(`     • ${error}`);
                    });
                    if (data.results.errors.length > 3) {
                      console.log(`     • ... and ${data.results.errors.length - 3} more errors`);
                    }
                  }
                }
              } else {
                console.error(`❌ Import failed (${code}):`, data.error || data.message);
              }
              return { json: () => {} };
            }
          })
        };

        // Import based on type
        switch (type) {
          case 'departments':
            await csvImportController.importDepartments(mockReq, mockRes);
            break;
          case 'jobs':
            await csvImportController.importJobs(mockReq, mockRes);
            break;
          case 'skills':
            await csvImportController.importSkills(mockReq, mockRes);
            break;
          case 'users':
            await csvImportController.importUsers(mockReq, mockRes);
            break;
        }

      } catch (error) {
        console.error(`❌ Failed to import ${type}:`, error.message);
      }
    }

    console.log('\n🔗 Creating job-skill relationships...');
    await createJobSkillRelationships();
    
    console.log('\n👤 Creating realistic skill progress for higher-level users...');
    await createRealisticSkillProgress();
    
    console.log('\n🎉 CSV-based seeding completed!');
    console.log('\n📋 What was seeded:');
    console.log('   • 10 departments with realistic Chinese names');
    console.log('   • 35+ job positions with career progression levels');
    console.log('   • 15 skills with flexible categories and methods');
    console.log('   • 20 users across different departments and roles');
    console.log('   • Job-skill relationships for demonstration');
    
    console.log('\n💡 You can now:');
    console.log('   1. Start your application: npm run dev');
    console.log('   2. Login and access the admin dashboard');
    console.log('   3. Explore the skill roadmap with proper job-skill relationships');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Mock the admin check for seeding
const originalImportUsers = csvImportController.importUsers;
const originalImportDepartments = csvImportController.importDepartments;
const originalImportJobs = csvImportController.importJobs;
const originalImportSkills = csvImportController.importSkills;

// Override the admin check for seeding
csvImportController.importUsers = async function(req, res, next) {
  const { User } = require('../models');
  
  // Create mock admin user for validation
  req.userId = 'mock-admin-for-seeding';
  
  // Mock User.findByPk to return admin user
  const originalFindByPk = User.findByPk;
  User.findByPk = async (id) => {
    if (id === 'mock-admin-for-seeding') {
      return { role: 'admin' };
    }
    return originalFindByPk.call(User, id);
  };
  
  try {
    await originalImportUsers.call(this, req, res, next);
  } finally {
    User.findByPk = originalFindByPk;
  }
};

csvImportController.importDepartments = async function(req, res, next) {
  req.userId = 'mock-admin-for-seeding';
  const { User } = require('../models');
  const originalFindByPk = User.findByPk;
  User.findByPk = async (id) => id === 'mock-admin-for-seeding' ? { role: 'admin' } : originalFindByPk.call(User, id);
  
  try {
    await originalImportDepartments.call(this, req, res, next);
  } finally {
    User.findByPk = originalFindByPk;
  }
};

csvImportController.importJobs = async function(req, res, next) {
  req.userId = 'mock-admin-for-seeding';
  const { User } = require('../models');
  const originalFindByPk = User.findByPk;
  User.findByPk = async (id) => id === 'mock-admin-for-seeding' ? { role: 'admin' } : originalFindByPk.call(User, id);
  
  try {
    await originalImportJobs.call(this, req, res, next);
  } finally {
    User.findByPk = originalFindByPk;
  }
};

csvImportController.importSkills = async function(req, res, next) {
  req.userId = 'mock-admin-for-seeding';
  const { User } = require('../models');
  const originalFindByPk = User.findByPk;
  User.findByPk = async (id) => id === 'mock-admin-for-seeding' ? { role: 'admin' } : originalFindByPk.call(User, id);
  
  try {
    await originalImportSkills.call(this, req, res, next);
  } finally {
    User.findByPk = originalFindByPk;
  }
};

seedFromCSV();