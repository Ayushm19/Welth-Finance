"use client";

import { useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { acceptInviteByToken, declineInvite } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Show, SignInButton } from "@clerk/nextjs";

export default function InviteAcceptClient({ token, invite }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const accept = () => {
    startTransition(async () => {
      try {
        await acceptInviteByToken(token);
        toast.success("You joined the team");
        router.push("/dashboard");
        router.refresh();
      } catch (error) {
        toast.error(error.message || "Could not accept invite");
      }
    });
  };

  const decline = () => {
    if (!invite?._id) return;
    startTransition(async () => {
      try {
        await declineInvite(invite._id);
        toast.success("Invite declined");
        router.push("/dashboard");
        router.refresh();
      } catch (error) {
        toast.error(error.message || "Could not decline invite");
      }
    });
  };

  if (!invite) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-20">
        <h1 className="text-3xl font-bold">Invite unavailable</h1>
        <p className="text-muted-foreground">
          This invite is invalid, declined, or already used.
        </p>
        <Button onClick={() => router.push("/dashboard")}>Go to dashboard</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center space-y-5 py-20">
      <div className="flex flex-col items-center gap-3">
        {invite.admin?.imageUrl ? (
          <Image
            src={invite.admin.imageUrl}
            alt={invite.admin.name || "Admin"}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xl font-semibold">
            {(invite.admin?.name || "A").charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">{invite.teamName}</h1>
          <p className="text-muted-foreground mt-1">
            <strong>{invite.admin?.name || "Someone"}</strong> invited you to
            join as a teammate
          </p>
        </div>
      </div>

      <div className="rounded-lg border p-4 text-left text-sm space-y-2 bg-slate-50">
        <p>
          <span className="text-muted-foreground">Accounts: </span>
          {invite.accounts?.map((a) => a.name).join(", ") || "None selected"}
        </p>
        <p>
          <span className="text-muted-foreground">Monthly spend limit: </span>
          {invite.monthlySpendLimit != null
            ? `$${Number(invite.monthlySpendLimit).toFixed(2)}`
            : "No limit"}
        </p>
        <p className="text-xs text-muted-foreground">
          Sign in with <strong>{invite.email}</strong> to respond.
        </p>
      </div>

      <Show when="signed-out">
        <SignInButton mode="modal" forceRedirectUrl={`/invite/${token}`}>
          <Button className="w-full">Sign in to continue</Button>
        </SignInButton>
      </Show>

      <Show when="signed-in">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={decline}
            disabled={pending}
          >
            Decline
          </Button>
          <Button className="flex-1" onClick={accept} disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Working...
              </>
            ) : (
              "Accept invite"
            )}
          </Button>
        </div>
      </Show>
    </div>
  );
}
