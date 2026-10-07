import test from 'node:test';
import assert from 'node:assert/strict';
import {authEntryUrl, BuyerError, createBuyerClient, parsePrice, paymentPresentation, type CheckoutResult} from './client.ts';

const orderId = 'a'.repeat(32);
const buyerRef = 'b'.repeat(64);
const stripeResult: CheckoutResult = {
  mode: 'sandbox',
  orderId,
  checkoutUrl: 'https://checkout.stripe.com/c/pay/fixture',
  amountCents: 20000,
  currency: 'USD',
};

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

function response(body: unknown, status = 200): Response {
  return new Response(body instanceof Blob ? body : JSON.stringify(body), {
    status,
    headers: {'content-type': body instanceof Blob ? body.type : 'application/json'},
  });
}

test('price parsing uses exact integer cents and server bounds', () => {
  assert.equal(parsePrice('50.01'), 5001);
  assert.equal(parsePrice('1000'), 100000);
  for (const invalid of ['49.99', '1000.01', '50.001', '1e3', '-50', '']) {
    assert.throws(() => parsePrice(invalid), (error: unknown) => error instanceof BuyerError && error.code === 'amount-invalid');
  }
});

test('auth entry preserves the exact checkout route and query', () => {
  assert.equal(authEntryUrl('login', '/checkout', '?amount=200'), '/auth/login?returnTo=%2Fcheckout%3Famount%3D200');
  assert.equal(authEntryUrl('register', '/purchase/return', '?provider=stripe'), '/auth/register?returnTo=%2Fpurchase%2Freturn');
});

test('request key is persisted before dispatch and reused after an uncertain response', async () => {
  const storage = memoryStorage();
  const keys: string[] = [];
  let loseFirstResponse = true;
  const request = async (input: string | URL | Request, init?: RequestInit) => {
    const path = String(input);
    if (path === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    keys.push((JSON.parse(String(init?.body)) as {requestKey: string}).requestKey);
    if (loseFirstResponse) {
      loseFirstResponse = false;
      throw new Error('response lost');
    }
    return response(stripeResult);
  };

  const first = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'stable-key'});
  await assert.rejects(() => first.create({provider: 'stripe', amountCents: 20000}));
  assert.equal(first.pending()?.requestKey, 'stable-key');
  assert.throws(() => first.reset(), (error: unknown) => error instanceof BuyerError && error.code === 'payment-outcome-uncertain');

  const reloaded = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'unused'});
  assert.deepEqual(await reloaded.create({provider: 'stripe', amountCents: 20000}), stripeResult);
  assert.deepEqual(keys, ['stable-key', 'stable-key']);
});

test('a result-less key cannot be retried under a different account', async () => {
  const storage = memoryStorage();
  let currentBuyer = buyerRef;
  let creations = 0;
  const request = async (input: string | URL | Request) => {
    if (String(input) === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef: currentBuyer});
    creations += 1;
    throw new Error('response lost');
  };
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'original-key'});
  await assert.rejects(() => client.create({provider: 'stripe', amountCents: 20000}));
  assert.equal(creations, 1);
  currentBuyer = 'c'.repeat(64);
  await assert.rejects(() => client.hydrate(currentBuyer), (error: unknown) => error instanceof BuyerError && error.code === 'checkout-account-mismatch');
  await assert.rejects(() => client.create({provider: 'stripe', amountCents: 20000}), (error: unknown) => error instanceof BuyerError && error.code === 'checkout-account-mismatch');
  assert.equal(creations, 1);
  assert.equal(client.pending()?.requestKey, 'original-key');
});

test('a late checkout response is not accepted after the account changes in flight', async () => {
  const storage = memoryStorage();
  let currentBuyer = buyerRef;
  let creations = 0;
  const request = async (input: string | URL | Request) => {
    if (String(input) === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef: currentBuyer});
    if (String(input) === '/api/checkout') {
      creations += 1;
      currentBuyer = 'c'.repeat(64);
      return response(stripeResult);
    }
    throw new Error(`unexpected request ${String(input)}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'original-key'});
  await assert.rejects(() => client.create({provider: 'stripe', amountCents: 20000}),
    (error: unknown) => error instanceof BuyerError && error.code === 'checkout-account-mismatch');
  assert.equal(creations, 1);
  assert.equal(client.pending()?.requestKey, 'original-key');
  assert.equal(client.pending()?.buyerRef, buyerRef);
  assert.equal(client.pending()?.result, undefined);
});

test('a late restore response is not accepted after the account changes in flight', async () => {
  const storage = memoryStorage();
  storage.setItem('keld-sdk-checkout-v1', JSON.stringify({input: {provider: 'stripe', amountCents: 20000}, requestKey: 'original-key', state: 'pending', buyerRef, result: stripeResult}));
  let currentBuyer = buyerRef;
  const request = async (input: string | URL | Request) => {
    if (String(input) === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef: currentBuyer});
    if (String(input) === '/api/restore') {
      currentBuyer = 'd'.repeat(64);
      return response({input: {provider: 'stripe', amountCents: 20000}, requestKey: 'original-key', state: 'paid', ledgerStatus: 'paid', result: stripeResult});
    }
    throw new Error(`unexpected request ${String(input)}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch});
  await assert.rejects(() => client.hydrate(buyerRef),
    (error: unknown) => error instanceof BuyerError && error.code === 'checkout-account-mismatch');
  assert.equal(client.pending()?.state, 'pending');
});

