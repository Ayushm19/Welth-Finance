"use client";

import React, { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { PenBox, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
  const router = useRouter();
  const [isPendingDashboard, startDashboardTransition] = useTransition();
  const [isPendingTransaction, startTransactionTransition] = useTransition();

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
            className="flex items-center gap-2"
            onClick={handleTransactionClick}
            disabled={isPendingTransaction}
          >
            <PenBox size={18} />
            <span className="hidden md:inline">
              {isPendingTransaction ? "Loading..." : "Add Transaction"}
            </span>
          </Button>
        </div>
      </nav>
    </header>
  );
};

export default Header;
