// models/allModels.js
import mongoose from "mongoose";

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
    teamId: { type: String, ref: "Team", default: null },
  },
  { timestamps: true }
);

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
    teamId: { type: String, ref: "Team", default: null },
  },
  { timestamps: true }
);

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

const teamSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    name: { type: String, required: true },
    adminId: { type: String, ref: "User", required: true, unique: true },
  },
  { timestamps: true }
);

const teamMemberSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => new mongoose.Types.ObjectId().toString(),
    },
    teamId: { type: String, ref: "Team", required: true },
    userId: { type: String, ref: "User", default: null },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ["ADMIN", "MEMBER"], default: "MEMBER" },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REVOKED"],
      default: "PENDING",
    },
    accountAccess: [{ type: String, ref: "Account" }],
    monthlySpendLimit: { type: Number, default: null },
    inviteToken: { type: String, unique: true, sparse: true },
    invitedBy: { type: String, ref: "User", required: true },
    joinedAt: Date,
  },
  { timestamps: true }
);

teamMemberSchema.index({ teamId: 1, email: 1 }, { unique: true });

export const User = mongoose.models.User || mongoose.model("User", userSchema);
export const Account =
  mongoose.models.Account || mongoose.model("Account", accountSchema);
export const Transaction =
  mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
export const Budget =
  mongoose.models.Budget || mongoose.model("Budget", budgetSchema);
export const Team = mongoose.models.Team || mongoose.model("Team", teamSchema);
export const TeamMember =
  mongoose.models.TeamMember || mongoose.model("TeamMember", teamMemberSchema);
