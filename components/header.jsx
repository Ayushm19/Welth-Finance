"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { PenBox, LayoutDashboard, UsersRound, LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import UserAvatar from "@/components/user-avatar";
import { SignInDialog } from "@/components/sign-in-dialog";

const Header = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [authCallback, setAuthCallback] = useState("/dashboard");
  const [isPendingDashboard, startDashboardTransition] = useTransition();
  const [isPendingTransaction, startTransactionTransition] = useTransition();
  const [isPendingTeam, startTeamTransition] = useTransition();

  const openAuth = (callbackUrl = "/dashboard") => {
    setAuthCallback(callbackUrl);
    setAuthOpen(true);
  };

  const handleDashboardClick = () => {
    startDashboardTransition(() => {
      router.push("/dashboard");
    });
  };

  const handleTransactionClick = () => {
    startTransactionTransition(() => {
      router.push("/transaction/create");
    });
  };

  const handleTeamClick = () => {
    startTeamTransition(() => {
      router.push("/team");
    });
  };

  const isSignedIn = status === "authenticated" && !!session?.user;

  return (
    <>
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="Welth Logo"
              width={200}
              height={60}
              className="h-12 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center space-x-4">
            {isSignedIn ? (
              <>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleDashboardClick}
                  disabled={isPendingDashboard}
                >
                  <LayoutDashboard size={18} />
                  <span className="hidden md:inline">
                    {isPendingDashboard ? "Loading..." : "Dashboard"}
                  </span>
                </Button>

                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                  onClick={handleTeamClick}
                  disabled={isPendingTeam}
                >
                  {isPendingTeam ? (
                    <span className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                  ) : (
                    <UsersRound size={18} />
                  )}
                  <span className="hidden md:inline">
                    {isPendingTeam ? "Opening..." : "Team"}
                  </span>
                </Button>

                <Button
                  className="flex items-center gap-2"
                  onClick={handleTransactionClick}
                  disabled={isPendingTransaction}
                >
                  <PenBox size={18} />
                  <span className="hidden md:inline">
                    {isPendingTransaction ? "Loading..." : "Add Transaction"}
                  </span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="rounded-full overflow-hidden border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="Account menu"
                    >
                      <UserAvatar
                        name={session.user.name || "Account"}
                        imageUrl={session.user.image}
                        size={36}
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {session.user.name || "User"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {session.user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600 focus:text-red-600"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : status !== "loading" ? (
              <>
                <Button variant="outline" onClick={() => openAuth("/dashboard")}>
                  Sign In
                </Button>
                <Button onClick={() => openAuth("/dashboard")}>
                  Get Started
                </Button>
              </>
            ) : null}
          </div>
        </nav>
      </header>

      <SignInDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        callbackUrl={authCallback}
      />
    </>
  );
};

export default Header;
