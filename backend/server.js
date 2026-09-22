// Main entry point for the backend server.
// Sets up database connections, Express middleware, and API routes.

// start the app server
// reload trigger for regenerated prisma client
import "dotenv/config";
import path from "path";
import { getRedisStatus } from "./utils/cache.js";
import { handlePageRequest } from "./middleware/seoMiddleware.js";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import { securityHeaders } from "./middleware/security.js";
import { WebSocketServer } from "ws";
import { setWss } from "./utils/wssStore.js";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/authRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import milestoneRoutes from "./routes/milestoneRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import deliverableRoutes from "./routes/deliverableRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";
import clientProfileRoutes from "./routes/clientProfileRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import invoiceRoutes from "./routes/invoiceRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import siteSettingsRoutes from "./routes/siteSettingsRoutes.js";
import emailSettingsRoutes from "./routes/emailSettingsRoutes.js";
import emailTemplateRoutes from "./routes/emailTemplateRoutes.js";
import securitySettingsRoutes from "./routes/securitySettingsRoutes.js";
import paymentGatewayRoutes from "./routes/paymentGatewayRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import themeRoutes from "./routes/themeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import auditLogRoutes from "./routes/auditLogRoutes.js";
import { auditMiddleware } from "./middleware/auditMiddleware.js";
import cmsRoutes from "./routes/cmsRoutes.js";
import revenueForecastRoutes from "./routes/revenueForecastRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import cacheRoutes from "./routes/cacheRoutes.js";
import loginAttemptRoutes from "./routes/loginAttemptRoutes.js";
import prisma from "./config/prisma.js";
import { setupSwagger } from "./config/swagger.js";

const app = express();

// Trust reverse proxy to get correct client IP for rate limiters
app.set("trust proxy", 1);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(url => url.trim())
  : [process.env.FRONTEND_URL || "http://localhost:5173", "http://localhost:4173"];

app.use(securityHeaders);
setupSwagger(app);
app.use(morgan("dev", { skip: (req, res) => req.method === "GET" }));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Fallback: allow localhost origins in development
    const isDev = !process.env.NODE_ENV || process.env.NODE_ENV === "development";
    if (isDev && (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"))) {
      return callback(null, true);
    }
    
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
// Route to handle USE /uploads requests
app.use("/uploads", express.static("uploads"));

// Route to handle GET / requests
app.get("/", (req, res, next) => {
  if (req.accepts("html")) {
    return next();
  }
  res.send("Client Project Management API");
});

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Retrieve system health status
 *     description: Checks database and Redis connectivity and returns the uptime.
 *     responses:
 *       200:
 *         description: System is healthy and fully connected.
 *       503:
 *         description: System is unhealthy.
 */
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redis = getRedisStatus();
    res.json({
      status: "healthy",
      database: "connected",
      redis: redis.connected ? "connected" : "disconnected",
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({ status: "unhealthy", error: error.message });
  }
});

app.get("/api/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redis = getRedisStatus();
    res.json({
      status: "healthy",
      database: "connected",
      redis: redis.connected ? "connected" : "disconnected",
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({ status: "unhealthy", error: error.message });
  }
});

app.use(auditMiddleware);

// Rate limiters for auth endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  message: { success: false, message: "Too many login attempts. Please try again after 15 minutes." }
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 OTP requests per windowMs
  message: { success: false, message: "Too many verification code attempts. Please try again after 15 minutes." }
});

app.use("/api/auth/forgot-password", otpLimiter);
app.use("/api/auth/verify-otp", otpLimiter);
app.use("/api/auth/verify-2fa", otpLimiter);

