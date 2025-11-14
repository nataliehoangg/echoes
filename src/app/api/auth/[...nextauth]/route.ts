import NextAuth, { type NextAuthOptions } from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

const scopes = [
  "user-read-email",
  "playlist-modify-private",
  "playlist-modify-public",
].join(" ");

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID ?? "",
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "",
      authorization: `https://accounts.spotify.com/authorize?scope=${encodeURIComponent(scopes)}`,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.display_name ?? profile.id ?? profile.email ?? "Spotify User",
          email: profile.email,
          image: profile.images?.[0]?.url ?? null,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = (account.expires_at ?? 0) * 1000;
      }

      // Refresh token if expired
      if (token.expiresAt && Date.now() >= token.expiresAt - 60000) {
        // Refresh 1 minute before expiry
        try {
          const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${Buffer.from(
                `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`,
              ).toString("base64")}`,
            },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
            }),
          });

          if (response.ok) {
            const refreshed = (await response.json()) as {
              access_token: string;
              expires_in: number;
            };
            token.accessToken = refreshed.access_token;
            token.expiresAt = Date.now() + refreshed.expires_in * 1000;
          }
        } catch (error) {
          console.error("Token refresh failed:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.refreshToken = token.refreshToken as string | undefined;
      session.expiresAt = token.expiresAt as number | undefined;
      return session;
    },
  },
};

const authHandler = NextAuth(authOptions);

export { authHandler as GET, authHandler as POST };