test('sign-out preserves an unresolved key for its original account only', async () => {
  const storage = memoryStorage();
  let currentBuyer = buyerRef;
  const request = async (input: string | URL | Request) => {
    if (String(input) === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef: currentBuyer});
    if (String(input) === '/api/checkout') return response(stripeResult);
    if (String(input) === '/auth/logout') return response({});
    if (String(input) === '/api/restore') return response({input: {provider: 'stripe', amountCents: 20000}, requestKey: 'pending-key', state: 'pending', ledgerStatus: 'pending', result: stripeResult});
    throw new Error(`unexpected request ${String(input)}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'pending-key'});
  await client.create({provider: 'stripe', amountCents: 20000});
  await client.logout();
  assert.equal(client.pending()?.requestKey, 'pending-key');
  currentBuyer = 'c'.repeat(64);
  await assert.rejects(() => client.hydrate(currentBuyer), (error: unknown) => error instanceof BuyerError && error.code === 'checkout-account-mismatch');
  currentBuyer = buyerRef;
  assert.equal((await client.hydrate(buyerRef))?.requestKey, 'pending-key');
});

test('legacy result-less state is quarantined instead of assigned to a new account', async () => {
  const storage = memoryStorage();
  storage.setItem('keld-sdk-checkout-v1', JSON.stringify({input: {provider: 'stripe', amountCents: 20000}, requestKey: 'legacy-key', state: 'pending'}));
  let creations = 0;
  const request = async (input: string | URL | Request) => {
    if (String(input) === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    creations += 1;
    return response(stripeResult);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch});
  await assert.rejects(() => client.hydrate(buyerRef), (error: unknown) => error instanceof BuyerError && error.code === 'checkout-owner-unbound');
  await assert.rejects(() => client.create({provider: 'stripe', amountCents: 20000}), (error: unknown) => error instanceof BuyerError && error.code === 'checkout-owner-unbound');
  assert.equal(creations, 0);
  assert.equal(client.pending()?.requestKey, 'legacy-key');
});

test('server restore corrects a local paid claim before display', async () => {
  const storage = memoryStorage();
  storage.setItem('keld-sdk-checkout-v1', JSON.stringify({input: {provider: 'stripe', amountCents: 20000}, requestKey: 'old-key', state: 'paid', buyerRef, result: stripeResult}));
  const request = async (input: string | URL | Request) => {
    if (String(input) === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    if (String(input) === '/api/restore') return response({input: {provider: 'stripe', amountCents: 20000}, requestKey: 'old-key', state: 'pending', ledgerStatus: 'pending', result: stripeResult});
    throw new Error(`unexpected request ${String(input)}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch});
  assert.equal((await client.hydrate(buyerRef))?.state, 'pending');
  assert.equal(client.pending()?.state, 'pending');
});

test('an older paid order can be inspected and downloaded without replacing a pending key', async () => {
  const storage = memoryStorage();
  const oldOrderId = 'c'.repeat(32);
  const request = async (input: string | URL | Request) => {
    if (String(input) === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    if (String(input) === '/api/checkout') return response(stripeResult);
    if (String(input) === '/api/restore') return response({input: {provider: 'stripe', amountCents: 5000}, requestKey: 'old-key', state: 'paid', ledgerStatus: 'paid', result: {...stripeResult, orderId: oldOrderId}});
    if (String(input) === '/api/download') return response(new Blob(['older-paid-order'], {type: 'application/octet-stream'}));
    throw new Error(`unexpected request ${String(input)}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'current-key'});
  await client.create({provider: 'stripe', amountCents: 20000});
  const owned = await client.inspect(oldOrderId);
  assert.equal(owned.state, 'paid');
  assert.equal(await (await client.downloadOrder(oldOrderId)).text(), 'older-paid-order');
  assert.equal(client.pending()?.requestKey, 'current-key');
});

test('an artifact response is withheld when the account changes during download', async () => {
  let currentBuyer = buyerRef;
  const request = async (input: string | URL | Request) => {
    if (String(input) === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef: currentBuyer});
    if (String(input) === '/api/download') {
      currentBuyer = 'e'.repeat(64);
      return response(new Blob(['private-artifact'], {type: 'application/octet-stream'}));
    }
    throw new Error(`unexpected request ${String(input)}`);
  };
  const client = createBuyerClient({storage: memoryStorage(), request: request as typeof fetch});
  await assert.rejects(() => client.downloadOrder(orderId),
    (error: unknown) => error instanceof BuyerError && error.code === 'checkout-account-mismatch');
});

test('an expired provider token starts durable session renewal instead of looking signed out', async () => {
  let renewals = 0;
  const client = createBuyerClient({
    storage: memoryStorage(),
    request: (async () => response({error: 'session_renewal_required'}, 401)) as typeof fetch,
    renew: () => { renewals += 1; },
  });
  await assert.rejects(
    () => client.session(),
    (error: unknown) => error instanceof BuyerError && error.code === 'session_renewal_required',
  );
  assert.equal(renewals, 1);
});

test('a fully expired session also returns to sign-in without losing the saved key', async () => {
  const storage = memoryStorage();
  let sessionExpired = false;
  let renewals = 0;
  const request = async (input: string | URL | Request) => {
    if (String(input) === '/api/session') return sessionExpired
      ? response({error: 'session_expired'}, 401)
      : response({authenticated: true, csrf: 'csrf', buyerRef});
    if (String(input) === '/api/checkout') return response(stripeResult);
    throw new Error(`unexpected request ${String(input)}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'session-key', renew: () => { renewals += 1; }});
  await client.create({provider: 'stripe', amountCents: 20000});
  sessionExpired = true;
  await assert.rejects(() => client.confirm(), (error: unknown) => error instanceof BuyerError && error.code === 'session_expired');
  assert.equal(renewals, 1);
  assert.equal(client.pending()?.requestKey, 'session-key');
});

test('a non-retryable result-less response does not spin on reload or mint another key', async () => {
  const storage = memoryStorage();
  let creations = 0;
  const request = async (input: string | URL | Request) => {
    if (String(input) === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    if (String(input) === '/api/restore') return response({input: {provider: 'stripe', amountCents: 20000}, requestKey: 'blocked-key', state: 'pending'});
    creations += 1;
    return response({error: 'checkout-reconciliation-required'}, 409);
  };
  const first = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'blocked-key'});
  await assert.rejects(() => first.create({provider: 'stripe', amountCents: 20000}), (error: unknown) => error instanceof BuyerError && error.code === 'checkout-reconciliation-required');
  assert.equal(first.pending()?.retryBlocked, 'checkout-reconciliation-required');
  const reloaded = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'unused'});
  assert.equal((await reloaded.hydrate(buyerRef))?.requestKey, 'blocked-key');
  await assert.rejects(() => reloaded.create({provider: 'stripe', amountCents: 20000}), (error: unknown) => error instanceof BuyerError && error.code === 'checkout-reconciliation-required');
  assert.equal(creations, 1);
  assert.equal((await reloaded.restore(orderId)).retryBlocked, 'checkout-reconciliation-required');
  assert.equal(reloaded.pending()?.requestKey, 'blocked-key');
});

