const { Sequelize } = require('sequelize');
const dbConfig = require('../config/db.config');

// Get environment configuration
const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

// Create Sequelize instance
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: config.logging,
    dialectOptions: config.dialectOptions
  }
);

// Initialize models object
const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./user.model')(sequelize, Sequelize);
db.Credit = require('./credit.model')(sequelize, Sequelize);
db.Department = require('./department.model')(sequelize, Sequelize);
db.Job = require('./job.model')(sequelize, Sequelize);

// Define associations using explicit foreign key
db.User.belongsTo(db.Department, { foreignKey: 'departmentId' });
db.Department.hasMany(db.User, { foreignKey: 'departmentId' });

db.User.belongsTo(db.Job, { foreignKey: 'jobId' });
db.Job.hasMany(db.User, { foreignKey: 'jobId' });

db.Credit.belongsTo(db.User, { as: 'sender', foreignKey: 'senderId' });
db.Credit.belongsTo(db.User, { as: 'receiver', foreignKey: 'receiverId' });

db.User.hasMany(db.Credit, { as: 'sentCredits', foreignKey: 'senderId' });
db.User.hasMany(db.Credit, { as: 'receivedCredits', foreignKey: 'receiverId' });

module.exports = db;