import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
  // Reuse an already authenticated request user.
  if (req.user?._id) {
    if (req.user.status === "terminated") {
      return res.status(403).json({
        code: "INTERN_TERMINATED",
        message: "Your internship access has been terminated.",
        termination: req.user.termination || null,
      });
    }

    return next();
  }

  try {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");

    if (!token) {
      return res.status(401).json({
        code: "AUTH_REQUIRED",
        message: "Please sign in.",
      });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({
        code: "ACCOUNT_UNAVAILABLE",
        message: "Account unavailable.",
      });
    }

    /*
     * Return a distinct response for terminated interns.
     * The frontend can use this code to show the termination modal.
     */
    if (user.status === "terminated" || user.termination?.isTerminated) {
      return res.status(403).json({
        code: "INTERN_TERMINATED",
        message: "Your internship access has been terminated.",
        termination: {
          reason: user.termination?.reason || "",
          terminatedAt: user.termination?.terminatedAt || null,
        },
      });
    }

    if (user.status !== "active") {
      return res.status(401).json({
        code: "ACCOUNT_UNAVAILABLE",
        message: "Your account is currently unavailable.",
      });
    }

    req.user = user;
    req.authMethod = payload.authMethod || "unknown";

    return next();
  } catch (error) {
    return res.status(401).json({
      code: "SESSION_EXPIRED",
      message: "Session expired. Please sign in again.",
    });
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      code: "ADMIN_REQUIRED",
      message: "Admin access required.",
    });
  }

  return next();
}

export function requireRegisteredIntern(req, res, next) {
  if (req.user?.role !== "intern" || !req.user.registrationComplete) {
    return res.status(403).json({
      code: "REGISTRATION_INCOMPLETE",
      message: "Complete intern registration first.",
    });
  }

  if (req.user.status === "terminated" || req.user.termination?.isTerminated) {
    return res.status(403).json({
      code: "INTERN_TERMINATED",
      message: "Your internship access has been terminated.",
      termination: req.user.termination || null,
    });
  }

  return next();
}
