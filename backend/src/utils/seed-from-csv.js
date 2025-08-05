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
        const completionRate = 0.80; // 80% completion rate for all skills
        
        if (Math.random() < completionRate) {
          const baseScore = 80; // Base score for all skills
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
    const departmentSkillUsage = new Map(); // Track skill usage per department
    
    // Group jobs by department for processing
    const jobsByDepartment = jobs.reduce((acc, job) => {
      if (!acc[job.departmentId]) {
        acc[job.departmentId] = [];
      }
      acc[job.departmentId].push(job);
      return acc;
    }, {});
    
    // Process each department separately to ensure skills only appear once per department
    for (const [departmentId, departmentJobs] of Object.entries(jobsByDepartment)) {
      // Sort jobs by level within department
      const sortedJobs = departmentJobs.sort((a, b) => a.level - b.level);
      const usedSkillsInDepartment = new Set();
      
      for (const job of sortedJobs) {
        const relevantSkills = [];
        
        // 1. Department-specific skills (only assign to lowest level job in department)
        if (job.level === 1) {
          if (job.name.includes('行銷')) {
            relevantSkills.push(...skills.filter(skill => 
              skill.name === '數位行銷策略' || skill.name === '市場趨勢分析'
            ));
          }
          if (job.name.includes('財務') || job.name.includes('會計')) {
            relevantSkills.push(...skills.filter(skill => 
              skill.name === '財務分析與預算規劃'
            ));
          }
          if (job.name.includes('工程師') || job.name.includes('研發')) {
            relevantSkills.push(...skills.filter(skill => 
              skill.name === '敏捷開發方法論' || skill.name === '資料庫設計與管理' ||
              skill.name === '雲端平台架構'
            ));
          }
          if (job.name.includes('客服')) {
            relevantSkills.push(...skills.filter(skill => 
              skill.name === '客戶關係管理'
            ));
          }
          if (job.name.includes('品管') || job.name.includes('品質')) {
            relevantSkills.push(...skills.filter(skill => 
              skill.name === '品質管理系統'
            ));
          }
          if (job.name.includes('法務')) {
            relevantSkills.push(...skills.filter(skill => 
              skill.name === '法規遵循管理'
            ));
          }
          if (job.name.includes('IT') || job.name.includes('資訊')) {
            relevantSkills.push(...skills.filter(skill => 
              skill.name === '資訊安全管理' || skill.name === '雲端平台架構' || skill.name === '資料庫設計與管理'
            ));
          }
          if (job.name.includes('營運')) {
            relevantSkills.push(...skills.filter(skill => 
              skill.name === '業務流程優化'
            ));
          }
          if (job.name.includes('人資') || job.name.includes('招募')) {
            relevantSkills.push(...skills.filter(skill => 
              skill.name === '團隊領導與激勵'
            ));
          }
          if (job.name.includes('策略')) {
            relevantSkills.push(...skills.filter(skill => 
              skill.name === '市場趨勢分析' || skill.name === '業務流程優化'
            ));
          }
          if (job.name.includes('系統管理')) {
            relevantSkills.push(...skills.filter(skill => 
              skill.name === '資訊安全管理'
            ));
          }
        }
        
        // 2. Level-based skills (only assign to specific level per department)
        if (job.level === 2) {
          relevantSkills.push(...skills.filter(skill => 
            skill.name === '專案管理認證'
          ));
        }
        if (job.level === 3) {
          relevantSkills.push(...skills.filter(skill => 
            skill.name === '團隊領導與激勵'
          ));
        }
        
        // 3. Core skills (山恩DNA) - only assign to specific jobs to avoid repetition
        if (job.level === 1) {
          // Assign different core skills to different departments
          if (job.name.includes('行銷') || job.name.includes('策略')) {
            relevantSkills.push(...skills.filter(skill => 
              skill.name === '商業簡報技巧'
            ));
          }
          if (job.name.includes('客服') || job.name.includes('人資')) {
            relevantSkills.push(...skills.filter(skill => 
              skill.name === '跨部門溝通協調'
            ));
          }
          // Don't assign 客戶關係管理 as core skill - it's department-specific
        }
        
        // 4. General skills (only truly general ones, distributed across jobs)
        const generalSkills = skills.filter(skill => {
          // Only include truly general skills that haven't been assigned
          return skill.category === '產品知識' || skill.category === '工具使用';
        });
        
        // Assign general skills deterministically but avoid duplicates within department
        const jobHash = (job.name + job.departmentId + job.level).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
        generalSkills.forEach((skill, index) => {
          const shouldInclude = (jobHash + index) % 4 === 0; // Less frequent assignment
          if (shouldInclude && !usedSkillsInDepartment.has(skill.id)) {
            relevantSkills.push(skill);
          }
        });
        
        // Remove duplicates and skills already used in this department
        const uniqueSkills = relevantSkills.filter((skill, index, self) => 
          index === self.findIndex(s => s.id === skill.id) && 
          !usedSkillsInDepartment.has(skill.id)
        );
        
        // Add skills to department usage tracker
        uniqueSkills.forEach(skill => {
          usedSkillsInDepartment.add(skill.id);
        });
        
        // Create job-skill relationships
        for (const skill of uniqueSkills) {
          relationships.push({
            jobId: job.id,
            skillId: skill.id
          });
        }
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
      console.log(`   • ${job.name}: ${jobSkills.length} skills`);
    }
    
  } catch (error) {
    console.error('❌ Failed to create job-skill relationships:', error);
    throw error;
  }
}

