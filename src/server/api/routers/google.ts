import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

import { enums, GoogleAdsApi, type OnQueryError } from "google-ads-api";

import getAccessTokenForProvider from '../../../utils/getAccessTokenForProvider';

// Getting an access token getter for google
const getAccessToken = getAccessTokenForProvider('google');

// Configure Google Ads API client
const googleAdsAPIClient = new GoogleAdsApi({
  client_id: process.env.GOOGLE_CLIENT_ID || '',
  client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
  developer_token: process.env.GOOGLE_DEV_TOKEN || '',
});

// Error handler for a request made with the Google Ads API client
const onQueryError: OnQueryError = ({ error }) => {
  console.error('Query error', error);
}

export const googleRouter = createTRPCRouter({
  // Set up a route for listing accessible Ads customer
  listAccessibleAdsCustomers: protectedProcedure.query(async ({ ctx }) => {
    return googleAdsAPIClient.listAccessibleCustomers(await getAccessToken(ctx));
  }),
  // Set up a route for creating a Customer instance with the client
  getCustomer: protectedProcedure.input(
    z.string(), // The front-end will be sending the ID of the customer we want
  ).query(async ({ ctx, input: customer_id }) => {
    const customer = googleAdsAPIClient.Customer({
      customer_id,
      refresh_token: await getAccessToken(ctx),
    }, {
      onQueryError,
    });
    return customer;
  }),
  // Set up a route for creating a Customer instance with the client
  getReport: protectedProcedure.input(
    z.string() // The front-end will be sending the ID of the customer we want
  ).query(async ({ ctx, input: customer_id }) => {
    try {
      // Create a Customer instance
      const customer = googleAdsAPIClient.Customer({
        customer_id,
        refresh_token: await getAccessToken(ctx),
      }, {
        onQueryError,
      });
      // Fetch a Report for this customer
      const report = await customer.report({
        entity: "campaign",
        // Decide what data you want back (untested)
        attributes: [
          "campaign.id",
          "campaign.name",
          "campaign.bidding_strategy_type",
          "campaign_budget.amount_micros",
        ],
        // Decide the metrics you want back (untested)
        metrics: [
          "metrics.cost_micros",
          "metrics.clicks",
          "metrics.impressions",
          "metrics.all_conversions",
        ],
        // Decide the constraints you want back (untested)
        constraints: {
          "campaign.status": enums.CampaignStatus.ENABLED,
        },
        limit: 20,
      });
      return report;
    } catch (ex) {
      console.error(ex)
      return ex
    }
  }),
});
