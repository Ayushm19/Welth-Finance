import { inngest } from "./client";
import { connectToDatabase } from "@/lib/mongoose";
import EmailTemplate from "@/emails/template";
import { sendEmail } from "@/actions/send-email";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { User, Account, Transaction, Budget } from "@/models/allModels";

// 1. Recurring Transaction Processing
export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    name: "Process Recurring Transaction",
    throttle: {
      limit: 10,
      period: "1m",
      key: "event.data.userId",
    },
  },
  { event: "transaction.recurring.process" },
  async ({ event, step }) => {
    if (!event?.data?.transactionId || !event?.data?.userId) {
      console.error("Invalid event data:", event);
      return { error: "Missing required event data" };
    }

    await connectToDatabase();

    await step.run("process-transaction", async () => {
      const transaction = await Transaction.findOne({
        _id: event.data.transactionId,
        userId: event.data.userId,
      });

      if (!transaction || !isTransactionDue(transaction)) return;

      const newTransaction = await Transaction.create({
        type: transaction.type,
        amount: transaction.amount,
        description: `${transaction.description} (Recurring)`,
        date: new Date(),
        category: transaction.category,
        userId: transaction.userId,
        accountId: transaction.accountId,
        isRecurring: false,
      });

      const balanceChange =
        transaction.type === "EXPENSE"
          ? -parseFloat(transaction.amount.toString())
          : parseFloat(transaction.amount.toString());

      await Account.updateOne(
        { _id: transaction.accountId },
        { $inc: { balance: balanceChange } }
      );

      await Transaction.updateOne(
        { _id: transaction._id },
        {
          lastProcessed: new Date(),
          nextRecurringDate: calculateNextRecurringDate(new Date(), transaction.recurringInterval),
        }
      );

      // ✅ Send email notification to user
      const user = await User.findById(transaction.userId);
      const account = await Account.findById(transaction.accountId);

      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: `Recurring ${transaction.type} Processed - ₹${parseFloat(transaction.amount.toString()).toFixed(2)}`,
          react: EmailTemplate({
            userName: user.name,
            type: "recurring-transaction",
            data: {
              amount: parseFloat(transaction.amount.toString()).toFixed(2),
              category: transaction.category,
              date: new Date().toLocaleDateString(),
              description: `${transaction.description} (Recurring)`,
              accountName: account?.name || "Your Account",
              type: transaction.type,
            },
          }),
        });
      }
    });
  }
);

// 2. Trigger Recurring Transactions
export const triggerRecurringTransactions = inngest.createFunction(
  {
    id: "trigger-recurring-transactions",
    name: "Trigger Recurring Transactions",
  },
  { cron: "0 0 * * *" },
  async ({ step }) => {
    await connectToDatabase();

    const recurringTransactions = await step.run("fetch-recurring-transactions", async () => {
      return await Transaction.find({
        isRecurring: true,
        status: "COMPLETED",
        $or: [{ lastProcessed: null }, { nextRecurringDate: { $lte: new Date() } }],
      });
    });

    if (recurringTransactions.length > 0) {
      const events = recurringTransactions.map((transaction) => ({
        name: "transaction.recurring.process",
        data: {
          transactionId: transaction._id,
          userId: transaction.userId,
        },
      }));

      await inngest.send(events);
    }

    return { triggered: recurringTransactions.length };
  }
);

// 3. Monthly Report
export const generateMonthlyReports = inngest.createFunction(
  {
    id: "generate-monthly-reports",
    name: "Generate Monthly Reports",
  },
  { cron: "0 0 1 * *" },
  async ({ step }) => {
    await connectToDatabase();

    const users = await step.run("fetch-users", async () => {
      return await User.find();
    });

    for (const user of users) {
      await step.run(`generate-report-${user._id}`, async () => {
        const currentMonth = new Date();
        const stats = await getMonthlyStats(user._id, currentMonth);
        const monthName = currentMonth.toLocaleString("default", { month: "long" });

        const insights = await generateFinancialInsights(stats, monthName);

        await sendEmail({
          to: user.email,
          subject: `Your Monthly Financial Report - ${monthName}`,
          react: EmailTemplate({
            userName: user.name,
            type: "monthly-report",
            data: {
              stats,
              month: monthName,
              insights,
            },
          }),
        });
      });
    }

    return { processed: users.length };
  }
);

