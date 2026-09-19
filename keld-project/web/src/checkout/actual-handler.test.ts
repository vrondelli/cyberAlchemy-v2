import test from 'node:test';
import assert from 'node:assert/strict';
import {Readable, Writable} from 'node:stream';
import {createHandler} from '../../../integrations/src/index.mjs';
import {createBuyerClient} from './client.ts';

const origin = 'https://keld.localhost';
const orderId = 'b'.repeat(32);

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

test('typed React client crosses the actual Node HTTP handler without changing its contract', async () => {
  let paid = false;
  const auth = {
    handle: async () => false,
    identity: async () => ({customer: 'oidc:fixture', csrf: 'csrf-fixture'}),
  };
  const checkout = {
    list: async () => ({orders: [], next: null}),
    create: async (_request: unknown, body: Record<string, unknown>) => {
      assert.deepEqual(body, {provider: 'stripe', amountCents: 20000, requestKey: 'react-http-contract'});
      return {
        mode: 'sandbox',
        orderId,
        amountCents: 20000,
        currency: 'USD',
        checkoutUrl: 'https://checkout.stripe.com/c/pay/react-contract',
      };
    },
    confirm: async (_request: unknown, receivedOrderId: string) => {
      assert.equal(receivedOrderId, orderId);
      paid = true;
      return {orderId, status: 'paid'};
    },
    restore: async () => { throw new Error('not used'); },
    downloadStream: async (_request: unknown, receivedOrderId: string) => {
      assert.equal(receivedOrderId, orderId);
      assert.equal(paid, true);
      return {stream: Readable.from([Buffer.from('ARE sandbox fixture')])};
    },
  };
  const handler = createHandler({auth, checkout, origin, diagnostic: () => {}});

  const requestThroughHandler = async (input: string | URL | Request, init: RequestInit = {}) => {
    const request = Readable.from(init.body ? [Buffer.from(String(init.body))] : []) as Readable & {
      url: string;
      method: string;
      headers: Record<string, string>;
      rawHeaders: string[];
    };
    request.url = String(input);
    request.method = init.method ?? 'GET';
    request.headers = {
      host: new URL(origin).host,
      ...(request.method === 'POST' ? {origin} : {}),
      ...Object.fromEntries(new Headers(init.headers).entries()),
    };
    request.rawHeaders = [];

    let status = 200;
    let headers: Record<string, string> = {};
    const chunks: Buffer[] = [];
    const response = new Writable({
      write(chunk, _encoding, complete) {
        chunks.push(Buffer.from(chunk));
        complete();
      },
    }) as Writable & {
      headersSent: boolean;
      destroyed: boolean;
      writableFinished: boolean;
      writeHead(code: number, values: Record<string, string>): void;
      end(chunk?: unknown): Writable;
    };
    response.headersSent = false;
    response.writeHead = (code, values) => {
      status = code;
      headers = {...headers, ...values};
      response.headersSent = true;
    };
    await handler(request, response);
    return new Response(Buffer.concat(chunks), {status, headers});
  };

  const client = createBuyerClient({
    request: requestThroughHandler as typeof fetch,
    storage: memoryStorage(),
    uuid: () => 'react-http-contract',
  });
  assert.equal((await client.session()).csrf, 'csrf-fixture');
  const checkoutResult = await client.create({provider: 'stripe', amountCents: 20000});
  assert.equal(checkoutResult.orderId, orderId);
  assert.equal((await client.confirm()).status, 'paid');
  assert.equal(await (await client.download()).text(), 'ARE sandbox fixture');
});
