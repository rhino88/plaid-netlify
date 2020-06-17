# Plaid Netlify

A [Netlify Functions](https://docs.netlify.com/functions/overview/) wrapper around [plaid](https://github.com/plaid/plaid-node).

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

```
npm ci
netlify dev
```
