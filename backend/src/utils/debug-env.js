#!/usr/bin/env node

require('dotenv').config();

console.log('🔍 Environment Debug Information:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD exists:', !!process.env.DB_PASSWORD);
console.log('DB_PASSWORD length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);
console.log('DB_PASSWORD type:', typeof process.env.DB_PASSWORD);
console.log('DB_NAME:', process.env.DB_NAME);

// Test password string conversion
if (process.env.DB_PASSWORD) {
  console.log('Password as string:', String(process.env.DB_PASSWORD));
  console.log('Password string length:', String(process.env.DB_PASSWORD).length);
}

// Show current working directory and .env file existence
console.log('Current working directory:', process.cwd());
console.log('.env file exists:', require('fs').existsSync('.env'));

// Show database config
const config = require('../config/db.config.js');
console.log('Database config for production:');
console.log({
  username: config.production.username,
  password: config.production.password ? '[REDACTED]' : 'undefined',
  database: config.production.database,
  host: config.production.host,
  port: config.production.port
});