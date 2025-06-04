const jwt = require("jsonwebtoken");
const axios = require("axios");
const { User, Department, Job } = require("../models");

// LINE API endpoints from environment or fallback
const LINE_VERIFY_TOKEN_URL = process.env.LINE_VERIFY_TOKEN_URL || "https://api.line.me/oauth2/v2.1/verify";
const LINE_USER_PROFILE_URL = process.env.LINE_USER_PROFILE_URL || "https://api.line.me/v2/profile";

// Verify LINE token and authenticate user
exports.lineLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: "ID token is required" });
    }

    console.log("Received idToken length:", idToken.length);

    // Verify the token with LINE
    let verifyResponse;
    try {
      verifyResponse = await axios.post(LINE_VERIFY_TOKEN_URL, null, {
        params: {
          id_token: idToken,
          client_id: process.env.LINE_CHANNEL_ID,
        },
      });
    } catch (verifyError) {
      console.error("LINE token verification failed:", verifyError.response?.data || verifyError.message);

      // Handle common LINE API errors
      if (verifyError.response?.data?.error === 'invalid_request' &&
          verifyError.response?.data?.error_description?.includes('expired')) {
        return res.status(401).json({
          message: "LINE登入已過期",
          error: "token_expired",
          detail: "請重新登入LINE"
        });
      }

      // Other verification errors
      return res.status(401).json({
        message: "無法驗證LINE身份",
        error: verifyError.response?.data?.error || "verification_failed"
      });
    }

    const lineUserData = verifyResponse.data;

    // Log LINE user data for debugging and to get your LINE user ID
    console.log("\n\n=================== LINE USER DATA ===================");
    console.log("✅ LINE USER DATA:", JSON.stringify(lineUserData, null, 2));
    console.log("✅ USER ID (sub):", lineUserData.sub);
    console.log("✅ NAME:", lineUserData.name);
    console.log("✅ EMAIL:", lineUserData.email);
    console.log("✅ PICTURE:", lineUserData.picture);
    console.log("=======================================================\n\n");

    // Find or create user based on LINE user ID
    let user = await User.findOne({ 
      where: { lineUserId: lineUserData.sub },
      include: [
        {
          model: Department,
          attributes: ['id', 'name']
        },
        {
          model: Job,
          attributes: ['id', 'name']
        }
      ]
    });
    
    // Log user query result for debugging
    if (user) {
      console.log("Found user in database:", {
        id: user.id,
        name: user.name,
        jobId: user.jobId,
        Job: user.Job
      });
    }
    if (!user) {
      // This is a new user - look them up by email if available
      if (lineUserData.email) {
        user = await User.findOne({ 
          where: { email: lineUserData.email },
          include: [
            {
              model: Department,
              attributes: ['id', 'name']
            },
            {
              model: Job,
              attributes: ['id', 'name']
            }
          ]
        });
        
        // Log user query result for debugging
        if (user) {
          console.log("Found user by email in database:", {
            id: user.id,
            name: user.name,
            jobId: user.jobId,
            Job: user.Job
          });
        }
      }

      // If still no user, we need to notify that this is an unregistered user
      if (!user) {
        console.log("\n\n=================== USER NOT FOUND ===================");
        console.log("❌ No matching user found in database for LINE ID:", lineUserData.sub);
        console.log("📝 IMPORTANT: To register this user, update your seed.js file with this LINE ID");
        console.log("📝 Example:");
        console.log(`
        {
          employeeId: "EMP001",
          name: "王小明",
          email: "${lineUserData.email || 'user@example.com'}",
          lineUserId: "${lineUserData.sub}", // <-- Add this line with your LINE ID
          departmentId: deptMap["工程部"],
          role: "admin",
          remainingDailyCredits: 5,
          dailyCreditResetDate: new Date()
        }`);
        console.log("=======================================================\n\n");

        // Always return error for unregistered users - they need to use the binding page
        return res.status(403).json({
          message: "User not registered in the system",
          detail: "Please enter your employee ID to continue.",
          lineData: {
            userId: lineUserData.sub,
            name: lineUserData.name,
            email: lineUserData.email,
            picture: lineUserData.picture,
          },
        });
      }

      // Update the user with LINE user ID
      user.lineUserId = lineUserData.sub;
      user.profilePicture = lineUserData.picture || user.profilePicture;
      await user.save();
    }

    // Update profile picture and last login time
    user.profilePicture = lineUserData.picture || user.profilePicture;
    user.lastLogin = new Date();
    await user.save();

    // Check and reset daily credits if needed
    await user.checkAndResetDailyCredits();

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        employeeId: user.employeeId,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || "24h" }
    );

    // Return user data and token
    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        departmentId: user.departmentId,
        Department: user.Department ? {
          id: user.Department.id,
          name: user.Department.name
        } : null,
        jobId: user.jobId,
        Job: user.Job ? {
          id: user.Job.id,
          name: user.Job.name
        } : null,
        remainingDailyCredits: user.remainingDailyCredits,
        creditsReceived: user.creditsReceived,
        creditsSent: user.creditsSent,
      },
    });
  } catch (error) {
    console.error("LINE login error:", error);

    if (error.response) {
      // Error from LINE API
      return res.status(401).json({
        message: "Failed to verify LINE credentials",
        error: error.response.data,
      });
    }

    next(error);
  }
};

