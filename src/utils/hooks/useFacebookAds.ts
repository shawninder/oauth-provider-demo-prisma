import { useState } from "react";
import { signIn } from "next-auth/react";
import { api } from "../api";

const facebookAdsScope = 'ads_read ads_management'

export default function useFacebookAds () {
  // Call this function to request an access token
  // with Facebook Ads permission scopes
  function connectFacebookAds () {
    void signIn('facebook', undefined, { scope: facebookAdsScope });
  }

  // Do we want to show the list of ad accounts?
  const [showFacebookAdAccounts, setShowFacebookAdAccounts] = useState(false);

  // Call this function to show/hide the list of ad accounts
  function callFacebookApi () {
    setShowFacebookAdAccounts((prev) => !prev);
  }

  // Get list of ad accounts from server via tRPC
  const {
    data: fbAdAccounts,
    isLoading: isFbAdAccountsLoading,
    error: fbAdAccountsError,
  } = api.facebook.getAdAccounts.useQuery(
    undefined,
    {
      // Only fetch data once if we want to show it (UI detail)
      enabled: showFacebookAdAccounts,
      refetchOnWindowFocus: false
    },
  );
  // Parse the JSON response into a javascript object
  const parsedFbAdAccounts = fbAdAccounts ? JSON.parse(fbAdAccounts as string) as {
    data: [{
      id: string,
      name: string
    }],
    paging?: {
      cursors: {
        before: string,
        after: string
      }
    }
  } : {
    data: []
  };

  // This is a status label we're going to show in the UI to track the status of this data
  const fbAdAccountStatus = isFbAdAccountsLoading ? 'Loading' : fbAdAccountsError ? 'error' : !!fbAdAccounts ? 'truthy' : 'falsy'

  // Which account from the list is selected
  const [fbAdAccountIdx, setFbAdAccountIdx] = useState(-1);

  // Whats the account ID?
  const fbAdAccountId = parsedFbAdAccounts.data?.[fbAdAccountIdx]?.id || '';

  // Get a report for an account from server via tRPC
  const {
    data: fbReport,
    isLoading: isFbReportLoading,
    error: fbReportError,
  } = api.facebook.getReport.useQuery(
    fbAdAccountId,
    {
      // Only fetch data once an account is selected from the list
      enabled: fbAdAccountIdx !== -1,
      refetchOnWindowFocus: false
    },
  );

  // This is a status label we're going to show in the UI to track the status of this data
  const fbReportStatus = isFbReportLoading ? 'Loading' : fbReportError ? 'error' : !!fbReport ? 'truthy' : 'falsy'

  return {
    connectFacebookAds,
    showFacebookAdAccounts,
    callFacebookApi,
    parsedFbAdAccounts,
    fbAdAccountsError,
    fbAdAccountStatus,
    fbAdAccountIdx,
    setFbAdAccountIdx,
    fbReport,
    fbReportError,
    fbReportStatus,
  }
}
