import NextAuth, { type NextAuthOptions, type Account } from "next-auth";
import type { JWT } from 'next-auth/jwt'
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
// Prisma adapter for NextAuth, optional and can be removed
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { env } from "../../../env/server.mjs";
import { prisma } from "../../../server/db";

export const authOptions: NextAuthOptions = {
  // Include user.id and account.access_token on session
  callbacks: {
    async session ({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      const account = await prisma.account.findFirst({
        where: {
          userId: user.id,
        },
      });

      if (account) {
        const accessToken = account.access_token;
        session.accessToken = accessToken;
      }

      return session;
    },
  },
  events: {
    async signIn(payload) {
      if (!payload.account) {
        throw new Error("No account from signIn event")
      }
      await refreshAccessToken(payload.user.id, payload.account);
    },
  },
  // Configure one or more authentication providers
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    }),
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'https://www.googleapis.com/auth/userinfo.email openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/adwords'
        }
      }
    }),
    /**
     * ...add more providers here
     *
     * Most other providers require a bit more work than the Discord provider.
     * For example, the GitHub provider requires you to add the
     * `refresh_token_expires_in` field to the Account model. Refer to the
     * NextAuth.js docs for the provider you want to use. Example:
     * @see https://next-auth.js.org/providers/github
     */
  ],
};

export default NextAuth(authOptions);

async function refreshAccessToken (userId: string, newAccount: Account) {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: userId },
    });

    const userAccount = accounts[0];

    if (userAccount?.expires_at) {
      if (Date.now() < userAccount.expires_at) {
        return; // no refresh needed
      }
    }

    const refreshToken = userAccount?.refresh_token || userAccount?.access_token || undefined;

    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      grant_type: "refresh_token",
      refresh_token: refreshToken || '',
    })
    const url =
      `https://oauth2.googleapis.com/token?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    });

    const refreshedTokens = await response.json() as JWT;

    if (!response.ok) {
      if (refreshedTokens.error === "invalid_grant") {
        await prisma.account.update({
          where: { id: userAccount?.id },
          data: {
            refresh_token: newAccount.refresh_token || newAccount.access_token,
            access_token: newAccount.access_token,
            expires_at: newAccount.expires_at,
          },
        });
        return;
      }
      throw refreshedTokens;
    }

    await prisma.account.update({
      where: { id: userAccount?.id },
      data: {
        refresh_token: refreshedTokens.refresh_token ?? refreshToken,
        access_token: refreshedTokens.access_token || '',
        expires_at: Math.round(Date.now() / 1000) + (refreshedTokens.expires_in as number),
      },
    });
  } catch (error) {
    console.error('Error refreshing token', error);
  }
}