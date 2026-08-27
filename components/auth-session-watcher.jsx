"use client";

import { useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

/**
 * If Google refresh fails, force re-auth so the user gets a new refresh token.
 */
export default function AuthSessionWatcher({ children }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.error === "RefreshTokenError") {
      signOut({ redirect: false }).then(() => {
        signIn("google", { callbackUrl: "/dashboard" });
      });
    }
  }, [session?.error]);

  return children;
}
