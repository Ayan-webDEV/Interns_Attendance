import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
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

    whatsappNumber: {
      type: String,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Female", "Male", "Non-binary", "Prefer not to say"],
      default: undefined,
    },

    termsAccepted: {
      type: Boolean,
      default: false,
    },

    termsAcceptedAt: {
      type: Date,
      default: null,
    },

    termsVersion: {
      type: String,
      trim: true,
      default: "",
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

    internCashBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    missedAttendanceRecords: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Attendance",
      },
    ],

    missedAttendanceCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
     * Account status:
     * active      -> normal access
     * suspended   -> temporarily blocked
     * terminated -> internship access revoked by an administrator
     */
    status: {
      type: String,
      enum: ["active", "suspended", "terminated"],
      default: "active",
      index: true,
    },

    /*
     * Termination is retained as history.
     * Do not delete this information when an intern is reinstated.
     */
    termination: {
      isTerminated: {
        type: Boolean,
        default: false,
      },
      reason: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },
      terminatedAt: {
        type: Date,
        default: null,
      },
      terminatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      groupAtTermination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InternshipGroup",
        default: null,
      },
      reinstatedAt: {
        type: Date,
        default: null,
      },
      reinstatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      reinstatementNote: {
        type: String,
        trim: true,
        maxlength: 1000,
        default: "",
      },
    },

    lastLoginAt: Date,
  },
  {
    timestamps: true,
  },
);

userSchema.index({
  group: 1,
  role: 1,
});

userSchema.index({
  status: 1,
  "termination.isTerminated": 1,
});

export default mongoose.model("User", userSchema);