// 4. Budget Alerts
export const checkBudgetAlerts = inngest.createFunction(
  { name: "Check Budget Alerts" },
  { cron: "0 */6 * * *" },
  async ({ step }) => {
    await connectToDatabase();

    const budgets = await step.run("fetch-budgets", async () => {
      return await Budget.find();
    });

    for (const budget of budgets) {
      const user = await User.findById(budget.userId);
      const defaultAccount = await Account.findOne({ userId: budget.userId, isDefault: true });
      if (!defaultAccount) continue;

      await step.run(`check-budget-${budget._id}`, async () => {
        const startDate = new Date();
        startDate.setDate(1);

        const expenses = await Transaction.aggregate([
          {
            $match: {
              userId: budget.userId,
              accountId: defaultAccount._id,
              type: "EXPENSE",
              date: { $gte: startDate },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: "$amount" },
            },
          },
        ]);

        const totalExpenses = expenses.length ? parseFloat(expenses[0].total.toString()) : 0;
        const budgetAmount = parseFloat(budget.amount.toString());
        const percentageUsed = (totalExpenses / budgetAmount) * 100;

        const shouldSend =
          percentageUsed >= 80 &&
          (!budget.lastAlertSent || isNewMonth(new Date(budget.lastAlertSent), new Date()));

        if (shouldSend) {
          await sendEmail({
            to: user.email,
            subject: `Budget Alert for ${defaultAccount.name || "Your Account"}`,
            react: EmailTemplate({
              userName: user.name,
              type: "budget-alert",
              data: {
                percentageUsed: percentageUsed.toFixed(1),
                budgetAmount: budgetAmount.toFixed(1),
                totalExpenses: totalExpenses.toFixed(1),
                accountName: defaultAccount.name || "Your Account",
              },
            }),
          });

          await Budget.updateOne(
            { _id: budget._id },
            { lastAlertSent: new Date() }
          );
        }
      });
    }
  }
);

// Utils
function isNewMonth(lastDate, currentDate) {
  return (
    lastDate.getMonth() !== currentDate.getMonth() ||
    lastDate.getFullYear() !== currentDate.getFullYear()
  );
}

function isTransactionDue(transaction) {
  if (!transaction.lastProcessed) return true;
  const today = new Date();
  const nextDue = new Date(transaction.nextRecurringDate);
  return nextDue <= today;
}

function calculateNextRecurringDate(date, interval) {
  const next = new Date(date);
  switch (interval) {
    case "DAILY":
      next.setDate(next.getDate() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

async function getMonthlyStats(userId, month) {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const transactions = await Transaction.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
  });

  return transactions.reduce(
    (stats, t) => {
      const amount = parseFloat(t.amount.toString());
      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {},
      transactionCount: transactions.length,
    }
  );
}

async function generateFinancialInsights(stats, month) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  });

  const prompt = `
    Analyze this financial data and provide 3 concise, actionable insights.
    Focus on spending patterns and practical advice.
    Keep it friendly and conversational.

    Financial Data for ${month}:
    - Total Income: $${stats.totalIncome}
    - Total Expenses: $${stats.totalExpenses}
    - Net Income: $${stats.totalIncome - stats.totalExpenses}
    - Expense Categories: ${Object.entries(stats.byCategory)
      .map(([category, amount]) => `${category}: $${amount}`)
      .join(", ")}

    Format the response as a JSON array of strings, like this:
    ["insight 1", "insight 2", "insight 3"]
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    const cleanedText = text.replace(/```(?:json)?\\n?/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating insights:", error);
    return [
      "Your highest expense category this month might need attention.",
      "Consider setting up a budget for better financial management.",
      "Track your recurring expenses to identify potential savings.",
    ];
  }
}
