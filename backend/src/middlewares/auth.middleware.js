const { verifyToken } = require("../controllers/auth.controller");
const { User } = require("../models");

// Authentication middleware
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    // Check if user exists
    const user = await User.findByPk(decoded.id);
    console.log("decoded", decoded);
    console.log("user", user);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found or inactive" });
    }

    // Set user ID and role in request object
    req.userId = user.id;
    req.userRole = user.role;
    req.employeeId = user.employeeId;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Authentication failed" });
  }
};

// Admin role check middleware
exports.isAdmin = (req, res, next) => {
  if (req.userRole !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};
