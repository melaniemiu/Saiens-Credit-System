module.exports = (sequelize, DataTypes) => {
  const SkillPrerequisite = sequelize.define('SkillPrerequisite', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    skillId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'skills',
        key: 'id'
      },
      comment: 'The skill that has prerequisites'
    },
    prerequisiteSkillId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'skills',
        key: 'id'
      },
      comment: 'The skill that is required as a prerequisite'
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Whether this prerequisite is mandatory or optional'
    }
  }, {
    timestamps: true,
    tableName: 'skill_prerequisites',
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['skillId', 'prerequisiteSkillId'],
        name: 'skill_prerequisites_unique',
        where: {
          deletedAt: null
        }
      },
      {
        fields: ['skillId']
      },
      {
        fields: ['prerequisiteSkillId']
      }
    ]
  });

  return SkillPrerequisite;
};