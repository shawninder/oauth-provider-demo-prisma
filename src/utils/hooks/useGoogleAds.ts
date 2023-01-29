import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { api } from "../api";

const googleAdsScope = 'https://www.googleapis.com/auth/userinfo.email openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/adwords'

export default function useGoogleAds () {
  // Are we logged in?
  const { status: sessionStatus } = useSession();
  const loggedIn = sessionStatus === 'authenticated';

  // Call this function to request an access token
  // with Google Ads permission scopes
  function connectGoogleAds () {
    void signIn('googleAds', undefined, { scope: googleAdsScope });
  }

  // Do we want to show the list of accessible ads customers for this manager account?
  const [showAccessibleAdsCustomers, setShowAccessibleAdsCustomers] = useState(false);

  // Call this function to toggle (show/hide) the list of accessible ads customers
  function listAccessibleCustomers () {
    setShowAccessibleAdsCustomers((prev) => !prev);
  }

  // Get list of accessible ads customers from server via tRPC
  const {
    data: accessibleAdsCustomers,
    isLoading: isCustomerListLoading,
    error: customerListError
  } = api.google.listAccessibleAdsCustomers.useQuery(
    undefined, // no input
    {
      // Only fetch data once we're logged in and only if we want to show it (UI detail)
      enabled: loggedIn && showAccessibleAdsCustomers,
      refetchOnWindowFocus: false
    },
  );

  // This is a status label we're going to show in the UI to track the status of this data
  const accessibleAdsCustomersStatus = isCustomerListLoading ? 'Loading' : customerListError ? 'error' : accessibleAdsCustomers ? 'truthy' : 'falsy'

  // Which customer from the list is selected
  const [customerIdx, setCustomerIdx] = useState(-1);

  // What's that customer's ID
  const customerId = (
    accessibleAdsCustomers?.resource_names[customerIdx] || ''
  )?.replace('customers/', '') // Extracting the numeric ID

  // Get list of accessible ads customers from server via tRPC
  const {
    data: customer,
    isLoading: isCustomerLoading,
    error: customerError
  } = api.google.getCustomer.useQuery(
    customerId, // this requires a customer to have been selected from the list, so…
    {
      // Only fetch data once a customer is selected from the list
      enabled: customerIdx !== -1,
      refetchOnWindowFocus: false
    },
  )

  // This is a status label we're going to show in the UI to track the status of this data
  const customerStatus = isCustomerLoading ? 'Loading' : customerError ? 'error' : !!customer ? 'truthy' : 'falsy'

  // Get a report for a specific customer from server via tRPC
  const {
    data: report,
    isLoading: isReportLoading,
    error: reportError,
  } = api.google.getReport.useQuery(
    customerId, // Again we need a customer ID, so…
    {
      // Only fetch data once we have a customer
      enabled: customerStatus === 'truthy',
      refetchOnWindowFocus: false
    },
  );

  // This is a status label we're going to show in the UI to track the status of this data
  const reportStatus = isReportLoading ? 'Loading' : reportError ? 'error' : !!report ? 'truthy' : 'falsy' // Label

  return {
    connectGoogleAds,
    showAccessibleAdsCustomers,
    listAccessibleCustomers,
    accessibleAdsCustomers,
    accessibleAdsCustomersStatus,
    customerIdx,
    setCustomerIdx,
    customerListError,
    customer,
    customerStatus,
    report,
    reportError,
    reportStatus,
  }
}
