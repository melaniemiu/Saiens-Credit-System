const { User, Credit, Department } = require("../models");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");

// Get all users with filtering and pagination
exports.getUsers = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      departmentId, 
      role,
      sortField = 'createdAt',
      sortOrder = 'DESC' 
    } = req.query;
    const offset = (page - 1) * limit;
    
    console.log('Sorting params:', { sortField, sortOrder });  // Debug log

    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { employeeId: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (departmentId && departmentId !== "all") {
      where.departmentId = departmentId;
    }

    if (role && role !== "all") {
      where.role = role;
    }

    // Map frontend sort fields to database fields
    const sortFieldMap = {
      'department': 'Department.name',
      'creditsSent': 'creditsSent',
      'creditsReceived': 'creditsReceived',
      'name': 'name',
      'employeeId': 'employeeId',
      'role': 'role',
      'remainingDailyCredits': 'remainingDailyCredits',
      'lastLogin': 'lastLogin',
      'createdAt': 'createdAt'
    };

    // Build the order clause
    let orderClause;
    
    // Special handling for department sorting
    if (sortField === 'department') {
      orderClause = [[{ model: Department }, 'name', sortOrder]];
    } else {
      const mappedField = sortFieldMap[sortField] || 'createdAt';
      orderClause = [[mappedField, sortOrder]];
    }
    
    console.log('Order clause:', JSON.stringify(orderClause));  // Debug log

    const { count, rows: users } = await User.findAndCountAll({
      where,
      include: [
        {
          model: Department,
          attributes: ["id", "name"],
        },
      ],
      attributes: [
        "id",
        "employeeId",
        "name",
        "email",
        "profilePicture",
        "role",
        "creditsReceived",
        "creditsSent",
        "remainingDailyCredits",
        "createdAt",
        "lastLogin",
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Transform the data to include totalCreditsReceived and totalCreditsSent
    const transformedUsers = users.map((user) => ({
      ...user.toJSON(),
      totalCreditsReceived: user.creditsReceived,
      totalCreditsSent: user.creditsSent,
      department: user.Department,
    }));

    return res.status(200).json({
      users: transformedUsers,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalCount: count,
    });
  } catch (error) {
    next(error);
  }
};

// Create a new user
exports.createUser = async (req, res, next) => {
  try {
    const { name, email, employeeId, role, departmentId } = req.body;

    console.log("Creating user with data:", {
      name,
      email,
      employeeId,
      role,
      departmentId,
    });

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { employeeId }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          existingUser.email === email
            ? "Email already exists"
            : "Employee ID already exists",
      });
    }

    // Create the user
    const user = await User.create({
      name,
      email,
      employeeId,
      role: role || "user",
      departmentId,
      remainingDailyCredits: process.env.DAILY_CREDIT_LIMIT || 5,
      dailyCreditResetDate: new Date(),
    });

    // Fetch the created user with department
    const createdUser = await User.findByPk(user.id, {
      include: [
        {
          model: Department,
          attributes: ["id", "name"],
        },
      ],
    });

    return res.status(201).json({
      message: "User created successfully",
      user: createdUser,
    });
  } catch (error) {
    next(error);
  }
};

