"use client";

import { useEffect, useState } from "react";
import { Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { updateMemberAccess } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export function EditMemberPermissionsDrawer({
  member,
  accounts = [],
  children,
}) {
  const [open, setOpen] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [monthlySpendLimit, setMonthlySpendLimit] = useState("");

  const { loading, fn: updateFn, data, error } = useFetch(updateMemberAccess);

  useEffect(() => {
    if (!open || !member) return;
    setSelectedAccounts((member.accountAccess || []).map(String));
    setMonthlySpendLimit(
      member.monthlySpendLimit != null ? String(member.monthlySpendLimit) : ""
    );
  }, [open, member]);

  const toggleAccount = (id) => {
    const key = String(id);
    setSelectedAccounts((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  const onSave = async () => {
    if (selectedAccounts.length === 0) {
      toast.error("Select at least one account");
      return;
    }
    await updateFn({
      memberId: member._id,
      accountIds: selectedAccounts,
      monthlySpendLimit,
    });
  };

  useEffect(() => {
    if (data?.success) {
      toast.success("Permissions updated");
      setOpen(false);
    }
  }, [data]);

  useEffect(() => {
    if (error) toast.error(error.message || "Failed to update permissions");
  }, [error]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {children || (
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
            <Settings2 className="h-3.5 w-3.5 mr-1" />
            Permissions
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            Permissions · {member?.name || member?.email}
          </DrawerTitle>
        </DrawerHeader>
        <div className="space-y-4 px-4 pb-6 max-w-lg mx-auto w-full">
          <div className="space-y-2">
            <label className="text-sm font-medium">Monthly spend limit</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 500 (empty = no limit)"
              value={monthlySpendLimit}
              onChange={(e) => setMonthlySpendLimit(e.target.value)}
            />
            {member?.status === "ACTIVE" && (
              <p className="text-xs text-muted-foreground">
                Spent this month: $
                {Number(member.spentThisMonth || 0).toFixed(2)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Accounts they can use</label>
            {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Create an account first, then share it.
              </p>
            ) : (
              <div className="space-y-2 rounded-md border p-3">
                {accounts.map((account) => (
                  <label
                    key={account._id}
                    className="flex items-center gap-3 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedAccounts.includes(String(account._id))}
                      onCheckedChange={() => toggleAccount(account._id)}
                    />
                    <span className="flex-1">{account.name}</span>
                    <span className="text-muted-foreground">
                      ${Number(account.balance || 0).toFixed(2)}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <DrawerClose asChild>
              <Button type="button" variant="outline" className="flex-1">
                Cancel
              </Button>
            </DrawerClose>
            <Button
              className="flex-1"
              onClick={onSave}
              disabled={loading || accounts.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save permissions"
              )}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
