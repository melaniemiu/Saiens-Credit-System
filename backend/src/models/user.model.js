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
    departmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'departmentId',
      references: {
        model: 'departments',
        key: 'id'
      }
    },
    jobId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'jobId',
      references: {
        model: 'jobs',
        key: 'id'
      }
    },
    creditsReceived: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    creditsSent: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    remainingDailyCredits: {
      type: DataTypes.INTEGER,
      defaultValue: 20 // Will be set from config in controllers
    },
    dailyCreditLimit: {
      type: DataTypes.INTEGER,
      defaultValue: 20, // Will be set from config in controllers
      allowNull: false
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
    // Use user's personal dailyCreditLimit instead of global env variable
    this.remainingDailyCredits = this.dailyCreditLimit;
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

  // Static method to get default daily credit limit from config
  User.getDefaultDailyCreditLimit = async function() {
    try {
      const { Config } = require('./index');
      return await Config.getConfigValue('default_daily_credit_limit', 20);
    } catch (error) {
      console.warn('Failed to get default daily credit limit from config, using fallback:', error.message);
      return 20;
    }
  };

  return User;
};