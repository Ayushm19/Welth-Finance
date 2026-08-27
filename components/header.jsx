"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Button } from "./ui/button";
import { PenBox, LayoutDashboard, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
  const router = useRouter();
  const [isPendingDashboard, startDashboardTransition] = useTransition();
  const [isPendingTransaction, startTransactionTransition] = useTransition();
  const [isPendingTeam, startTeamTransition] = useTransition();

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

  return (
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
          <Show when="signed-in">
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

            <UserButton />
          </Show>

          <Show when="signed-out">
            <SignInButton mode="modal" forceRedirectUrl="/dashboard">
              <Button variant="outline">Sign In</Button>
            </SignInButton>
            <SignUpButton mode="modal" forceRedirectUrl="/dashboard">
              <Button>Get Started</Button>
            </SignUpButton>
          </Show>
        </div>
      </nav>
    </header>
  );
};

export default Header;