// Function to create skill prerequisites from sample CSV data
async function createSkillPrerequisites() {
  const { Skill, SkillPrerequisite } = require('../models');
  const fs = require('fs');
  const path = require('path');
  
  try {
    // Read the skills sample file to extract prerequisite data
    const sampleDataPath = path.join(__dirname, '../../sample-data');
    const skillsFilePath = path.join(sampleDataPath, 'skills-sample.csv');
    
    if (!fs.existsSync(skillsFilePath)) {
      console.log('ℹ️ Skills sample file not found, skipping prerequisite creation');
      return;
    }
    
    // Parse the CSV file
    const csvData = await CSVUtils.parseCSVFromBuffer(fs.readFileSync(skillsFilePath));
    
    console.log(`📊 Processing prerequisites for ${csvData.length} skills`);
    
    const prerequisites = [];
    let processed = 0;
    
    for (const row of csvData) {
      const skillName = CSVUtils.cleanString(row.name);
      const prerequisiteSkillsText = CSVUtils.cleanString(row.prerequisiteSkills);
      
      if (!prerequisiteSkillsText) {
        continue; // Skip skills without prerequisites
      }
      
      // Find the main skill
      const skill = await Skill.findOne({ where: { name: skillName } });
      if (!skill) {
        console.log(`⚠️ Skill not found: ${skillName}`);
        continue;
      }
      
      // Parse prerequisite skills (comma-separated)
      const prerequisiteNames = prerequisiteSkillsText.split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0);
      
      for (const prereqName of prerequisiteNames) {
        // Find the prerequisite skill
        const prerequisiteSkill = await Skill.findOne({ where: { name: prereqName } });
        if (!prerequisiteSkill) {
          console.log(`⚠️ Prerequisite skill not found: ${prereqName} for ${skillName}`);
          continue;
        }
        
        // Check if relationship already exists
        const existingPrereq = await SkillPrerequisite.findOne({
          where: {
            skillId: skill.id,
            prerequisiteSkillId: prerequisiteSkill.id
          }
        });
        
        if (!existingPrereq) {
          prerequisites.push({
            skillId: skill.id,
            prerequisiteSkillId: prerequisiteSkill.id,
          });
        }
      }
      
      processed++;
    }
    
    // Bulk create prerequisites
    if (prerequisites.length > 0) {
      await SkillPrerequisite.bulkCreate(prerequisites, { 
        ignoreDuplicates: true 
      });
      
      console.log(`✅ Created ${prerequisites.length} skill prerequisites`);
      
      // Log summary
      const prereqsBySkill = {};
      for (const prereq of prerequisites) {
        const skill = await Skill.findByPk(prereq.skillId);
        if (skill) {
          prereqsBySkill[skill.name] = (prereqsBySkill[skill.name] || 0) + 1;
        }
      }
      
      Object.entries(prereqsBySkill).forEach(([skillName, count]) => {
        console.log(`   • ${skillName}: ${count} prerequisite(s)`);
      });
    } else {
      console.log('ℹ️ No prerequisites to create');
    }
    
  } catch (error) {
    console.error('❌ Failed to create skill prerequisites:', error);
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
    
    console.log('\n🔗 Creating skill prerequisites from sample data...');
    await createSkillPrerequisites();
    
    console.log('\n👤 Creating realistic skill progress for higher-level users...');
    await createRealisticSkillProgress();
    
    console.log('\n🎉 CSV-based seeding completed!');
    console.log('\n📋 What was seeded:');
    console.log('   • 10 departments with realistic Chinese names');
    console.log('   • 35+ job positions with career progression levels');
    console.log('   • 15 skills with flexible categories and methods');
    console.log('   • 6 skill prerequisite relationships');
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