"use server";

import { connectToDatabase } from "@/lib/mongoose";
import { revalidatePath } from "next/cache";
import { checkUser } from "@/lib/checkUser";
import { Account, Transaction } from "@/models/allModels";
import { getAccessibleAccountIds } from "@/actions/team";

const serializeTransaction = (obj) => {
  const serialized = { ...(obj._doc || obj) };
  if (serialized.balance) {
    serialized.balance = parseFloat(serialized.balance.toString());
  }
  if (serialized.amount) {
    serialized.amount = parseFloat(serialized.amount.toString());
  }
  return serialized;
};

export async function getUserAccounts() {
  await connectToDatabase();

  const user = await checkUser();
  if (!user) throw new Error("User not found");

  const { personalIds, sharedIds } = await getAccessibleAccountIds(user);
  const allIds = [...new Set([...personalIds, ...sharedIds])];

  const accounts = await Account.find({ _id: { $in: allIds } })
    .sort({ createdAt: -1 })
    .lean();

  const accountsWithCount = await Promise.all(
    accounts.map(async (account) => {
      const txCount = await Transaction.countDocuments({
        accountId: account._id,
      });
      const isShared = account.userId !== user._id;
      return {
        ...serializeTransaction(account),
        isShared,
        ownership: isShared ? "SHARED" : "PERSONAL",
        _count: { transactions: txCount },
      };
    })
  );

  return accountsWithCount;
}

export async function createAccount(data) {
  await connectToDatabase();

  const user = await checkUser();
  if (!user) throw new Error("User not found");

  const balanceFloat = parseFloat(data.balance);
  if (isNaN(balanceFloat)) {
    throw new Error("Invalid balance amount");
  }

  const existingAccounts = await Account.find({ userId: user._id });

  const shouldBeDefault =
    existingAccounts.length === 0 ? true : data.isDefault;

  if (shouldBeDefault) {
    await Account.updateMany(
      { userId: user._id, isDefault: true },
      { $set: { isDefault: false } }
    );
  }

  const account = await Account.create({
    ...data,
    balance: balanceFloat,
    userId: user._id,
    isDefault: shouldBeDefault,
    teamId: null,
  });

  revalidatePath("/dashboard");
  revalidatePath("/team");

  return {
    success: true,
    data: serializeTransaction(account),
  };
}

export async function getDashboardData() {
  await connectToDatabase();

  const user = await checkUser();
  if (!user) throw new Error("User not found");

  const { personalIds, sharedIds } = await getAccessibleAccountIds(user);
  const allIds = [...new Set([...personalIds, ...sharedIds].map(String))];

  const transactions = await Transaction.find({
    accountId: { $in: allIds },
  })
    .sort({ createdAt: -1, date: -1 })
    .lean();

  return transactions.map((tx) => ({
    ...serializeTransaction(tx),
    accountId: String(tx.accountId),
    amount: parseFloat(tx.amount?.toString?.() || tx.amount || 0),
  }));
}
