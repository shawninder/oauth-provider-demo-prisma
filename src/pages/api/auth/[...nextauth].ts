import NextAuth, { type NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
// Prisma adapter for NextAuth, optional and can be removed
import { PrismaAdapter } from "@next-auth/prisma-adapter";

import { env } from "../../../env/server.mjs";
import { prisma } from "../../../server/db";

export const authOptions: NextAuthOptions = {
  callbacks: {
    async signIn ({ user, account, profile }) {
      // Refuse logging in via Google for accounts with an unverified email
      if (account?.provider === 'google' && profile?.email_verified === false) {
        console.error("Cannot log in with Google using unverified email");
        return false;
      }
      if (user) {
        // When signing in an existing user, save the access token in their account
        try {
          const dbUser = await prisma.user.findFirst({
            where: {
              id: user.id
            }
          });
          if (dbUser) {
            await prisma.account.update({
              where: {
                provider_providerAccountId: {
                  provider: account?.provider || '',
                  providerAccountId: account?.providerAccountId || '',
                }
              },
              data: {
                access_token: account?.access_token,
                expires_at: account?.expires_at,
                id_token: account?.id_token,
                refresh_token: account?.refresh_token,
                session_state: account?.session_state,
                scope: account?.scope
              }
            });
          }
        } catch (ex) {
          console.error(ex);
        }
      }
      return true;
    },
    // Include user.id on session
    session ({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }

      return session;
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
          scope: 'https://www.googleapis.com/auth/userinfo.email openid https://www.googleapis.com/auth/userinfo.profile'
        }
      },
      allowDangerousEmailAccountLinking: true // See https://next-auth.js.org/configuration/providers/oauth#allowdangerousemailaccountlinking-option
    }),
    FacebookProvider({
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true // See https://next-auth.js.org/configuration/providers/oauth#allowdangerousemailaccountlinking-option
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