// Route to handle USE /api/auth requests
app.use("/api/auth", authRoutes);
// Route to handle USE /api/projects requests
app.use("/api/projects", projectRoutes);
// Route to handle USE /api/clients requests
app.use("/api/clients", clientRoutes);
// Route to handle USE /api/tasks requests
app.use("/api/tasks", taskRoutes);
// Route to handle USE /api/dashboard requests
app.use("/api/dashboard", dashboardRoutes);
// Route to handle USE /api/milestones requests
app.use("/api/milestones", milestoneRoutes);
// Route to handle USE /api/documents requests
app.use("/api/documents", documentRoutes);
// Route to handle USE /api/login-attempts requests
app.use("/api/login-attempts", loginAttemptRoutes);
// Route to handle USE /api/deliverables requests
app.use("/api/deliverables", deliverableRoutes);
// Route to handle USE /api/activities requests
app.use("/api/activities", activityRoutes);
// Route to handle USE /api/contacts requests
app.use("/api/contacts", contactRoutes);
// Route to handle USE /api/client requests
app.use("/api/client", clientProfileRoutes);
// Route to handle USE /api/notifications requests
app.use("/api/notifications", notificationRoutes);
// Route to handle USE /api/tickets requests
app.use("/api/tickets", ticketRoutes);
// Route to handle USE /api/invoices requests
app.use("/api/invoices", invoiceRoutes);
// Route to handle USE /api/analytics requests
app.use("/api/analytics", analyticsRoutes);
// Route to handle USE /api/site-settings requests
app.use("/api/site-settings", siteSettingsRoutes);
// Route to handle USE /api/email-settings requests
app.use("/api/email-settings", emailSettingsRoutes);
// Route to handle USE /api/email-templates requests
app.use("/api/email-templates", emailTemplateRoutes);
// Route to handle USE /api/security-settings requests
app.use("/api/security-settings", securitySettingsRoutes);
// Route to handle USE /api/payment-gateways requests
app.use("/api/payment-gateways", paymentGatewayRoutes);
// Route to handle USE /api/payments requests
app.use("/api/payments", paymentRoutes);
// Route to handle USE /api/transactions requests
app.use("/api/transactions", transactionRoutes);
// Route to handle USE /api/search requests
app.use("/api/search", searchRoutes);
// Route to handle USE /api/themes requests
app.use("/api/themes", themeRoutes);
// Route to handle USE /api/users requests
app.use("/api/users", userRoutes);
// Route to handle USE /api/audit-logs requests
app.use("/api/audit-logs", auditLogRoutes);
// Route to handle USE /api/cms and other cms/public requests
app.use("/api", cmsRoutes);
app.use("/api/revenue", revenueForecastRoutes);
app.use("/api/messages", messageRoutes);
// Route to handle USE /api/cache requests (Redis toggle)
app.use("/api/cache", cacheRoutes);


// Serve static assets from frontend build in production/built state
const frontendDistPath = path.resolve("../frontend/dist");
app.use(express.static(frontendDistPath));

// Wildcard route to handle page requests
app.get(/.*/, handlePageRequest);

// Centralized global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.code === "LIMIT_FILE_SIZE") {
    let maxLimit = "30 MB";
    if (req.originalUrl.includes("site-settings") || req.originalUrl.includes("payment")) {
      maxLimit = "5 MB";
    } else if (req.originalUrl.includes("users") || req.originalUrl.includes("milestones") || req.originalUrl.includes("projects") || req.originalUrl.includes("tasks")) {
      maxLimit = "5 MB";
    }
    return res.status(400).json({
      success: false,
      message: `File size limit exceeded. Maximum allowed size is ${maxLimit}.`
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: (process.env.NODE_ENV === "production" && !err.statusCode) ? "Internal server error" : err.message
  });
});

const PORT = process.env.PORT || 5000;
let server = null;

