module.exports = (sequelize, DataTypes) => {
  const JobSkill = sequelize.define('JobSkill', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    jobId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'jobs',
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
    }
  }, {
    timestamps: true,
    tableName: 'job_skills',
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['jobId', 'skillId']
      },
      {
        fields: ['jobId']
      },
      {
        fields: ['skillId']
      }
    ]
  });
  
  return JobSkill;
};