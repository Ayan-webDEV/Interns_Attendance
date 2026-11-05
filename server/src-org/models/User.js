import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    /* ---------------------------------------------------------------------- */
    /* User identity and authentication                                       */
    /* ---------------------------------------------------------------------- */

    role: {
      type: String,
      enum: ["intern", "admin"],
      default: "intern",
      required: true,
    },

    internId: {
      type: String,
      uppercase: true,
      trim: true,
      sparse: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      trim: true,
      required: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
      required: true,
      unique: true,
      index: true,
    },

    googleSub: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },

    passwordHash: {
      type: String,
      select: false,
    },

    /* ---------------------------------------------------------------------- */
    /* Intern details                                                          */
    /* ---------------------------------------------------------------------- */

    whatsappNumber: {
      type: String,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Female", "Male", "Non-binary", "Prefer not to say"],
      default: undefined,
    },

    whatsappGroupName: {
      type: String,
      trim: true,
    },

    whatsappGroupCode: {
      type: String,
      trim: true,
    },

    internshipStartDate: {
      type: Date,
    },

    offerIssueDate: {
      type: Date,
    },

    offerDuration: {
      type: mongoose.Schema.Types.Mixed,
    },

    workMode: {
      type: String,
      trim: true,
    },

    stipend: {
      type: mongoose.Schema.Types.Mixed,
    },

    offerSent: {
      type: Boolean,
      default: false,
    },

    offerSentStatus: {
      type: String,
      trim: true,
    },

    offerSentAt: {
      type: Date,
    },

    domain: {
      type: String,
      trim: true,
    },

    /* ---------------------------------------------------------------------- */
    /* Group information                                                       */
    /* ---------------------------------------------------------------------- */

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InternshipGroup",
      default: null,
      index: true,
    },

    registrationComplete: {
      type: Boolean,
      default: false,
    },

    /* ---------------------------------------------------------------------- */
    /* InternCash wallet                                                       */
    /* ---------------------------------------------------------------------- */

    internCashBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* ---------------------------------------------------------------------- */
    /* Missed attendance tracking                                             */
    /* ---------------------------------------------------------------------- */

    /**
     * References to automatically generated or administrator-recorded
     * missed attendance documents.
     *
     * The actual missed-session information remains stored in the
     * Attendance collection.
     */
    missedAttendanceRecords: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attendance",
      },
    ],

    /**
     * Denormalized missed-session count.
     *
     * This will be incremented only when a new missed Attendance document
     * is successfully created and linked to this user.
     */
    missedAttendanceCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* ---------------------------------------------------------------------- */
    /* Account status                                                          */
    /* ---------------------------------------------------------------------- */

    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },

    lastLoginAt: Date,
  },
  {
    timestamps: true,
  },
);

/* -------------------------------------------------------------------------- */
/* Indexes                                                                     */
/* -------------------------------------------------------------------------- */

userSchema.index({
  group: 1,
  role: 1,
});

export default mongoose.model("User", userSchema);
