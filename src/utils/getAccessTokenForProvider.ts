import type { Account, Prisma, PrismaClient } from "@prisma/client"
import { type Session } from "next-auth";

export type Ctx = {
  prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>;
  session: Session | null;
};

export type KnownProvider = 'google' | 'googleAnalytics' | 'googleAds' | 'facebook';

export type RefreshedTokens = {
  ok: boolean
  access_token: string
  expires_in: number
}

export type RefreshError = {
  error: string
}

// One refreshAccessToken functions for each provider
const refreshAccessTokenForProvider = {
  google: refreshGoogleAccessToken,
  googleAds: refreshGoogleAccessToken,
  googleAnalytics: refreshGoogleAccessToken,
  facebook: refreshFacebookAccessToken,
}

// Returns a getter function for fetching a provider-specific access token from the database
export default function getAccessTokenForProvider (provider: KnownProvider) {
  const refreshAccessToken = refreshAccessTokenForProvider[provider];
  if (!refreshAccessToken) {
    throw new Error("Missing access token refresher for this provider")
  }
  // This is the getter function
  return async function getAccessToken (ctx: Ctx): Promise<string> {
    const dbAccount = await ctx.prisma.account.findFirst({
      where: {
        // Filter by user
        userId: ctx.session?.user?.id,
        // and provider
        provider,
      }
    });

    if (!dbAccount) {
      throw new Error("Cannot get access token, account not found for this provider");
    }
    const accessToken = dbAccount.access_token;
    const expiresAt = dbAccount.expires_at;

    if (!accessToken || !expiresAt) {
      throw new Error("Cannot get access token, account doesn't have one…");
    }

    if (expiresAt < Date.now() / 1000) {
      // token expired!
      return refreshAccessToken(ctx, dbAccount);
    }

    // No need to refresh token, return existing token
    return accessToken;
  }
}

export async function refreshGoogleAccessToken (ctx: Ctx, dbAccount: Account): Promise<string> {
  try {
    // See https://developers.google.com/identity/protocols/oauth2/web-server#exchange-authorization-code
    const url =
      `https://oauth2.googleapis.com/token?${(new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        grant_type: 'refresh_token',
        refresh_token: dbAccount.refresh_token || ''
      })).toString()}`

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    })

    const responseData = await response.json() as RefreshedTokens | RefreshError;

    if (!response.ok) {
      throw responseData
    }

    const data = responseData as RefreshedTokens;

    // Update database with refreshed token
    await ctx.prisma.account.update({
      where: {
        id: dbAccount.id
      },
      data: {
        access_token: data.access_token,
        expires_at: Math.round((Date.now() / 1000) + data.expires_in)
      }
    })

    return data.access_token;
  } catch (error) {
    console.error(error);
    throw new Error("RefreshGoogleAccessTokenError");
  }
}

export async function refreshFacebookAccessToken (ctx: Ctx, dbAccount: Account): Promise<string> {
  try {
    // See https://developers.facebook.com/docs/facebook-login/guides/access-tokens/get-long-lived
    const url =
      `https://graph.facebook.com/v15.0/oauth/access_token?${(new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: process.env.FACEBOOK_CLIENT_ID || '',
        client_secret: process.env.FACEBOOK_CLIENT_SECRET || '',
        fb_exchange_token: dbAccount.access_token || '',
      })).toString()}`

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      method: "POST",
    })

    const responseData = await response.json() as RefreshedTokens | RefreshError;

    if (!response.ok) {
      throw responseData
    }

    const data = responseData as RefreshedTokens;

    // Update database with refreshed token
    await ctx.prisma.account.update({
      where: {
        id: dbAccount.id
      },
      data: {
        access_token: data.access_token,
        expires_at: Math.round((Date.now() / 1000) + data.expires_in)
      }
    })

    return data.access_token;
  } catch (error) {
    console.error(error);
    throw new Error("RefreshGoogleAccessTokenError");
  }
}