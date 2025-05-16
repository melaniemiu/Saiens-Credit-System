require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { sequelize } = require("./models");

// Import routes
const authRoutes = require("./routes/auth.routes");
const creditRoutes = require("./routes/credit.routes");
const userRoutes = require("./routes/user.routes");

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers

// Configure CORS with all needed origins
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "https://3.unayung.cc",
      "https://4.unayung.cc",
      "https://5.unayung.cc",
      "http://localhost:3001",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json()); // Parse JSON bodies
app.use(morgan("dev")); // Request logging

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/credits", creditRoutes);
app.use("/api/users", userRoutes);

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "production" ? "🥞" : err.stack,
  });
});

// Start server
const startServer = async () => {
  try {
    // Sync database (don't drop tables in any environment)
    await sequelize.sync({ force: false });
    console.log("Database synced successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
  }
};

startServer();
