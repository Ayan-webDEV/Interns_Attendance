import { Router } from "express";
import mongoose from "mongoose";
import WalletTransaction from "../models/WalletTransaction.js";
import crypto from "node:crypto";

import {
  requireAuth,
  requireRegisteredIntern,
  requireAdmin,
} from "../middleware/auth.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

const router = Router();

/* =========================================================
   INTERN: GET MY WALLET
========================================================= */

router.get(
  "/mine",
  requireAuth,
  requireRegisteredIntern,
  asyncHandler(async (req, res) => {
    const transactions = await WalletTransaction.find({
      intern: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    res.json({
      balance: req.user.internCashBalance,
      conversion: Number(process.env.INTERN_CASH_TO_INR || 0.5),
      transactions,
    });
  }),
);

/* =========================================================
   ADMIN: GET WALLET TRANSACTIONS
========================================================= */

router.get(
  "/admin/transactions",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const filter = {};

    if (req.query.groupId) {
      const User = (await import("../models/User.js")).default;

      const internIds = await User.find({
        group: req.query.groupId,
        role: "intern",
      }).distinct("_id");

      filter.$or = [
        { group: req.query.groupId },
        { intern: { $in: internIds } },
      ];
    }

    const transactions = await WalletTransaction.find(filter)
      .populate({
        path: "intern",
        select: "name email internId group",
        populate: {
          path: "group",
          select: "name",
        },
      })
      .populate("group", "name")
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    res.json({ transactions });
  }),
);

/* =========================================================
   ADMIN: ADJUST INTERN WALLET BALANCE
   Modes: credit | debit | set

   Uses MongoDB transactions to keep the balance
   and transaction history consistent.
========================================================= */

router.post(
  "/admin/adjust",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { internId, amount, reason } = req.body;

    const mode = req.body.mode || req.body.direction;

    const enteredAmount = Number(amount);
    const cleanReason = String(reason || "").trim();

    /* ---------- VALIDATION ---------- */

    if (!Number.isSafeInteger(enteredAmount) || enteredAmount < 0) {
      throw new HttpError(400, "Enter a valid whole-number amount.");
    }

    if (!["credit", "debit", "set"].includes(mode)) {
      throw new HttpError(400, "Choose Add, Deduct, or Set exact balance.");
    }

    if (mode !== "set" && enteredAmount <= 0) {
      throw new HttpError(
        400,
        "Credit and debit amounts must be greater than zero.",
      );
    }

    if (cleanReason.length < 5) {
      throw new HttpError(
        400,
        "Please provide a reason of at least 5 characters.",
      );
    }

    if (cleanReason.length > 300) {
      throw new HttpError(400, "Reason cannot exceed 300 characters.");
    }

    /* ---------- VALIDATE INTERN ID ---------- */

    const lookup = String(internId || "")
      .trim()
      .toUpperCase();

    if (!lookup) {
      throw new HttpError(400, "Intern ID is required.");
    }

    /* ---------- LOAD USER MODEL ---------- */

    const User = (await import("../models/User.js")).default;

    /* ---------- START MONGODB TRANSACTION ---------- */

    const session = await mongoose.startSession();

    let result;

    // Keep the same reference if MongoDB retries the transaction.
    const transactionReference = `admin-adjustment:${crypto.randomUUID()}`;

    try {
      await session.withTransaction(async () => {
        /*
         * Find the intern inside the transaction.
         * This ensures we calculate the adjustment
         * using the latest committed balance.
         */

        let user = await User.findOne({
          role: "intern",
          internId: lookup,
        }).session(session);

        // Also support MongoDB account IDs.
        if (!user && /^[a-f\d]{24}$/i.test(lookup)) {
          user = await User.findOne({
            _id: lookup,
            role: "intern",
          }).session(session);
        }

        if (!user) {
          throw new HttpError(404, "Intern not found. Check the intern ID.");
        }

        /* ---------- CALCULATE BALANCE ---------- */

        const oldBalance = Number(user.internCashBalance || 0);

        let newBalance;

        if (mode === "credit") {
          newBalance = oldBalance + enteredAmount;
        } else if (mode === "debit") {
          newBalance = oldBalance - enteredAmount;
        } else {
          // Set exact balance.
          newBalance = enteredAmount;
        }

        if (!Number.isSafeInteger(newBalance)) {
          throw new HttpError(
            400,
            "The resulting balance is outside the supported range.",
          );
        }

        if (newBalance < 0) {
          throw new HttpError(
            400,
            `Insufficient balance. Available balance: ${oldBalance} IC.`,
          );
        }

        const signedAmount = newBalance - oldBalance;

        if (signedAmount === 0) {
          throw new HttpError(
            400,
            "The new balance is the same as the current balance.",
          );
        }

        /* ---------- UPDATE INTERN BALANCE ---------- */

        user.internCashBalance = newBalance;

        await user.save({ session });

        /* ---------- CREATE TRANSACTION RECORD ---------- */

        const createdTransactions = await WalletTransaction.create(
          [
            {
              intern: user._id,
              group: user.group,
              amount: signedAmount,
              type: "admin_adjustment",
              reference: transactionReference,
              description: cleanReason,
              balanceAfter: newBalance,
              createdBy: req.user._id,
            },
          ],
          { session },
        );

        const transaction = createdTransactions[0];

        /* ---------- PREPARE RESPONSE ---------- */

        result = {
          success: true,
          message: "Wallet balance adjusted successfully.",

          intern: {
            _id: user._id,
            name: user.name,
            internId: user.internId,
            internCashBalance: newBalance,
          },

          previousBalance: oldBalance,
          adjustment: signedAmount,
          balance: newBalance,
          transaction,
        };
      });
    } finally {
      await session.endSession();
    }

    /* ---------- SEND RESPONSE AFTER COMMIT ---------- */

    res.json(result);
  }),
);

export default router;