// Update a user
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, employeeId, role, departmentId } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if email or employeeId are being changed to existing values
    if (email !== user.email || employeeId !== user.employeeId) {
      const existingUser = await User.findOne({
        where: {
          [Op.and]: [
            {
              [Op.or]: [
                { email: email || "" },
                { employeeId: employeeId || "" },
              ],
            },
            { id: { [Op.ne]: id } },
          ],
        },
      });

      if (existingUser) {
        return res.status(400).json({
          message:
            existingUser.email === email
              ? "Email already exists"
              : "Employee ID already exists",
        });
      }
    }

    // Update the user
    await user.update({
      name,
      email,
      employeeId,
      role,
      departmentId,
    });

    // Fetch the updated user with department
    const updatedUser = await User.findByPk(id, {
      include: [
        {
          model: Department,
          attributes: ["id", "name"],
        },
      ],
    });

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a user
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Don't allow deleting yourself
    if (user.id === req.userId) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    await user.destroy();

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Get all credits with filtering and pagination
exports.getCredits = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      departmentId,
      startDate,
      endDate,
      sortField = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate + " 23:59:59");
      }
    }

    // For search, we need to search in related user tables
    const include = [
      {
        model: User,
        as: "sender",
        attributes: ["id", "name", "employeeId"],
        paranoid: false, // Include soft-deleted users
        include: [
          {
            model: Department,
            attributes: ["id", "name"],
          },
        ],
      },
      {
        model: User,
        as: "receiver",
        attributes: ["id", "name", "employeeId"],
        paranoid: false, // Include soft-deleted users
        include: [
          {
            model: Department,
            attributes: ["id", "name"],
          },
        ],
      },
    ];

    if (departmentId && departmentId !== "all") {
      include[0].where = { departmentId };
      include[1].where = { departmentId };
    }

    if (search) {
      const searchCondition = {
        [Op.or]: [
          { "$sender.name$": { [Op.iLike]: `%${search}%` } },
          { "$receiver.name$": { [Op.iLike]: `%${search}%` } },
          { reason: { [Op.iLike]: `%${search}%` } },
        ],
      };
      where[Op.and] = where[Op.and]
        ? [...where[Op.and], searchCondition]
        : [searchCondition];
    }

    // First, count without includes
    const count = await Credit.count({
      where,
    });

    // Map frontend sort fields to database fields for credits
    const creditSortFieldMap = {
      'createdAt': 'createdAt',
      'sender': ['sender', 'name'],
      'receiver': ['receiver', 'name']
    };

    let orderClause = [[creditSortFieldMap[sortField] || 'createdAt', sortOrder]];
    
    // Special handling for sender and receiver sorting
    if (sortField === 'sender') {
      orderClause = [[{ model: User, as: 'sender' }, 'name', sortOrder]];
    } else if (sortField === 'receiver') {
      orderClause = [[{ model: User, as: 'receiver' }, 'name', sortOrder]];
    }

    // Then find with includes
    const credits = await Credit.findAll({
      where,
      include,
      order: orderClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Transform the data to match expected format
    const transformedCredits = credits.map((credit) => ({
      id: credit.id,
      reason: credit.reason,
      createdAt: credit.createdAt,
      sender: credit.sender
        ? {
            id: credit.sender.id,
            name: credit.sender.name,
            employeeId: credit.sender.employeeId,
            department: {
              name: credit.sender.Department
                ? credit.sender.Department.name
                : "Unknown",
            },
          }
        : {
            id: null,
            name: "Deleted User",
            employeeId: "N/A",
            department: {
              name: "Unknown",
            },
          },
      receiver: credit.receiver
        ? {
            id: credit.receiver.id,
            name: credit.receiver.name,
            employeeId: credit.receiver.employeeId,
            department: {
              name: credit.receiver.Department
                ? credit.receiver.Department.name
                : "Unknown",
            },
          }
        : {
            id: null,
            name: "Deleted User",
            employeeId: "N/A",
            department: {
              name: "Unknown",
            },
          },
    }));

    return res.status(200).json({
      credits: transformedCredits,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalCount: count,
    });
  } catch (error) {
    next(error);
  }
};

// Export credits to CSV
exports.exportCredits = async (req, res, next) => {
  try {
    const { search, departmentId, startDate, endDate } = req.query;

    const where = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate + " 23:59:59");
      }
    }

    const include = [
      {
        model: User,
        as: "sender",
        attributes: ["id", "name", "employeeId"],
        include: [
          {
            model: Department,
            attributes: ["id", "name"],
          },
        ],
      },
      {
        model: User,
        as: "receiver",
        attributes: ["id", "name", "employeeId"],
        include: [
          {
            model: Department,
            attributes: ["id", "name"],
          },
        ],
      },
    ];

    if (departmentId && departmentId !== "all") {
      include[0].where = { departmentId };
      include[1].where = { departmentId };
    }

    if (search) {
      const searchCondition = {
        [Op.or]: [
          { "$sender.name$": { [Op.iLike]: `%${search}%` } },
          { "$receiver.name$": { [Op.iLike]: `%${search}%` } },
          { reason: { [Op.iLike]: `%${search}%` } },
        ],
      };
      where[Op.and] = where[Op.and]
        ? [...where[Op.and], searchCondition]
        : [searchCondition];
    }

    const credits = await Credit.findAll({
      where,
      include,
      order: [["createdAt", "DESC"]],
    });

    // Create CSV content
    let csv =
      "時間,發送者姓名,發送者工號,發送者部門,接收者姓名,接收者工號,接收者部門,原因\n";

    credits.forEach((credit) => {
      const date = new Date(credit.createdAt).toLocaleString("zh-TW", {
        timeZone: "Asia/Taipei",
      });
      const row = [
        date,
        credit.sender ? credit.sender.name : "Deleted User",
        credit.sender ? credit.sender.employeeId : "N/A",
        credit.sender && credit.sender.Department
          ? credit.sender.Department.name
          : "Unknown",
        credit.receiver ? credit.receiver.name : "Deleted User",
        credit.receiver ? credit.receiver.employeeId : "N/A",
        credit.receiver && credit.receiver.Department
          ? credit.receiver.Department.name
          : "Unknown",
        credit.reason.replace(/"/g, '""'), // Escape quotes
      ];
      csv += row.map((field) => `"${field}"`).join(",") + "\n";
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=credits_export.csv"
    );

    // Send CSV data
    return res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
};
