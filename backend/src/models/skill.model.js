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
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'skill_categories',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Foreign key reference to skill_categories table'
    },
    learningMethod: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Learning method from CSV data (flexible values)'
    },
    assessmentMethod: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Assessment method from CSV data (flexible values)'
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
        fields: ['categoryId']
      }
    ]
  });
  
  return Skill;
};