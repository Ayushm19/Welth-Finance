"use client";

import Link from "next/link";
import { ArrowLeft, UsersRound, Sparkles, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateTeamDrawer } from "@/components/team/create-team-drawer";
import { TeamAdminPanel } from "@/components/team/team-admin-panel";

export function TeamWorkspace({ data }) {
  const joinedCount = data.joinedTeams?.length || 0;
  const pendingCount = data.pendingInvites?.length || 0;
  const memberCount =
    data.members?.filter((m) => m.role === "MEMBER").length || 0;

  return (
    <div className="relative px-5 pb-10">
      <div className="pointer-events-none absolute inset-x-0 -top-8 h-64 team-hero-glow" />

      <div className="relative space-y-8">
        <div className="team-fade-up flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1 text-xs font-medium text-blue-700 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Collaborate on shared money
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tight gradient-title">
              Team
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">
              Invite teammates, share accounts, and control spend limits — all
              in one place.
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              {data.ownedTeam && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                  Admin of {data.ownedTeam.name}
                </span>
              )}
              {joinedCount > 0 && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                  Joined {joinedCount} team{joinedCount > 1 ? "s" : ""}
                </span>
              )}
              {pendingCount > 0 && (
                <span className="rounded-full bg-amber-50 text-amber-800 px-3 py-1">
                  {pendingCount} pending invite{pendingCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            className="self-start sm:self-auto border-slate-200 bg-white/80 backdrop-blur hover:bg-white"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>

        {!data.ownedTeam ? (
          <section className="team-fade-up team-fade-up-delay-1 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/40 to-sky-50/60 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center gap-8">
              <div className="flex-1 space-y-4">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
                  <UsersRound className="h-6 w-6" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
                  Create your own team
                </h2>
                <p className="text-muted-foreground max-w-xl">
                  You&apos;re not an admin yet. Start a team to invite people,
                  share accounts, and set monthly limits — even if you already
                  belong to someone else&apos;s team.
                </p>
                <CreateTeamDrawer hasPersonalAccount={data.hasPersonalAccount}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-transform hover:-translate-y-0.5">
                    <UsersRound className="h-4 w-4 mr-2" />
                    Create team
                  </Button>
                </CreateTeamDrawer>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full lg:w-72">
                {[
                  "Invite by email",
                  "Share accounts",
                  "Spend limits",
                  "Live activity",
                ].map((label, i) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/70 bg-white/70 px-3 py-4 text-sm font-medium text-slate-700 shadow-sm backdrop-blur team-fade-up"
                    style={{ animationDelay: `${0.2 + i * 0.06}s` }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <div className="team-fade-up team-fade-up-delay-1 space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="Teammates" value={String(memberCount)} />
              <StatCard
                label="Shareable accounts"
                value={String(data.accounts?.length || 0)}
              />
              <StatCard
                label="Pending invites"
                value={String(
                  data.members?.filter((m) => m.status === "PENDING").length ||
                    0
                )}
              />
            </div>
            <TeamAdminPanel data={data} />
          </div>
        )}

        {(joinedCount > 0 || pendingCount > 0) && (
          <section className="team-fade-up team-fade-up-delay-2 space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Teams you&apos;ve joined
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Shared accounts from teams where you&apos;re a member.
                </p>
              </div>
            </div>

            {pendingCount > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-900">
                <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                <p>
                  You have {pendingCount} pending invite
                  {pendingCount > 1 ? "s" : ""}. Accept them from the dashboard
                  sidebar.
                </p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {data.joinedTeams.map((t, index) => (
                <article
                  key={t.teamId}
                  className="group rounded-2xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md team-fade-up"
                  style={{ animationDelay: `${0.2 + index * 0.07}s` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {t.admin?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={t.admin.imageUrl}
                          alt=""
                          className="h-11 w-11 rounded-full object-cover ring-2 ring-blue-50"
                        />
                      ) : (
                        <div className="h-11 w-11 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                          {(t.admin?.name || "A").charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate text-slate-900">
                          {t.teamName}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          Admin · {t.admin?.name || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      Member
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 px-3 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Limit
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        {t.monthlySpendLimit != null
                          ? `$${Number(t.monthlySpendLimit).toFixed(0)}/mo`
                          : "None"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-3 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Spent
                      </p>
                      <p className="mt-1 font-semibold text-slate-900">
                        ${Number(t.spentThisMonth || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border bg-white/90 px-4 py-4 shadow-sm backdrop-blur transition-transform duration-300 hover:-translate-y-0.5">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}