test('an older order can be verified without replacing a blocked or uncertain current key', async () => {
  const storage = memoryStorage();
  storage.setItem('keld-sdk-checkout-v1', JSON.stringify({
    input: {provider: 'stripe', amountCents: 20000}, requestKey: 'historical-second',
    state: 'pending', buyerRef, retryBlocked: 'checkout-reconciliation-required',
  }));
  let creates = 0;
  let confirms = 0;
  const request = async (input: string | URL | Request) => {
    if (String(input) === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    if (String(input) === '/api/confirm') {
      confirms += 1;
      return response({orderId, status: 'awaiting-payment'});
    }
    if (String(input) === '/api/restore') return response({
      input: {provider: 'stripe', amountCents: 20000}, requestKey: 'older-bound',
      state: 'pending', ledgerStatus: 'expired', result: stripeResult,
    });
    creates += 1;
    throw new Error(`unexpected payment request ${String(input)}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'unused'});
  assert.equal((await client.inspect(orderId)).requestKey, 'older-bound');
  assert.equal(client.pending()?.requestKey, 'historical-second');
  await assert.rejects(() => client.restore(orderId),
    (error: unknown) => error instanceof BuyerError && error.code === 'checkout-conflict');
  assert.deepEqual(await client.verifyOrder(orderId), {orderId, status: 'awaiting-payment'});
  assert.equal(client.pending()?.requestKey, 'historical-second');
  assert.equal(creates, 0);
  assert.equal(confirms, 1);

  const protectedStorage = memoryStorage();
  protectedStorage.setItem('keld-sdk-checkout-v1', JSON.stringify({
    input: {provider: 'stripe', amountCents: 20000}, requestKey: 'live-pending',
    state: 'pending', buyerRef, result: {...stripeResult, orderId: 'c'.repeat(32)},
  }));
  const protectedClient = createBuyerClient({storage: protectedStorage, request: request as typeof fetch});
  await assert.rejects(() => protectedClient.restore(orderId),
    (error: unknown) => error instanceof BuyerError && error.code === 'checkout-conflict');
  assert.equal(protectedClient.pending()?.requestKey, 'live-pending');
});

test('anonymous session discovery is non-error state but mutations remain closed', async () => {
  const client = createBuyerClient({
    storage: memoryStorage(),
    request: (async () => response({authenticated: false})) as typeof fetch,
    uuid: () => 'anonymous-key',
  });
  assert.deepEqual(await client.session(), {authenticated: false});
  await assert.rejects(
    () => client.create({provider: 'stripe', amountCents: 20000}),
    (error: unknown) => error instanceof BuyerError && error.code === 'authentication-required',
  );
});

test('a definite existing-checkout rejection clears the unused local key so history can be restored', async () => {
  const storage = memoryStorage();
  const recovered = {
    input: {provider: 'stripe' as const, amountCents: 20000},
    requestKey: 'existing-server-key',
    state: 'pending' as const,
    result: stripeResult,
  };
  const request = async (input: string | URL | Request) => {
    const path = String(input);
    if (path === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    if (path === '/api/checkout') return response({error: 'customer-checkout-pending'}, 409);
    if (path === '/api/checkout/lookup') return response({found: false});
    if (path === '/api/restore') return response(recovered);
    throw new Error(`unexpected request ${path}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'unused-local-key'});
  await assert.rejects(
    () => client.create({provider: 'stripe', amountCents: 20000}),
    (error: unknown) => error instanceof BuyerError && error.code === 'customer-checkout-pending',
  );
  assert.equal(client.pending(), null);
  assert.deepEqual(await client.restore(orderId), {...recovered, buyerRef});
});

test('an unresolved older provider attempt rejects a fresh key without trapping the browser in it', async () => {
  const storage = memoryStorage();
  let checkoutCalls = 0;
  const client = createBuyerClient({
    storage,
    uuid: () => 'unused-new-key',
    request: (async (input: string | URL | Request) => {
      const path = String(input);
      if (path === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
      if (path === '/api/checkout') {
        checkoutCalls += 1;
        return response({error: 'customer-checkout-unresolved'}, 409);
      }
      if (path === '/api/checkout/lookup') return response({found: false});
      if (path === '/api/orders') return response({orders: [{orderId, provider: 'stripe', amountCents: 20000, currency: 'USD', createdAt: 100, status: 'expired'}], next: null});
      throw new Error(`unexpected request ${path}`);
    }) as typeof fetch,
  });
  await assert.rejects(
    () => client.create({provider: 'stripe', amountCents: 20000}),
    (error: unknown) => error instanceof BuyerError && error.code === 'customer-checkout-unresolved',
  );
  assert.equal(checkoutCalls, 1);
  assert.equal(client.pending(), null);
  assert.equal((await client.orders()).orders[0].orderId, orderId);
});

test('expired replacement saves the successor key before dispatch and promotes only its owned linked order', async () => {
  const storage = memoryStorage();
  const nextOrderId = 'c'.repeat(32);
  const oldInput = {provider: 'stripe' as const, amountCents: 20000};
  const nextInput = {provider: 'stripe' as const, amountCents: 25000};
  storage.setItem('keld-sdk-checkout-v1', JSON.stringify({input: oldInput, requestKey: 'old-key', state: 'pending', buyerRef, result: stripeResult}));
  let dispatched = 0;
  const nextResult = {...stripeResult, orderId: nextOrderId, amountCents: 25000};
  const request = async (input: string | URL | Request, init?: RequestInit) => {
    const path = String(input);
    if (path === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    if (path === '/api/restore') {
      const {orderId: requested} = JSON.parse(String(init?.body)) as {orderId: string};
      return response(requested === orderId
        ? {input: oldInput, requestKey: 'old-key', state: 'pending', ledgerStatus: 'expired', replacementCheckAvailable: true, result: stripeResult}
        : {input: nextInput, requestKey: 'next-key', state: 'pending', ledgerStatus: 'pending', result: nextResult});
    }
    if (path === '/api/checkout') {
      dispatched += 1;
      assert.equal(client.pending()?.replacementDraft?.nextRequestKey, 'next-key');
      assert.deepEqual(JSON.parse(String(init?.body)), {...nextInput, requestKey: 'next-key', replaceOldOrderId: orderId});
      return response(nextResult);
    }
    if (path === '/api/checkout/lookup') return response({found: true, orderId: nextOrderId, status: 'pending', replacesOrderId: orderId});
    throw new Error(`unexpected request ${path}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'next-key'});
  assert.deepEqual(await client.replaceExpired(nextInput), nextResult);
  assert.equal(dispatched, 1);
  assert.equal(client.pending()?.requestKey, 'next-key');
  assert.equal(client.pending()?.replacementDraft, undefined);
});

test('lost replacement response survives reload and resolves through exact-key lookup without a second create', async () => {
  const storage = memoryStorage();
  const nextOrderId = 'c'.repeat(32);
  const oldInput = {provider: 'stripe' as const, amountCents: 20000};
  const nextInput = {provider: 'stripe' as const, amountCents: 25000};
  const nextResult = {...stripeResult, orderId: nextOrderId, amountCents: 25000};
  storage.setItem('keld-sdk-checkout-v1', JSON.stringify({input: oldInput, requestKey: 'old-key', state: 'pending', buyerRef, result: stripeResult}));
  let creates = 0;
  let lookupAvailable = false;
  const request = async (input: string | URL | Request, init?: RequestInit) => {
    const path = String(input);
    if (path === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    if (path === '/api/restore') {
      const {orderId: requested} = JSON.parse(String(init?.body)) as {orderId: string};
      return response(requested === orderId
        ? {input: oldInput, requestKey: 'old-key', state: 'pending', ledgerStatus: 'expired', replacementCheckAvailable: true, result: stripeResult}
        : {input: nextInput, requestKey: 'next-key', state: 'pending', ledgerStatus: 'pending', result: nextResult});
    }
    if (path === '/api/checkout') { creates += 1; throw new Error('response lost'); }
    if (path === '/api/checkout/lookup') {
      if (!lookupAvailable) throw new Error('lookup temporarily unavailable');
      return response({found: true, orderId: nextOrderId, status: 'pending', replacesOrderId: orderId});
    }
    throw new Error(`unexpected request ${path}`);
  };
  const first = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'next-key'});
  await assert.rejects(() => first.replaceExpired(nextInput));
  assert.equal(first.pending()?.replacementDraft?.nextRequestKey, 'next-key');
  assert.throws(() => first.reset(), (error: unknown) => error instanceof BuyerError && error.code === 'payment-outcome-uncertain');
  lookupAvailable = true;
  const reloaded = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'never-used'});
  assert.deepEqual(await reloaded.replaceExpired(), nextResult);
  assert.equal(creates, 1);
  assert.equal(reloaded.pending()?.requestKey, 'next-key');
});

test('a prepared successor without provider result replays its exact key with the old-order link', async () => {
  const storage = memoryStorage();
  const nextOrderId = 'c'.repeat(32);
  const oldInput = {provider: 'stripe' as const, amountCents: 20000};
  const nextInput = {provider: 'stripe' as const, amountCents: 25000};
  const nextResult = {...stripeResult, orderId: nextOrderId, amountCents: 25000};
  storage.setItem('keld-sdk-checkout-v1', JSON.stringify({input: oldInput, requestKey: 'old-key', state: 'pending', buyerRef,
    result: stripeResult, replacementDraft: {oldOrderId: orderId, nextRequestKey: 'next-key', nextInput}}));
  let created = false;
  const request = async (input: string | URL | Request, init?: RequestInit) => {
    const path = String(input);
    if (path === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    if (path === '/api/checkout/lookup') return response({found: true, orderId: nextOrderId, status: 'pending', replacesOrderId: orderId});
    if (path === '/api/restore') return response({input: nextInput, requestKey: 'next-key', state: 'pending', ledgerStatus: 'pending',
      replacesOrderId: orderId, ...(created ? {result: nextResult} : {})});
    if (path === '/api/checkout') {
      assert.deepEqual(JSON.parse(String(init?.body)), {...nextInput, requestKey: 'next-key', replaceOldOrderId: orderId});
      assert.equal(client.pending()?.replacementDraft?.nextRequestKey, 'next-key');
      created = true;
      return response(nextResult);
    }
    throw new Error(`unexpected request ${path}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch});
  assert.deepEqual(await client.replaceExpired(), nextResult);
  assert.equal(client.pending()?.requestKey, 'next-key');
  assert.equal(client.pending()?.replacesOrderId, orderId);
});

test('a linked Mercado Pago preparing checkout keeps its old-order link on same-key Pix retry', async () => {
  const storage = memoryStorage();
  const oldOrderId = 'c'.repeat(32);
  const pixOrderId = 'd'.repeat(32);
  const input = {provider: 'mercadopago' as const, amountCents: 20000, payerEmail: 'buyer@example.test'};
  const preparing: CheckoutResult = {mode: 'sandbox', orderId: pixOrderId, amountCents: 102000, currency: 'BRL',
    usdAmountCents: 20000, quoteReference: 'merchant-fixed-5.10', checkoutState: 'preparing'};
  const ready = {...preparing, checkoutState: 'ready', pixCode: '000201-fixture'};
  storage.setItem('keld-sdk-checkout-v1', JSON.stringify({input, requestKey: 'next-pix-key', state: 'pending', buyerRef,
    replacesOrderId: oldOrderId, result: preparing}));
  let creates = 0;
  const request = async (target: string | URL | Request, init?: RequestInit) => {
    const path = String(target);
    if (path === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    if (path === '/api/checkout') {
      creates += 1;
      assert.deepEqual(JSON.parse(String(init?.body)), {...input, requestKey: 'next-pix-key', replaceOldOrderId: oldOrderId});
      return response(ready);
    }
    throw new Error(`unexpected request ${path}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch});
  assert.deepEqual(await client.create(input), ready);
  assert.equal(creates, 1);
  assert.equal(client.pending()?.replacesOrderId, oldOrderId);
});

test('post-commit replacement conflict cannot discard an exact-key successor', async () => {
  const storage = memoryStorage();
  const nextOrderId = 'c'.repeat(32);
  const oldInput = {provider: 'stripe' as const, amountCents: 20000};
  const nextInput = {provider: 'stripe' as const, amountCents: 25000};
  const nextResult = {...stripeResult, orderId: nextOrderId, amountCents: 25000};
  storage.setItem('keld-sdk-checkout-v1', JSON.stringify({input: oldInput, requestKey: 'old-key', state: 'pending', buyerRef, result: stripeResult}));
  const request = async (input: string | URL | Request, init?: RequestInit) => {
    const path = String(input);
    if (path === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    if (path === '/api/restore') {
      const {orderId: requested} = JSON.parse(String(init?.body)) as {orderId: string};
      return response(requested === orderId
        ? {input: oldInput, requestKey: 'old-key', state: 'pending', ledgerStatus: 'expired', replacementCheckAvailable: true, result: stripeResult}
        : {input: nextInput, requestKey: 'next-key', state: 'pending', ledgerStatus: 'pending', result: nextResult});
    }
    if (path === '/api/checkout') return response({error: 'customer-checkout-pending'}, 409);
    if (path === '/api/checkout/lookup') return response({found: true, orderId: nextOrderId, status: 'pending', replacesOrderId: orderId});
    throw new Error(`unexpected request ${path}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'next-key'});
  assert.deepEqual(await client.replaceExpired(nextInput), nextResult);
  assert.equal(client.pending()?.requestKey, 'next-key');
});

test('definite rejected replacement clears only the successor draft after absent lookup and owned old restore', async () => {
  const storage = memoryStorage();
  const oldInput = {provider: 'stripe' as const, amountCents: 20000};
  const nextInput = {provider: 'stripe' as const, amountCents: 25000};
  storage.setItem('keld-sdk-checkout-v1', JSON.stringify({input: oldInput, requestKey: 'old-key', state: 'pending', buyerRef, result: stripeResult}));
  const request = async (input: string | URL | Request) => {
    const path = String(input);
    if (path === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    if (path === '/api/restore') return response({input: oldInput, requestKey: 'old-key', state: 'pending', ledgerStatus: 'expired', replacementCheckAvailable: true, result: stripeResult});
    if (path === '/api/checkout') return response({error: 'replacement-review-required'}, 409);
    if (path === '/api/checkout/lookup') return response({found: false});
    throw new Error(`unexpected request ${path}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'next-key'});
  await assert.rejects(() => client.replaceExpired(nextInput), (error: unknown) => error instanceof BuyerError && error.code === 'replacement-review-required');
  assert.equal(client.pending()?.requestKey, 'old-key');
  assert.equal(client.pending()?.replacementDraft, undefined);
});

test('a 409 with failed successor lookup preserves the draft even when the old order still appears open', async () => {
  const storage = memoryStorage();
  const oldInput = {provider: 'stripe' as const, amountCents: 20000};
  const nextInput = {provider: 'stripe' as const, amountCents: 25000};
  storage.setItem('keld-sdk-checkout-v1', JSON.stringify({input: oldInput, requestKey: 'old-key', state: 'pending', buyerRef, result: stripeResult}));
  let oldRestores = 0;
  const request = async (input: string | URL | Request) => {
    const path = String(input);
    if (path === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    if (path === '/api/restore') {
      oldRestores += 1;
      return response({input: oldInput, requestKey: 'old-key', state: 'pending', ledgerStatus: 'expired', replacementCheckAvailable: true, result: stripeResult});
    }
    if (path === '/api/checkout') return response({error: 'replacement-review-required'}, 409);
    if (path === '/api/checkout/lookup') throw new Error('lookup timed out');
    throw new Error(`unexpected request ${path}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'next-key'});
  await assert.rejects(() => client.replaceExpired(nextInput),
    (error: unknown) => error instanceof BuyerError && error.code === 'replacement-review-required');
  assert.equal(oldRestores, 1, 'the old order was eligible when the draft was created');
  assert.equal(client.pending()?.requestKey, 'old-key');
  assert.equal(client.pending()?.replacementDraft?.nextRequestKey, 'next-key');
});

test('replacement refuses account switching and failed local storage before any provider dispatch', async () => {
  const values = memoryStorage();
  const oldInput = {provider: 'stripe' as const, amountCents: 20000};
  values.setItem('keld-sdk-checkout-v1', JSON.stringify({input: oldInput, requestKey: 'old-key', state: 'pending', buyerRef, result: stripeResult}));
  let currentBuyer = buyerRef;
  let dispatches = 0;
  const request = async (input: string | URL | Request) => {
    const path = String(input);
    if (path === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef: currentBuyer});
    if (path === '/api/restore') return response({input: oldInput, requestKey: 'old-key', state: 'pending', ledgerStatus: 'expired', replacementCheckAvailable: true, result: stripeResult});
    if (path === '/api/checkout') { dispatches += 1; return response(stripeResult); }
    throw new Error(`unexpected request ${path}`);
  };
  const storage = {
    getItem: values.getItem,
    setItem: (_key: string, _value: string) => { throw new Error('storage denied'); },
    removeItem: values.removeItem,
  };
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'next-key'});
  currentBuyer = 'c'.repeat(64);
  await assert.rejects(() => client.replaceExpired({provider: 'stripe', amountCents: 25000}),
    (error: unknown) => error instanceof BuyerError && error.code === 'checkout-account-mismatch');
  currentBuyer = buyerRef;
  await assert.rejects(() => client.replaceExpired({provider: 'stripe', amountCents: 25000}),
    (error: unknown) => error instanceof BuyerError && error.code === 'storage-unavailable');
  assert.equal(dispatches, 0);
  assert.equal(client.pending()?.replacementDraft, undefined);
});

test('every mutation gets a fresh CSRF token and payment requires server confirmation', async () => {
  const storage = memoryStorage();
  let sessionCalls = 0;
  let paid = false;
  const request = async (input: string | URL | Request, init?: RequestInit) => {
    const path = String(input);
    if (path === '/api/session') return response({authenticated: true, csrf: `csrf-${++sessionCalls}`, buyerRef});
    assert.equal(new Headers(init?.headers).get('x-csrf-token'), `csrf-${sessionCalls}`);
    if (path === '/api/checkout') return response(stripeResult);
    if (path === '/api/confirm') return response({orderId, status: paid ? 'paid' : 'awaiting-payment'});
    if (path === '/api/download') return paid ? response(new Blob(['fixture'], {type: 'application/octet-stream'})) : response({error: 'delivery-not-authorized'}, 403);
    throw new Error(`unexpected request ${path}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'key'});
  await client.create({provider: 'stripe', amountCents: 20000});
  assert.equal((await client.confirm()).status, 'awaiting-payment');
  await assert.rejects(() => client.download(), (error: unknown) => error instanceof BuyerError && error.code === 'delivery-not-authorized');
  paid = true;
  assert.equal((await client.confirm()).status, 'paid');
  assert.equal(await (await client.download()).text(), 'fixture');
  assert.equal(sessionCalls, 12);
});

test('a paid checkout can be released locally without mutating the server order', async () => {
  const storage = memoryStorage();
  let requestCalls = 0;
  const request = async (input: string | URL | Request) => {
    requestCalls += 1;
    if (String(input) === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    if (String(input) === '/api/checkout') return response(stripeResult);
    if (String(input) === '/api/confirm') return response({orderId, status: 'paid'});
    throw new Error(`unexpected request ${String(input)}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'paid-key'});
  await client.create({provider: 'stripe', amountCents: 20000});
  await client.confirm();
  assert.equal(client.pending()?.state, 'paid');

  const callsBeforeReset = requestCalls;
  client.reset();

  assert.equal(client.pending(), null);
  assert.equal(requestCalls, callsBeforeReset);
});

test('provider destinations and restored state are fail closed', async () => {
  const storage = memoryStorage();
  const request = async (input: string | URL | Request) => {
    if (String(input) === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    return response({...stripeResult, checkoutUrl: 'https://attacker.invalid/pay'});
  };
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'key'});
  await assert.rejects(
    () => client.create({provider: 'stripe', amountCents: 20000}),
    (error: unknown) => error instanceof BuyerError && error.code === 'invalid-checkout-response',
  );
});

test('expired payment presentation removes actionable provider data', () => {
  const result: CheckoutResult = {...stripeResult, checkoutUrl: 'https://checkout.stripe.com/pay/test', expiresAt: 100};
  const presented = paymentPresentation(result, 100);
  assert.equal(presented.checkoutState, 'expired');
  assert.equal(presented.checkoutUrl, undefined);
  assert.equal(result.checkoutUrl, 'https://checkout.stripe.com/pay/test');
});

test('verified access revocation replaces paid presentation and permits a fresh local draft', async () => {
  const storage = memoryStorage();
  let revoked = false;
  const request = async (input: string | URL | Request) => {
    const path = String(input);
    if (path === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    if (path === '/api/restore') return response({input: {provider: 'stripe', amountCents: 20000},
      requestKey: 'original-key', state: revoked ? 'revoked' : 'paid', result: stripeResult});
    if (path === '/api/confirm') return response({orderId, status: revoked ? 'revoked' : 'paid'});
    throw new Error(`unexpected request ${path}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch});
  assert.equal((await client.restore(orderId)).state, 'paid');
  revoked = true;
  assert.equal((await client.confirm()).status, 'revoked');
  assert.equal(client.pending()?.state, 'revoked');
  assert.equal((await client.hydrate(buyerRef))?.state, 'revoked');
  client.reset();
  assert.equal(client.pending(), null);
});

test('reopening a late payment replaces local refund hints with the owned server projection', async () => {
  const storage = memoryStorage();
  let remote = {input: {provider: 'stripe', amountCents: 20000}, requestKey: 'original-key',
    state: 'pending', ledgerStatus: 'paid-review', lateRefundStatus: 'recorded', result: stripeResult};
  const request = async (input: string | URL | Request) => {
    if (String(input) === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    if (String(input) === '/api/restore') return response(remote);
    if (String(input) === '/api/orders') return response({orders: [{orderId, provider: 'stripe', amountCents: 20000,
      currency: 'USD', createdAt: 100, status: 'paid-review', lateRefundStatus: remote.lateRefundStatus}], next: null});
    throw new Error(`unexpected request ${input}`);
  };
  const first = createBuyerClient({storage, request: request as typeof fetch});
  assert.equal((await first.restore(orderId)).lateRefundStatus, 'recorded');
  remote = {...remote, lateRefundStatus: 'review-required'};
  const reopened = createBuyerClient({storage, request: request as typeof fetch});
  assert.equal((await reopened.hydrate(buyerRef))?.lateRefundStatus, 'review-required');
  assert.equal((await reopened.orders()).orders[0].lateRefundStatus, 'review-required');
  remote = {...remote, lateRefundStatus: 'verified-full-refund'};
  await assert.rejects(() => reopened.inspect(orderId),
    (error: unknown) => error instanceof BuyerError && error.code === 'invalid-checkout-response');
  assert.equal(reopened.pending()?.lateRefundStatus, 'review-required');
});

test('an expired order remains preserved when provider verification is inconclusive', async () => {
  const storage = memoryStorage();
  const calls: string[] = [];
  let key = 0;
  const expired = {...stripeResult, expiresAt: 1};
  const request = async (input: string | URL | Request, init?: RequestInit) => {
    const path = String(input);
    calls.push(path);
    if (path === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    if (path === '/api/checkout') return response(key === 1 ? expired : stripeResult);
    if (path === '/api/confirm') return response({orderId, status: 'awaiting-payment'});
    if (path === '/api/restore') return response({input: {provider: 'stripe', amountCents: 20000}, requestKey: 'key-1', state: 'pending', ledgerStatus: 'expired', result: expired});
    throw new Error(`unexpected request ${path} ${init?.method}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => `key-${++key}`});
  await client.create({provider: 'stripe', amountCents: 20000});
  assert.throws(() => client.reset(), (error: unknown) => error instanceof BuyerError && error.code === 'payment-outcome-uncertain');
  assert.deepEqual(await client.recoverExpired(), {released: false, status: 'expired'});
  assert.equal(client.pending()?.requestKey, 'key-1');
  assert.equal(key, 1);
  assert.deepEqual(calls.filter(path => path !== '/api/session'), ['/api/checkout', '/api/confirm', '/api/restore']);
});

test('a closed provider link does not release a pending or review-required order', async () => {
  for (const ledgerStatus of ['pending', 'paid-review']) {
    const storage = memoryStorage();
    const expired = {...stripeResult, expiresAt: 1};
    const request = async (input: string | URL | Request) => {
      const path = String(input);
      if (path === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
      if (path === '/api/checkout') return response(expired);
      if (path === '/api/confirm') return response({orderId, status: ledgerStatus === 'paid-review' ? 'paid-review' : 'awaiting-payment'});
      if (path === '/api/restore') return response({input: {provider: 'stripe', amountCents: 20000}, requestKey: 'original', state: 'pending', ledgerStatus, result: expired});
      throw new Error(`unexpected request ${path}`);
    };
    const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'original'});
    await client.create({provider: 'stripe', amountCents: 20000});
    assert.deepEqual(await client.recoverExpired(), {released: false, status: ledgerStatus});
    assert.equal(client.pending()?.requestKey, 'original');
    assert.throws(() => client.reset(), (error: unknown) => error instanceof BuyerError && error.code === 'payment-outcome-uncertain');
  }
});

test('an unbound expired order remains preserved without terminal provider evidence', async () => {
  const storage = memoryStorage();
  const expired = {...stripeResult, expiresAt: 1};
  let serverStatus = 'pending';
  const request = async (input: string | URL | Request) => {
    const path = String(input);
    if (path === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    if (path === '/api/checkout') return response(expired);
    if (path === '/api/confirm') return response({error: 'checkout-unbound'}, 400);
    if (path === '/api/restore') return response({input: {provider: 'stripe', amountCents: 20000}, requestKey: 'unbound', state: 'pending', ledgerStatus: serverStatus, result: expired});
    throw new Error(`unexpected request ${path}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'unbound'});
  await client.create({provider: 'stripe', amountCents: 20000});
  assert.deepEqual(await client.recoverExpired(), {released: false, status: 'pending'});
  assert.equal(client.pending()?.requestKey, 'unbound');
  serverStatus = 'expired';
  assert.deepEqual(await client.recoverExpired(), {released: false, status: 'expired'});
  assert.equal(client.pending()?.requestKey, 'unbound');
});

test('Mercado Pago accepts bounded Pix data and preserves the server quote', async () => {
  const storage = memoryStorage();
  const pixResult: CheckoutResult = {
    mode: 'sandbox', orderId, amountCents: 113400, currency: 'BRL', usdAmountCents: 20000,
    pixCode: '000201010212-keld-sandbox', quoteReference: 'BRL-test-rate', checkoutState: 'ready',
  };
  const request = async (input: string | URL | Request) => String(input) === '/api/session'
    ? response({authenticated: true, csrf: 'csrf', buyerRef}) : response(pixResult);
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'pix-key'});
  assert.deepEqual(await client.create({provider: 'mercadopago', amountCents: 20000, payerEmail: 'buyer@example.com'}), pixResult);
  assert.equal(client.pending()?.result?.quoteReference, 'BRL-test-rate');
});

test('delayed Pix preparation resumes through the same request key', async () => {
  const storage = memoryStorage();
  const keys: string[] = [];
  const base = {mode: 'sandbox' as const, orderId, amountCents: 102000, currency: 'BRL' as const,
    usdAmountCents: 20000, quoteReference: 'merchant-fixed-5.10', expiresAt: Math.floor(Date.now() / 1000) + 1800};
  const request = async (input: string | URL | Request, init?: RequestInit) => {
    if (String(input) === '/api/session') return response({authenticated: true, csrf: 'csrf', buyerRef});
    keys.push((JSON.parse(String(init?.body)) as {requestKey: string}).requestKey);
    return response(keys.length === 1 ? {...base, checkoutState: 'preparing'} : {...base, checkoutState: 'ready', pixCode: '000201010212-fixture'});
  };
  const first = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'pix-stable-key'});
  assert.equal((await first.create({provider: 'mercadopago', amountCents: 20000, payerEmail: 'buyer@example.com'})).checkoutState, 'preparing');
  const reloaded = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'unused'});
  assert.equal((await reloaded.create({provider: 'mercadopago', amountCents: 20000, payerEmail: 'buyer@example.com'})).pixCode, '000201010212-fixture');
  assert.deepEqual(keys, ['pix-stable-key', 'pix-stable-key']);
});

test('PayPal accepts only the exact sandbox approval host', async () => {
  for (const checkoutUrl of ['https://www.sandbox.paypal.com/checkoutnow?token=test', 'https://sandbox.paypal.com/checkoutnow?token=test']) {
    const storage = memoryStorage();
    const request = async (input: string | URL | Request) => String(input) === '/api/session'
      ? response({authenticated: true, csrf: 'csrf', buyerRef})
      : response({...stripeResult, checkoutUrl});
    const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'paypal-key'});
    if (checkoutUrl.includes('www.')) assert.equal((await client.create({provider: 'paypal', amountCents: 20000})).checkoutUrl, checkoutUrl);
    else await assert.rejects(() => client.create({provider: 'paypal', amountCents: 20000}), (error: unknown) => error instanceof BuyerError && error.code === 'invalid-checkout-response');
  }
});

test('PayPal accepts a server-frozen BRL quote but rejects incomplete conversion evidence', async () => {
  const brlResult: CheckoutResult = {
    mode: 'sandbox', orderId, amountCents: 25788, currency: 'BRL', usdAmountCents: 5000,
    quoteReference: 'BCB-PTAX-test', checkoutUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=test',
  };
  for (const result of [brlResult, {...brlResult, quoteReference: null}]) {
    const storage = memoryStorage();
    const request = async (input: string | URL | Request) => String(input) === '/api/session'
      ? response({authenticated: true, csrf: 'csrf', buyerRef}) : response(result);
    const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'paypal-brl-key'});
    if (result.quoteReference) assert.deepEqual(await client.create({provider: 'paypal', amountCents: 5000}), brlResult);
    else await assert.rejects(() => client.create({provider: 'paypal', amountCents: 5000}), (error: unknown) => error instanceof BuyerError && error.code === 'invalid-checkout-response');
  }
});
