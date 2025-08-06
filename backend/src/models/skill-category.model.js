module.exports = (sequelize, DataTypes) => {
  const SkillCategory = sequelize.define('SkillCategory', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Category name like: 山恩DNA, 產品知識, 工具使用, etc.'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional description of the skill category'
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Hex color code for UI theming (e.g., #3B82F6)'
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Icon name or code for UI display'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Sort order for display purposes'
    }
  }, {
    timestamps: true,
    tableName: 'skill_categories',
    paranoid: true,
    indexes: [
      {
        fields: ['name'],
        unique: true
      },
      {
        fields: ['sortOrder']
      }
    ]
  });
  
  return SkillCategory;
};