// verify db connection before listening
prisma.$queryRaw`SELECT 1`
  .then(async () => {
    console.log("Database connected successfully");

    if (process.env.NODE_ENV !== "test") {
      server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    }

    // Start background data retention policies
    try {
      const { startRetentionJob } = await import("./jobs/retentionJob.js");
      startRetentionJob();
    } catch (jobErr) {
      console.error("Failed to start data retention job:", jobErr.message);
    }

    // Start WebSocket Server sharing the HTTP server instance for chat reactions & messaging sync
    try {
      const wss = new WebSocketServer({ server });
      setWss(wss); // Register wss globally so notifier.js can broadcast notification events
      wss.on("connection", async (ws, req) => {
        console.log("[WS Server] Client connecting...");

        try {
          const reqUrl = new URL(req.url, "http://localhost");
          const token = reqUrl.searchParams.get("token");

          if (!token) {
            console.log("[WS Server] Connection rejected: No token provided");
            ws.close(4001, "No token provided");
            return;
          }

          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const user = await prisma.user.findUnique({
            where: { id: decoded.id },
          });

          if (!user || user.status === "Suspended") {
            console.log("[WS Server] Connection rejected: User not found or suspended");
            ws.close(4003, "Authentication failed");
            return;
          }

          // Attach user information to the WebSocket instance
          ws.userId = user.id;
          ws.userRole = user.role;
          console.log(`[WS Server] Client authenticated: user id ${user.id}`);

          ws.on("message", async (rawData) => {
            try {
              if (!ws.userId) {
                console.warn("[WS Server] Unauthenticated client sent a message.");
                ws.close(4003, "Unauthenticated");
                return;
              }

              const messageStr = rawData.toString();
              const packet = JSON.parse(messageStr);
              console.log("[WS Server] Received packet type:", packet.type, "from user:", ws.userId);

              if (packet.type === "identify") {
                console.log("[WS Server] Identify packet received for user:", ws.userId);
                return;
              }

              // 1. Resolve conversation ID
              let conversationId = Number(packet.conversationId);
              if (isNaN(conversationId) && packet.messageId) {
                const msg = await prisma.message.findUnique({
                  where: { id: Number(packet.messageId) },
                  select: { conversationId: true }
                });
                if (msg) {
                  conversationId = msg.conversationId;
                }
              }

              if (isNaN(conversationId)) {
                console.warn("[WS Server] Packet contains no valid conversation context");
                return;
              }

              // 2. Verify authorization: Is the sender a participant of the conversation?
              const convo = await prisma.conversation.findUnique({
                where: { id: conversationId },
                include: { participants: true }
              });

              if (!convo) {
                console.warn("[WS Server] Conversation not found:", conversationId);
                return;
              }

              const participantIds = convo.participants.map(p => p.id);
              if (!participantIds.includes(ws.userId)) {
                console.warn(`[WS Server] User ${ws.userId} is not authorized for conversation ${conversationId}`);
                return;
              }

              // 3. Packet type-specific validation
              if (packet.type === "message") {
                // Ensure the sender ID in the packet matches the authenticated user
                if (packet.senderId !== ws.userId && packet.sender?.id !== ws.userId) {
                  console.warn("[WS Server] Spoofed sender ID in message packet");
                  return;
                }
              } else if (packet.type === "reaction") {
                // Ensure the sender ID in the reaction matches the authenticated user
                if (packet.senderId !== ws.userId) {
                  console.warn("[WS Server] Spoofed sender ID in reaction packet");
                  return;
                }

                // Persist reaction to database
                const msgId = Number(packet.messageId);
                if (!isNaN(msgId)) {
                  try {
                    const dbMsg = await prisma.message.findUnique({
                      where: { id: msgId }
                    });

                    if (dbMsg) {
                      let currentReactions = [];
                      if (dbMsg.reactions) {
                        try {
                          currentReactions = typeof dbMsg.reactions === "string"
                            ? JSON.parse(dbMsg.reactions)
                            : dbMsg.reactions;
                          if (!Array.isArray(currentReactions)) {
                            currentReactions = [];
                          }
                        } catch (parseErr) {
                          currentReactions = [];
                        }
                      }

                      const existingIdx = currentReactions.findIndex(r => r.senderId === ws.userId);
                      let updatedReactions = [...currentReactions];

                      if (packet.isRemoved) {
                        if (existingIdx > -1) {
                          updatedReactions.splice(existingIdx, 1);
                        }
                      } else {
                        if (existingIdx > -1) {
                          updatedReactions[existingIdx] = {
                            reaction: packet.reaction,
                            senderId: ws.userId
                          };
                        } else {
                          updatedReactions.push({
                            reaction: packet.reaction,
                            senderId: ws.userId
                          });
                        }
                      }

                      await prisma.message.update({
                        where: { id: msgId },
                        data: { reactions: updatedReactions }
                      });
                      console.log(`[WS Server] Persisted reaction "${packet.reaction}" on message ${msgId} (isRemoved: ${packet.isRemoved})`);
                    } else {
                      console.warn("[WS Server] Message to react to not found in DB:", msgId);
                    }
                  } catch (dbErr) {
                    console.error("[WS Server] Error persisting reaction to database:", dbErr.message);
                  }
                }
              } else if (packet.type === "delete") {
                // If type is delete, check if user is sender or group admin/creator
                if (packet.messageId) {
                  const msg = await prisma.message.findUnique({
                    where: { id: Number(packet.messageId) },
                    select: { senderId: true }
                  });
                  if (msg) {
                    const isOwnMsg = msg.senderId === ws.userId;
                    const isGroupAdmin = convo.creatorId === ws.userId || convo.adminIds?.includes(ws.userId) || ws.userRole === "ADMIN";
                    if (!isOwnMsg && !isGroupAdmin) {
                      console.warn("[WS Server] User unauthorized to delete this message");
                      return;
                    }
                  } else {
                    return;
                  }
                }
              } else if (
                packet.type === "pin" ||
                packet.type === "unpin" ||
                packet.type === "pin-chat" ||
                packet.type === "unpin-chat" ||
                packet.type === "archive-chat" ||
                packet.type === "unarchive-chat"
              ) {
                if (convo.type === "GROUP" && (packet.type === "pin" || packet.type === "unpin")) {
                  const isGroupAdmin = convo.creatorId === ws.userId || convo.adminIds?.includes(ws.userId) || ws.userRole === "ADMIN";
                  if (!isGroupAdmin) {
                    console.warn("[WS Server] User unauthorized to pin/unpin in this group conversation");
                    return;
                  }
                }
              } else {
                console.warn("[WS Server] Unknown packet type:", packet.type);
                return;
              }

              // 4. Broadcast to other authorized participants who are currently connected
              wss.clients.forEach((client) => {
                if (
                  client.readyState === 1 && // WebSocket.OPEN
                  client !== ws && // Don't echo back to the originating socket
                  participantIds.includes(client.userId)
                ) {
                  client.send(messageStr);
                }
              });
            } catch (e) {
              console.warn("[WS Server] Failed to process message:", e.message);
            }
          });

          ws.on("close", () => {
            console.log(`[WS Server] Client disconnected: user id ${ws.userId}`);
          });

        } catch (connectionErr) {
          console.warn("[WS Server] Error handling connection auth:", connectionErr.message);
          ws.close(4003, "Authentication failed");
        }
      });
      console.log(`WebSocket server running and sharing port ${PORT}`);
    } catch (wsErr) {
      console.error("Failed to start WebSocket server:", wsErr.message);
    }
  })
  .catch((err) => {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  });

// Graceful shutdown handling
const gracefulShutdown = async (signal) => {
  console.log(`[${signal}] Received. Starting graceful shutdown...`);
  try {
    await prisma.$disconnect();
    console.log("Database disconnected successfully.");
  } catch (dbErr) {
    console.error("Error during database disconnect:", dbErr.message);
  }
  
  if (server) {
    server.close(() => {
      console.log("HTTP server closed.");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

export default app;
// Trigger nodemon restart for Prisma client regeneration
