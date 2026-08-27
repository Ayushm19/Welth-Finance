"use client";

import { SessionProvider } from "next-auth/react";
import AuthSessionWatcher from "@/components/auth-session-watcher";

export default function Providers({ children }) {
  return (
    <SessionProvider refetchInterval={5 * 60} refetchOnWindowFocus>
      <AuthSessionWatcher>{children}</AuthSessionWatcher>
    </SessionProvider>
  );
}
