require('dotenv').config();
const { sequelize } = require('../models');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    console.log('Starting migrations...');
    
    // Create migrations table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        name VARCHAR(255) PRIMARY KEY,
        run_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.js'));
    
    // Get already run migrations
    const [completedMigrations] = await sequelize.query('SELECT name FROM migrations');
    const completedNames = completedMigrations.map(m => m.name);
    
    // Run pending migrations
    for (const file of migrationFiles) {
      if (!completedNames.includes(file)) {
        console.log(`Running migration: ${file}`);
        
        const migration = require(path.join(migrationsDir, file));
        await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
        
        // Record the migration
        await sequelize.query('INSERT INTO migrations (name) VALUES (?)', {
          replacements: [file]
        });
        
        console.log(`✓ Completed migration: ${file}`);
      } else {
        console.log(`✓ Migration already run: ${file}`);
      }
    }
    
    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run migrations
runMigrations();