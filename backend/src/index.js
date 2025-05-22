require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { createServer } = require("http");
const { Server } = require("socket.io");
const { sequelize } = require("./models");

// Import routes
const authRoutes = require("./routes/auth.routes");
const creditRoutes = require("./routes/credit.routes");
const userRoutes = require("./routes/user.routes");
const departmentRoutes = require("./routes/department.routes");
const adminRoutes = require("./routes/admin.routes");

// Initialize express app
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "https://3.unayung.cc",
      "https://4.unayung.cc", 
      "https://5.unayung.cc",
      "http://localhost:3001",
    ],
    credentials: true,
    methods: ["GET", "POST"]
  }
});
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
app.use("/api/departments", departmentRoutes);
app.use("/api/admin", adminRoutes);

// Make io available to routes
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 [SOCKET] User connected: ${socket.id} from ${socket.handshake.address}`);
  
  // Join user to their personal room for targeted notifications
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 [SOCKET] User ${userId} joined room: user-${userId} (socket: ${socket.id})`);
    
    // Log room info
    const room = io.sockets.adapter.rooms.get(`user-${userId}`);
    const roomSize = room ? room.size : 0;
    console.log(`📊 [SOCKET] Room user-${userId} now has ${roomSize} connected client(s)`);
  });
  
  // Handle test credit notifications from script
  socket.on('credit-received-test', ({ room, data }) => {
    console.log(`📧 [TEST] Test notification for room: ${room}`);
    const targetRoom = io.sockets.adapter.rooms.get(room);
    const clientCount = targetRoom ? targetRoom.size : 0;
    console.log(`📡 [TEST] Broadcasting to ${clientCount} client(s) in ${room}`);
    io.to(room).emit('credit-received', data);
    console.log(`✅ [TEST] Test credit notification sent to ${room}`);
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`❌ [SOCKET] User disconnected: ${socket.id} (reason: ${reason})`);
  });
});

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

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.io server ready`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
  }
};

startServer();
