#!/usr/bin/env node

const dotenv = require("dotenv");
dotenv.config();

const { sequelize } = require("../models");
const CSVUtils = require("./csv-utils");
const fs = require('fs');
const path = require('path');

// Import controllers for CSV processing
const csvImportController = require('../controllers/csv-import.controller');

async function seedFromCSV() {
  try {
    console.log('🌱 Starting CSV-based seeding...');
    
    // Check if we should force sync (drop all tables)
    const forceDrop = process.argv.includes("--force");

    if (forceDrop) {
      console.log("⚠️ WARNING: Dropping all tables and recreating schema...");
      await sequelize.sync({ force: true });
      console.log("✅ Database synced and recreated");
    } else {
      console.log("📋 Using existing database schema (no force sync)");
      await sequelize.sync({ force: false });
      console.log("✅ Database synced without dropping tables");
    }

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

    console.log('\n🎉 CSV-based seeding completed!');
    console.log('\n📋 What was seeded:');
    console.log('   • 10 departments with realistic Chinese names');
    console.log('   • 35+ job positions with career progression levels');
    console.log('   • 15 skills with flexible categories and methods');
    console.log('   • 20 users across different departments and roles');
    
    console.log('\n💡 You can now:');
    console.log('   1. Start your application: npm run dev');
    console.log('   2. Login and access the admin dashboard');
    console.log('   3. Explore the imported data structure');
    
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