const path = require("path");
const http = require("http");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { socketAuthMiddleware } = require("./socket/socketAuth");
const { attachChatSocket } = require("./socket/chatSocket");
const { seedDefaults } = require("./utils/seedDefaults");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/items", require("./routes/itemRoutes"));
app.use("/api/claims", require("./routes/claimRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/stats", require("./routes/statsRoutes"));
app.use("/api/metadata", require("./routes/metadataRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

const startServer = async () => {
  try {
    await connectDB();
    await seedDefaults();

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.use(socketAuthMiddleware);
    attachChatSocket(io);
    app.set("io", io);

    const PORT = Number(process.env.PORT) || 5000;

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Auth API: http://127.0.0.1:${PORT}/api/auth`);
      console.log(`Chat API: http://127.0.0.1:${PORT}/api/chat`);
      console.log(`Socket.io ready (JWT on connect)`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
