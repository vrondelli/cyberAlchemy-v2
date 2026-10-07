import {useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode} from 'react';
import {
  authEntryUrl,
  BuyerError,
  createBuyerClient,
  parsePrice,
  paymentPresentation,
  type CheckoutInput,
  type OrderSummary,
  type Provider,
  type StoredCheckout,
} from './client.ts';
import {
  checkoutPresentationState,
  checkoutProgressIndex,
  lateRefundMessage,
  revocationMessage,
  type CheckoutActivity,
  type CheckoutAuthState,
  type CheckoutPresentationState,
} from './presentation.ts';

const providerNames: Record<Provider, string> = {
  stripe: 'Stripe',
  mercadopago: 'Mercado Pago Pix',
  paypal: 'PayPal',
};

const messages: Record<string, string> = {
  'amount-invalid': 'Choose a price from $50.00 to $1,000.00, using no more than two decimal places.',
  'authentication-required': 'Sign in to continue. Your checkout remains saved in this tab.',
  'session_renewal_required': 'Your session needs to be renewed. Sign in again to resume this checkout.',
  'session_expired': 'Your session ended. Sign in again to recover this checkout.',
  'payment-creation-failed': 'The provider could not create this payment. You can safely start another checkout.',
  'payment-outcome-uncertain': 'The outcome is still uncertain. Resume this checkout instead of starting another payment.',
  'checkout-in-progress': 'The provider is still preparing this checkout. Wait a moment, then resume it.',
  'checkout-conflict': 'A different checkout is already saved in this tab. Restore or verify that order first.',
  'checkout-not-pending': 'This checkout is no longer open. Restore it from history to see its server status.',
  'checkout-unbound': 'Synvora has no confirmed provider reference for this order yet. It needs reconciliation before another payment.',
  'checkout-reconciliation-required': 'An earlier provider attempt needs reconciliation. This request key remains saved; find the order in history and do not create another payment.',
  'checkout-account-mismatch': 'This tab has a checkout from a different account. Sign in with the original account to resume it.',
  'checkout-owner-unbound': 'This older saved attempt cannot be linked to an account safely. Check your account history before another payment.',
  'customer-checkout-pending': 'An earlier checkout is still pending. Find your checkouts and restore it before paying again.',
  'customer-checkout-unresolved': 'An earlier provider payment may still complete. No new payment was created. Find that order in your history; Synvora must resolve it before you pay again.',
  'start-new-checkout': 'This checkout is complete. Start another checkout before choosing a new payment method.',
  'storage-unavailable': 'This browser could not safely save the checkout. Enable session storage before continuing.',
  'not-owned': 'This checkout belongs to another account.',
  'service-unavailable': 'Synvora could not reach the payment service. Your saved checkout has not been replaced.',
};

const terminalVerificationStatuses = new Set(['cancelled', 'failed', 'rejected', 'revoked']);

function errorMessage(error: unknown): string {
  return error instanceof BuyerError
    ? messages[error.code] ?? 'The request could not finish. Your saved checkout remains safe to retry.'
    : 'The request could not finish. Your saved checkout remains safe to retry.';
}

function money(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {style: 'currency', currency}).format(cents / 100);
}

