"use server";

import { connectToDatabase } from "@/lib/mongoose";
import { revalidatePath } from "next/cache";
import { User, Account, Transaction } from "@/models/allModels";

const DEMO_USER_ID = "demo-user-id";

const serializeDecimal = (obj) => {
  const serialized = { ...obj };
  if (obj.balance) {
    serialized.balance = parseFloat(obj.balance.toString());
  }
  if (obj.amount) {
    serialized.amount = parseFloat(obj.amount.toString());
  }
  return serialized;
};

export async function getAccountWithTransactions(accountId) {
  await connectToDatabase();

  const user = await User.findOne({ clerkUserId: DEMO_USER_ID });
  if (!user) throw new Error("User not found");

  const account = await Account.findOne({ _id: accountId, userId: user._id }).lean();
  if (!account) return null;

  const transactions = await Transaction.find({ accountId, userId: user._id })
    .sort({ date: -1 })
    .lean();

  const transactionCount = await Transaction.countDocuments({ accountId, userId: user._id });

  return {
    ...serializeDecimal(account),
    transactions: transactions.map(serializeDecimal),
    _count: { transactions: transactionCount },
  };
}

export async function bulkDeleteTransactions(transactionIds) {
  try {
    await connectToDatabase();

    const user = await User.findOne({ clerkUserId: DEMO_USER_ID });
    if (!user) throw new Error("User not found");

    const transactions = await Transaction.find({
      _id: { $in: transactionIds },
      userId: user._id,
    });

    const accountBalanceChanges = {};
    transactions.forEach((tx) => {
      const change = tx.type === "EXPENSE" ? tx.amount : -tx.amount;
      const accId = tx.accountId;
      if (!accountBalanceChanges[accId]) {
        accountBalanceChanges[accId] = change;
      } else {
        accountBalanceChanges[accId] += change;
      }
    });

    await Transaction.deleteMany({
      _id: { $in: transactionIds },
      userId: user._id,
    });

    const updatePromises = Object.entries(accountBalanceChanges).map(
      ([accountId, balanceChange]) =>
        Account.updateOne(
          { _id: accountId },
          { $inc: { balance: balanceChange } }
        )
    );

    await Promise.all(updatePromises);

    revalidatePath("/dashboard");
    revalidatePath("/account/[id]");

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function updateDefaultAccount(accountId) {
  try {
    await connectToDatabase();

    const user = await User.findOne({ clerkUserId: DEMO_USER_ID });
    if (!user) throw new Error("User not found");

    await Account.updateMany(
      { userId: user._id, isDefault: true },
      { $set: { isDefault: false } }
    );

    const updatedAccount = await Account.findOneAndUpdate(
      { _id: accountId, userId: user._id },
      { $set: { isDefault: true } },
      { new: true }
    ).lean();

    revalidatePath("/dashboard");

    return { success: true, data: serializeDecimal(updatedAccount) };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
