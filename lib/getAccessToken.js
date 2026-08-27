import { auth } from "@/auth";

/**
 * Returns a valid Google access token for the current session.
 * Auth.js refreshes it automatically in the jwt callback when expired.
 */
export async function getGoogleAccessToken() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.error === "RefreshTokenError") return null;
  return session.accessToken || null;
}
