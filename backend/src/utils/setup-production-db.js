#!/usr/bin/env node

const { Client } = require('pg');
require('dotenv').config();

const setupDatabase = async () => {
  const dbName = process.env.DB_NAME || 'saiens_credit_production';
  const dbUser = process.env.DB_USER || 'saiens_credit';
  const dbPassword = process.env.DB_PASSWORD || '32fabdd45cab!';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || 5432;

  console.log('🔧 Setting up production database...');
  console.log(`Database: ${dbName}`);
  console.log(`User: ${dbUser}`);
  console.log(`Host: ${dbHost}:${dbPort}`);

  // Connect to PostgreSQL server (not specific database)
  const adminClient = new Client({
    user: 'postgres', // Default postgres superuser
    host: dbHost,
    database: 'postgres', // Connect to default database
    password: process.env.POSTGRES_PASSWORD || '', // Will need postgres password
    port: dbPort,
  });

  try {
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL server');

    // Create database if it doesn't exist
    try {
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully`);
    } catch (error) {
      if (error.code === '42P04') {
        console.log(`✅ Database "${dbName}" already exists`);
      } else {
        throw error;
      }
    }

    // Create user if it doesn't exist
    try {
      await adminClient.query(`CREATE USER "${dbUser}" WITH PASSWORD '${dbPassword}'`);
      console.log(`✅ User "${dbUser}" created successfully`);
    } catch (error) {
      if (error.code === '42710') {
        console.log(`✅ User "${dbUser}" already exists`);
      } else {
        throw error;
      }
    }

    // Grant privileges
    await adminClient.query(`GRANT ALL PRIVILEGES ON DATABASE "${dbName}" TO "${dbUser}"`);
    console.log(`✅ Granted privileges to user "${dbUser}"`);

    await adminClient.end();

    // Test connection with new user
    const testClient = new Client({
      user: dbUser,
      host: dbHost,
      database: dbName,
      password: dbPassword,
      port: dbPort,
    });

    await testClient.connect();
    console.log('✅ Test connection successful with new user');
    await testClient.end();

    console.log('🎉 Database setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Run migrations: npm run migrate');
    console.log('2. Seed database: npm run seed');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\nMake sure:');
    console.error('1. PostgreSQL is running');
    console.error('2. You have the correct postgres superuser password');
    console.error('3. Set POSTGRES_PASSWORD environment variable if needed');
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;