const http = require('node:http');

const INTERNAL_PREFIX = '/api/v1/internal/accounts';

function createAccountServiceServer() {
  return http.createServer((request, response) => {
    const parsedUrl = new URL(request.url || '/', 'http://account-service.local');
    const isAccountRoute =
      parsedUrl.pathname === INTERNAL_PREFIX ||
      parsedUrl.pathname.startsWith(`${INTERNAL_PREFIX}/`);

    if (!isAccountRoute) {
      response.writeHead(404, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'Account route not found' }));
      return;
    }

    // Demo response lets us verify exactly which internal path was forwarded.
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(
      JSON.stringify({
        service: 'account-service',
        method: request.method,
        forwardedPath: parsedUrl.pathname,
        query: parsedUrl.search,
      }),
    );
  });
}

if (require.main === module) {
  const port = Number(process.env.ACCOUNT_SERVICE_PORT || 8081);
  createAccountServiceServer().listen(port, () => {
    console.log(`Account service listening on http://localhost:${port}`);
  });
}

module.exports = { createAccountServiceServer };
