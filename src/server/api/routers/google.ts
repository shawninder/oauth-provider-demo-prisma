import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

import { enums, GoogleAdsApi, type OnQueryError } from "google-ads-api";

import getAccessTokenForProvider from '../../../utils/getAccessTokenForProvider';

import get from '../../../utils/get';

// Getting an access token getter for google
const getAnalyticsAccessToken = getAccessTokenForProvider('googleAnalytics');
const getAdsAccessToken = getAccessTokenForProvider('googleAds');

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

const googleAnalyticsBaseURL = 'https://www.googleapis.com'

export const googleRouter = createTRPCRouter({

  // GOOGLE ADS

  // Set up a route for listing accessible Ads customer
  listAccessibleAdsCustomers: protectedProcedure.query(async ({ ctx }) => {
    return googleAdsAPIClient.listAccessibleCustomers(await getAdsAccessToken(ctx));
  }),
  // Set up a route for creating a Customer instance with the client
  getCustomer: protectedProcedure.input(
    z.string(), // The front-end will be sending the ID of the customer we want
  ).query(async ({ ctx, input: customer_id }) => {
    const customer = googleAdsAPIClient.Customer({
      customer_id,
      refresh_token: await getAdsAccessToken(ctx),
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
        refresh_token: await getAdsAccessToken(ctx),
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

  // GOOGLE ANALYTICS

  listAnalyticsAccounts: protectedProcedure.query(async ({ ctx }) => {
    try {
      // Reaching the accounts endpoint of the Google Analytics Management API
      const queryUrl = 'analytics/v3/management/accounts'
      const searchParams = new URLSearchParams({
        // Access token authorizing the request
        access_token: await getAnalyticsAccessToken(ctx)
      })
      // Final URL for the request
      const url = new URL(`${queryUrl}?${searchParams.toString()}`, googleAnalyticsBaseURL)

      // Perform the request
      const response = await get(url)

      return response
    } catch (ex) {
      console.error(ex);
      return ex;
    }
  }),

  listWebProperties: protectedProcedure.input(
    z.string() // The front-end will be sending the ID of the account we want
  ).query(async ({ ctx, input: accountId }) => {
    try {
      // Reaching the accounts endpoint of the Google Analytics Management API
      const queryUrl = `analytics/v3/management/accounts/${accountId}/webproperties`
      const searchParams = new URLSearchParams({
        // Access token authorizing the request
        access_token: await getAnalyticsAccessToken(ctx)
      })
      // Final URL for the request
      const url = new URL(`${queryUrl}?${searchParams.toString()}`, googleAnalyticsBaseURL)

      // Perform the request
      const response = await get(url)

      return response
    } catch (ex) {
      console.error(ex);
      return ex;
    }
  })
});
