import { Suspense } from "react";
import { getUserAccounts, getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { AccountCard } from "./_components/account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { BudgetProgress } from "./_components/budget-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { DashboardOverview } from "./_components/transaction-overview";

export default async function DashboardPage() {
  const [accounts, transactions] = await Promise.all([
    getUserAccounts(),
    getDashboardData(),
  ]);

  const personalAccounts = accounts.filter((a) => !a.isShared);
  const sharedAccounts = accounts.filter((a) => a.isShared);
  const defaultAccount =
    personalAccounts.find((account) => account.isDefault) ||
    personalAccounts[0];

  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount._id);
  }

  return (
    <div className="space-y-8">
      <BudgetProgress
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
        hasAccount={personalAccounts.length > 0}
      />

      <DashboardOverview
        accounts={accounts}
        transactions={transactions || []}
      />

      {sharedAccounts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Shared team accounts</h2>
          <p className="text-sm text-muted-foreground">
            Spending here deducts from the admin&apos;s account balance within
            your limits.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sharedAccounts.map((account) => (
              <AccountCard key={account._id} account={account} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Personal accounts</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CreateAccountDrawer>
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed">
              <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full pt-5">
                <Plus className="h-10 w-10 mb-2" />
                <p className="text-sm font-medium">Add New Account</p>
              </CardContent>
            </Card>
          </CreateAccountDrawer>
          {personalAccounts.map((account) => (
            <AccountCard key={account._id} account={account} />
          ))}
        </div>
      </section>
    </div>
  );
}
