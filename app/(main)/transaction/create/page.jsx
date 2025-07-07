import { headers } from "next/headers";
import { getUserAccounts } from "@/actions/dashboard";
import { getTransaction } from "@/actions/transaction";
import { AddTransactionForm } from "../_components/transaction-form";
import { defaultCategories } from "@/data/categories";

export default async function AddTransactionPage() {
  const headersList = await headers(); // ✅ Use Next.js headers API
  const fullUrl = headersList.get("x-url") || ""; // Edge-safe fallback
  const url = new URL(fullUrl, "http://localhost"); // base required for parsing
  const editId = url.searchParams.get("edit"); // ✅ SAFE query param access

  const accounts = await getUserAccounts();

  let initialData = null;
  if (editId) {
    initialData = await getTransaction(editId);
  }

  return (
    <div className="max-w-3xl mx-auto px-5">
      <div className="flex justify-center md:justify-normal mb-8">
        <h1 className="text-5xl gradient-title">Add Transaction</h1>
      </div>
      <AddTransactionForm
        accounts={accounts}
        categories={defaultCategories}
        editMode={!!editId}
        initialData={initialData}
      />
    </div>
  );
}
