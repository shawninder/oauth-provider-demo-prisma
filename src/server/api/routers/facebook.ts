import https from 'https'
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

const apiBaseUrl = 'https://graph.facebook.com/v15.0/'

export const facebookRouter = createTRPCRouter({
  getAdAccounts: protectedProcedure.query(async ({ ctx }) => {
    try {
      const queryUrl = 'me/adaccounts'
      const searchParams = new URLSearchParams({
        fields: 'id,name',
        access_token: ctx.session.accessTokens?.facebook || ''
      })
      const url = new URL(`${queryUrl}?${searchParams.toString()}`, apiBaseUrl)

      const response = await get(url)

      return response
    } catch (ex) {
      console.error(ex)
      return ex;
    }
  }),
  getReport: protectedProcedure.input(
    z.string()
  ).query(async ({ ctx, input: adAccountId }) => {
    try {
      const queryUrl = `${adAccountId}/campaigns`
      const searchParams = new URLSearchParams({
        fields: 'id,name,daily_budget',
        access_token: ctx.session.accessTokens?.facebook || ''
      })
      const url = new URL(`${queryUrl}?${searchParams.toString()}`, apiBaseUrl)

      const response = await get(url)

      return response
    } catch (ex) {
      console.error(ex);
      return ex;
    }
  }),
});

function get (url: URL): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(url, (res) => {
      let output = '';
      res.on('data', (chunk) => {
        output += chunk;
      });
      res.on('end', () => {
        return resolve(output);
      });
    });
    req.on('error', reject);
    req.end();
  });
}