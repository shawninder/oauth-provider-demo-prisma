import type { Account, Prisma, PrismaClient } from "@prisma/client"
import { type Session } from "next-auth";

export type Ctx = {
  prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>;
  session: Session | null;
};

export type KnownProvider = 'google' | 'facebook';

export type RefreshedTokens = {
  ok: boolean
  access_token: string
  expires_in: number
}

export type RefreshError = {
  error: string
}

const refreshAccessTokenForProvider = {
  google: refreshGoogleAccessToken,
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
        userId: ctx.session?.user?.id, // Filter by user
        provider // and provider
      }
    });

    if (!dbAccount) {
      throw new Error("Cannot get access token, account not found for this provider")
    }

    const accessToken = dbAccount.access_token
    const expiresAt = dbAccount.expires_at

    if (!accessToken || !expiresAt) {
      throw new Error("Cannot get access token, account doesn't have one…")
    }

    if (expiresAt < Date.now() / 1000) {
      // token expired!
      return refreshAccessToken(ctx, dbAccount);
    }

    return accessToken; // Return the access token for this user–provider pair, if found
  }
}

export async function refreshGoogleAccessToken (ctx: Ctx, dbAccount: Account): Promise<string> {
  try {
    const url =
      `https://oauth2.googleapis.com/token?${(new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        grant_type: 'refresh_token',
        refresh_token: dbAccount.access_token || ''
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
    console.log(error);
    throw new Error("RefreshGoogleAccessTokenError");
  }
}