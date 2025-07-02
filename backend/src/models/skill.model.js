module.exports = (sequelize, DataTypes) => {
  const Skill = sequelize.define('Skill', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Category like: 山恩DNA, 產品知識, 工具使用, etc.'
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Whether this skill is required (必修) or optional (選修)'
    },
    learningMethod: {
      type: DataTypes.ENUM('實體', '線上'),
      allowNull: false,
      comment: 'Learning method: 實體 (physical) or 線上 (online)'
    },
    assessmentMethod: {
      type: DataTypes.ENUM('考卷考核', '實作考核'),
      allowNull: false,
      comment: 'Assessment method: 考卷考核 (exam) or 實作考核 (practical)'
    },
    syllabus: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Exam outline/syllabus content for the skill (考試大綱)'
    }
  }, {
    timestamps: true,
    tableName: 'skills',
    paranoid: true,
    indexes: [
      {
        fields: ['category']
      },
      {
        fields: ['isRequired']
      }
    ]
  });
  
  return Skill;
};