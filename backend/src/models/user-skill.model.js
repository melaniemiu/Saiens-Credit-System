module.exports = (sequelize, DataTypes) => {
  const UserSkill = sequelize.define('UserSkill', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    skillId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'skills',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed', 'certified'),
      allowNull: false,
      defaultValue: 'not_started',
      comment: 'Skill learning status: not_started, in_progress, completed, certified'
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the user started learning this skill'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the user completed learning this skill'
    },
    certifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the user passed the certification/assessment'
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Score achieved in assessment (0-100)'
    },
    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of assessment attempts made'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Additional notes about the learning progress'
    },
    certifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'ID of the user who certified this skill (supervisor/admin)'
    }
  }, {
    timestamps: true,
    tableName: 'user_skills',
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'skillId']
      },
      {
        fields: ['userId']
      },
      {
        fields: ['skillId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['certifiedAt']
      }
    ]
  });
  
  return UserSkill;
};