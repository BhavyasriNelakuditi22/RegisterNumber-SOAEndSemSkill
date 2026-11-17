const http = require('node:http');

const PUBLIC_PREFIX = '/accounts';
const INTERNAL_PREFIX = '/api/v1/internal/accounts';

/** Map a public gateway URL to the internal account-service URL. */
function rewriteAccountPath(requestUrl) {
  const parsedUrl = new URL(requestUrl, 'http://gateway.local');
  const { pathname, search } = parsedUrl;

  // Match exactly /accounts or a child path, not similarly named routes.
  if (pathname !== PUBLIC_PREFIX && !pathname.startsWith(`${PUBLIC_PREFIX}/`)) {
    return null;
  }

  const remainingPath = pathname.slice(PUBLIC_PREFIX.length);
  return `${INTERNAL_PREFIX}${remainingPath}${search}`;
}

function createGatewayServer({
  accountServiceUrl = process.env.ACCOUNT_SERVICE_URL || 'http://localhost:8081',
} = {}) {
  const target = new URL(accountServiceUrl);
  if (target.protocol !== 'http:') {
    throw new Error('This demo gateway supports HTTP account-service URLs only.');
  }

  return http.createServer((request, response) => {
    const rewrittenPath = rewriteAccountPath(request.url || '/');
    if (rewrittenPath === null) {
      response.writeHead(404, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'Route not found' }));
      return;
    }

    const proxyRequest = http.request(
      {
        hostname: target.hostname,
        port: target.port || 80,
        method: request.method,
        path: rewrittenPath,
        headers: { ...request.headers, host: target.host },
      },
      (targetResponse) => {
        response.writeHead(targetResponse.statusCode || 502, targetResponse.headers);
        targetResponse.pipe(response);
      },
    );

    proxyRequest.on('error', () => {
      if (!response.headersSent) {
        response.writeHead(502, { 'content-type': 'application/json' });
      }
      response.end(JSON.stringify({ error: 'Account service is unavailable' }));
    });

    request.pipe(proxyRequest);
  });
}

if (require.main === module) {
  const port = Number(process.env.GATEWAY_PORT || 8080);
  createGatewayServer().listen(port, () => {
    console.log(`API gateway listening on http://localhost:${port}`);
  });
}

module.exports = { createGatewayServer, rewriteAccountPath };
