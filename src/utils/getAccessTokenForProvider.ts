import type { Prisma, PrismaClient } from "@prisma/client"
import { type Session } from "next-auth";

type Ctx = {
  prisma: PrismaClient<Prisma.PrismaClientOptions, never, Prisma.RejectOnNotFound | Prisma.RejectPerOperation | undefined>;
  session: Session | null;
}

export default function getAccessTokenForProvider (provider: string) {
  return async function getAccessToken (ctx: Ctx): Promise<string> {
    const dbAccount = await ctx.prisma.account.findFirst({
      where: {
        userId: ctx.session?.user?.id,
        provider
      }
    });
    return dbAccount?.access_token || '';
  }
}