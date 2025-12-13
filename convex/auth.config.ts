export default {
  providers: [
    {
      domain: process.env.CLERK_ISSUER_URL || 'https://your-issuer.clerk.accounts.dev',
      applicationID: 'convex',
    },
  ],
}
