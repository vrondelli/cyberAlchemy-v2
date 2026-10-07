export type Provider = 'stripe' | 'mercadopago' | 'paypal';
export type LocalCheckoutState = 'pending' | 'paid' | 'failed' | 'revoked';
export type LateRefundStatus = 'recorded' | 'checking' | 'review-required' | 'verified-full-refund';
export type RevocationReason = 'full-refund' | 'lost-dispute';

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
  buyerRef?: string;
  retryBlocked?: 'checkout-not-pending' | 'checkout-reconciliation-required';
  ledgerStatus?: string;
  lateRefundStatus?: LateRefundStatus;
  revocationReason?: RevocationReason;
  replacesOrderId?: string;
  replacementCheckAvailable?: boolean;
  replacementDraft?: {
    oldOrderId: string;
    nextRequestKey: string;
    nextInput: CheckoutInput;
  };
  result?: CheckoutResult;
}

export type BuyerSession = {authenticated: true; csrf: string; buyerRef: string} | {authenticated: false};

export interface OrderSummary {
  orderId: string;
  provider: Provider;
  amountCents: number;
  currency: string;
  createdAt: number;
  status: string;
  lateRefundStatus?: LateRefundStatus;
  revocationReason?: RevocationReason;
}

export interface BuyerClient {
  pending(): StoredCheckout | null;
  session(): Promise<BuyerSession>;
  hydrate(buyerRef: string): Promise<StoredCheckout | null>;
  create(input: CheckoutInput): Promise<CheckoutResult>;
  replaceExpired(input?: CheckoutInput): Promise<CheckoutResult>;
  confirm(): Promise<{orderId: string; status: string}>;
  recoverExpired(): Promise<{released: boolean; status: string}>;
  download(): Promise<Blob>;
  downloadOrder(orderId: string): Promise<Blob>;
  orders(before?: string): Promise<{orders: OrderSummary[]; next: string | null}>;
  restore(orderId: string): Promise<StoredCheckout>;
  inspect(orderId: string): Promise<StoredCheckout>;
  verifyOrder(orderId: string): Promise<{orderId: string; status: string}>;
  logout(): Promise<void>;
  reset(): void;
}

export class BuyerError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(code: string, status?: number) {
    super(code);
    this.name = 'BuyerError';
    this.code = code;
    this.status = status;
  }
}

const storageKey = 'keld-sdk-checkout-v1';
const orderIdPattern = /^[a-f0-9]{32}$/;
const requestKeyPattern = /^[A-Za-z0-9_-]{1,100}$/;
const buyerRefPattern = /^[a-f0-9]{64}$/;
const lateRefundStatuses = new Set<LateRefundStatus>(['recorded', 'checking', 'review-required', 'verified-full-refund']);
const revocationReasons = new Set<RevocationReason>(['full-refund', 'lost-dispute']);

function validRefundProjection(value: {state?: string; status?: string; lateRefundStatus?: LateRefundStatus; revocationReason?: RevocationReason}): boolean {
  const state = value.state ?? value.status;
  return (value.lateRefundStatus === undefined || lateRefundStatuses.has(value.lateRefundStatus)) &&
    (value.revocationReason === undefined || (state === 'revoked' && revocationReasons.has(value.revocationReason))) &&
    (value.lateRefundStatus !== 'verified-full-refund' || (state === 'revoked' && value.revocationReason === 'full-refund'));
}

