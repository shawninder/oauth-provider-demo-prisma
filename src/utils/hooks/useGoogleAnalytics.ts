import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { api } from "../api";

const googleAnalyticsScope = 'openid https://www.googleapis.com/auth/analytics.readonly'

export type AnalyticsAccount = {
  id: string
  name: string
}

export type AnalyticsAccounts = {
  items: AnalyticsAccount[]
}

export default function useGoogleAnalytics () {
  // Are we logged in?
  const { status: sessionStatus } = useSession();
  const loggedIn = sessionStatus === 'authenticated';

  // Call this function to request an access token
  // with Google Analytics permission scopes
  function connectGoogleAnalytics () {
    void signIn('google', undefined, { scope: googleAnalyticsScope });
  }

  // Do we want to show the list of accessible analytics accounts?
  const [showAnalyticsAccounts, setShowAnalyticsAccounts] = useState(false);

  // Call this function to toggle (show/hide) the list of accessible analytics accounts
  function listAnalyticsAccounts () {
    setShowAnalyticsAccounts((prev) => !prev);
  }

  // Get list of accessible analytics accounts from server via tRPC
  const {
    data: accessibleAnalyticsAccounts,
    isLoading: isAnalyticsAccountsListLoading,
    error: analyticsAccountsListError
  } = api.google.listAnalyticsAccounts.useQuery(
    undefined, // no input
    {
      // Only fetch data once we're logged in and only if we want to show it (UI detail)
      enabled: loggedIn && showAnalyticsAccounts,
      refetchOnWindowFocus: false
    },
  );

  const parsedAccessibleAnalyticsAccounts = accessibleAnalyticsAccounts ? JSON.parse(accessibleAnalyticsAccounts as string) as AnalyticsAccounts : { items: [] };

  // This is a status label we're going to show in the UI to track the status of this data
  const accessibleAnalyticsAccountsStatus = isAnalyticsAccountsListLoading ? 'Loading' : analyticsAccountsListError ? 'error' : parsedAccessibleAnalyticsAccounts ? 'truthy' : 'falsy'

  // Which account from the list is selected
  const [analyticsAccountsIdx, setAnalyticsAccountsIdx] = useState(-1);

  // What's that account's ID
  const accountId = parsedAccessibleAnalyticsAccounts?.items?.[analyticsAccountsIdx]?.id || ''

  // Get list of accessible ads customers from server via tRPC
  const {
    data: analyticsWebProperties,
    isLoading: isAnalyticsWebPropertiesLoading,
    error: analyticsWebPropertiesError
  } = api.google.listWebProperties.useQuery(
    accountId, // this requires a account to have been selected from the list, so…
    {
      // Only fetch data once a account is selected from the list
      enabled: analyticsAccountsIdx !== -1,
      refetchOnWindowFocus: false
    },
  )

  // This is a status label we're going to show in the UI to track the status of this data
  const analyticsWebPropertiesStatus = isAnalyticsWebPropertiesLoading ? 'Loading' : analyticsWebPropertiesError ? 'error' : !!analyticsWebProperties ? 'truthy' : 'falsy'

  return {
    connectGoogleAnalytics,
    showAnalyticsAccounts,
    listAnalyticsAccounts,
    parsedAccessibleAnalyticsAccounts,
    accessibleAnalyticsAccountsStatus,
    analyticsAccountsIdx,
    setAnalyticsAccountsIdx,
    analyticsAccountsListError,
    analyticsWebProperties,
    analyticsWebPropertiesError,
    analyticsWebPropertiesStatus,
  }
}
