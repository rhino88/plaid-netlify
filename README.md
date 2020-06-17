# Plaid Netlify

A [Netlify Functions](https://docs.netlify.com/functions/overview/) wrapper around [plaid](https://github.com/plaid/plaid-node). It is important to invoke Plaid calls from a backend service to avoid exposing [private identifiers](https://plaid.com/docs/quickstart/#api-keys) (`secret` and `client_id`) in client-side code, using a serverless implementation makes this easy to manage.

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/rhino88/plaid-netlify)

## Required Environment Variables

```
  PLAID_CLIENT_ID
  PLAID_SECRET
  PLAID_PUBLIC_KEY
  PLAID_ENVIRONMENT
```

## Running Locally

Prerequisite: Node 12

1. `npm i` or `yarn`
2. `netlify dev`
