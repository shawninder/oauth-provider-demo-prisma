import { type NextPage } from "next";
import Head from "next/head";
import { useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

import useGoogleAds from '../utils/hooks/useGoogleAds';
import useGoogleAnalytics from '../utils/hooks/useGoogleAnalytics';
import useFacebookAds from '../utils/hooks/useFacebookAds';

const Home: NextPage = () => {
  // Get a session object from Next-Auth
  const { status: sessionStatus, data: sessionData } = useSession();

  // When the session data changes
  useEffect(() => {
    // Check for recuperable errors
    if (sessionData?.error === "RefreshAccessTokenError") {
      void signIn(); // Force sign in to hopefully resolve error
    }
  }, [sessionData]);

  const {
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
  } = useGoogleAds();

  const {
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
  } = useGoogleAnalytics();

  const {
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
  } = useFacebookAds();

  return (
    <>
      <Head>
        <title>Integrating with Providers</title>
        <meta name="description" content="Operating various APIs on behalf of your users via OAuth" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
            Integrating with <span className="text-[hsl(280,100%,70%)]">Providers</span>
          </h1>
          <div className="flex flex-col items-center gap-2">
            <AuthShowcase />
          </div>

          {sessionStatus === 'authenticated' ? (
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-white text-4xl font-bold mb-4">Google Ads</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
                <a
                  className="flex flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20 cursor-pointer"
                  onClick={connectGoogleAds}
                  target="_blank"
                >
                  <h3 className="text-2xl font-bold">Connect with Google Ads →</h3>
                  <div className="text-lg">
                    This will ask you to give this app access to your account.
                  </div>
                </a>
                <a
                  className="flex flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20 cursor-pointer"
                  onClick={listAccessibleCustomers}
                  target="_blank"
                >
                  <h3 className="text-2xl font-bold">List Accessible Ads Customers →</h3>
                  <div className="text-lg">
                    These can be added as sub-accounts under the manager account holding the developer token either via the UI in the developer console, or via the API.
                  </div>
                </a>
                {showAccessibleAdsCustomers ? (
                  <div
                    className="flex flex-col gap-4 rounded-xl bg-white/10 p-4 text-white"
                  >
                    <h3 className="text-2xl font-bold">Accessible Ads Customers → {accessibleAdsCustomersStatus}</h3>
                    <div className="text-lg">
                      <pre>{JSON.stringify(accessibleAdsCustomers, null, 2)}</pre>
                      <p>{customerListError?.toString()}</p>
                      <ul>
                        {accessibleAdsCustomers?.resource_names.map((fullId, idx) => {
                          return (
                            <li key={fullId} className={idx === customerIdx ? 'text-red' : ''}>
                              <a className="underline cursor-pointer" onClick={() => {
                                idx === customerIdx ? setCustomerIdx(-1) : setCustomerIdx(idx)
                              }}>{fullId}</a>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                ) : null}
                {customerIdx !== -1 ? (
                  <div className="flex flex-col gap-4 rounded-xl bg-white/10 p-4 text-white">
                    <h3 className="text-2xl font-bold">Customer → {customerStatus}</h3>
                    <div className="text-lg">
                      <pre>{JSON.stringify(customer, null, 2)}</pre>
                    </div>
                  </div>
                ) : null}
                {customerIdx !== -1 ? (
                  <div className="flex flex-col gap-4 rounded-xl bg-white/10 p-4 text-white">
                    <h3 className="text-2xl font-bold">Customer Report → {reportStatus}</h3>
                    <div className="text-lg">
                      <p>{(reportError as object)?.toString()}</p>
                      <pre>{JSON.stringify(report, null, 2)}</pre>
                    </div>
                  </div>
                ) : null}
              </div>
              <h2 className="text-white text-4xl font-bold mb-4">Google Analytics</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
                <a
                  className="flex flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20 cursor-pointer"
                  onClick={connectGoogleAnalytics}
                  target="_blank"
                >
                  <h3 className="text-2xl font-bold">Connect with Google Analytics →</h3>
                  <div className="text-lg">
                    This will ask you to give this app access to your account.
                  </div>
                </a>
                <a
                  className="flex flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20 cursor-pointer"
                  onClick={listAnalyticsAccounts}
                  target="_blank"
                >
                  <h3 className="text-2xl font-bold">List Analytics Accounts →</h3>
                  <div className="text-lg">
                    This gets the analytics accounts available to the logged in user
                  </div>
                </a>
                {showAnalyticsAccounts ? (
                  <div
                    className="flex flex-col gap-4 rounded-xl bg-white/10 p-4 text-white"
                  >
                    <h3 className="text-2xl font-bold">Accessible Analytics Accounts → {accessibleAnalyticsAccountsStatus}</h3>
                    <div className="text-lg">
                      <pre>{JSON.stringify(parsedAccessibleAnalyticsAccounts)}</pre>
                      <p>{analyticsAccountsListError?.toString()}</p>
                      {(parsedAccessibleAnalyticsAccounts?.items?.length || -1) >= 0 ? (
                        <ul>
                          {parsedAccessibleAnalyticsAccounts.items.map(({ id, name }, idx) => {
                            return (
                              <li key={id} className={idx === customerIdx ? 'text-red' : ''}>
                                <a className="underline cursor-pointer" onClick={() => {
                                  idx === customerIdx ? setAnalyticsAccountsIdx(-1) : setAnalyticsAccountsIdx(idx)
                                }}>{name} ({id})</a>
                              </li>
                            )
                          })}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {analyticsAccountsIdx !== -1 ? (
                  <div className="flex flex-col gap-4 rounded-xl bg-white/10 p-4 text-white">
                    <h3 className="text-2xl font-bold">Analytics Account Web Properties → {analyticsWebPropertiesStatus}</h3>
                    <div className="text-lg">
                      <p>{analyticsWebPropertiesError?.toString()}</p>
                      <pre>{JSON.stringify(analyticsWebProperties, null, 2)}</pre>
                    </div>
                  </div>
                ) : null}
              </div>
              <h2 className="text-white text-4xl font-bold mb-4">Facebook</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
                <a
                  className="flex flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20 cursor-pointer"
                  onClick={connectFacebookAds}
                  target="_blank"
                >
                  <h3 className="text-2xl font-bold">Connect with Facebook Marketing API →</h3>
                  <div className="text-lg">
                    This will ask you to give this app access to your account.
                  </div>
                </a>
                <a
                  className="flex flex-col gap-4 rounded-xl bg-white/10 p-4 text-white hover:bg-white/20 cursor-pointer"
                  onClick={callFacebookApi}
                  target="_blank"
                >
                  <h3 className="text-2xl font-bold">Call Facebook API →</h3>
                  <div className="text-lg">
                    This demonstrates calling the API by fetching the ad campaigns for the logged-in user.
                  </div>
                </a>
                {showFacebookAdAccounts ? (
                  <div className="flex flex-col gap-4 rounded-xl bg-white/10 p-4 text-white">
                    <h3 className="text-2xl font-bold">Report → {fbAdAccountStatus}</h3>
                    <div className="text-lg">
                      <p>{fbAdAccountsError?.toString()}</p>
                      <pre>{JSON.stringify(parsedFbAdAccounts, null, 2)}</pre>
                      <ul>{parsedFbAdAccounts.data.map(({ id, name }, idx) => {
                        return (
                          <li key={id} className={idx === fbAdAccountIdx ? 'text-red' : ''}>
                            <a className="underline cursor-pointer" onClick={() => {
                                idx === fbAdAccountIdx ? setFbAdAccountIdx(-1) : setFbAdAccountIdx(idx)
                              }}>{name} ({id})</a>
                            </li>
                        )
                      })}</ul>
                    </div>
                  </div>
                ) : null}
                {fbAdAccountIdx !== -1 ? (
                  <div className="flex flex-col gap-4 rounded-xl bg-white/10 p-4 text-white">
                    <h3 className="text-2xl font-bold">Ad Account → {fbReportStatus}</h3>
                    <div className="text-lg">
                      <p>{fbReportError?.toString()}</p>
                      <pre>{JSON.stringify(fbReport, null, 2)}</pre>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
};

export default Home;

const AuthShowcase: React.FC = () => {
  const { data: sessionData } = useSession();

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
};
