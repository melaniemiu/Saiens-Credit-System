const { User, Credit, Department, Job, UserSkill, JobSkill, Skill } = require("../models");
const { Op } = require("sequelize");

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
      'jobTitle': 'Job.name',
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
    
    // Special handling for department and job sorting
    if (sortField === 'department') {
      orderClause = [[{ model: Department }, 'name', sortOrder]];
    } else if (sortField === 'jobTitle') {
      orderClause = [[{ model: Job }, 'name', sortOrder]];
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
        {
          model: Job,
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
      job: user.Job,
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

    // Validate required fields
    if (!name || !email || !employeeId || !departmentId) {
      return res.status(400).json({
        message: "All required fields must be provided (name, email, employeeId, departmentId)",
      });
    }

    // Check if department exists
    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(400).json({
        message: "Invalid department selected",
      });
    }

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
    const { name, email, employeeId, role, departmentId, jobId } = req.body;

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

    // Validate job assignment if provided
    if (jobId) {
      const job = await Job.findByPk(jobId);
      if (!job) {
        return res.status(400).json({
          message: "Invalid job selected",
        });
      }
      
      // Optionally validate that job belongs to the same department
      if (departmentId && job.departmentId !== departmentId) {
        return res.status(400).json({
          message: "Selected job does not belong to the selected department",
        });
      }
    }

    // Update the user
    const updateData = {
      name,
      email,
      employeeId,
      role,
      departmentId,
    };

    // Only update jobId if it's provided (could be null to unassign)
    if (jobId !== undefined) {
      updateData.jobId = jobId || null;
    }

    await user.update(updateData);

    // Fetch the updated user with department and job
    const updatedUser = await User.findByPk(id, {
      include: [
        {
          model: Department,
          attributes: ["id", "name"],
        },
        {
          model: Job,
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

// Check if user can be promoted (all required skills for current job completed)
exports.checkUserPromotion = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Get user with current job
    const user = await User.findByPk(userId, {
      include: [
        {
          model: Job,
          include: [
            {
              model: Skill,
              as: 'skills',
              through: { 
                attributes: ['isRequired'],
                where: { isRequired: true } // Only check required skills
              }
            }
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.Job) {
      return res.status(400).json({ 
        message: "User has no assigned job",
        canPromote: false 
      });
    }

    // Check if current job has a next job
    const currentJob = await Job.findByPk(user.Job.id, {
      include: [
        {
          model: Job,
          as: 'NextJob',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!currentJob.nextJobId) {
      return res.status(200).json({ 
        message: "User is already at the highest job level",
        canPromote: false,
        isMaxLevel: true,
        currentJob: {
          id: currentJob.id,
          name: currentJob.name
        }
      });
    }

    // Get required skills for current job
    const requiredSkills = user.Job.skills || [];
    
    if (requiredSkills.length === 0) {
      return res.status(200).json({
        canPromote: true,
        message: "No required skills for current job",
        nextJob: currentJob.NextJob,
        completedSkills: [],
        requiredSkills: []
      });
    }

    // Get user's completed skills (status = 'completed' or 'certified')
    const userSkills = await UserSkill.findAll({
      where: {
        userId: userId,
        skillId: { [Op.in]: requiredSkills.map(skill => skill.id) },
        status: { [Op.in]: ['completed', 'certified'] }
      },
      include: [
        {
          model: Skill,
          attributes: ['id', 'name', 'category']
        }
      ]
    });

    const completedSkillIds = userSkills.map(us => us.skillId);
    const requiredSkillIds = requiredSkills.map(skill => skill.id);
    
    const canPromote = requiredSkillIds.every(skillId => completedSkillIds.includes(skillId));

    return res.status(200).json({
      canPromote,
      nextJob: currentJob.NextJob,
      currentJob: {
        id: user.Job.id,
        name: user.Job.name
      },
      requiredSkills: requiredSkills.map(skill => ({
        id: skill.id,
        name: skill.name,
        category: skill.category,
        completed: completedSkillIds.includes(skill.id)
      })),
      completedSkills: userSkills.map(us => ({
        id: us.Skill.id,
        name: us.Skill.name,
        category: us.Skill.category,
        status: us.status,
        score: us.score
      }))
    });

  } catch (error) {
    next(error);
  }
};

// Promote user to next job level
exports.promoteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Get user with current job
    const user = await User.findByPk(userId, {
      include: [{ model: Job }]
    });

    if (!user || !user.Job) {
      return res.status(404).json({ message: "User or job not found" });
    }

    // Get current job with next job info
    const currentJob = await Job.findByPk(user.Job.id);
    
    if (!currentJob.nextJobId) {
      return res.status(400).json({ message: "No next job level available" });
    }

    // Check if all required skills are completed
    const requiredSkills = await JobSkill.findAll({
      where: {
        jobId: user.Job.id,
        isRequired: true
      }
    });

    const userCompletedSkills = await UserSkill.findAll({
      where: {
        userId: userId,
        skillId: { [Op.in]: requiredSkills.map(js => js.skillId) },
        status: { [Op.in]: ['completed', 'certified'] }
      }
    });

    if (userCompletedSkills.length < requiredSkills.length) {
      return res.status(400).json({ 
        message: "User has not completed all required skills for current job level",
        missingSkills: requiredSkills.length - userCompletedSkills.length
      });
    }

    // Promote user to next job
    await user.update({ jobId: currentJob.nextJobId });

    // Get the new job info
    const nextJob = await Job.findByPk(currentJob.nextJobId, {
      include: [{ model: Department, attributes: ['id', 'name'] }]
    });

    // Emit socket notification to the promoted user
    const io = req.app.get('io');
    if (io) {
      const promotionData = {
        id: `${user.id}-${Date.now()}`, // Unique promotion ID for confetti tracking
        userId: user.id,
        userName: user.name,
        employeeId: user.employeeId,
        previousJob: user.Job.name,
        newJob: nextJob.name,
        department: nextJob.Department?.name,
        promotedAt: new Date().toISOString()
      };
      
      console.log(`🚀 [PROMOTION] Emitting promotion notification to user-${user.id}`);
      io.to(`user-${user.id}`).emit('user-promoted', promotionData);
    }

    return res.status(200).json({
      message: "User promoted successfully",
      user: {
        id: user.id,
        name: user.name,
        employeeId: user.employeeId,
        previousJob: user.Job.name,
        newJob: nextJob.name,
        department: nextJob.Department?.name
      }
    });

  } catch (error) {
    next(error);
  }
};

// Get jobs for a department
exports.getJobsForDepartment = async (req, res, next) => {
  try {
    const { departmentId } = req.params;

    if (!departmentId || departmentId === 'all') {
      // Return all jobs if no specific department
      const jobs = await Job.findAll({
        include: [
          {
            model: Department,
            attributes: ['id', 'name']
          }
        ],
        order: [['level', 'ASC'], ['name', 'ASC']]
      });

      return res.status(200).json({
        jobs: jobs.map(job => ({
          id: job.id,
          name: job.name,
          level: job.level,
          department: job.Department
        }))
      });
    }

    // Get jobs for specific department
    const jobs = await Job.findAll({
      where: { departmentId },
      include: [
        {
          model: Department,
          attributes: ['id', 'name']
        }
      ],
      order: [['level', 'ASC'], ['name', 'ASC']]
    });

    return res.status(200).json({
      jobs: jobs.map(job => ({
        id: job.id,
        name: job.name,
        level: job.level,
        department: job.Department
      }))
    });
  } catch (error) {
    next(error);
  }
};
