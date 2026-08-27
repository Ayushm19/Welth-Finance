"use server";

import { connectToDatabase } from "@/lib/mongoose";
import { revalidatePath } from "next/cache";
import { Account, Transaction, User } from "@/models/allModels";
import { checkUser } from "@/lib/checkUser";
import { assertAccountAccess } from "@/actions/team";

const serializeDecimal = (obj) => {
  const serialized = { ...obj };
  if (obj.balance != null) {
    serialized.balance = parseFloat(obj.balance.toString());
  }
  if (obj.amount != null) {
    serialized.amount = parseFloat(obj.amount.toString());
  }
  return serialized;
};

export async function getAccountWithTransactions(accountId) {
  await connectToDatabase();

  const user = await checkUser();
  if (!user) throw new Error("User not found");

  try {
    await assertAccountAccess(user, accountId);
  } catch {
    return null;
  }

  const account = await Account.findById(accountId).lean();
  if (!account) return null;

  // Include every transaction on this account (admin + all members)
  const transactions = await Transaction.find({
    $or: [{ accountId }, { accountId: String(accountId) }],
  })
    .sort({ createdAt: -1, date: -1 })
    .lean();

  const userIds = [...new Set(transactions.map((t) => t.userId).filter(Boolean))];
  const users = await User.find({ _id: { $in: userIds } })
    .select("_id name email imageUrl")
    .lean();
  const userMap = Object.fromEntries(users.map((u) => [u._id, u]));

  const serializedTransactions = transactions.map((tx) => {
    const creator = userMap[tx.userId];
    return {
      ...serializeDecimal(tx),
      createdBy: creator
        ? {
            _id: creator._id,
            name: creator.name || creator.email,
            email: creator.email,
            imageUrl: creator.imageUrl || null,
            isOwner: creator._id === account.userId,
          }
        : {
            _id: tx.userId,
            name: "Unknown",
            email: "",
            imageUrl: null,
            isOwner: false,
          },
    };
  });

  const transactionCount = serializedTransactions.length;

  return {
    ...serializeDecimal(account),
    isShared: account.userId !== user._id,
    transactions: serializedTransactions,
    _count: { transactions: transactionCount },
  };
}

export async function bulkDeleteTransactions(transactionIds) {
  try {
    await connectToDatabase();

    const user = await checkUser();
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

    const user = await checkUser();
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
