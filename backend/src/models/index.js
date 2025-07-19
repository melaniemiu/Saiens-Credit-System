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
db.SkillCategory = require('./skill-category.model')(sequelize, Sequelize);
db.Skill = require('./skill.model')(sequelize, Sequelize);
db.JobSkill = require('./job-skill.model')(sequelize, Sequelize);
db.UserSkill = require('./user-skill.model')(sequelize, Sequelize);
db.SkillDepartment = require('./skill-department.model')(sequelize, Sequelize);
db.SkillPrerequisite = require('./skill-prerequisite.model')(sequelize, Sequelize);

// Define associations using explicit foreign key
db.User.belongsTo(db.Department, { foreignKey: 'departmentId' });
db.Department.hasMany(db.User, { foreignKey: 'departmentId' });

db.User.belongsTo(db.Job, { foreignKey: 'jobId' });
db.Job.hasMany(db.User, { foreignKey: 'jobId' });

// Job belongs to Department
db.Job.belongsTo(db.Department, { foreignKey: 'departmentId' });
db.Department.hasMany(db.Job, { foreignKey: 'departmentId' });

// Job self-association for hierarchy (nextJobId)
db.Job.belongsTo(db.Job, { as: 'NextJob', foreignKey: 'nextJobId' });
db.Job.hasMany(db.Job, { as: 'PreviousJobs', foreignKey: 'nextJobId' });

db.Credit.belongsTo(db.User, { as: 'sender', foreignKey: 'senderId' });
db.Credit.belongsTo(db.User, { as: 'receiver', foreignKey: 'receiverId' });

db.User.hasMany(db.Credit, { as: 'sentCredits', foreignKey: 'senderId' });
db.User.hasMany(db.Credit, { as: 'receivedCredits', foreignKey: 'receiverId' });

// SkillCategory and Skill associations
db.Skill.belongsTo(db.SkillCategory, { foreignKey: 'categoryId', as: 'category' });
db.SkillCategory.hasMany(db.Skill, { foreignKey: 'categoryId', as: 'skills' });

// Job and Skill many-to-many relationship through JobSkill
db.Job.belongsToMany(db.Skill, { 
  through: db.JobSkill, 
  foreignKey: 'jobId',
  otherKey: 'skillId',
  as: 'skills'
});
db.Skill.belongsToMany(db.Job, { 
  through: db.JobSkill, 
  foreignKey: 'skillId',
  otherKey: 'jobId',
  as: 'jobs'
});

// Direct associations for JobSkill
db.JobSkill.belongsTo(db.Job, { foreignKey: 'jobId' });
db.JobSkill.belongsTo(db.Skill, { foreignKey: 'skillId' });
db.Job.hasMany(db.JobSkill, { foreignKey: 'jobId' });
db.Skill.hasMany(db.JobSkill, { foreignKey: 'skillId' });

// User and Skill many-to-many relationship through UserSkill
db.User.belongsToMany(db.Skill, { 
  through: db.UserSkill, 
  foreignKey: 'userId',
  otherKey: 'skillId',
  as: 'skills'
});
db.Skill.belongsToMany(db.User, { 
  through: db.UserSkill, 
  foreignKey: 'skillId',
  otherKey: 'userId',
  as: 'users'
});

// Direct associations for UserSkill
db.UserSkill.belongsTo(db.User, { foreignKey: 'userId' });
db.UserSkill.belongsTo(db.Skill, { foreignKey: 'skillId' });
db.UserSkill.belongsTo(db.User, { as: 'certifier', foreignKey: 'certifiedBy' });
db.UserSkill.belongsTo(db.User, { as: 'evaluator', foreignKey: 'evaluatedBy' });
db.User.hasMany(db.UserSkill, { foreignKey: 'userId' });
db.User.hasMany(db.UserSkill, { as: 'certifiedSkills', foreignKey: 'certifiedBy' });
db.User.hasMany(db.UserSkill, { as: 'evaluatedSkills', foreignKey: 'evaluatedBy' });
db.Skill.hasMany(db.UserSkill, { foreignKey: 'skillId' });

// Department and Skill many-to-many relationship through SkillDepartment
db.Department.belongsToMany(db.Skill, { 
  through: db.SkillDepartment, 
  foreignKey: 'departmentId',
  otherKey: 'skillId',
  as: 'skills'
});
db.Skill.belongsToMany(db.Department, { 
  through: db.SkillDepartment, 
  foreignKey: 'skillId',
  otherKey: 'departmentId',
  as: 'departments'
});

// Direct associations for SkillDepartment
db.SkillDepartment.belongsTo(db.Department, { foreignKey: 'departmentId' });
db.SkillDepartment.belongsTo(db.Skill, { foreignKey: 'skillId' });
db.Department.hasMany(db.SkillDepartment, { foreignKey: 'departmentId' });
db.Skill.hasMany(db.SkillDepartment, { foreignKey: 'skillId' });

// Skill prerequisites self-referential many-to-many relationship through SkillPrerequisite
db.Skill.belongsToMany(db.Skill, {
  through: db.SkillPrerequisite,
  as: 'prerequisites',
  foreignKey: 'skillId',
  otherKey: 'prerequisiteSkillId'
});
db.Skill.belongsToMany(db.Skill, {
  through: db.SkillPrerequisite,
  as: 'dependentSkills',
  foreignKey: 'prerequisiteSkillId',
  otherKey: 'skillId'
});

// Direct associations for SkillPrerequisite
db.SkillPrerequisite.belongsTo(db.Skill, { as: 'skill', foreignKey: 'skillId' });
db.SkillPrerequisite.belongsTo(db.Skill, { as: 'prerequisiteSkill', foreignKey: 'prerequisiteSkillId' });
db.Skill.hasMany(db.SkillPrerequisite, { as: 'skillPrerequisites', foreignKey: 'skillId' });
db.Skill.hasMany(db.SkillPrerequisite, { as: 'prerequisiteFor', foreignKey: 'prerequisiteSkillId' });

module.exports = db;