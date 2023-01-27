import type { Prisma, PrismaClient } from "@prisma/client"
import { type Session } from "next-auth";

type Ctx = {
  prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>;
  session: Session | null;
}

// Returns a getter function for fetching a provider-specific access token from the database
export default function getAccessTokenForProvider (provider: string) {
  // This is the getter function
  return async function getAccessToken (ctx: Ctx): Promise<string> {
    const dbAccount = await ctx.prisma.account.findFirst({
      where: {
        userId: ctx.session?.user?.id, // Filter by user
        provider // and provider
      }
    });
    return dbAccount?.access_token || ''; // Return the access token for this user–provider pair, if found
  }
}