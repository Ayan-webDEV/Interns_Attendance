import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    intern: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InternshipGroup",
      required: true,
      index: true,
    },

    dateKey: {
      type: String,
      required: true,
      index: true,
    },

    sessionNumber: {
      type: Number,
      enum: [1, 2],
      required: true,
      default: 1,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected",
        "admin_corrected_present",
        "admin_corrected_absent",
        "missed",
      ],
      default: "pending",
      index: true,
    },

    /*
     * These fields are populated for an attendance submission.
     * They are optional because an automatically recorded missed session
     * has no actual session start or intern submission time.
     */
    sessionStartedAt: {
      type: Date,
      default: undefined,
    },

    markedAt: {
      type: Date,
      default: undefined,
    },

    /* ---------------------------------------------------------------------- */
    /* Missed attendance information                                          */
    /* ---------------------------------------------------------------------- */

    missedAt: {
      type: Date,
      default: undefined,
    },

    missedReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: undefined,
    },

    missedSource: {
      type: String,
      enum: ["automatic", "admin"],
      default: undefined,
    },

    /* ---------------------------------------------------------------------- */
    /* Approval information                                                   */
    /* ---------------------------------------------------------------------- */

    approvedAt: Date,

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    /* ---------------------------------------------------------------------- */
    /* Rejection information                                                  */
    /* ---------------------------------------------------------------------- */

    rejectedAt: Date,

    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    /* ---------------------------------------------------------------------- */
    /* Attendance history                                                     */
    /* ---------------------------------------------------------------------- */

    approvalHistory: [
      {
        action: {
          type: String,
          enum: ["submitted", "approved", "rejected", "corrected", "missed"],
          required: true,
        },

        actor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        at: {
          type: Date,
          default: Date.now,
        },

        note: {
          type: String,
          trim: true,
          maxlength: 500,
        },
      },
    ],

    /* ---------------------------------------------------------------------- */
    /* Rewards                                                                 */
    /* ---------------------------------------------------------------------- */

    rewardIssued: {
      type: Boolean,
      default: false,
    },

    rewardAmount: {
      type: Number,
      default: 0,
    },

    /* ---------------------------------------------------------------------- */
    /* Administrator correction                                               */
    /* ---------------------------------------------------------------------- */

    correctedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    correctionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

/*
 * One attendance record per intern, date and session.
 *
 * This protects both normal submissions and automatically generated
 * missed-session records against duplication.
 */
schema.index(
  {
    intern: 1,
    dateKey: 1,
    sessionNumber: 1,
  },
  {
    unique: true,
    name: "intern_date_session_unique",
  },
);

schema.index(
  {
    group: 1,
    dateKey: -1,
    status: 1,
  },
  {
    name: "group_date_status",
  },
);

schema.index(
  {
    intern: 1,
    status: 1,
    missedAt: -1,
  },
  {
    name: "intern_missed_attendance",
  },
);

export default mongoose.model("Attendance", schema);
