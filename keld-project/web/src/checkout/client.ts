export type Provider = 'stripe' | 'mercadopago' | 'paypal';
export type LocalCheckoutState = 'pending' | 'paid' | 'failed';

export interface CheckoutInput {
  provider: Provider;
  amountCents: number;
  payerEmail?: string;
}

export interface CheckoutResult {
  mode: 'sandbox';
  orderId: string;
  amountCents: number;
  currency: 'USD' | 'BRL';
  usdAmountCents?: number;
  checkoutUrl?: string;
  pixCode?: string;
  checkoutState?: string;
  quoteReference?: string | null;
  expiresAt?: number;
  paymentExpiresAt?: number;
  earlySupporter?: boolean;
  recovered?: boolean;
}

export interface StoredCheckout {
  input: CheckoutInput;
  requestKey: string;
  state: LocalCheckoutState;
  ledgerStatus?: string;
  result?: CheckoutResult;
}

export interface OrderSummary {
  orderId: string;
  provider: Provider;
  amountCents: number;
  currency: string;
  createdAt: number;
  status: string;
}

export interface BuyerClient {
  pending(): StoredCheckout | null;
  session(): Promise<{authenticated: true; csrf: string}>;
  create(input: CheckoutInput): Promise<CheckoutResult>;
  confirm(): Promise<{orderId: string; status: string}>;
  download(): Promise<Blob>;
  orders(before?: string): Promise<{orders: OrderSummary[]; next: string | null}>;
  restore(orderId: string): Promise<StoredCheckout>;
  logout(): Promise<void>;
  reset(): void;
}

export class BuyerError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = 'BuyerError';
    this.code = code;
  }
}

const storageKey = 'keld-sdk-checkout-v1';
const orderIdPattern = /^[a-f0-9]{32}$/;
const requestKeyPattern = /^[A-Za-z0-9_-]{1,100}$/;

export function parsePrice(value: string): number {
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(value)) throw new BuyerError('amount-invalid');
  const [whole, fraction = ''] = value.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (cents < 5000 || cents > 100000) throw new BuyerError('amount-invalid');
  return cents;
}

function validateResult(result: CheckoutResult, provider: Provider): void {
  const currencyAccepted = provider === 'stripe'
    ? result.currency === 'USD'
    : provider === 'mercadopago'
      ? result.currency === 'BRL'
      : ['USD', 'BRL'].includes(result.currency);
  if (
    result?.mode !== 'sandbox' ||
    !orderIdPattern.test(result.orderId) ||
    !Number.isSafeInteger(result.amountCents) ||
    result.amountCents <= 0 ||
    !currencyAccepted ||
    (result.currency === 'BRL' && (
      !Number.isSafeInteger(result.usdAmountCents) ||
      result.usdAmountCents! <= 0 ||
      typeof result.quoteReference !== 'string' ||
      !result.quoteReference
    ))
  ) throw new BuyerError('invalid-checkout-response');

  if (result.recovered === true) {
    if (result.checkoutUrl !== undefined || result.pixCode !== undefined) {
      throw new BuyerError('invalid-checkout-response');
    }
    return;
  }

  if (provider === 'mercadopago') {
    if (
      ['preparing', 'verification-required', 'expired'].includes(result.checkoutState ?? '') &&
      result.pixCode === undefined &&
      result.checkoutUrl === undefined
    ) return;
    if (typeof result.pixCode !== 'string' || !result.pixCode || result.pixCode.length > 4096) {
      throw new BuyerError('invalid-checkout-response');
    }
    return;
  }

  if (!result.checkoutUrl) throw new BuyerError('invalid-checkout-response');
  const destination = new URL(result.checkoutUrl);
  const expectedHost = provider === 'stripe' ? 'checkout.stripe.com' : 'www.sandbox.paypal.com';
  if (
    destination.protocol !== 'https:' ||
    destination.hostname !== expectedHost ||
    destination.port ||
    destination.username ||
    destination.password
  ) throw new BuyerError('invalid-checkout-response');
}

export function paymentPresentation(result: CheckoutResult, now = Math.floor(Date.now() / 1000)): CheckoutResult {
  const deadline = Math.min(result.expiresAt ?? Infinity, result.paymentExpiresAt ?? Infinity);
  if (result.checkoutState === 'expired' || now >= deadline) {
    const {pixCode: _pixCode, checkoutUrl: _checkoutUrl, ...safe} = result;
    return {...safe, checkoutState: 'expired'};
  }
  return result;
}