// Register function for admin to register users
exports.registerUser = async (req, res, next) => {
  try {
    const { employeeId, name, email, departmentId, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        employeeId,
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Employee ID already registered" });
    }

    // Create new user
    const user = await User.create({
      employeeId,
      name,
      email,
      departmentId,
      role: role || "user",
      remainingDailyCredits: process.env.DAILY_CREDIT_LIMIT || 5,
      dailyCreditResetDate: new Date(),
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Function to verify JWT token (used in middleware)
exports.verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Logout controller
exports.logout = async (req, res) => {
  try {
    // Clear authentication cookies on the server-side
    res.clearCookie('user_session');
    res.clearCookie('admin_role');

    return res.status(200).json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      message: 'Server error during logout',
      error: error.message
    });
  }
};

// Bind employee ID to LINE user ID
exports.bindEmployeeId = async (req, res, next) => {
  try {
    const { employeeId, lineUserId, profilePicture } = req.body;

    if (!employeeId || !lineUserId) {
      return res.status(400).json({ 
        message: "Employee ID and LINE user ID are required" 
      });
    }

    // Find user by employee ID
    let user = await User.findOne({ 
      where: { employeeId },
      include: [{ model: Department, as: 'Department' }]
    });

    if (!user) {
      console.log("❌ No user found with employee ID:", employeeId);
      return res.status(404).json({ 
        message: "Employee ID not found in the system", 
        detail: "請檢查員工編號是否正確" 
      });
    }

    // Check if this employee already has a LINE account linked
    if (user.lineUserId) {
      if (user.lineUserId === lineUserId) {
        // Same LINE account, this is already bound properly
        console.log("✔️ Employee already linked to this LINE account:", user.employeeId);
        // Still return success since it's the same account
      } else {
        // Different LINE account
        console.log("❌ Employee already has a different LINE account linked:", user.employeeId);
        return res.status(409).json({ 
          message: "Employee already linked to another LINE account", 
          detail: "此員工已連結至其他LINE帳號" 
        });
      }
    }

    // Check if another user already has this LINE user ID
    const existingUser = await User.findOne({ where: { lineUserId } });
    if (existingUser && existingUser.id !== user.id) {
      console.log("❌ LINE user ID already linked to another employee:", existingUser.employeeId);
      return res.status(409).json({ 
        message: "LINE account already linked to another employee", 
        detail: "此LINE帳號已連結至其他員工" 
      });
    }

    // Update user with LINE user ID and profile picture
    user.lineUserId = lineUserId;
    if (profilePicture) {
      user.profilePicture = profilePicture;
    }
    user.lastLogin = new Date();
    await user.save();

    // Check and reset daily credits if needed
    await user.checkAndResetDailyCredits();

    // Create JWT token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        employeeId: user.employeeId,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || "24h" }
    );

    // Return user data and token
    return res.status(200).json({
      message: "Employee ID binding successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        departmentId: user.departmentId,
        departmentName: user.Department?.name,
        remainingDailyCredits: user.remainingDailyCredits,
        creditsReceived: user.creditsReceived,
        creditsSent: user.creditsSent,
      },
    });
  } catch (error) {
    console.error("Employee ID binding error:", error);
    next(error);
  }
};