function remainingTime(seconds: number): string {
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function initialAmount(): string {
  const candidate = new URLSearchParams(window.location.search).get('amount') ?? '200';
  try {
    parsePrice(candidate);
    return candidate;
  } catch {
    return '200';
  }
}

function stateHeading(state: CheckoutPresentationState): {eyebrow: string; title: ReactNode; intro: string} {
  switch (state) {
    case 'creating': return {eyebrow: 'Creating checkout', title: <>Preparing your<br/><em>payment.</em></>, intro: 'Synvora is creating one retry-safe provider session. Do not refresh or submit again.'};
    case 'awaiting_provider': return {eyebrow: 'Provider action', title: <>Continue with<br/><em>your provider.</em></>, intro: 'Complete the sandbox approval with the provider, then return here for Synvora verification.'};
    case 'awaiting_customer_action': return {eyebrow: 'Pix ready', title: <>Scan. Pay.<br/><em>Then verify.</em></>, intro: 'Use the sandbox Pix code before it expires. Synvora checks the provider before delivery.'};
    case 'verifying': return {eyebrow: 'Verification', title: <>Checking the<br/><em>provider.</em></>, intro: 'Synvora is asking the provider directly. A return URL never marks an order paid.'};
    case 'pending': return {eyebrow: 'Payment pending', title: <>Your order is<br/><em>still protected.</em></>, intro: 'The provider has not confirmed payment. Keep this order and check the same attempt again.'};
    case 'replacement_pending': return {eyebrow: 'Replacement check', title: <>One request,<br/><em>still protected.</em></>, intro: 'Synvora saved the exact replacement key. Resume it to learn whether the old payment was safely closed; no second key will be created.'};
    case 'paid': return {eyebrow: 'Payment verified', title: <>Ready for the<br/><em>workbench.</em></>, intro: 'Synvora verified the payment and unlocked the test artifact for this account.'};
    case 'revoked': return {eyebrow: 'Access revoked', title: <>This order is<br/><em>closed.</em></>, intro: 'Synvora verified a full refund or lost dispute. Future access to this order is no longer available.'};
    case 'failed': return {eyebrow: 'Checkout closed', title: <>This attempt<br/><em>did not complete.</em></>, intro: 'The provider outcome is terminal. The order remains in your history and a new checkout is safe.'};
    case 'review_required': return {eyebrow: 'Review required', title: <>Your order is<br/><em>being preserved.</em></>, intro: 'The payment outcome needs reconciliation. Do not create a second payment for this order.'};
    case 'unavailable': return {eyebrow: 'Account check', title: <>Securing your<br/><em>checkout.</em></>, intro: 'Checkout stays closed until Synvora can confirm your account session.'};
    default: return {eyebrow: 'Review checkout', title: <>Choose your<br/><em>instrument.</em></>, intro: 'Set your price and sandbox payment method. The same test artifact is used at every accepted price; final ARE license terms are under review.'};
  }
}

function restoredCheckoutStatus(saved: StoredCheckout): string {
  if (saved.replacementDraft) return 'A replacement request key is saved. Resume that exact request or check your order history; do not start another payment.';
  if (saved.state === 'revoked') return revocationMessage(saved.revocationReason);
  if (saved.state === 'paid') return 'Payment verified by Synvora. Your test artifact is ready.';
  if (saved.state === 'failed') return 'This checkout is closed. Start another checkout when you are ready.';
  if (saved.ledgerStatus === 'paid-review' || saved.result?.checkoutState === 'verification-required') {
    return lateRefundMessage(saved.lateRefundStatus) ?? 'This payment needs review. Do not start another payment.';
  }
  if (!saved.result || saved.result.checkoutState === 'preparing') {
    return 'Your saved checkout request is loaded. Resume this same attempt.';
  }
  return 'Your saved order is loaded. Continue or verify the same payment attempt.';
}

function CheckoutProgress({state}: {state: CheckoutPresentationState}) {
  const active = checkoutProgressIndex(state);
  return <ol className="checkout-progress" aria-label="Checkout progress">
    {['Review', 'Provider', 'Verify', 'Result'].map((label, index) => <li key={label} className={index < active ? 'complete' : index === active ? 'active' : ''} aria-current={index === active ? 'step' : undefined}><span>{String(index + 1).padStart(2, '0')}</span>{label}</li>)}
  </ol>;
}

function OrderSummaryCard({amount, provider, checkout, pending = false, unavailable = false}: {amount: string; provider: Provider; checkout: StoredCheckout | null; pending?: boolean; unavailable?: boolean}) {
  if (pending) return <div className="checkout-order-card" aria-busy="true"><p className="checkout-kicker">K—001 / Alpha software</p><h2>Agent Reasoning Engine.</h2><p>Checking your account and saved order before showing an amount.</p></div>;
  if (unavailable) return <div className="checkout-order-card"><p className="checkout-kicker">K—001 / Alpha software</p><h2>Agent Reasoning Engine.</h2><p>Account details are unavailable. Retry the account check before reviewing an order amount.</p></div>;
  let inputCents = 20000;
  try { inputCents = parsePrice(amount); } catch { /* Keep the last safe visual fallback while the field is being edited. */ }
  const result = checkout?.result ? paymentPresentation(checkout.result) : null;
  const finalAmount = result ? money(result.amountCents, result.currency) : money(inputCents);
  const finalCurrency = result?.currency ?? 'USD';
  const selectedProvider = checkout?.input.provider ?? provider;
  return <div className="checkout-order-card">
    <p className="checkout-kicker">K—001 / Alpha software</p>
    <div className="checkout-order-art"><img src="/assets/artifact.svg" alt=""/></div>
    <h2>Agent Reasoning Engine.</h2>
    <dl>
      <div><dt>Your price</dt><dd>{money(checkout?.input.amountCents ?? inputCents)} USD</dd></div>
      <div><dt>Payment method</dt><dd>{providerNames[selectedProvider]}</dd></div>
      {result?.currency === 'BRL' ? <div><dt>Frozen conversion</dt><dd>{finalAmount} BRL</dd></div> : null}
      {result?.quoteReference ? <div><dt>Quote</dt><dd>{result.quoteReference}</dd></div> : null}
      <div className="checkout-order-total"><dt>Provider total</dt><dd>{finalAmount} {finalCurrency}</dd></div>
    </dl>
    <p className="checkout-order-note">Sandbox demonstration only. No ARE engine release is delivered. Final license terms are under review.</p>
  </div>;
}

function Summary({amount, provider, checkout, pending, unavailable}: {amount: string; provider: Provider; checkout: StoredCheckout | null; pending: boolean; unavailable: boolean}) {
  return <details className="checkout-summary-mobile"><summary>Order summary</summary><OrderSummaryCard amount={amount} provider={provider} checkout={checkout} pending={pending} unavailable={unavailable}/></details>;
}

export function CheckoutPage() {
  const client = useMemo(() => createBuyerClient(), []);
  const verifiedBuyerRef = useRef<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const actionInFlight = useRef(false);
  const refreshAfterAction = useRef(false);
  const checkedExpiryRef = useRef<string | null>(null);
  const [authState, setAuthState] = useState<CheckoutAuthState>('checking');
  const [sessionAttempt, setSessionAttempt] = useState(0);
  const [checkout, setCheckout] = useState<StoredCheckout | null>(null);
  const [amount, setAmount] = useState(initialAmount);
  const [provider, setProvider] = useState<Provider>('stripe');
  const [email, setEmail] = useState('');
  const [activity, setActivity] = useState<CheckoutActivity>('idle');
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [recoveryProblem, setRecoveryProblem] = useState<string | null>(null);
  const [resumeBlocked, setResumeBlocked] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<StoredCheckout | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [status, setStatus] = useState(() => window.location.pathname === '/purchase/return'
    ? 'Welcome back. Synvora will verify this provider return directly.'
    : window.location.pathname === '/purchase/cancel'
      ? 'You returned without completing approval. Your existing checkout is still saved.'
      : 'Review the amount and choose a sandbox payment method.');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<OrderSummary[]>([]);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const route = window.location.pathname;
  const loginHref = authEntryUrl('login', route, window.location.search);
  const registerHref = authEntryUrl('register', route, window.location.search);

  const sync = useCallback((preserveVerification = false) => {
    try {
      const saved = client.pending();
      if (saved && (!verifiedBuyerRef.current || saved.buyerRef !== verifiedBuyerRef.current)) {
        setCheckout(null);
        setRecoveryProblem(saved.buyerRef ? 'checkout-account-mismatch' : 'checkout-owner-unbound');
        return;
      }
      setCheckout(saved);
      if (saved) {
        setResumeBlocked(Boolean(saved.retryBlocked));
        if (!saved.replacementCheckAvailable || saved.replacementDraft) {
          const shown = saved.replacementDraft?.nextInput ?? saved.input;
          setAmount((shown.amountCents / 100).toFixed(2));
          setProvider(shown.provider);
          setEmail(shown.payerEmail ?? '');
        }
        if (!preserveVerification) setVerificationStatus(saved.ledgerStatus ?? null);
      }
    } catch (caught) {
      setCheckout(null);
      setError(errorMessage(caught));
    }
  }, [client]);

  const finishAction = useCallback(() => {
    actionInFlight.current = false;
    if (refreshAfterAction.current && document.visibilityState === 'visible') {
      refreshAfterAction.current = false;
      setNow(Math.floor(Date.now() / 1000));
      setSessionAttempt(value => value + 1);
    }
  }, []);

  useEffect(() => {
    headingRef.current?.focus({preventScroll: true});
  }, []);

  useEffect(() => {
    if (error) errorRef.current?.focus({preventScroll: true});
  }, [error]);

  useEffect(() => {
    let active = true;
    verifiedBuyerRef.current = null;
    setAuthState('checking');
    setError('');
    setCheckout(null);
    setSelectedOrder(null);
    setSelectedOrderId(null);
    setHistory([]);
    setNextPage(null);
    setHistoryOpen(false);
    setRecoveryProblem(null);
    void (async () => {
      try {
        const session = await client.session();
        if (!active) return;
        if (!session.authenticated) { setAuthState('anonymous'); return; }
        verifiedBuyerRef.current = session.buyerRef;
        try {
          const saved = await client.hydrate(session.buyerRef);
          if (!active) return;
          setCheckout(saved);
          if (saved) {
            setResumeBlocked(Boolean(saved.retryBlocked));
            const shown = saved.replacementDraft?.nextInput ?? saved.input;
            setAmount((shown.amountCents / 100).toFixed(2));
            setProvider(shown.provider);
            setEmail(shown.payerEmail ?? '');
            setVerificationStatus(saved.ledgerStatus ?? null);
            setStatus(restoredCheckoutStatus(saved));
          } else {
            setStatus('Review the amount and choose a sandbox payment method.');
          }
        } catch (caught) {
          if (!active) return;
          if (caught instanceof BuyerError && ['checkout-account-mismatch', 'checkout-owner-unbound', 'not-owned', 'storage-unavailable'].includes(caught.code)) {
            setRecoveryProblem(caught.code === 'not-owned' ? 'checkout-account-mismatch' : caught.code);
          } else throw caught;
        }
        setAuthState('authenticated');
      } catch (caught) {
        if (active) { setAuthState('unavailable'); setError('Account check could not finish. No payment action is enabled. Retry your account check.'); }
      }
    })();
    return () => { active = false; };
  }, [client, sessionAttempt]);

  useEffect(() => {
    const hide = () => {
      if (document.visibilityState !== 'hidden') return;
      verifiedBuyerRef.current = null;
      setCheckout(null);
      setSelectedOrder(null);
      setSelectedOrderId(null);
      setHistory([]);
      setNextPage(null);
      setHistoryOpen(false);
      setAuthState('checking');
    };
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      if (actionInFlight.current) { refreshAfterAction.current = true; return; }
      refreshAfterAction.current = false;
      setNow(Math.floor(Date.now() / 1000));
      setSessionAttempt(value => value + 1);
    };
    document.addEventListener('visibilitychange', hide);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  useEffect(() => {
    const deadline = Math.min(checkout?.result?.expiresAt ?? Infinity, checkout?.result?.paymentExpiresAt ?? Infinity);
    if (!Number.isFinite(deadline) || now >= deadline) return;
    const timer = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [checkout?.result?.expiresAt, checkout?.result?.paymentExpiresAt, now]);

  const result = checkout?.result ? paymentPresentation(checkout.result, now) : null;
  const viewState = checkoutPresentationState({authState, checkout, activity, verificationStatus, now});
  const replacementCheckAvailable = authState === 'authenticated' && checkout?.state === 'pending' &&
    checkout.ledgerStatus === 'expired' && checkout.replacementCheckAvailable === true && !checkout.replacementDraft;
  const heading = stateHeading(viewState);
  const deadline = Math.min(result?.expiresAt ?? Infinity, result?.paymentExpiresAt ?? Infinity);
  const remainingSeconds = Number.isFinite(deadline) ? Math.max(0, deadline - now) : null;
  const remaining = remainingSeconds === null ? null : remainingTime(remainingSeconds);

  const performConfirm = useCallback(async (automatic = false) => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    setActivity('verifying');
    setError('');
    if (!automatic) setStatus('Synvora is checking the provider directly…');
    try {
      const pending = client.pending();
      if (pending?.result && (pending.ledgerStatus === 'expired' || paymentPresentation(pending.result).checkoutState === 'expired')) {
        const recovered = await client.recoverExpired();
        if (recovered.released) {
          setVerificationStatus(null);
          setHistoryOpen(false);
          setStatus('The previous order expired without verified payment. Choose a new price and payment method; the old order remains in your history.');
          window.history.replaceState(null, '', '/checkout');
        } else {
          setVerificationStatus(recovered.status);
          setStatus(recovered.status === 'paid'
            ? 'Payment verified by Synvora. Your test artifact is ready.'
            : recovered.status === 'paid-review' || recovered.status === 'verification-required'
              ? lateRefundMessage(client.pending()?.lateRefundStatus) ?? 'The payment outcome requires review. Do not start another payment.'
              : recovered.status === 'expired'
                ? 'The reservation expired, but Synvora cannot prove that another payment is safe. Keep this order for reconciliation.'
                : 'The old provider instructions are closed, but this order is still unresolved. Check it again before starting another payment.');
        }
        return;
      }
      const value = await client.confirm();
      setVerificationStatus(value.status);
      if (terminalVerificationStatuses.has(value.status) || value.status === 'paid-review') await client.restore(value.orderId);
      setStatus(value.status === 'paid'
        ? 'Payment verified by Synvora. Your test artifact is ready.'
        : value.status === 'revoked'
          ? revocationMessage(client.pending()?.revocationReason)
        : value.status === 'paid-review'
          ? lateRefundMessage(client.pending()?.lateRefundStatus) ?? 'Payment was detected outside the normal window and requires review. Do not pay again.'
          : value.status === 'expired'
            ? 'The provider payment window ended. The existing order remains available for verification.'
            : 'The provider has not confirmed payment yet. Keep this checkout and check again.');
    } catch (caught) {
      if (caught instanceof BuyerError && caught.code === 'checkout-account-mismatch') {
        verifiedBuyerRef.current = null;
        setCheckout(null);
        setSelectedOrder(null);
        setSelectedOrderId(null);
        setHistory([]);
        setHistoryOpen(false);
        setRecoveryProblem(caught.code);
      }
      const message = errorMessage(caught);
      if (automatic) setStatus(`Automatic verification paused. ${message}`);
      else setError(message);
    } finally {
      setActivity('idle');
      finishAction();
      sync(true);
    }
  }, [client, finishAction, sync]);

  useEffect(() => {
    const orderId = checkout?.result?.orderId;
    if (authState !== 'authenticated' || checkout?.replacementDraft || !orderId || result?.checkoutState !== 'expired' || checkedExpiryRef.current === orderId) return;
    checkedExpiryRef.current = orderId;
    void performConfirm(true);
  }, [authState, checkout?.replacementDraft, checkout?.result?.orderId, result?.checkoutState, performConfirm]);

  useEffect(() => {
    const orderId = checkout?.result?.orderId;
    const shouldPoll = authState === 'authenticated' && checkout?.state === 'pending' && !checkout.replacementDraft && Boolean(orderId) && checkout?.result?.checkoutState !== 'preparing' && route !== '/purchase/cancel' && (route === '/purchase/return' || checkout?.input.provider === 'mercadopago');
    if (!shouldPoll) return;
    let attempts = 0;
    let stopped = false;
    const check = () => {
      if (stopped || document.visibilityState !== 'visible' || attempts >= 12) return;
      attempts += 1;
      void performConfirm(true);
    };
    const first = window.setTimeout(check, 1800);
    const timer = window.setInterval(check, 10_000);
    const visible = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', visible);
    return () => {
      stopped = true;
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', visible);
    };
  }, [authState, checkout?.input.provider, checkout?.replacementDraft, checkout?.result?.orderId, checkout?.result?.checkoutState, checkout?.state, performConfirm, route]);

  const prepare = (input: CheckoutInput, replace = false) => {
    if (actionInFlight.current) return;
    void (async () => {
      actionInFlight.current = true;
      setActivity('creating');
      setError('');
      setResumeBlocked(false);
      setStatus(replace ? 'Checking whether the old provider payment is conclusively closed…' : input.provider === 'mercadopago' ? 'Preparing a frozen BRL quote and Pix payment…' : `Preparing one retry-safe ${providerNames[input.provider]} checkout…`);
      try {
        let created = replace ? await client.replaceExpired(client.pending()?.replacementDraft ? undefined : input) : await client.create(input);
        for (const delay of [1000, 2000, 4000]) {
          if (created.checkoutState !== 'preparing' || Date.now() >= (created.expiresAt ?? 0) * 1000) break;
          setStatus('Mercado Pago is still preparing the Pix code…');
          await new Promise(resolve => window.setTimeout(resolve, delay));
          created = await client.create(input);
        }
        setVerificationStatus(created.checkoutState ?? null);
        setStatus(created.checkoutState === 'verification-required'
          ? 'The Pix details require provider verification. Resume this same checkout later.'
          : created.checkoutState === 'preparing'
            ? 'Mercado Pago is still preparing the Pix code. Resume this same checkout later without creating another payment.'
          : created.checkoutState === 'expired'
            ? 'The payment window ended before instructions became available. Verify this order before retrying.'
            : created.pixCode
              ? 'Pix is ready. Pay in the sandbox, then Synvora will verify this same order.'
              : 'The hosted payment is ready. Continue with the provider, then return for verification.');
      } catch (caught) {
        if (caught instanceof BuyerError && caught.code === 'checkout-account-mismatch') {
          verifiedBuyerRef.current = null;
          setCheckout(null);
          setSelectedOrder(null);
          setSelectedOrderId(null);
          setHistory([]);
          setHistoryOpen(false);
          setRecoveryProblem(caught.code);
        }
        setError(errorMessage(caught));
        setStatus(client.pending()?.replacementDraft
          ? 'The replacement outcome is not yet clear. The same request key remains saved; resume it or check history.'
          : caught instanceof BuyerError && ['customer-checkout-pending', 'customer-checkout-unresolved'].includes(caught.code)
          ? 'No new checkout was opened. Find and review the earlier order in your account history.'
          : 'Checkout preparation stopped. Review the alert before taking another action.');
        if (caught instanceof BuyerError && ['checkout-not-pending', 'checkout-reconciliation-required'].includes(caught.code)) setResumeBlocked(true);
      } finally {
        setActivity('idle');
        finishAction();
        sync();
      }
    })();
  };

  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      prepare({provider, amountCents: parsePrice(amount), ...(provider === 'mercadopago' ? {payerEmail: email} : {})}, replacementCheckAvailable);
    } catch (caught) { setError(errorMessage(caught)); }
  };

  const resume = () => {
    try {
      const saved = client.pending();
      if (saved?.replacementDraft) { prepare(saved.replacementDraft.nextInput, true); return; }
      if (!saved || saved.state !== 'pending') throw new BuyerError('checkout-not-pending');
      prepare(saved.input);
    } catch (caught) { setError(errorMessage(caught)); }
  };

  const loadHistory = (before?: string) => {
    if (actionInFlight.current) return;
    void (async () => {
      actionInFlight.current = true;
      setError('');
      try {
        const page = await client.orders(before);
        const session = await client.session();
        if (!session.authenticated || session.buyerRef !== verifiedBuyerRef.current) throw new BuyerError('checkout-account-mismatch');
        setHistory(old => before ? [...old, ...page.orders] : page.orders);
        setNextPage(page.next);
        setHistoryOpen(true);
        setStatus(page.orders.length ? 'Choose an order to restore it into this checkout.' : 'No previous checkouts were found for this account.');
      } catch (caught) {
        if (caught instanceof BuyerError && caught.code === 'checkout-account-mismatch') {
          verifiedBuyerRef.current = null;
          setCheckout(null); setSelectedOrder(null); setSelectedOrderId(null); setHistory([]); setHistoryOpen(false); setRecoveryProblem(caught.code);
        }
        setError(errorMessage(caught));
      }
      finally { finishAction(); }
    })();
  };

  const restore = (orderId: string) => {
    if (actionInFlight.current) return;
    void (async () => {
      actionInFlight.current = true;
      setError('');
      try {
        const owned = await client.inspect(orderId);
        setSelectedOrder(owned);
        setSelectedOrderId(orderId);
        setStatus('Order details loaded from your account. Your active checkout was not replaced.');
      } catch (caught) {
        if (caught instanceof BuyerError && caught.code === 'checkout-account-mismatch') {
          verifiedBuyerRef.current = null;
          setCheckout(null); setSelectedOrder(null); setSelectedOrderId(null); setHistory([]); setHistoryOpen(false); setRecoveryProblem(caught.code);
        }
        setError(errorMessage(caught));
      }
      finally { finishAction(); }
    })();
  };

  const checkSelectedOrder = (orderId: string) => {
    if (actionInFlight.current) return;
    void (async () => {
      actionInFlight.current = true;
      setError('');
      try {
        await client.verifyOrder(orderId);
        const owned = await client.inspect(orderId);
        setSelectedOrder(owned);
        setStatus(owned.state === 'paid'
          ? 'Payment verified by Synvora. This older test artifact is ready in your history.'
          : owned.ledgerStatus === 'paid-review'
            ? lateRefundMessage(owned.lateRefundStatus) ?? 'This older payment needs review before delivery or another payment.'
            : 'This older payment is still unresolved. Your current request key has not been replaced.');
      } catch (caught) {
        if (caught instanceof BuyerError && caught.code === 'checkout-account-mismatch') {
          verifiedBuyerRef.current = null;
          setCheckout(null); setSelectedOrder(null); setSelectedOrderId(null);
          setHistory([]); setHistoryOpen(false); setRecoveryProblem(caught.code);
        }
        setError(errorMessage(caught));
      } finally { finishAction(); }
    })();
  };

  const resumeFromHistory = (orderId: string) => {
    if (actionInFlight.current) return;
    void (async () => {
      actionInFlight.current = true;
      setError('');
      try {
        const owned = await client.restore(orderId);
        verifiedBuyerRef.current = owned.buyerRef ?? null;
        setCheckout(owned);
        setSelectedOrder(null);
        setSelectedOrderId(null);
        setHistoryOpen(false);
        setRecoveryProblem(null);
        setResumeBlocked(Boolean(owned.retryBlocked));
        setVerificationStatus(owned.ledgerStatus ?? null);
        setStatus('Your existing order is back in this checkout. Continue or verify the same payment attempt.');
      } catch (caught) {
        if (caught instanceof BuyerError && caught.code === 'checkout-account-mismatch') {
          verifiedBuyerRef.current = null;
          setCheckout(null); setSelectedOrder(null); setSelectedOrderId(null); setHistory([]); setHistoryOpen(false); setRecoveryProblem(caught.code);
        }
        setError(errorMessage(caught));
      }
      finally { finishAction(); }
    })();
  };

  const reset = () => {
    try {
      client.reset();
      setCheckout(null);
      setVerificationStatus(null);
      setHistoryOpen(false);
      setStatus('Choose a price and payment method for a new checkout.');
      window.history.replaceState(null, '', '/checkout');
    } catch (caught) { setError(errorMessage(caught)); }
  };

  const download = (orderId?: string) => {
    if (actionInFlight.current) return;
    void (async () => {
      actionInFlight.current = true;
      setError('');
      try {
        const blob = orderId ? await client.downloadOrder(orderId) : await client.download();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'are-sandbox-fixture.bin';
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
        setStatus('Verified test artifact downloaded.');
      } catch (caught) {
        if (caught instanceof BuyerError && caught.code === 'checkout-account-mismatch') {
          verifiedBuyerRef.current = null;
          setCheckout(null); setSelectedOrder(null); setSelectedOrderId(null); setHistory([]); setHistoryOpen(false); setRecoveryProblem(caught.code);
        }
        setError(errorMessage(caught));
      }
      finally { finishAction(); }
    })();
  };

  const copyPix = () => {
    const pixCode = result?.pixCode;
    if (!pixCode) return;
    void (async () => {
      try {
        const session = await client.session();
        if (!session.authenticated || session.buyerRef !== verifiedBuyerRef.current) throw new BuyerError('checkout-account-mismatch');
        const owned = await client.hydrate(session.buyerRef);
        if (owned?.state !== 'pending' || !owned.result || paymentPresentation(owned.result).pixCode !== pixCode) throw new BuyerError('checkout-not-pending');
        await navigator.clipboard.writeText(pixCode);
        setStatus('Pix code copied. Complete the sandbox payment before it expires.');
      } catch (caught) {
        if (caught instanceof BuyerError && caught.code === 'checkout-account-mismatch') { setCheckout(null); setRecoveryProblem(caught.code); }
        if (caught instanceof BuyerError && caught.code === 'checkout-not-pending') sync();
        if (caught instanceof BuyerError) setError(errorMessage(caught));
        else {
          setError('Automatic copy was blocked by your browser. Select the Pix code above and copy it manually; your payment is unchanged.');
        }
      }
    })();
  };

  const openProvider = (url: string) => {
    if (actionInFlight.current) return;
    actionInFlight.current = true;
    void (async () => {
      try {
        const session = await client.session();
        if (!session.authenticated || session.buyerRef !== verifiedBuyerRef.current) throw new BuyerError('checkout-account-mismatch');
        const owned = await client.hydrate(session.buyerRef);
        if (owned?.state !== 'pending' || !owned.result || paymentPresentation(owned.result).checkoutUrl !== url) throw new BuyerError('checkout-not-pending');
        window.location.assign(url);
      } catch (caught) {
        if (caught instanceof BuyerError && caught.code === 'checkout-account-mismatch') { setCheckout(null); setRecoveryProblem(caught.code); }
        if (caught instanceof BuyerError && caught.code === 'checkout-not-pending') sync();
        setError(errorMessage(caught));
      } finally { finishAction(); }
    })();
  };

  const logout = () => {
    if (actionInFlight.current) return;
    void (async () => {
      actionInFlight.current = true;
      setStatus('Signing out…');
      try { await client.logout(); window.location.assign('/signed-out'); }
      catch (caught) { setError(`Sign out was not completed. ${errorMessage(caught)}`); finishAction(); }
    })();
  };

  const reviewForm = <form className="checkout-review-form" onSubmit={create} noValidate={false}>
    <div className="checkout-field"><label htmlFor="checkout-amount">Your price in USD</label><div className="checkout-money-field"><span aria-hidden="true">$</span><input id="checkout-amount" value={amount} onChange={event => setAmount(event.target.value)} inputMode="decimal" autoComplete="off" required pattern="[0-9]+([.][0-9]{1,2})?" aria-describedby="checkout-amount-help"/></div><small id="checkout-amount-help">Choose from $50.00 to $1,000.00. The sandbox test artifact does not change.</small></div>
    <fieldset className="checkout-provider-fieldset"><legend>Payment method</legend>{(Object.keys(providerNames) as Provider[]).map(value => <label key={value} className={provider === value ? 'selected' : ''}><input type="radio" name="provider" value={value} checked={provider === value} onChange={() => setProvider(value)}/><span><strong>{providerNames[value]}</strong><small>{value === 'mercadopago' ? 'Pix · frozen BRL quote' : value === 'paypal' ? 'Hosted PayPal sandbox' : 'Hosted Stripe sandbox'}</small></span></label>)}</fieldset>
    {provider === 'mercadopago' ? <div className="checkout-field"><label htmlFor="checkout-email">Pix payer email</label><input id="checkout-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required/><small>Used only to create the sandbox Pix payment with Mercado Pago.</small></div> : null}
    <div className="checkout-trust-note"><strong>Payment credentials stay with the provider.</strong><span>Synvora only unlocks the sandbox test artifact after server verification.</span></div>
    <button className="checkout-primary" type="submit" disabled={activity !== 'idle'}>{replacementCheckAvailable ? 'Check old payment and start a new checkout' : provider === 'mercadopago' ? 'Generate sandbox Pix' : `Continue to ${providerNames[provider]}`}</button>
  </form>;

  let stateContent: ReactNode = reviewForm;
  if (authState === 'anonymous') {
    stateContent = <div className="checkout-gate"><p>Sign in to create or recover a checkout. Your selected price will remain in this URL.</p><div className="checkout-actions"><a className="checkout-primary" href={loginHref}>Sign in to continue</a><a className="checkout-secondary" href={registerHref}>Create an account</a></div></div>;
  } else if (authState === 'checking' || authState === 'unavailable') {
    stateContent = <div className="checkout-gate"><p>{authState === 'checking' ? 'Checking your account and saved order…' : 'Synvora cannot confirm your account right now. No payment action is enabled.'}</p>{authState === 'unavailable' ? <div className="checkout-actions"><button className="checkout-secondary" type="button" onClick={() => setSessionAttempt(value => value + 1)}>Retry account check</button><a className="checkout-secondary" href={loginHref}>Sign in again</a></div> : null}</div>;
  } else if (recoveryProblem) {
    stateContent = <div className="checkout-gate"><p>{messages[recoveryProblem] ?? 'The saved checkout cannot be linked to this account safely.'} No new payment will be started from that saved key.</p><div className="checkout-actions">{recoveryProblem !== 'storage-unavailable' ? <a className="checkout-primary" href={loginHref}>Sign in with the original account</a> : null}<button className="checkout-secondary" type="button" onClick={() => loadHistory()}>Check this account’s history</button></div></div>;
  } else if (viewState === 'creating' || viewState === 'verifying') {
    stateContent = <div className="checkout-state-card busy" aria-busy="true"><span className="checkout-spinner" aria-hidden="true"/><p>{viewState === 'creating' ? 'Creating one protected provider session…' : 'Checking this order with the provider…'}</p></div>;
  } else if (viewState === 'awaiting_provider' && result) {
    stateContent = <div className="checkout-state-card"><p className="checkout-state-label">{providerNames[checkout!.input.provider]} is ready</p><p>Open the provider to approve this sandbox payment. When you return, Synvora will verify the existing order.</p><div className="checkout-actions"><button className="checkout-primary" type="button" onClick={() => openProvider(result.checkoutUrl!)}>Open {providerNames[checkout!.input.provider]} <span aria-hidden="true">↗</span></button><button className="checkout-secondary" type="button" onClick={() => void performConfirm(false)}>Check payment status</button></div></div>;
  } else if (viewState === 'awaiting_customer_action' && result?.pixCode) {
    stateContent = <div className="checkout-state-card"><div className="checkout-state-row"><p className="checkout-state-label">Pix copy-and-paste code</p>{remaining ? <span className="checkout-expiry">Expires in {remaining}</span> : null}</div><textarea className="checkout-pix-code" aria-label="Pix copy-and-paste code" readOnly rows={4} value={result.pixCode}/><div className="checkout-actions"><button className="checkout-primary" type="button" onClick={copyPix}>Copy Pix code</button><button className="checkout-secondary" type="button" onClick={() => void performConfirm(false)}>Check payment status</button></div></div>;
  } else if (viewState === 'paid') {
    stateContent = <div className="checkout-state-card outcome success"><span className="checkout-outcome-mark" aria-hidden="true">✓</span><p>Order <code>{result?.orderId.slice(0, 8)}</code> was verified by Synvora. The paid order remains in your account history.</p><div className="checkout-actions"><button className="checkout-primary" type="button" onClick={() => download()}>Download verified artifact</button><button className="checkout-secondary" type="button" onClick={reset}>Start another checkout</button></div></div>;
  } else if (viewState === 'revoked') {
    stateContent = <div className="checkout-state-card outcome warning"><span className="checkout-outcome-mark" aria-hidden="true">!</span><p>{revocationMessage(checkout?.revocationReason)} Previously downloaded copies cannot be recalled.</p><div className="checkout-actions"><button className="checkout-primary" type="button" onClick={reset}>Start another checkout</button><button className="checkout-secondary" type="button" onClick={() => loadHistory()}>View order history</button></div></div>;
  } else if (viewState === 'failed') {
    stateContent = <div className="checkout-state-card outcome failed"><span className="checkout-outcome-mark" aria-hidden="true">×</span><p>This provider attempt is closed. Starting another checkout will not erase this order.</p><div className="checkout-actions"><button className="checkout-primary" type="button" onClick={reset}>Start another checkout</button><button className="checkout-secondary" type="button" onClick={() => loadHistory()}>View order history</button></div></div>;
  } else if (viewState === 'review_required') {
    stateContent = <div className="checkout-state-card outcome warning"><span className="checkout-outcome-mark" aria-hidden="true">!</span><p>{lateRefundMessage(checkout?.lateRefundStatus) ?? 'Synvora preserved this order for reconciliation. Do not create a replacement payment while review is required.'}</p><div className="checkout-actions"><button className="checkout-primary" type="button" onClick={() => void performConfirm(false)}>Check again</button><button className="checkout-secondary" type="button" onClick={() => loadHistory()}>View order history</button></div></div>;
  } else if (viewState === 'replacement_pending') {
    stateContent = <div className="checkout-state-card outcome warning"><span className="checkout-outcome-mark" aria-hidden="true">!</span><p>The previous order remains visible while Synvora resolves one saved replacement request. A timeout or closed tab does not create permission for another key.</p><div className="checkout-actions"><button className="checkout-primary" type="button" onClick={resume}>Resume the saved replacement</button><button className="checkout-secondary" type="button" onClick={() => loadHistory()}>View order history</button></div></div>;
  } else if (viewState === 'pending') {
    stateContent = replacementCheckAvailable
      ? <div><div className="checkout-state-card outcome pending"><span className="checkout-outcome-mark" aria-hidden="true">…</span><p>The prior order <code>{checkout?.result?.orderId.slice(0, 8)}</code> is expired, but elapsed time is not payment proof. Choose a new price and method; Synvora will create a new payment only if it proves the previous provider attempt terminal and unpaid.</p><div className="checkout-actions"><button className="checkout-secondary" type="button" onClick={() => void performConfirm(false)}>Check old payment</button><button className="checkout-secondary" type="button" onClick={() => loadHistory()}>View order history</button></div></div>{reviewForm}</div>
      : <div className="checkout-state-card outcome pending"><span className="checkout-outcome-mark" aria-hidden="true">…</span><p>{result?.checkoutState === 'expired' ? 'The old provider instructions are closed. Synvora cannot yet prove another payment is safe; this order remains preserved for review.' : !result || result.checkoutState === 'preparing' ? 'The provider response is not ready. Resume this same request key; do not start another payment.' : 'The order is still pending. Synvora keeps the original request key while checking this attempt.'}</p><div className="checkout-actions">{result?.checkoutUrl ? <button className="checkout-primary" type="button" onClick={() => openProvider(result.checkoutUrl!)}>Resume {providerNames[checkout!.input.provider]}</button> : !result || result.checkoutState === 'preparing' ? resumeBlocked ? <button className="checkout-primary" type="button" onClick={() => loadHistory()}>Find my checkouts</button> : <button className="checkout-primary" type="button" onClick={resume}>Resume this checkout</button> : <button className="checkout-primary" type="button" onClick={() => void performConfirm(false)}>Check again</button>}<button className="checkout-secondary" type="button" onClick={() => loadHistory()}>Find my checkouts</button></div></div>;
  }

  return <main className="checkout-page">
    <header className="checkout-site-header"><a className="checkout-brand" href="/#shop" aria-label="Synvora shop"><strong className="checkout-brand-name">Synvora</strong><span>Secure checkout</span></a><div><span className="checkout-environment">Sandbox · no real money</span>{authState === 'authenticated' ? <button type="button" onClick={logout}>Sign out</button> : null}<a href="/#shop">Back to shop</a></div></header>
    <CheckoutProgress state={viewState}/>
    <Summary amount={amount} provider={provider} checkout={replacementCheckAvailable || checkout?.replacementDraft ? null : checkout} pending={authState === 'checking'} unavailable={authState === 'unavailable'}/>
    <div className="checkout-page-grid">
      <section className="checkout-main" aria-labelledby="checkout-page-title">
        <p className="checkout-kicker">{heading.eyebrow}</p>
        <h1 id="checkout-page-title" ref={headingRef} tabIndex={-1}>{heading.title}</h1>
        <p className="checkout-intro">{heading.intro}</p>
        <p className="checkout-license-notice">Sandbox demonstration only. No ARE engine release is delivered. Final license terms are under review.</p>
        <p className="checkout-live-status" role="status" aria-live="polite">{authState === 'checking' ? 'Checking your account and saved checkout…' : status}</p>
        {route === '/purchase/cancel' ? <div className="checkout-route-notice"><strong>Provider approval was cancelled.</strong><span>No payment status was changed. Resume or verify this same order.</span></div> : null}
        {error ? <div className="checkout-error-summary" ref={errorRef} tabIndex={-1} role="alert"><strong>We could not complete that action.</strong><span>{error}</span></div> : null}
        {stateContent}
        {authState === 'authenticated' && !historyOpen && !recoveryProblem && !['pending', 'replacement_pending', 'failed', 'revoked', 'review_required'].includes(viewState) ? <button className="checkout-history-link" type="button" onClick={() => loadHistory()}>Find my checkouts</button> : null}
        {historyOpen ? <section className="checkout-history" aria-labelledby="checkout-history-title">
          <div><h2 id="checkout-history-title">Your checkout history</h2><button type="button" onClick={() => { setHistoryOpen(false); setSelectedOrder(null); setSelectedOrderId(null); }} aria-label="Close checkout history">Close</button></div>
          {history.length ? history.map(order => <button type="button" key={order.orderId} onClick={() => restore(order.orderId)}><span>{providerNames[order.provider]}</span><strong>{money(order.amountCents, order.currency)}</strong><small>{order.status} · {new Date(order.createdAt * 1000).toLocaleDateString()}</small>{order.lateRefundStatus ? <small>{lateRefundMessage(order.lateRefundStatus)}</small> : order.revocationReason ? <small>{revocationMessage(order.revocationReason)}</small> : null}</button>) : <p>No previous checkouts were found.</p>}
          {selectedOrder && selectedOrderId ? <div className="checkout-state-card">
            <p>Order {selectedOrderId.slice(0, 8)} · {selectedOrder.ledgerStatus ?? selectedOrder.state}</p>
            {selectedOrder.lateRefundStatus ? <p>{lateRefundMessage(selectedOrder.lateRefundStatus)}</p> : selectedOrder.revocationReason ? <p>{revocationMessage(selectedOrder.revocationReason)}</p> : null}
            <p>This view does not replace your active checkout.</p>
            {selectedOrder.state === 'paid' && selectedOrder.result ? <button className="checkout-primary" type="button" onClick={() => download(selectedOrderId)}>Download this paid order</button> : null}
            {selectedOrder.state === 'pending' && selectedOrder.ledgerStatus === 'expired' && checkout?.state === 'pending' && checkout.requestKey !== selectedOrder.requestKey && selectedOrder.result ? <button className="checkout-primary" type="button" onClick={() => checkSelectedOrder(selectedOrderId)}>Check this older payment</button> : null}
            {selectedOrder.state === 'pending' && selectedOrder.ledgerStatus === 'expired' && checkout?.state === 'pending' && checkout.requestKey !== selectedOrder.requestKey && !selectedOrder.result ? <p>Synvora has no confirmed provider reference for this older order. It needs reconciliation before another payment.</p> : null}
            {selectedOrder.state === 'pending' && !recoveryProblem && (!checkout || checkout.state !== 'pending' || checkout.requestKey === selectedOrder.requestKey) ? <button className="checkout-primary" type="button" onClick={() => resumeFromHistory(selectedOrderId)}>Resume this order</button> : null}
          </div> : null}
          {nextPage ? <button className="checkout-history-more" type="button" onClick={() => loadHistory(nextPage)}>Load older checkouts</button> : null}
        </section> : null}
        <div className="checkout-leave"><a href="/#shop">← Leave checkout and return to the shop</a><p>{checkout ? 'This checkout stays in this tab. Check your account history for any server-recorded order.' : 'Leaving checkout does not start a payment. You can return to review your selection.'}</p></div>
      </section>
      <aside className="checkout-summary-column" aria-label="Order summary"><OrderSummaryCard amount={amount} provider={provider} checkout={replacementCheckAvailable || checkout?.replacementDraft ? null : checkout} pending={authState === 'checking'} unavailable={authState === 'unavailable'}/></aside>
    </div>
    <footer className="checkout-footer"><span>Payment credentials stay with Stripe, Mercado Pago, or PayPal.</span><span>Returning from a provider never marks an order paid.</span></footer>
  </main>;
}
