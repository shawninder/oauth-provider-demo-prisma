# Integrating with Providers

Allows users to log into various Ad data providers via oauth2 and aggregate data into a single dashboard.

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app` using Prisma and Next-Auth most notably.

## Get Started

- clone
- install: `npm i`
- init DB: `npx prisma db push` (first run only)
- Configure environments: `cp .env.example .env && cp .env.example .env.local` and edit both of those files as required.
- launch dev env: `npm run dev`

## Providers

**Warning:** You'll notice I'm using `allowDangerousEmailAccountLinking: true` on the Google and Facebook providers. This is safer than the name suggests because these providers verify emails before allow OAuth login. For providers where this isn't the case, e-mail verification will have to be implemented manually in a way than prevents any opportunity for account hijacking. Similarly, if you want to support account linking for accounts using different email addresses, that would have to be implemented manually as well.

### Google and the Google Ads API
You will need to add the following values to your environment variables via .env and/or .env.local, all of which you can get / set up in the Google Developer Console:
  - GOOGLE_CLIENT_ID
  - GOOGLE_CLIENT_SECRET
  - GOOGLE_DEV_TOKEN (see https://developers.google.com/google-ads/api/docs/first-call/dev-token)
  - GOOGLE_AUTH_REDIRECT (this should be http://localhost:3000/api/auth/callback/google when using an unmodified next-auth, as it is set it `.env.example`)

Depending on which API endpoints you reach, you may need to add additional scopes in the provider settings in `[...nextauth].ts`

Notice that I've installed `google-ads-api` from npm to help with making authenticated OAuth2 requests to the Google Ads API.

#### Accounts
The first API call demonstrated is `listAccessibleCustomers`. This returns a list of customers or client accounts which the logged in manager account can access. To access more client accounts, sub-accounts can be added via the API or via the Google Ads manager UI which is especially useful for setting up test accounts (see below).

Clicking one of the returned "customers" should demonstrated a second API call which fetches a report, although this just returns `[]` for test accounts.

#### Test accounts
- Fist, [create a test manager account](https://developers.google.com/google-ads/api/docs/first-call/test-accounts).
- Once you're logged into that account, go to Settings, Sub-account settings, and click the big "+", and then "Create a new account"
- Fill in some details here and invite yourself with you same email, selecting a "Standard" account type.

#### Links
- [NextAuth - Google Authentications for Nextjs](https://refine.dev/blog/nextauth-google-github-authentication-nextjs/)
- [Obtain your Developer Token](https://developers.google.com/google-ads/api/docs/first-call/dev-token)
- [Test Accounts](https://developers.google.com/google-ads/api/docs/first-call/test-accounts)

### Facebook and the Facebook Marketing API
You will need to add the following values to your environment variables via .env and/or .env.local, all of which you can get / set up in the Facebook Developers Console:
  - FACEBOOK_CLIENT_ID
  - FACEBOOK_CLIENT_SECRET

For the login to work, you'll have to set up Facebook Login (which is different than Facebook Login for Businesses) and provide a valid URL for your app's privacy policy (although I just used GitHub's privacy policy page for testing purposes and that seems to work for now…).

You'll also need to add `localhost` to your app's domains for it to work with local testing, as well as select a category and upload an app icon.

You can test this with real-world accounts or make test accounts from your Facebook App's dashboard under Add Roles. Unfortunately, things simply don't work when using test accounts and instead Facebook fails saying it can't load the URL and advising the domain be added in the account settings despite it being there already.

According to [the docs](https://developers.facebook.com/docs/marketing-api/overview/authorization/), to access the Marketing API, you need to create a Business App (as opposed to a gaming app or any other [app type](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/app-types)).

#### Links
- [Marketing API Authorization](https://developers.facebook.com/docs/marketing-api/overview/authorization/)
- [Facebook API Tutorial: Graph API, Access Token, and Developer Documentation Exaplained](https://www.kitchn.io/blog/intro-facebook-marketing-api)

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.
