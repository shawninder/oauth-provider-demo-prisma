import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers';
import type { GoogleProfile } from 'next-auth/providers/google';

export default function GoogleAnalyticsProvider<P extends GoogleProfile> (options: OAuthUserConfig<P>): OAuthConfig<P> {
  const finalObject: OAuthConfig<P> = {
    id: "googleAnalytics",
    name: "Google Analytics",
    type: "oauth",
    version: "2.0",
    wellKnown: "https://accounts.google.com/.well-known/openid-configuration",
    authorization: {
      url: "https://accounts.google.com/o/oauth2/auth?response_type=code",
      params: {
        scope: "openid https://www.googleapis.com/auth/analytics.readonly",
        grant_type: "authorization_code",
      },
    },
    checks: ["pkce", "state"],
    accessTokenUrl: "https://accounts.google.com/o/oauth2/token",
    requestTokenUrl: "https://accounts.google.com/o/oauth2/auth",
    profileUrl: "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
    profile ({ sub: id, name, email, picture: image }) {
      // You can use the tokens, in case you want to fetch more profile information
      // For example several OAuth providers do not return email by default.
      // Depending on your provider, will have tokens like `access_token`, `id_token` and or `refresh_token`

      return {
        id,
        name,
        email,
        image
      };
    },
    ...options,
  };

  return finalObject;
}
