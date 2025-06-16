module.exports = (sequelize, DataTypes) => {
  const SkillDepartment = sequelize.define('SkillDepartment', {
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
      }
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'departments',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    tableName: 'skill_departments',
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['skillId', 'departmentId']
      },
      {
        fields: ['skillId']
      },
      {
        fields: ['departmentId']
      }
    ]
  });
  
  return SkillDepartment;
};