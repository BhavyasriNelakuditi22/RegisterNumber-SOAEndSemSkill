# Banking account API gateway path rewrite

This Node.js demo includes a gateway and a mock account service:

- Public endpoint: `/accounts/**` on port `8080`
- Internal service endpoint: `/api/v1/internal/accounts/**` on port `8081`

The gateway matches `/accounts` and `/accounts/**`, replaces the public prefix with `/api/v1/internal/accounts`, and preserves the HTTP method, request body, and query string. Paths such as `/accounts-extra/...` do not match.

## Run locally

Requires Node.js 18 or newer. Open two terminals in this folder:

1. Run `npm run start:accounts` to start the account service.
2. Run `npm run start:gateway` to start the API gateway.
3. Request `http://localhost:8080/accounts/123?view=summary`.

The mock service response confirms the forwarding, for example:

```json
{
  "service": "account-service",
  "method": "GET",
  "forwardedPath": "/api/v1/internal/accounts/123",
  "query": "?view=summary"
}
```

The response fields are for this demo only; a production account service would return account data instead. Configure `ACCOUNT_SERVICE_URL`, `GATEWAY_PORT`, or `ACCOUNT_SERVICE_PORT` with environment variables as needed.

## Automated verification

Run `npm test` for unit and end-to-end checks covering route matching, prefix rewriting, query preservation, and actual gateway-to-service forwarding.
