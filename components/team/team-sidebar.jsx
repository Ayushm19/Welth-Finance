"use client";

import { useEffect, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  Shield,
  Clock,
  LogOut,
  Check,
  X,
  UsersRound,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import {
  revokeTeammate,
  acceptInviteById,
  declineInvite,
  leaveTeam,
} from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InviteTeammateDrawer } from "@/components/team/invite-teammate-drawer";
import { EditMemberPermissionsDrawer } from "@/components/team/edit-member-permissions-drawer";
import { CreateTeamDrawer } from "@/components/team/create-team-drawer";

function AdminAvatar({ name, imageUrl }) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name || "Admin"}
        width={40}
        height={40}
        className="h-10 w-10 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
      {(name || "A").charAt(0).toUpperCase()}
    </div>
  );
}

export function TeamSidebar({ data }) {
  const router = useRouter();
  const [isOpeningTeam, startTeamTransition] = useTransition();

  const {
    team,
    role,
    members = [],
    accounts = [],
    pendingInvites = [],
    joinedTeams = [],
    canCreateTeam = false,
    hasOwnedTeam = false,
    hasPersonalAccount = false,
  } = data || {};
  const isAdmin = role === "ADMIN";
  const isMember = role === "MEMBER";

  const openTeamPage = () => {
    startTeamTransition(() => {
      router.push("/team");
    });
  };

  const {
    loading: revokeLoading,
    fn: revokeFn,
    data: revokeData,
    error: revokeError,
  } = useFetch(revokeTeammate);

  const {
    loading: acceptLoading,
    fn: acceptFn,
    data: acceptData,
    error: acceptError,
  } = useFetch(acceptInviteById);

  const {
    loading: declineLoading,
    fn: declineFn,
    data: declineData,
    error: declineError,
  } = useFetch(declineInvite);

  const {
    loading: leaveLoading,
    fn: leaveFn,
    data: leaveData,
    error: leaveError,
  } = useFetch(leaveTeam);

  useEffect(() => {
    if (revokeData?.success) toast.success("Teammate removed");
  }, [revokeData]);

  useEffect(() => {
    if (acceptData?.success) toast.success("You joined the team");
  }, [acceptData]);

  useEffect(() => {
    if (declineData?.success) toast.success("Invite declined");
  }, [declineData]);

  useEffect(() => {
    if (leaveData?.success) toast.success("You left the team");
  }, [leaveData]);

  useEffect(() => {
    const err = revokeError || acceptError || declineError || leaveError;
    if (err) toast.error(err.message || "Something went wrong");
  }, [revokeError, acceptError, declineError, leaveError]);

  return (
    <aside className="w-full lg:w-72 shrink-0 border rounded-xl bg-white p-4 space-y-4 h-fit lg:sticky lg:top-28">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Users className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold truncate">
              {team?.name || "Your team"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAdmin
                ? "Admin"
                : isMember
                  ? `Member · ${team?.adminName}`
                  : "No team yet"}
            </p>
          </div>
        </div>
        {isAdmin && (
          <InviteTeammateDrawer accounts={accounts}>
            <Button size="sm" variant="outline" className="shrink-0">
              <UserPlus className="h-4 w-4" />
            </Button>
          </InviteTeammateDrawer>
        )}
      </div>

      {canCreateTeam && (
        <CreateTeamDrawer hasPersonalAccount={hasPersonalAccount}>
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <UsersRound className="h-4 w-4 mr-2" />
            Create your team
          </Button>
        </CreateTeamDrawer>
      )}

      {(hasOwnedTeam || isAdmin) && (
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isOpeningTeam}
          onClick={openTeamPage}
        >
          {isOpeningTeam ? (
            <>
              <span className="h-4 w-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Opening...
            </>
          ) : (
            <>
              <Settings className="h-4 w-4 mr-2" />
              Manage team
            </>
          )}
        </Button>
      )}

      {pendingInvites.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Invites for you
          </p>
          {pendingInvites.map((invite) => (
            <div
              key={invite._id}
              className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 space-y-3"
            >
              <div className="flex items-center gap-3">
                <AdminAvatar
                  name={invite.admin?.name}
                  imageUrl={invite.admin?.imageUrl}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {invite.admin?.name || "Admin"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    invited you to {invite.teamName}
                  </p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  Accounts:{" "}
                  {invite.accounts?.map((a) => a.name).join(", ") || "None"}
                </p>
                <p>
                  Monthly limit:{" "}
                  {invite.monthlySpendLimit != null
                    ? `$${Number(invite.monthlySpendLimit).toFixed(2)}`
                    : "No limit"}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={acceptLoading || declineLoading}
                  onClick={() => acceptFn(invite._id)}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={acceptLoading || declineLoading}
                  onClick={() => declineFn(invite._id)}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {team && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Teammates
          </p>

          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No teammates yet. Invite someone by email.
            </p>
          ) : (
            <ul className="space-y-3">
              {members.map((member) => (
                <li
                  key={member._id}
                  className="rounded-lg border p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <AdminAvatar
                        name={member.name}
                        imageUrl={member.imageUrl}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.name || member.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    {member.role === "ADMIN" ? (
                      <Badge variant="secondary" className="shrink-0">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    ) : member.status === "PENDING" ? (
                      <Badge variant="outline" className="shrink-0">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0">
                        Member
                      </Badge>
                    )}
                  </div>

                  {member.role === "MEMBER" && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>
                        Accounts:{" "}
                        {member.accountNames?.length
                          ? member.accountNames.join(", ")
                          : `${member.accountAccess?.length || 0} shared`}
                      </p>
                      <p>
                        Limit:{" "}
                        {member.monthlySpendLimit != null
                          ? `$${Number(member.monthlySpendLimit).toFixed(2)}/mo`
                          : "No limit"}
                      </p>
                      {member.status === "ACTIVE" && (
                        <p>
                          Spent this month: $
                          {Number(member.spentThisMonth || 0).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}

                  {isAdmin && member.role === "MEMBER" && (
                    <div className="flex flex-wrap gap-1">
                      <EditMemberPermissionsDrawer
                        member={member}
                        accounts={accounts}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-red-600"
                        disabled={revokeLoading}
                        onClick={() => revokeFn(member._id)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isAdmin && (
        <InviteTeammateDrawer accounts={accounts}>
          <Button className="w-full" variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite teammate
          </Button>
        </InviteTeammateDrawer>
      )}

      {hasOwnedTeam && joinedTeams.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Teams you&apos;re in
          </p>
          <ul className="space-y-3">
            {joinedTeams.map((joined) => (
              <li
                key={joined.membershipId || joined.teamId}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <AdminAvatar
                      name={joined.admin?.name}
                      imageUrl={joined.admin?.imageUrl}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {joined.teamName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Admin · {joined.admin?.name || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    Member
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    Accounts:{" "}
                    {joined.accountNames?.length
                      ? joined.accountNames.join(", ")
                      : `${joined.accountAccess?.length || 0} shared`}
                  </p>
                  <p>
                    Limit:{" "}
                    {joined.monthlySpendLimit != null
                      ? `$${Number(joined.monthlySpendLimit).toFixed(2)}/mo`
                      : "No limit"}
                  </p>
                  <p>
                    Spent this month: $
                    {Number(joined.spentThisMonth || 0).toFixed(2)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-red-600"
                  disabled={leaveLoading}
                  onClick={() =>
                    leaveFn(joined.membershipId || joined.teamId)
                  }
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" />
                  Leave
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isMember && (
        <Button
          className="w-full"
          variant="outline"
          disabled={leaveLoading}
          onClick={() =>
            leaveFn(joinedTeams[0]?.membershipId || joinedTeams[0]?.teamId)
          }
        >
          <LogOut className="h-4 w-4 mr-2" />
          Leave team
        </Button>
      )}

      {!hasOwnedTeam && !isAdmin && (
        <Button
          className="w-full border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
          variant="outline"
          disabled={isOpeningTeam}
          onClick={openTeamPage}
        >
          {isOpeningTeam ? (
            <>
              <span className="h-4 w-4 mr-2 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              Opening...
            </>
          ) : (
            "Open team page"
          )}
        </Button>
      )}
    </aside>
  );
}
