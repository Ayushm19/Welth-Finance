"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Shield,
  Clock,
  UserPlus,
  Wallet,
  PencilLine,
} from "lucide-react";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { renameTeam, revokeTeammate } from "@/actions/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { InviteTeammateDrawer } from "@/components/team/invite-teammate-drawer";
import { EditMemberPermissionsDrawer } from "@/components/team/edit-member-permissions-drawer";

function Avatar({ name, imageUrl }) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={imageUrl}
        alt=""
        className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm"
      />
    );
  }
  return (
    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 text-white flex items-center justify-center text-sm font-semibold shadow-sm">
      {(name || "A").charAt(0).toUpperCase()}
    </div>
  );
}

export function TeamAdminPanel({ data }) {
  const { ownedTeam, members = [], accounts = [] } = data || {};
  const [teamName, setTeamName] = useState(ownedTeam?.name || "");
  const [editingName, setEditingName] = useState(false);

  const {
    loading: renameLoading,
    fn: renameFn,
    data: renameData,
    error: renameError,
  } = useFetch(renameTeam);

  const {
    loading: revokeLoading,
    fn: revokeFn,
    data: revokeData,
    error: revokeError,
  } = useFetch(revokeTeammate);

  useEffect(() => {
    if (renameData?.success) {
      toast.success("Team name updated");
      setEditingName(false);
    }
  }, [renameData]);

  useEffect(() => {
    if (revokeData?.success) toast.success("Teammate removed");
  }, [revokeData]);

  useEffect(() => {
    const err = renameError || revokeError;
    if (err) toast.error(err.message || "Something went wrong");
  }, [renameError, revokeError]);

  const memberOnly = members.filter((m) => m.role === "MEMBER");

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="bg-gradient-to-r from-blue-600 via-blue-600 to-sky-500 px-6 py-6 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2 min-w-0">
              <p className="text-blue-100 text-sm">Your team · Admin</p>
              {!editingName ? (
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-2xl sm:text-3xl font-semibold truncate">
                    {ownedTeam?.name}
                  </h2>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/15"
                    onClick={() => setEditingName(true)}
                  >
                    <PencilLine className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                  <Input
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="bg-white text-slate-900"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <Button
                      className="bg-white text-blue-700 hover:bg-blue-50"
                      disabled={renameLoading}
                      onClick={() => renameFn({ name: teamName })}
                    >
                      {renameLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-white hover:bg-white/15"
                      onClick={() => {
                        setTeamName(ownedTeam?.name || "");
                        setEditingName(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-blue-100 text-sm">
                Invite people, share accounts, and control spend limits.
              </p>
            </div>
            <InviteTeammateDrawer accounts={accounts}>
              <Button className="bg-white text-blue-700 hover:bg-blue-50 shadow-md transition-transform hover:-translate-y-0.5">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite teammate
              </Button>
            </InviteTeammateDrawer>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Teammates</h3>
          <span className="text-sm text-muted-foreground">
            {memberOnly.length} people
          </span>
        </div>

        {memberOnly.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-slate-50 px-4 py-10 text-center">
            <p className="font-medium text-slate-800">No teammates yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Invite someone to share accounts and track their spending.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {memberOnly.map((member, index) => {
              const spent = Number(member.spentThisMonth || 0);
              const limit =
                member.monthlySpendLimit != null
                  ? Number(member.monthlySpendLimit)
                  : null;
              const pct =
                limit && limit > 0
                  ? Math.min(100, Math.round((spent / limit) * 100))
                  : 0;

              return (
                <li
                  key={member._id}
                  className="rounded-xl border p-4 transition-all duration-300 hover:border-blue-200 hover:shadow-sm team-fade-up"
                  style={{ animationDelay: `${0.05 + index * 0.05}s` }}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <Avatar name={member.name} imageUrl={member.imageUrl} />
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">
                            {member.name || member.email}
                          </p>
                          {member.status === "PENDING" ? (
                            <Badge variant="outline" className="bg-amber-50">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Member</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {member.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.accountNames?.length
                            ? member.accountNames.join(", ")
                            : "No accounts shared"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                      {member.status === "ACTIVE" && (
                        <div className="w-full sm:w-44 space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>${spent.toFixed(0)} spent</span>
                            <span>
                              {limit != null ? `$${limit.toFixed(0)}` : "∞"}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                pct >= 90
                                  ? "bg-red-500"
                                  : pct >= 70
                                    ? "bg-amber-400"
                                    : "bg-blue-500"
                              }`}
                              style={{ width: `${limit != null ? pct : 8}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <EditMemberPermissionsDrawer
                          member={member}
                          accounts={accounts}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={revokeLoading}
                          onClick={() => revokeFn(member._id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
            <Wallet className="h-4 w-4 text-slate-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Shareable accounts
              <Shield className="h-4 w-4 text-muted-foreground" />
            </h3>
            <p className="text-sm text-muted-foreground">
              These can be granted to teammates in permissions.
            </p>
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-slate-50 px-4 py-8 text-sm text-muted-foreground">
            Create a personal account on the dashboard first, then share it with
            teammates.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {accounts.map((account, index) => (
              <li
                key={account._id}
                className="rounded-xl border bg-gradient-to-br from-white to-slate-50 px-4 py-4 flex items-center justify-between transition-transform duration-300 hover:-translate-y-0.5 team-fade-up"
                style={{ animationDelay: `${0.1 + index * 0.05}s` }}
              >
                <div>
                  <p className="font-medium text-slate-900">{account.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {account.type}
                  </p>
                </div>
                <p className="font-semibold text-slate-900">
                  ${Number(account.balance || 0).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
