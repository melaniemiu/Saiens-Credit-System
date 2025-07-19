const { Credit, User, Department } = require("../models");
const { Op } = require("sequelize");

// Give credit to another user
exports.giveCredit = async (req, res, next) => {
  try {
    const { receiverId, reason } = req.body;
    const senderId = req.userId; // Set by auth middleware

    // Check if sender and receiver are the same
    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ message: "You cannot give credit to yourself" });
    }

    // Get sender with department
    const sender = await User.findByPk(senderId, {
      include: [{ model: Department, attributes: ['id', 'name'] }]
    });

    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    // Check daily credit limit
    await sender.checkAndResetDailyCredits();

    if (sender.remainingDailyCredits <= 0) {
      return res.status(403).json({
        message: "Daily credit limit reached",
        resetDate: sender.dailyCreditResetDate,
      });
    }

    // Check if receiver exists
    const receiver = await User.findByPk(receiverId);

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found" });
    }

    // Create credit
    const credit = await Credit.create({
      senderId,
      receiverId,
      reason,
      status: "approved", // Auto-approve
      approvedAt: new Date(),
    });

    // Update sender's remaining credits and credits sent
    sender.remainingDailyCredits -= 1;
    sender.creditsSent += 1;
    await sender.save();

    // Update receiver's credits received
    receiver.creditsReceived += 1;
    await receiver.save();

    // Emit socket notification to receiver
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${receiverId}`).emit('credit-received', {
        id: credit.id,
        senderId: sender.id,
        senderName: sender.name,
        senderDepartment: sender.Department?.name,
        reason: credit.reason,
        createdAt: credit.createdAt
      });
    }

    // Return the created credit
    return res.status(201).json({
      message: "Credit given successfully",
      credit: {
        id: credit.id,
        reason: credit.reason,
        createdAt: credit.createdAt,
        status: credit.status,
        sender: {
          id: sender.id,
          name: sender.name,
          employeeId: sender.employeeId,
        },
        receiver: {
          id: receiver.id,
          name: receiver.name,
          employeeId: receiver.employeeId,
        },
      },
      remainingCredits: sender.remainingDailyCredits,
    });
  } catch (error) {
    next(error);
  }
};

// Give credit to multiple users (bulk operation) - only counts as 1 daily credit
exports.giveBulkCredit = async (req, res, next) => {
  try {
    const { receiverIds, reason } = req.body;
    const senderId = req.userId; // Set by auth middleware

    // Validate input
    if (!Array.isArray(receiverIds) || receiverIds.length === 0) {
      return res
        .status(400)
        .json({ message: "Please provide at least one receiver" });
    }

    // Check if sender is giving credit to themselves
    if (receiverIds.includes(senderId)) {
      return res
        .status(400)
        .json({ message: "You cannot give credit to yourself" });
    }

    // Get sender with department
    const sender = await User.findByPk(senderId, {
      include: [{ model: Department, attributes: ['id', 'name'] }]
    });

    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    // Check daily credit limit (only check for 1 credit)
    await sender.checkAndResetDailyCredits();

    if (sender.remainingDailyCredits <= 0) {
      return res.status(403).json({
        message: "Daily credit limit reached",
        resetDate: sender.dailyCreditResetDate,
      });
    }

    // Check if all receivers exist
    const receivers = await User.findAll({
      where: { id: receiverIds },
    });

    if (receivers.length !== receiverIds.length) {
      return res
        .status(400)
        .json({ message: "One or more receivers not found" });
    }

    // Create credits for all receivers
    const creditPromises = receivers.map((receiver) =>
      Credit.create({
        senderId,
        receiverId: receiver.id,
        reason,
        status: "approved",
        approvedAt: new Date(),
      })
    );

    const credits = await Promise.all(creditPromises);

    // Update sender's remaining credits and credits sent (only deduct 1)
    sender.remainingDailyCredits -= 1;
    sender.creditsSent += credits.length; // Increase by number of credits sent
    await sender.save();

    // Update each receiver's credits received and emit notifications
    const io = req.app.get('io');
    for (let i = 0; i < receivers.length; i++) {
      const receiver = receivers[i];
      const credit = credits[i];
      
      receiver.creditsReceived += 1;
      await receiver.save();
      
      // Emit socket notification to each receiver
      if (io) {
        io.to(`user-${receiver.id}`).emit('credit-received', {
          id: credit.id,
          senderId: sender.id,
          senderName: sender.name,
          senderDepartment: sender.Department?.name,
          reason: credit.reason,
          createdAt: credit.createdAt
        });
      }
    }

    // Return the created credits
    return res.status(201).json({
      message: `Credit given successfully to ${receivers.length} recipients`,
      creditsCreated: credits.length,
      remainingCredits: sender.remainingDailyCredits,
      credits: credits.map((credit) => ({
        id: credit.id,
        reason: credit.reason,
        createdAt: credit.createdAt,
        status: credit.status,
        sender: {
          id: sender.id,
          name: sender.name,
          employeeId: sender.employeeId,
        },
        receiver: {
          id: receivers.find((r) => r.id === credit.receiverId).id,
          name: receivers.find((r) => r.id === credit.receiverId).name,
          employeeId: receivers.find((r) => r.id === credit.receiverId)
            .employeeId,
        },
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Get credits received by user
exports.getReceivedCredits = async (req, res, next) => {
  try {
    const userId = req.userId; // Set by auth middleware
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: credits } = await Credit.findAndCountAll({
      where: {
        receiverId: userId,
        status: "approved",
      },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "name", "employeeId", "profilePicture"],
          include: [
            {
              model: Department,
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    return res.status(200).json({
      totalItems: count,
      credits,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    next(error);
  }
};

// Get credits sent by user
exports.getSentCredits = async (req, res, next) => {
  try {
    const userId = req.userId; // Set by auth middleware
    const { page = 1, limit = 10 } = req.query;

    const offset = (page - 1) * limit;

    const { count, rows: credits } = await Credit.findAndCountAll({
      where: {
        senderId: userId,
        status: "approved",
      },
      include: [
        {
          model: User,
          as: "receiver",
          attributes: ["id", "name", "employeeId", "profilePicture"],
          include: [
            {
              model: Department,
              attributes: ["id", "name"],
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    return res.status(200).json({
      totalItems: count,
      credits,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all credits
exports.getAllCredits = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      departmentId,
      startDate,
      endDate,
      searchTerm,
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;
    const whereClause = { status: "approved" };

    // Add date filters if provided
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereClause.createdAt = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      whereClause.createdAt = { [Op.lte]: new Date(endDate) };
    }

    // Create include clauses for sender and receiver
    const includeClause = [
      {
        model: User,
        as: "sender",
        attributes: ["id", "name", "employeeId", "profilePicture"],
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
        attributes: ["id", "name", "employeeId", "profilePicture"],
        include: [
          {
            model: Department,
            attributes: ["id", "name"],
          },
        ],
      },
    ];

    // Add department filter if provided
    if (departmentId) {
      includeClause[0].include[0].where = { id: departmentId };
      includeClause[1].include[0].where = { id: departmentId };
    }

    // Add search filter if provided
    if (searchTerm) {
      whereClause[Op.or] = [{ reason: { [Op.iLike]: `%${searchTerm}%` } }];
    }

    const { count, rows: credits } = await Credit.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    return res.status(200).json({
      totalItems: count,
      credits,
      totalPages: Math.ceil(count / limitNum),
      currentPage: pageNum,
    });
  } catch (error) {
    next(error);
  }
};
