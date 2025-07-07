#!/usr/bin/env node

const { sequelize } = require('./src/models');
const fs = require('fs');
const path = require('path');

async function resetDatabase() {
  try {
    console.log('🔄 Starting database reset...');
    
    // Force sync will drop all tables and recreate them
    await sequelize.sync({ force: true });
    
    console.log('✅ Database reset completed successfully!');
    console.log('📋 All tables have been dropped and recreated with current schema');
    
    // Mark all migrations as completed since force sync creates the latest schema
    console.log('🔧 Marking all migrations as completed...');
    await markMigrationsAsCompleted();
    
    console.log('💡 You can now import fresh data using CSV import');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

async function markMigrationsAsCompleted() {
  try {
    // Create SequelizeMeta table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        "name" VARCHAR(255) NOT NULL PRIMARY KEY
      );
    `);

    // Get all migration files
    const migrationsDir = path.join(__dirname, 'src', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    // Insert all migration names into SequelizeMeta table
    for (const file of migrationFiles) {
      await sequelize.query(`
        INSERT INTO "SequelizeMeta" ("name") 
        VALUES (:name) 
        ON CONFLICT ("name") DO NOTHING;
      `, {
        replacements: { name: file }
      });
    }

    console.log(`✅ Marked ${migrationFiles.length} migrations as completed`);
  } catch (error) {
    console.error('❌ Failed to mark migrations as completed:', error);
    // Don't fail the whole process for this
  }
}

resetDatabase();