export function authEntryUrl(action: 'login' | 'register', pathname: string, search = ''): string {
  const returnTo = pathname === '/checkout' ? `${pathname}${search}` : pathname;
  return `/auth/${action}?returnTo=${encodeURIComponent(returnTo)}`;
}

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
  renew = () => globalThis.location?.assign(authEntryUrl('login', globalThis.location.pathname, globalThis.location.search)),
}: {
  request?: FetchLike;
  storage?: StorageLike;
  uuid?: () => string;
  renew?: () => void;
} = {}): BuyerClient {
  const read = (): StoredCheckout | null => {
    try {
      const value = JSON.parse(storage.getItem(storageKey) || 'null') as StoredCheckout | null;
      if (value === null) return null;
      if (
        !['pending', 'paid', 'failed', 'revoked'].includes(value.state) ||
        !['stripe', 'mercadopago', 'paypal'].includes(value.input?.provider) ||
        !Number.isSafeInteger(value.input.amountCents) ||
        value.input.amountCents < 5000 ||
        value.input.amountCents > 100000 ||
        typeof value.requestKey !== 'string' ||
        !requestKeyPattern.test(value.requestKey) ||
        (value.buyerRef !== undefined && !buyerRefPattern.test(value.buyerRef)) ||
        (value.retryBlocked !== undefined && !['checkout-not-pending', 'checkout-reconciliation-required'].includes(value.retryBlocked)) ||
        (value.replacesOrderId !== undefined && !orderIdPattern.test(value.replacesOrderId)) ||
        (value.replacementCheckAvailable !== undefined && typeof value.replacementCheckAvailable !== 'boolean') ||
        !validRefundProjection(value)
      ) throw new Error('invalid stored checkout');
      if (value.result) validateResult(value.result, value.input.provider);
      const draft = value.replacementDraft;
      if (draft && (!value.buyerRef || !value.result || draft.oldOrderId !== value.result.orderId ||
        !orderIdPattern.test(draft.oldOrderId) || !requestKeyPattern.test(draft.nextRequestKey) ||
        draft.nextRequestKey === value.requestKey || !['stripe', 'mercadopago', 'paypal'].includes(draft.nextInput?.provider) ||
        !Number.isSafeInteger(draft.nextInput.amountCents) || draft.nextInput.amountCents < 5000 || draft.nextInput.amountCents > 100000 ||
        (draft.nextInput.provider === 'mercadopago' && typeof draft.nextInput.payerEmail !== 'string') ||
        (draft.nextInput.provider !== 'mercadopago' && draft.nextInput.payerEmail !== undefined))) throw new Error('invalid replacement draft');
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

  const rejection = (response: Response, body: {error?: string}): BuyerError => {
    const code = body.error || (response.status === 401 ? 'authentication-required' : 'request-not-completed');
    if (response.status === 401 && ['session_renewal_required', 'session_expired'].includes(code)) renew();
    return new BuyerError(code, response.status);
  };

  const json = async <T>(url: string, init?: RequestInit): Promise<T> => {
    const response = await request(url, {credentials: 'same-origin', cache: 'no-store', ...init});
    const body = await response.json() as T & {error?: string};
    if (!response.ok) throw rejection(response, body);
    return body;
  };

  const session = async (): Promise<BuyerSession> => {
    const active = await json<BuyerSession>('/api/session');
    if (active.authenticated && (typeof active.csrf !== 'string' || !buyerRefPattern.test(active.buyerRef))) {
      throw new BuyerError('invalid-session-response');
    }
    return active;
  };

  const authenticatedSession = async (): Promise<Extract<BuyerSession, {authenticated: true}>> => {
    const active = await session();
    if (!active.authenticated) throw new BuyerError('authentication-required');
    return active;
  };

  const post = async (url: string, body: object, expectedBuyerRef?: string): Promise<Response> => {
    const active = await authenticatedSession();
    if (expectedBuyerRef && active.buyerRef !== expectedBuyerRef) throw new BuyerError('checkout-account-mismatch');
    return request(url, {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {'content-type': 'application/json', 'x-csrf-token': active.csrf},
      body: JSON.stringify(body),
    });
  };

  const operation = async <T>(url: string, body: object, expectedBuyerRef?: string): Promise<T> => {
    const response = await post(url, body, expectedBuyerRef);
    const value = await response.json() as T & {error?: string};
    if (!response.ok) throw rejection(response, value);
    if (expectedBuyerRef && (await authenticatedSession()).buyerRef !== expectedBuyerRef) {
      throw new BuyerError('checkout-account-mismatch');
    }
    return value;
  };

  const inspectOwned = async (orderId: string, expectedBuyerRef?: string): Promise<StoredCheckout> => {
    const active = await authenticatedSession();
    if (expectedBuyerRef && active.buyerRef !== expectedBuyerRef) throw new BuyerError('checkout-account-mismatch');
    const recovered = await operation<StoredCheckout>('/api/restore', {orderId}, active.buyerRef);
    if (!recovered.input || typeof recovered.requestKey !== 'string' ||
      !['pending', 'paid', 'failed', 'revoked'].includes(recovered.state)) throw new BuyerError('invalid-checkout-response');
    if (recovered.replacesOrderId !== undefined && !orderIdPattern.test(recovered.replacesOrderId)) throw new BuyerError('invalid-checkout-response');
    if (recovered.replacementCheckAvailable !== undefined && typeof recovered.replacementCheckAvailable !== 'boolean') throw new BuyerError('invalid-checkout-response');
    if (!validRefundProjection(recovered)) throw new BuyerError('invalid-checkout-response');
    if (recovered.result) validateResult(recovered.result, recovered.input.provider);
    return {...recovered, buyerRef: active.buyerRef};
  };

  const restoreOwned = async (orderId: string): Promise<StoredCheckout> => {
    const current = read();
    const recovered = await inspectOwned(orderId);
    if (current?.buyerRef && current.buyerRef !== recovered.buyerRef) throw new BuyerError('checkout-account-mismatch');
    if (current?.replacementDraft && current.requestKey !== recovered.requestKey) throw new BuyerError('checkout-conflict');
    if (current && current.requestKey !== recovered.requestKey && !['paid', 'failed', 'revoked'].includes(current.state)) {
      throw new BuyerError('checkout-conflict');
    }
    save(current?.requestKey === recovered.requestKey
      ? {...recovered,
          ...(recovered.state === 'pending' && current.retryBlocked ? {retryBlocked: current.retryBlocked} : {}),
          ...(current.replacementDraft ? {replacementDraft: current.replacementDraft} : {})}
      : recovered);
    return read() as StoredCheckout;
  };

  return {
    pending: read,
    session,

    async hydrate(buyerRef) {
      if (!buyerRefPattern.test(buyerRef)) throw new BuyerError('invalid-session-response');
      const saved = read();
      if (!saved) return null;
      if (saved.buyerRef && saved.buyerRef !== buyerRef) throw new BuyerError('checkout-account-mismatch');
      if (saved.result?.orderId) {
        const owned = await inspectOwned(saved.result.orderId, buyerRef);
        if (owned.requestKey !== saved.requestKey) throw new BuyerError('checkout-account-mismatch');
        save(saved.replacementDraft ? {...owned,replacementDraft:saved.replacementDraft} : owned);
        return read();
      }
      if (!saved.buyerRef) throw new BuyerError('checkout-owner-unbound');
      return saved;
    },

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
      const active = await authenticatedSession();
      let pending = read();
      if (pending) {
        if (!pending.buyerRef) throw new BuyerError('checkout-owner-unbound');
        if (pending.buyerRef !== active.buyerRef) throw new BuyerError('checkout-account-mismatch');
        if (pending.replacementDraft) throw new BuyerError('payment-outcome-uncertain');
        if (pending.retryBlocked) throw new BuyerError(pending.retryBlocked);
        if (['failed', 'paid', 'revoked'].includes(pending.state)) throw new BuyerError('start-new-checkout');
        if (JSON.stringify(pending.input) !== JSON.stringify(normalized)) throw new BuyerError('checkout-conflict');
      } else {
        pending = {input: normalized, requestKey: uuid(), state: 'pending', buyerRef: active.buyerRef};
      }

      // Save before dispatch so refreshes and uncertain responses reuse the key.
      save(pending);
      try {
        const result = await operation<CheckoutResult>('/api/checkout', {...pending.input, requestKey: pending.requestKey,
          ...(pending.replacesOrderId ? {replaceOldOrderId: pending.replacesOrderId} : {})}, active.buyerRef);
        validateResult(result, input.provider);
        pending.result = result;
        save(pending);
        return result;
      } catch (error) {
        if (error instanceof BuyerError && error.code === 'payment-creation-failed') {
          pending.state = 'failed';
          save(pending);
        }
        if (error instanceof BuyerError && ['customer-checkout-pending', 'customer-checkout-unresolved'].includes(error.code)) {
          // A server-side reservation may already exist for this key even if
          // the final provider step failed. Clear only after an owned lookup
          // proves that the completed request created no order.
          try {
            const match = await operation<{found: boolean}>('/api/checkout/lookup',
              {requestKey: pending.requestKey}, active.buyerRef);
            if (match.found === false) storage.removeItem(storageKey);
          } catch { /* Keep the key while lookup or ownership is uncertain. */ }
        }
        if (error instanceof BuyerError && ['checkout-not-pending', 'checkout-reconciliation-required'].includes(error.code)) {
          pending.retryBlocked = error.code as StoredCheckout['retryBlocked'];
          save(pending);
        }
        throw error;
      }
    },

    async confirm() {
      const pending = read();
      if (!pending?.result?.orderId) throw new BuyerError('checkout-unbound');
      if (!pending.buyerRef) throw new BuyerError('checkout-owner-unbound');
      const result = await operation<{orderId: string; status: string}>('/api/confirm', {orderId: pending.result.orderId}, pending.buyerRef);
      if (result.status === 'paid' || result.status === 'revoked') {
        pending.state = result.status;
        save(pending);
      }
      return result;
    },

    async replaceExpired(input) {
      let old = read();
      if (!old?.result?.orderId || !old.buyerRef) throw new BuyerError('checkout-unbound');
      const active = await authenticatedSession();
      if (active.buyerRef !== old.buyerRef) throw new BuyerError('checkout-account-mismatch');
      let draft = old.replacementDraft;
      if (!draft) {
        if (!input || !['stripe', 'mercadopago', 'paypal'].includes(input.provider) ||
          !Number.isSafeInteger(input.amountCents) || input.amountCents < 5000 || input.amountCents > 100000 ||
          (input.provider === 'mercadopago' && (typeof input.payerEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.payerEmail))) ||
          (input.provider !== 'mercadopago' && input.payerEmail !== undefined)) throw new BuyerError('amount-invalid');
        const owned = await inspectOwned(old.result.orderId, active.buyerRef);
        if (owned.requestKey !== old.requestKey || owned.state !== 'pending' || owned.ledgerStatus !== 'expired' ||
          owned.replacementCheckAvailable !== true) throw new BuyerError('checkout-reconciliation-required');
        const nextRequestKey = uuid();
        if (!requestKeyPattern.test(nextRequestKey) || nextRequestKey === old.requestKey) throw new BuyerError('invalid-checkout-response');
        draft = {oldOrderId: old.result.orderId, nextRequestKey, nextInput: input};
        old = {...owned, replacementDraft: draft};
        save(old); // Persist before any possible provider command or lost response.
      } else if (input && JSON.stringify(input) !== JSON.stringify(draft.nextInput)) {
        throw new BuyerError('checkout-conflict');
      }

      const lookup = async () => {
        const match = await operation<{found: false} | {found: true; orderId: string; status: string; replacesOrderId: string | null}>(
          '/api/checkout/lookup', {requestKey: draft.nextRequestKey}, active.buyerRef);
        if (!match.found) return null;
        if (!orderIdPattern.test(match.orderId) || match.replacesOrderId !== draft.oldOrderId) throw new BuyerError('checkout-reconciliation-required');
        const successor = await inspectOwned(match.orderId, active.buyerRef);
        if (successor.requestKey !== draft.nextRequestKey || JSON.stringify(successor.input) !== JSON.stringify(draft.nextInput)) {
          throw new BuyerError('checkout-reconciliation-required');
        }
        if (successor.result) save({...successor, replacesOrderId: draft.oldOrderId});
        return successor;
      };

      // A resumed draft first checks whether an earlier response was lost.
      if (old.replacementDraft && input === undefined) {
        const found = await lookup();
        if (found) {
          if (found.result) return found.result;
          // A prepared successor may have no provider response yet. Replay its
          // exact key with the old-order link below, never as generic create.
        } else {
          const owned = await inspectOwned(draft.oldOrderId, active.buyerRef);
          if (owned.state !== 'pending' || owned.ledgerStatus !== 'expired' || owned.replacementCheckAvailable !== true) {
            throw new BuyerError('checkout-reconciliation-required');
          }
        }
      }

      try {
        const result = await operation<CheckoutResult>('/api/checkout',
          {...draft.nextInput, requestKey: draft.nextRequestKey, replaceOldOrderId: draft.oldOrderId}, active.buyerRef);
        validateResult(result, draft.nextInput.provider);
        const successor = await lookup();
        if (!successor || successor.result?.orderId !== result.orderId) throw new BuyerError('checkout-reconciliation-required');
        return successor.result;
      } catch (error) {
        // A post-commit 409 is possible. Never discard the saved successor key
        // until an owned lookup proves whether that exact request committed.
        let found: StoredCheckout | null = null;
        let lookupConfirmedAbsent = false;
        try {
          found = await lookup();
          lookupConfirmedAbsent = found === null;
        } catch { /* Preserve the draft on lookup failure. */ }
        if (found) {
          if (found.result) return found.result;
          // Keep the old order and draft key visible until exact-key replay.
        }
        if (error instanceof BuyerError && error.status === 409 && lookupConfirmedAbsent) {
          try {
            const owned = await inspectOwned(draft.oldOrderId, active.buyerRef);
            if (owned.state === 'pending' && owned.ledgerStatus === 'expired' && owned.replacementCheckAvailable === true) {
              save(owned); // The completed request created no successor and old is still open.
            }
          } catch { /* Keep the draft if ownership or old state is uncertain. */ }
        }
        throw error;
      }
    },

    async recoverExpired() {
      const pending = read();
      if (!pending?.result?.orderId) throw new BuyerError('checkout-unbound');
      if (!pending.buyerRef) throw new BuyerError('checkout-owner-unbound');
      if (pending.state !== 'pending' || (pending.ledgerStatus !== 'expired' && paymentPresentation(pending.result).checkoutState !== 'expired')) {
        throw new BuyerError('checkout-not-expired');
      }

      let verificationStatus: string | null = null;
      try {
        const verified = await operation<{orderId: string; status: string}>('/api/confirm', {orderId: pending.result.orderId}, pending.buyerRef);
        if (verified.orderId !== pending.result.orderId) throw new BuyerError('invalid-checkout-response');
        verificationStatus = verified.status;
      } catch (error) {
        // No provider binding means there are no provider instructions to verify.
        // The server-owned order must still be expired before this tab is released.
        if (!(error instanceof BuyerError && error.code === 'checkout-unbound')) throw error;
      }

      const restored = await restoreOwned(pending.result.orderId);
      // An expired reservation and a current non-payment observation do not prove
      // that an already-issued provider instruction cannot settle later.
      return {released: false, status: restored.ledgerStatus ?? verificationStatus ?? 'awaiting-payment'};
    },

    async download() {
      const pending = read();
      if (!pending?.result?.orderId) throw new BuyerError('checkout-unbound');
      if (!pending.buyerRef) throw new BuyerError('checkout-owner-unbound');
      return this.downloadOrder(pending.result.orderId);
    },

    async downloadOrder(orderId) {
      if (!orderIdPattern.test(orderId)) throw new BuyerError('order-id-invalid');
      const active = await authenticatedSession();
      const response = await post('/api/download', {orderId}, active.buyerRef);
      if (!response.ok) {
        const body = await response.json() as {error?: string};
        throw rejection(response, body);
      }
      const artifact = await response.blob();
      if ((await authenticatedSession()).buyerRef !== active.buyerRef) throw new BuyerError('checkout-account-mismatch');
      return artifact;
    },

    orders(before) {
      return json<{orders: OrderSummary[]; next: string | null}>(`/api/orders${before ? `?before=${encodeURIComponent(before)}` : ''}`)
        .then(page => {
          if (!Array.isArray(page.orders) || page.orders.some(order => !validRefundProjection(order))) {
            throw new BuyerError('invalid-checkout-response');
          }
          return page;
        });
    },

    restore: restoreOwned,
    inspect: inspectOwned,

    async verifyOrder(orderId) {
      if (!orderIdPattern.test(orderId)) throw new BuyerError('order-id-invalid');
      const active = await authenticatedSession();
      const verified = await operation<{orderId: string; status: string}>('/api/confirm', {orderId}, active.buyerRef);
      if (verified.orderId !== orderId || typeof verified.status !== 'string') throw new BuyerError('invalid-checkout-response');
      return verified;
    },

    async logout() {
      let saved: StoredCheckout | null = null;
      try { saved = read(); } catch { /* Revocation must remain available with damaged storage. */ }
      const response = await post('/auth/logout', {});
      if (!response.ok) {
        const body = await response.json() as {error?: string};
        throw rejection(response, body);
      }
      if (saved?.state === 'pending' || saved?.replacementDraft) return;
      try { storage.removeItem(storageKey); }
      catch { throw new BuyerError('signed-out-storage-unavailable'); }
    },

    reset() {
      const pending = read();
      if (pending?.replacementDraft) throw new BuyerError('payment-outcome-uncertain');
      if (pending && !['failed', 'paid', 'revoked'].includes(pending.state)) throw new BuyerError('payment-outcome-uncertain');
      storage.removeItem(storageKey);
    },
  };
}
