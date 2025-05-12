module.exports = (sequelize, DataTypes) => {
  const Credit = sequelize.define('Credit', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: "Reason cannot be empty"
        },
        len: {
          args: [3, 500],
          msg: "Reason must be between 3 and 500 characters"
        }
      }
    },
    // senderId and receiverId will be foreign keys to User model
    // These are defined in the associations in index.js
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'approved' // Auto-approve by default
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true
      // This would reference an admin user who approved, if needed
    }
  }, {
    // Options
    timestamps: true,
    tableName: 'credits',
    paranoid: true // Soft deletes
  });
  
  return Credit;
};