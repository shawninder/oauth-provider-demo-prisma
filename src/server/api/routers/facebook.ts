import https from 'https'
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

import getAccessTokenForProvider from '../../../utils/getAccessTokenForProvider';

// Getting an access token getter for facebook
const getAccessToken = getAccessTokenForProvider('facebook');

// Reaching the Graph API, see https://developers.facebook.com/docs/graph-api/
const apiBaseUrl = 'https://graph.facebook.com/v15.0/'

export const facebookRouter = createTRPCRouter({
  // Fetches all ad accounts for the logged-in user
  getAdAccounts: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Reaching the `me` endpoint and querying its `adaccounts` edge
      const queryUrl = 'me/adaccounts'
      const searchParams = new URLSearchParams({
        // Fields I want to retrieve for each returned account
        fields: 'id,name',
        // Access token authorizing the request
        access_token: await getAccessToken(ctx)
      })
      // Final URL for the request
      const url = new URL(`${queryUrl}?${searchParams.toString()}`, apiBaseUrl)

      // Perform the request
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
      // Reaching the Graph API endpoint for a specific ad account and querying its `campaigns` edge
      const queryUrl = `${adAccountId}/campaigns`
      const searchParams = new URLSearchParams({
        // Fields I want to retrieve for each returned campaign
        fields: 'id,name,daily_budget',
        // Access token authorizing the request
        access_token: await getAccessToken(ctx)
      })
      // Final URL for the request
      const url = new URL(`${queryUrl}?${searchParams.toString()}`, apiBaseUrl)

      // Perform the request
      const response = await get(url)

      return response
    } catch (ex) {
      console.error(ex);
      return ex;
    }
  }),
});

// Helper function to perform GET requests over https
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