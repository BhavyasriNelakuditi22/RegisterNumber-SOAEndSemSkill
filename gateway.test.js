const test = require('node:test');
const assert = require('node:assert/strict');
const { createGatewayServer, rewriteAccountPath } = require('./gateway');
const { createAccountServiceServer } = require('./account-service');

async function listen(server) {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

async function close(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test('rewrites public account paths to the internal account route', () => {
  assert.equal(
    rewriteAccountPath('/accounts/123/transactions?limit=5'),
    '/api/v1/internal/accounts/123/transactions?limit=5',
  );
  assert.equal(rewriteAccountPath('/accounts'), '/api/v1/internal/accounts');
  assert.equal(rewriteAccountPath('/accounts-extra/123'), null);
});

test('forwards a gateway request to the account service with its rewritten path', async (t) => {
  const accountService = createAccountServiceServer();
  const accountServiceUrl = await listen(accountService);
  const gateway = createGatewayServer({ accountServiceUrl });
  const gatewayUrl = await listen(gateway);

  t.after(async () => {
    await close(gateway);
    await close(accountService);
  });

  const result = await fetch(`${gatewayUrl}/accounts/123?view=summary`);
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), {
    service: 'account-service',
    method: 'GET',
    forwardedPath: '/api/v1/internal/accounts/123',
    query: '?view=summary',
  });
});

test('returns 404 for paths outside the public account route', async (t) => {
  const accountService = createAccountServiceServer();
  const accountServiceUrl = await listen(accountService);
  const gateway = createGatewayServer({ accountServiceUrl });
  const gatewayUrl = await listen(gateway);

  t.after(async () => {
    await close(gateway);
    await close(accountService);
  });

  const result = await fetch(`${gatewayUrl}/customers/123`);
  assert.equal(result.status, 404);
});
