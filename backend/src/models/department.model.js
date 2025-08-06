module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define('Department', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    // Options
    timestamps: true,
    tableName: 'departments',
    paranoid: true // Soft deletes
  });
  
  return Department;
};