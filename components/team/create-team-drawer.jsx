"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { createTeam } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

export function CreateTeamDrawer({ children, hasPersonalAccount = false }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [name, setName] = useState("");
  const { loading, fn: createFn, data, error } = useFetch(createTeam);

  const handleOpenChange = (next) => {
    if (next && !hasPersonalAccount) {
      toast.message("Create an account first for your team", {
        description:
          "Add a personal account, then you can create and share your team.",
      });
      setAccountOpen(true);
      setOpen(false);
      return;
    }
    setOpen(next);
  };

  const handleAccountOpenChange = (next) => {
    setAccountOpen(next);
    if (!next) {
      router.refresh();
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!hasPersonalAccount) {
      toast.message("Create an account first for your team");
      setOpen(false);
      setAccountOpen(true);
      return;
    }
    await createFn({ name });
  };

  useEffect(() => {
    if (data?.success) {
      toast.success("Team created");
      setOpen(false);
      setName("");
      router.push("/team");
      router.refresh();
    }
  }, [data, router]);

  useEffect(() => {
    if (error) toast.error(error.message || "Failed to create team");
  }, [error]);

  return (
    <>
      <CreateAccountDrawer
        open={accountOpen}
        onOpenChange={handleAccountOpenChange}
      />

      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Create your team</DrawerTitle>
          </DrawerHeader>
          <form
            onSubmit={onSubmit}
            className="space-y-4 px-4 pb-6 max-w-lg mx-auto w-full"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Team name</label>
              <Input
                placeholder="e.g. Family Budget"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You&apos;ll be the admin. You can still stay on other teams as a
                member.
              </p>
            </div>
            <div className="flex gap-3">
              <DrawerClose asChild>
                <Button type="button" variant="outline" className="flex-1">
                  Cancel
                </Button>
              </DrawerClose>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UsersRound className="mr-2 h-4 w-4" />
                    Create team
                  </>
                )}
              </Button>
            </div>
          </form>
        </DrawerContent>
      </Drawer>
    </>
  );
}
