const jwt = require("jsonwebtoken");
const axios = require("axios");
const { User, Department } = require("../models");

// LINE API endpoints
const LINE_VERIFY_TOKEN_URL = "https://api.line.me/oauth2/v2.1/verify";
const LINE_USER_PROFILE_URL = "https://api.line.me/v2/profile";

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
    let user = await User.findOne({ where: { lineUserId: lineUserData.sub } });
    if (!user) {
      // This is a new user - look them up by email if available
      if (lineUserData.email) {
        user = await User.findOne({ where: { email: lineUserData.email } });
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

        // Create a simple auto-registration for development
        // This should be removed in production and replaced with proper user management
        if (process.env.NODE_ENV === 'development') {
          console.log("🔄 Development mode: Auto-creating user for LINE ID");

          try {
            // Try to find first department for new user
            const department = await Department.findOne();
            if (!department) {
              throw new Error("No department found for auto-registration");
            }

            // Create new user with LINE data
            user = await User.create({
              employeeId: `EMP${Date.now().toString().slice(-6)}`,
              name: lineUserData.name || 'LINE User',
              email: lineUserData.email,
              lineUserId: lineUserData.sub,
              profilePicture: lineUserData.picture,
              departmentId: department.id,
              role: 'user',
              remainingDailyCredits: process.env.DAILY_CREDIT_LIMIT || 5,
              dailyCreditResetDate: new Date()
            });

            console.log("✅ Auto-created new user:", user.name);
          } catch (createError) {
            console.error("❌ Failed to auto-create user:", createError);

            return res.status(403).json({
              message: "User not registered in the system",
              detail: "Auto-registration failed. Please contact administrator.",
              lineData: {
                userId: lineUserData.sub,
                name: lineUserData.name,
                email: lineUserData.email,
              },
            });
          }
        } else {
          // In production, just return error
          return res.status(403).json({
            message: "User not registered in the system",
            detail: "Please contact your administrator to register your LINE account.",
            lineData: {
              userId: lineUserData.sub,
              name: lineUserData.name,
              email: lineUserData.email,
              picture: lineUserData.picture,
            },
          });
        }
      }

      // Update the user with LINE user ID
      user.lineUserId = lineUserData.sub;
      user.profilePicture = lineUserData.picture || user.profilePicture;
      await user.save();
    }

    // Update last login time
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
        remainingDailyCredits: user.remainingDailyCredits,
        creditsReceived: user.creditsReceived,
        creditsGiven: user.creditsGiven,
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
