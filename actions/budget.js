"use server";

import { connectToDatabase } from "@/lib/mongoose";
import { revalidatePath } from "next/cache";
import { Transaction, Budget } from "@/models/allModels";
import { checkUser } from "@/lib/checkUser";

export async function getCurrentBudget(accountId) {
  try {
    await connectToDatabase();

    const user = await checkUser();
    if (!user) throw new Error("User not found");

    const budget = await Budget.findOne({ userId: user._id }).lean();

    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const expensesAgg = await Transaction.aggregate([
      {
        $match: {
          userId: user._id,
          type: "EXPENSE",
          ...(accountId ? { accountId } : {}),
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    const totalExpenses = expensesAgg.length ? parseFloat(expensesAgg[0].total.toString()) : 0;

    return {
      budget: budget ? { ...budget, amount: parseFloat(budget.amount.toString()) } : null,
      currentExpenses: totalExpenses,
    };
  } catch (error) {
    console.error("Error fetching budget:", error);
    throw error;
  }
}

export async function updateBudget(amount) {
  try {
    await connectToDatabase();

    const user = await checkUser();
    if (!user) throw new Error("User not found");

    const updated = await Budget.findOneAndUpdate(
      { userId: user._id },
      { $set: { amount } },
      { upsert: true, new: true }
    ).lean();

    revalidatePath("/dashboard");

    return {
      success: true,
      data: { ...updated, amount: parseFloat(updated.amount.toString()) },
    };
  } catch (error) {
    console.error("Error updating budget:", error);
    return { success: false, error: error.message };
  }
}
