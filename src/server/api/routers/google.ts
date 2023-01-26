import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";

import { enums, GoogleAdsApi, type OnQueryError } from "google-ads-api";

import getAccessTokenForProvider from '../../../utils/getAccessTokenForProvider';

const getAccessToken = getAccessTokenForProvider('google');

const googleAdsAPIClient = new GoogleAdsApi({
  client_id: process.env.GOOGLE_CLIENT_ID || '',
  client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
  developer_token: process.env.GOOGLE_DEV_TOKEN || '',
});

const onQueryError: OnQueryError = ({ error }) => {
  console.error('Query error', error);
}



export const googleRouter = createTRPCRouter({
  listAccessibleAdsCustomers: protectedProcedure.query(async ({ ctx }) => {
    return googleAdsAPIClient.listAccessibleCustomers(await getAccessToken(ctx));
  }),
  getCustomer: protectedProcedure.input(
    z.string()
  ).query(async ({ ctx, input: customer_id }) => {
    const customer = googleAdsAPIClient.Customer({
      customer_id,
      refresh_token: await getAccessToken(ctx),
    }, {
      onQueryError,
    });
    return customer;
  }),
  getReport: protectedProcedure.input(
    z.string()
  ).query(async ({ ctx, input: customer_id }) => {
    try {
      const customer = googleAdsAPIClient.Customer({
        customer_id,
        refresh_token: await getAccessToken(ctx),
      }, {
        onQueryError,
      });
      const report = await customer.report({ // Untested since I have no running campaigns to test with
        entity: "campaign",
        attributes: [
          "campaign.id",
          "campaign.name",
          "campaign.bidding_strategy_type",
          "campaign_budget.amount_micros",
        ],
        metrics: [
          "metrics.cost_micros",
          "metrics.clicks",
          "metrics.impressions",
          "metrics.all_conversions",
        ],
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
