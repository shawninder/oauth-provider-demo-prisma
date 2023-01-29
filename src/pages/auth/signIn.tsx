import { getProviders, signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import NextHead from 'next/head';

import type { BuiltInProviderType } from "next-auth/providers";
import type { ClientSafeProvider, LiteralUnion } from "next-auth/react/types";
import type { GetServerSideProps } from "next";

export type PropsType = {
  providers: Record<LiteralUnion<BuiltInProviderType, string>, ClientSafeProvider>
};

// Custom Sign-In page to avoid listing all providers
export default function SignIn ({ providers }: PropsType) {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const { callbackUrl } = router.query;

  return Object.values(providers).map((provider) => {
    const name = provider.name;

    return (
      <div key={name}>
        <NextHead>
          {/* When SignIn is completed, redirect to the callback URL */}
          {sessionStatus === "authenticated" ? (
            <meta http-equiv="Refresh" content={`0; url='${callbackUrl as string}'`} />
          ): null}
        </NextHead>
        <button onClick={() => void signIn(provider.id as string)}>
          Sign in with {name}
        </button>
      </div>
    );
  });
}

export const getServerSideProps: GetServerSideProps = async () => {
  const providers = await getProviders()

  // This is where we choose the providers we want listed on the signIn page
  return {
    props: {
      providers: {
        google: providers?.google,
        facebook: providers?.facebook
      }
    },
  }
};
