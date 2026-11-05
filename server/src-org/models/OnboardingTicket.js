import mongoose from "mongoose";

const onboardingTicketSchema = new mongoose.Schema(
  {
    jti: {
      type: String,
      required: true,
      unique: true,
    },

    googleSub: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    consumedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

onboardingTicketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("OnboardingTicket", onboardingTicketSchema);
