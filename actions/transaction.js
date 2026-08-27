"use server";

import { connectToDatabase } from "@/lib/mongoose";
import { Transaction, Account } from "@/models/allModels";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { checkUser } from "@/lib/checkUser";
import { assertAccountAccess } from "@/actions/team";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

const serializeAmount = (obj) => ({
  ...obj.toObject(),
  amount: parseFloat(obj.amount.toString()),
});

function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);
  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date;
}

export async function createTransaction(data) {
  await connectToDatabase();

  const user = await checkUser();
  if (!user) throw new Error("User not found");

  const access = await assertAccountAccess(user, data.accountId, {
    forExpense: data.type === "EXPENSE",
  });
  const { account, membership } = access;

  if (
    data.type === "EXPENSE" &&
    access.access === "SHARED" &&
    access.monthlySpendLimit != null
  ) {
    const nextTotal = (access.spentThisMonth || 0) + Number(data.amount);
    if (nextTotal > access.monthlySpendLimit) {
      throw new Error(
        `Monthly spend limit exceeded. Limit: $${access.monthlySpendLimit.toFixed(2)}, already spent: $${(access.spentThisMonth || 0).toFixed(2)}`
      );
    }
  }

  if (data.type === "INCOME" && access.access === "SHARED") {
    throw new Error("Only the account owner can add income to shared accounts");
  }

  const balanceChange = data.type === "EXPENSE" ? -data.amount : data.amount;
  const newBalance = parseFloat(account.balance.toString()) + balanceChange;

  const transaction = new Transaction({
    ...data,
    userId: user._id,
    teamId: membership?.teamId || account.teamId || null,
    nextRecurringDate:
      data.isRecurring && data.recurringInterval
        ? calculateNextRecurringDate(data.date, data.recurringInterval)
        : null,
  });

  await transaction.save();
  account.balance = newBalance;
  await account.save();

  revalidatePath("/dashboard");
  revalidatePath(`/account/${transaction.accountId}`);

  return { success: true, data: serializeAmount(transaction) };
}

export async function getTransaction(id) {
  await connectToDatabase();

  const user = await checkUser();
  if (!user) throw new Error("User not found");

  const transaction = await Transaction.findOne({ _id: id, userId: user._id });
  if (!transaction) throw new Error("Transaction not found");

  return serializeAmount(transaction);
}

export async function updateTransaction(id, data) {
  await connectToDatabase();

  const user = await checkUser();
  if (!user) throw new Error("User not found");

  const originalTransaction = await Transaction.findOne({ _id: id, userId: user._id });
  if (!originalTransaction) throw new Error("Transaction not found");

  const account = await Account.findById(data.accountId);
  if (!account) throw new Error("Account not found");

  const oldAmount = parseFloat(originalTransaction.amount.toString());
  const newAmount = data.amount;
  const oldChange = originalTransaction.type === "EXPENSE" ? -oldAmount : oldAmount;
  const newChange = data.type === "EXPENSE" ? -newAmount : newAmount;
  const netChange = newChange - oldChange;

  Object.assign(originalTransaction, {
    ...data,
    nextRecurringDate:
      data.isRecurring && data.recurringInterval
        ? calculateNextRecurringDate(data.date, data.recurringInterval)
        : null,
  });
  await originalTransaction.save();

  account.balance = parseFloat(account.balance.toString()) + netChange;
  await account.save();

  revalidatePath("/dashboard");
  revalidatePath(`/account/${data.accountId}`);

  return { success: true, data: serializeAmount(originalTransaction) };
}

export async function getUserTransactions(query = {}) {
  await connectToDatabase();

  const user = await checkUser();
  if (!user) throw new Error("User not found");

  const transactions = await Transaction.find({ userId: user._id, ...query })
    .populate("accountId")
    .sort({ date: -1 });

  return {
    success: true,
    data: transactions.map((tx) => ({
      ...tx.toObject(),
      amount: parseFloat(tx.amount.toString()),
    })),
  };
}

export async function scanReceipt(file) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "Missing GEMINI_API_KEY. Add a valid key from https://aistudio.google.com/apikey"
      );
    }

    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const arrayBuffer = await file.arrayBuffer();
    const base64String = Buffer.from(arrayBuffer).toString("base64");

    const prompt = `
      Analyze this receipt image and extract the following information in JSON format:
      {
        "amount": number,
        "date": "ISO date string",
        "description": "string",
        "merchantName": "string",
        "category": "string"
      }
      If it's not a receipt, return an empty object.
    `;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
    const data = JSON.parse(cleanedText);

    return {
      amount: parseFloat(data.amount),
      date: new Date(data.date),
      description: data.description,
      category: data.category,
      merchantName: data.merchantName,
    };
  } catch (error) {
    console.error("Error scanning receipt:", error);
    const message = String(error?.message || error);
    if (
      message.includes("API_KEY_INVALID") ||
      message.includes("API key not valid")
    ) {
      throw new Error(
        "Gemini API key is invalid. Create a new key at https://aistudio.google.com/apikey and set GEMINI_API_KEY in .env, then restart the server."
      );
    }
    throw new Error(message || "Failed to scan receipt");
  }
}
