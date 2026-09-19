import test from 'node:test';
import assert from 'node:assert/strict';
import {BuyerError, createBuyerClient, parsePrice, paymentPresentation, type CheckoutResult} from './client.ts';

const orderId = 'a'.repeat(32);
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

test('request key is persisted before dispatch and reused after an uncertain response', async () => {
  const storage = memoryStorage();
  const keys: string[] = [];
  let loseFirstResponse = true;
  const request = async (input: string | URL | Request, init?: RequestInit) => {
    const path = String(input);
    if (path === '/api/session') return response({authenticated: true, csrf: 'csrf'});
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
    if (path === '/api/session') return response({authenticated: true, csrf: 'csrf'});
    if (path === '/api/checkout') return response({error: 'customer-checkout-pending'}, 409);
    if (path === '/api/restore') return response(recovered);
    throw new Error(`unexpected request ${path}`);
  };
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'unused-local-key'});
  await assert.rejects(
    () => client.create({provider: 'stripe', amountCents: 20000}),
    (error: unknown) => error instanceof BuyerError && error.code === 'customer-checkout-pending',
  );
  assert.equal(client.pending(), null);
  assert.deepEqual(await client.restore(orderId), recovered);
});

test('every mutation gets a fresh CSRF token and payment requires server confirmation', async () => {
  const storage = memoryStorage();
  let sessionCalls = 0;
  let paid = false;
  const request = async (input: string | URL | Request, init?: RequestInit) => {
    const path = String(input);
    if (path === '/api/session') return response({authenticated: true, csrf: `csrf-${++sessionCalls}`});
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
  assert.equal(sessionCalls, 5);
});

test('provider destinations and restored state are fail closed', async () => {
  const storage = memoryStorage();
  const request = async (input: string | URL | Request) => {
    if (String(input) === '/api/session') return response({authenticated: true, csrf: 'csrf'});
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

test('Mercado Pago accepts bounded Pix data and preserves the server quote', async () => {
  const storage = memoryStorage();
  const pixResult: CheckoutResult = {
    mode: 'sandbox', orderId, amountCents: 113400, currency: 'BRL', usdAmountCents: 20000,
    pixCode: '000201010212-keld-sandbox', quoteReference: 'BRL-test-rate', checkoutState: 'ready',
  };
  const request = async (input: string | URL | Request) => String(input) === '/api/session'
    ? response({authenticated: true, csrf: 'csrf'}) : response(pixResult);
  const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'pix-key'});
  assert.deepEqual(await client.create({provider: 'mercadopago', amountCents: 20000, payerEmail: 'buyer@example.com'}), pixResult);
  assert.equal(client.pending()?.result?.quoteReference, 'BRL-test-rate');
});

test('PayPal accepts only the exact sandbox approval host', async () => {
  for (const checkoutUrl of ['https://www.sandbox.paypal.com/checkoutnow?token=test', 'https://sandbox.paypal.com/checkoutnow?token=test']) {
    const storage = memoryStorage();
    const request = async (input: string | URL | Request) => String(input) === '/api/session'
      ? response({authenticated: true, csrf: 'csrf'})
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
      ? response({authenticated: true, csrf: 'csrf'}) : response(result);
    const client = createBuyerClient({storage, request: request as typeof fetch, uuid: () => 'paypal-brl-key'});
    if (result.quoteReference) assert.deepEqual(await client.create({provider: 'paypal', amountCents: 5000}), brlResult);
    else await assert.rejects(() => client.create({provider: 'paypal', amountCents: 5000}), (error: unknown) => error instanceof BuyerError && error.code === 'invalid-checkout-response');
  }
});
