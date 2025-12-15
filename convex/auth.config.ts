export default {
  providers: [
    {
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN || 'https://apparent-oryx-57.clerk.accounts.dev',
      applicationID: 'convex',
    },
  ],
}
