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

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err.message);
  process.exit(1);
});

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, message: "API is running" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/items", require("./routes/itemRoutes"));
app.use("/api/claims", require("./routes/claimRoutes"));
app.use("/api/ai-claim", require("./routes/aiClaimRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/stats", require("./routes/statsRoutes"));
app.use("/api/metadata", require("./routes/metadataRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

app.use((err, _req, res, _next) => {
  console.error("API error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});

let httpServer = null;

function listen(server, port) {
  return new Promise((resolve, reject) => {
    const onError = (err) => {
      server.removeListener("listening", onListening);
      reject(err);
    };

    const onListening = () => {
      server.removeListener("error", onError);
      resolve(port);
    };

    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, "0.0.0.0");
  });
}

function printPortInUseHelp(port) {
  console.error(`
❌ Port ${port} is already in use (EADDRINUSE).

Another backend instance is probably still running.

Fix (Windows):
  1. npm run free-port
  2. Or close the other terminal running "node server.js" / "npm run dev"
  3. Or set a different port in backend/.env: PORT=5001
     (and update frontend .env: VITE_API_BASE_URL=http://localhost:5001/api)
`);
}

async function startServer() {
  try {
    await connectDB();
    await seedDefaults();

    httpServer = http.createServer(app);

    const io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    io.use(socketAuthMiddleware);
    attachChatSocket(io);
    app.set("io", io);

    const PORT = Number(process.env.PORT) || 5000;

    try {
      await listen(httpServer, PORT);
    } catch (err) {
      if (err.code === "EADDRINUSE") {
        printPortInUseHelp(PORT);
        process.exit(1);
      }
      throw err;
    }

    console.log(`Server running on port ${PORT}`);
    console.log(`Health: http://127.0.0.1:${PORT}/api/health`);
    console.log(`Auth API: http://127.0.0.1:${PORT}/api/auth`);
    console.log(`Chat API: http://127.0.0.1:${PORT}/api/chat`);
    console.log(`Socket.io ready (JWT on connect)`);
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully...`);

  if (!httpServer) {
    process.exit(0);
    return;
  }

  httpServer.close((err) => {
    if (err) {
      console.error("Error during shutdown:", err.message);
      process.exit(1);
      return;
    }
    console.log("Server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer();
