import { type NextPage } from "next";
import Head from "next/head";
import { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

import { api } from "../utils/api";

const Home: NextPage = () => {
  const { status: sessionStatus, data: sessionData } = useSession();

  useEffect(() => {
    if (sessionData?.error === "RefreshAccessTokenError") {
      void signIn(); // Force sign in to hopefully resolve error
    }
  }, [sessionData]);

  const [showAccessibleAdsCustomers, setShowAccessibleAdsCustomers] = useState(false); // Do we want to get the Google Ads client accounts accessible from this manager account
  const [customerIdx, setCustomerIdx] = useState(-1); // Which from the list is selected

  const {
    data: accessibleAdsCustomers,
    isLoading: isCustomerListLoading,
    error: customerListError
  } = api.google.listAccessibleAdsCustomers.useQuery(
    undefined, // no input
    { enabled: sessionStatus === 'authenticated' && showAccessibleAdsCustomers, refetchOnWindowFocus: false },
  );

  const accessibleAdsCustomersStatus = isCustomerListLoading ? 'Loading' : customerListError ? 'error' : accessibleAdsCustomers ? 'truthy' : 'falsy'

  function listAccessibleCustomers () {
    setShowAccessibleAdsCustomers(true);
  }

  const customerId = (accessibleAdsCustomers?.resource_names[customerIdx] || '')?.replace('customers/', '') // Extracting the numeric ID

  const {
    data: customer,
    isLoading: isCustomerLoading,
    error: customerError
  } = api.google.getCustomer.useQuery(
    customerId,
    { enabled: customerIdx !== -1, refetchOnWindowFocus: false },
  )

  const customerStatus = isCustomerLoading ? 'Loading' : customerError ? 'error' : !!customer ? 'truthy' : 'falsy' // Label

  const {
    data: report,
    isLoading: isReportLoading,
    error: reportError
  } = api.google.getReport.useQuery(
    customerId,
    { enabled: customerStatus === 'truthy', refetchOnWindowFocus: false },
  )

  const reportStatus = isReportLoading ? 'Loading' : reportError ? 'error' : !!report ? 'truthy' : 'falsy' // Label

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
              <h2 className="text-white text-4xl font-bold mb-4">Google</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
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
                      <p>{reportError?.toString()}</p>
                      <pre>{JSON.stringify(report, null, 2)}</pre>
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
