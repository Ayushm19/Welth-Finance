import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

async function refreshAccessToken(token) {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshed = await response.json();
    if (!response.ok) throw refreshed;

    return {
      ...token,
      accessToken: refreshed.access_token,
      // Google access tokens typically expire in ~3600s
      accessTokenExpires:
        Math.floor(Date.now() / 1000) + (refreshed.expires_in ?? 3600),
      // Google may omit refresh_token on refresh — keep the old one
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error("Failed to refresh Google access token:", error);
    return {
      ...token,
      error: "RefreshTokenError",
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      // Required for Google to return a refresh_token
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          response_type: "code",
        },
      },
    }),
  ],
  // Cookie session (encrypted JWT) — classic session-based auth for the app
  session: {
    strategy: "jwt",
    maxAge: 3 * 24 * 60 * 60, // stay signed in for 3 days
    updateAge: 12 * 60 * 60, // refresh session cookie every 12h while active
  },
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial Google sign-in: persist OAuth tokens in the session JWT
      if (account) {
        return {
          ...token,
          googleId: profile?.sub || account.providerAccountId,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          accessTokenExpires: account.expires_at,
          error: undefined,
        };
      }

      if (profile?.sub) {
        token.googleId = profile.sub;
      }

      // Access token still valid
      if (
        token.accessTokenExpires &&
        Date.now() < token.accessTokenExpires * 1000 - 60_000
      ) {
        return token;
      }

      // Access token expired (or about to) — use refresh token
      if (token.refreshToken) {
        return refreshAccessToken(token);
      }

      return { ...token, error: "RefreshTokenError" };
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.googleId = token.googleId || token.sub;
      }

      // Expose expiry + error to the app; keep refresh token server-side only
      session.accessToken = token.accessToken;
      session.accessTokenExpires = token.accessTokenExpires;
      session.error = token.error;

      return session;
    },
  },
  trustHost: true,
});
