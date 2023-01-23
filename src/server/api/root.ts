import { createTRPCRouter } from "./trpc";
import { googleRouter } from "./routers/google";
import { facebookRouter } from "./routers/facebook";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  google: googleRouter,
  facebook: facebookRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
