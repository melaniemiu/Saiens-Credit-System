module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    employeeId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lineUserId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('admin', 'user'),
      defaultValue: 'user'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    DepartmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id'
      }
    },
    creditsReceived: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    creditsGiven: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    remainingDailyCredits: {
      type: DataTypes.INTEGER,
      defaultValue: 5 // Default daily credit limit
    },
    dailyCreditResetDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    // Options
    timestamps: true,
    tableName: 'users',
    paranoid: true // Soft deletes
  });

  // Instance methods
  User.prototype.resetDailyCredits = function() {
    this.remainingDailyCredits = process.env.DAILY_CREDIT_LIMIT || 5;
    this.dailyCreditResetDate = new Date();
    return this.save();
  };

  // Check if daily credits should be reset
  User.prototype.checkAndResetDailyCredits = function() {
    if (!this.dailyCreditResetDate) {
      return this.resetDailyCredits();
    }

    const now = new Date();
    const resetDate = new Date(this.dailyCreditResetDate);
    
    // If it's a new day, reset credits
    if (now.getDate() !== resetDate.getDate() || 
        now.getMonth() !== resetDate.getMonth() || 
        now.getFullYear() !== resetDate.getFullYear()) {
      return this.resetDailyCredits();
    }

    return Promise.resolve(this);
  };

  return User;
};