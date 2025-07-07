// models/allModels.js
import mongoose from "mongoose";

// User Schema
const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    clerkUserId: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    name: String,
    imageUrl: String,
  },
  { timestamps: true }
);

// Account Schema
const accountSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    name: { type: String, required: true },
    type: { type: String, enum: ["CURRENT", "SAVINGS"], required: true },
    balance: { type: mongoose.Decimal128, default: 0 },
    isDefault: { type: Boolean, default: false },
    userId: { type: String, ref: "User", required: true },
  },
  { timestamps: true }
);

// Transaction Schema
const transactionSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    type: { type: String, enum: ["INCOME", "EXPENSE"], required: true },
    amount: { type: mongoose.Decimal128, required: true },
    description: String,
    date: { type: Date, required: true },
    category: { type: String, required: true },
    receiptUrl: String,
    isRecurring: { type: Boolean, default: false },
    recurringInterval: {
      type: String,
      enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
      default: null,
    },
    nextRecurringDate: Date,
    lastProcessed: Date,
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "COMPLETED",
    },
    userId: { type: String, ref: "User", required: true },
    accountId: { type: String, ref: "Account", required: true },
  },
  { timestamps: true }
);

// Budget Schema
const budgetSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    amount: { type: mongoose.Decimal128, required: true },
    lastAlertSent: Date,
    userId: { type: String, ref: "User", unique: true, required: true },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Account = mongoose.models.Account || mongoose.model("Account", accountSchema);
export const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
export const Budget = mongoose.models.Budget || mongoose.model("Budget", budgetSchema);