type FetchLike = typeof globalThis.fetch;
type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function createBuyerClient({
  request = globalThis.fetch,
  storage = globalThis.sessionStorage,
  uuid = () => globalThis.crypto.randomUUID(),
}: {
  request?: FetchLike;
  storage?: StorageLike;
  uuid?: () => string;
} = {}): BuyerClient {
  const read = (): StoredCheckout | null => {
    try {
      const value = JSON.parse(storage.getItem(storageKey) || 'null') as StoredCheckout | null;
      if (value === null) return null;
      if (
        !['pending', 'paid', 'failed'].includes(value.state) ||
        !['stripe', 'mercadopago', 'paypal'].includes(value.input?.provider) ||
        !Number.isSafeInteger(value.input.amountCents) ||
        value.input.amountCents < 5000 ||
        value.input.amountCents > 100000 ||
        typeof value.requestKey !== 'string' ||
        !requestKeyPattern.test(value.requestKey)
      ) throw new Error('invalid stored checkout');
      if (value.result) validateResult(value.result, value.input.provider);
      return value;
    } catch {
      throw new BuyerError('storage-unavailable');
    }
  };

  const save = (value: StoredCheckout): void => {
    try {
      storage.setItem(storageKey, JSON.stringify(value));
    } catch {
      throw new BuyerError('storage-unavailable');
    }
  };

  const json = async <T>(url: string, init?: RequestInit): Promise<T> => {
    const response = await request(url, {credentials: 'same-origin', cache: 'no-store', ...init});
    const body = await response.json() as T & {error?: string};
    if (!response.ok) {
      throw new BuyerError(response.status === 401 ? 'authentication-required' : body.error || 'request-not-completed');
    }
    return body;
  };

  const session = () => json<{authenticated: true; csrf: string}>('/api/session');

  const post = async (url: string, body: object): Promise<Response> => {
    const active = await session();
    return request(url, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {'content-type': 'application/json', 'x-csrf-token': active.csrf},
      body: JSON.stringify(body),
    });
  };

  const operation = async <T>(url: string, body: object): Promise<T> => {
    const response = await post(url, body);
    const value = await response.json() as T & {error?: string};
    if (!response.ok) {
      throw new BuyerError(response.status === 401 ? 'authentication-required' : value.error || 'request-not-completed');
    }
    return value;
  };

  return {
    pending: read,
    session,

    async create(input) {
      if (
        !['stripe', 'mercadopago', 'paypal'].includes(input.provider) ||
        !Number.isSafeInteger(input.amountCents) ||
        input.amountCents < 5000 ||
        input.amountCents > 100000
      ) throw new BuyerError('amount-invalid');

      const normalized: CheckoutInput = {
        provider: input.provider,
        amountCents: input.amountCents,
        ...(input.provider === 'mercadopago' ? {payerEmail: input.payerEmail} : {}),
      };
      let pending = read();
      if (pending) {
        if (pending.state === 'failed' || pending.state === 'paid') throw new BuyerError('start-new-checkout');
        if (JSON.stringify(pending.input) !== JSON.stringify(normalized)) throw new BuyerError('checkout-conflict');
      } else {
        pending = {input: normalized, requestKey: uuid(), state: 'pending'};
      }

      // Save before dispatch so refreshes and uncertain responses reuse the key.
      save(pending);
      try {
        const result = await operation<CheckoutResult>('/api/checkout', {...pending.input, requestKey: pending.requestKey});
        validateResult(result, input.provider);
        pending.result = result;
        save(pending);
        return result;
      } catch (error) {
        if (error instanceof BuyerError && error.code === 'payment-creation-failed') {
          pending.state = 'failed';
          save(pending);
        }
        if (error instanceof BuyerError && error.code === 'customer-checkout-pending') {
          storage.removeItem(storageKey);
        }
        throw error;
      }
    },

    async confirm() {
      const pending = read();
      if (!pending?.result?.orderId) throw new BuyerError('checkout-unbound');
      const result = await operation<{orderId: string; status: string}>('/api/confirm', {orderId: pending.result.orderId});
      if (result.status === 'paid') {
        pending.state = 'paid';
        save(pending);
      }
      return result;
    },

    async download() {
      const pending = read();
      if (!pending?.result?.orderId) throw new BuyerError('checkout-unbound');
      const response = await post('/api/download', {orderId: pending.result.orderId});
      if (!response.ok) {
        const body = await response.json() as {error?: string};
        throw new BuyerError(response.status === 401 ? 'authentication-required' : body.error || 'request-not-completed');
      }
      return response.blob();
    },

    orders(before) {
      return json<{orders: OrderSummary[]; next: string | null}>(`/api/orders${before ? `?before=${encodeURIComponent(before)}` : ''}`);
    },

    async restore(orderId) {
      const current = read();
      const recovered = await operation<StoredCheckout>('/api/restore', {orderId});
      if (current && current.requestKey !== recovered.requestKey && !['paid', 'failed'].includes(current.state)) {
        throw new BuyerError('checkout-conflict');
      }
      if (
        !recovered.input ||
        typeof recovered.requestKey !== 'string' ||
        !['pending', 'paid', 'failed'].includes(recovered.state)
      ) throw new BuyerError('invalid-checkout-response');
      if (recovered.result) validateResult(recovered.result, recovered.input.provider);
      save(recovered);
      return read() as StoredCheckout;
    },

    async logout() {
      const response = await post('/auth/logout', {});
      if (!response.ok) {
        const body = await response.json() as {error?: string};
        throw new BuyerError(response.status === 401 ? 'authentication-required' : body.error || 'request-not-completed');
      }
      try {
        storage.removeItem(storageKey);
      } catch {
        throw new BuyerError('signed-out-storage-unavailable');
      }
    },

    reset() {
      const pending = read();
      if (pending && !['failed', 'paid'].includes(pending.state)) throw new BuyerError('payment-outcome-uncertain');
      storage.removeItem(storageKey);
    },
  };
}
