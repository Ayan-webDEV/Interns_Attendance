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
const app = express();
app.set("trust proxy", 1);
app.use(
  helmet({
    crossOriginOpenerPolicy: {
      policy: "same-origin-allow-popups",
    },
  }),
);
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header, such as server-to-server requests.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
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
app.use("/api/groups", groupRoutes);
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
app.use("/api/wallet", walletRoutes);
app.use("/api/promo-codes", promoRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.get("/api/health", (req, res) =>
  res.json({
    ok: true,
    service: "veloop-intern-attendance-api",
    time: new Date().toISOString(),
  }),
);
app.use((req, res) =>
  res.status(404).json({ message: "API route not found." }),
);
app.use((err, req, res, next) => {
  if (err?.name === "ZodError")
    return res.status(400).json({
      message: "Please check the submitted fields.",
      errors: err.issues?.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    message:
      status >= 500 ? "Something went wrong. Please try again." : err.message,
  });
});
const port = process.env.PORT || 5000;
connectDB()
  .then(() =>
    app.listen(port, () => console.log(`Attendance API listening on ${port}`)),
  )
  .catch((err) => {
    console.error("Startup failed:", err.message);
    process.exit(1);
  });
