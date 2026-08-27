"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { inviteTeammate } from "@/actions/team";
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

export function InviteTeammateDrawer({ accounts = [], children }) {
  const [open, setOpen] = useState(false);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      email: "",
      monthlySpendLimit: "",
    },
  });

  const { loading, fn: inviteFn, data, error } = useFetch(inviteTeammate);

  const toggleAccount = (id) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const onSubmit = async (values) => {
    if (selectedAccounts.length === 0) {
      toast.error("Select at least one account to share");
      return;
    }

    await inviteFn({
      email: values.email,
      accountIds: selectedAccounts,
      monthlySpendLimit: values.monthlySpendLimit,
    });
  };

  useEffect(() => {
    if (data?.success) {
      toast.success("Invite sent — they’ll see it when they sign in");
      reset();
      setSelectedAccounts([]);
      setOpen(false);
    }
  }, [data, reset]);

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to send invite");
    }
  }, [error]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Invite teammate</DrawerTitle>
        </DrawerHeader>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 px-4 pb-6 max-w-lg mx-auto w-full"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="teammate@gmail.com"
              {...register("email", { required: true })}
            />
            <p className="text-xs text-muted-foreground">
              They’ll see this invite on their dashboard after signing in with
              Google using this email.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Monthly spend limit</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 500 (leave empty for no limit)"
              {...register("monthlySpendLimit")}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Accounts they can use</label>
            {accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Create an account first, then invite teammates.
              </p>
            ) : (
              <div className="space-y-2 rounded-md border p-3">
                {accounts.map((account) => (
                  <label
                    key={account._id}
                    className="flex items-center gap-3 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedAccounts.includes(account._id)}
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
              type="submit"
              className="flex-1"
              disabled={loading || accounts.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send invite
                </>
              )}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
