import { createTRPCRouter } from "./trpc";
import { googleRouter } from "./routers/google";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  google: googleRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
