import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.routes.js";
import groupRoutes from "./routes/group.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import promoRoutes from "./routes/promo.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import notificationRoutes from "./routes/notification.routes.js";

import {
  startMissedAttendanceTracker,
  stopMissedAttendanceTracker,
} from "./services/attendanceMissedTracker.js";

import AppSettings from "./models/AppSettings.js";

/* -------------------------------------------------------------------------- */
/* Express application                                                       */
/* -------------------------------------------------------------------------- */

const app = express();

app.set("trust proxy", 1);

/* -------------------------------------------------------------------------- */
/* Security                                                                   */
/* -------------------------------------------------------------------------- */

app.use(
  helmet({
    crossOriginOpenerPolicy: {
      policy: "same-origin-allow-popups",
    },
  }),
);

/* -------------------------------------------------------------------------- */
/* CORS                                                                       */
/* -------------------------------------------------------------------------- */

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/+$/, ""))
  .filter(Boolean);

console.log("[CORS] Allowed frontend origins:", allowedOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server requests and tools without an Origin header
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/+$/, "");

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    console.warn("[CORS] Blocked origin:", origin);

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],

  optionsSuccessStatus: 204,
};

// Register CORS before API routes so preflight requests are handled
app.use(cors(corsOptions));

/* -------------------------------------------------------------------------- */
/* Request parsing and logging                                                */
/* -------------------------------------------------------------------------- */

app.use(express.json({ limit: "100kb" }));

app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

/* -------------------------------------------------------------------------- */
/* Authentication routes                                                     */
/* -------------------------------------------------------------------------- */

app.use(
  "/api/auth",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 80,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  authRoutes,
);

/* -------------------------------------------------------------------------- */
/* Group routes                                                               */
/* -------------------------------------------------------------------------- */

app.use("/api/groups", groupRoutes);

/* -------------------------------------------------------------------------- */
/* Attendance routes                                                         */
/* -------------------------------------------------------------------------- */

app.use(
  "/api/attendance",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
  attendanceRoutes,
);

/* -------------------------------------------------------------------------- */
/* Wallet, promotions, admin and notifications                               */
/* -------------------------------------------------------------------------- */

app.use("/api/wallet", walletRoutes);

app.use("/api/promo-codes", promoRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/notifications", notificationRoutes);

/* -------------------------------------------------------------------------- */
/* Public portal configuration                                                */
/* -------------------------------------------------------------------------- */

app.get("/api/portal/config", async (req, res, next) => {
  try {
    const saved = await AppSettings.findOne({
      key: "portal-access",
    }).lean();

    const envDefault =
      String(process.env.ONLY_DESKTOP_ACCESS || "true").toLowerCase() !==
      "false";

    res.json({
      settings: {
        onlyDesktopAccess: saved?.value?.onlyDesktopAccess ?? envDefault,
      },
    });
  } catch (error) {
    next(error);
  }
});

/* -------------------------------------------------------------------------- */
/* Health check                                                               */
/* -------------------------------------------------------------------------- */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "veloop-intern-attendance-api",
    time: new Date().toISOString(),
  });
});

/* -------------------------------------------------------------------------- */
/* 404 handler                                                                */
/* -------------------------------------------------------------------------- */

app.use((req, res) => {
  res.status(404).json({
    message: "API route not found.",
  });
});

/* -------------------------------------------------------------------------- */
/* Global error handler                                                       */
/* -------------------------------------------------------------------------- */

app.use((err, req, res, next) => {
  if (err?.name === "ZodError") {
    return res.status(400).json({
      message: "Please check the submitted fields.",

      errors: err.issues?.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  const status = err.status || 500;

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    message:
      status >= 500 ? "Something went wrong. Please try again." : err.message,
  });
});

/* -------------------------------------------------------------------------- */
/* Server startup                                                             */
/* -------------------------------------------------------------------------- */

const port = process.env.PORT || 5000;

let server;

async function startServer() {
  try {
    // MongoDB must be connected before the tracker starts.
    await connectDB();

    console.log("[AttendanceAPI] Database connection established.");

    // Start automatic missed-session tracking.
    startMissedAttendanceTracker({
      intervalMs: 60 * 1000,
    });

    server = app.listen(port, () => {
      console.log(`Attendance API listening on ${port}`);
    });
  } catch (error) {
    console.error("Startup failed:", error?.message || error);

    process.exit(1);
  }
}

/* -------------------------------------------------------------------------- */
/* Graceful shutdown                                                          */
/* -------------------------------------------------------------------------- */

async function shutdown(signal) {
  console.log(`[AttendanceAPI] ${signal} received. Shutting down...`);

  stopMissedAttendanceTracker();

  if (server) {
    server.close(() => {
      console.log("[AttendanceAPI] HTTP server closed.");
      process.exit(0);
    });

    // Avoid hanging indefinitely if connections do not close.
    setTimeout(() => {
      console.error("[AttendanceAPI] Forced shutdown.");
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("SIGINT", () => shutdown("SIGINT"));

/* -------------------------------------------------------------------------- */
/* Launch                                                                     */
/* -------------------------------------------------------------------------- */

startServer();
