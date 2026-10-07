import {memo, useCallback, useEffect, useMemo, useState} from 'react';
import {createPortal} from 'react-dom';
import {BuyerError, createBuyerClient, type StoredCheckout} from './checkout/client.ts';
import {CheckoutPage} from './checkout/CheckoutPage.tsx';
import {ARE_PUBLIC_ORIGIN} from './config.ts';
import legacyDocument from '../../prototype/index.html?raw';
import shopConfigUrl from '../../prototype/assets/shop-config.js?url';
import shopScriptUrl from '../../prototype/assets/shop.js?url';
import appScriptUrl from '../../prototype/assets/app.js?url';

const legacyBody = (() => {
  const match = legacyDocument.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!match) throw new Error('The Synvora legacy body could not be loaded');
  return match[1]
    // The storefront is also rendered on /purchase/return and /purchase/cancel.
    // Root these legacy image URLs so provider redirects cannot resolve them
    // underneath /purchase/assets/.
    .replaceAll('src="assets/', 'src="/assets/')
    .replaceAll('href="assets/', 'href="/assets/')
    .replaceAll('href="/are/"', `href="${ARE_PUBLIC_ORIGIN}"`)
    .replaceAll('Checkout preview. No payment is taken.', 'Sandbox checkout. No real money is charged.')
    .replaceAll('Preview only. No payment is taken and no engine file is delivered.', 'Sandbox checkout only. No real money is charged and no engine release is delivered.')
    .replaceAll('Preview only. Nothing will be charged.', 'Sandbox only. No real money will be charged.')
    .replaceAll('CHECKOUT PREVIEW', 'SANDBOX CHECKOUT')
    .replaceAll('checkout and delivery are not connected in this preview.', 'the sandbox checkout verifies test payments before test delivery.')
    .replaceAll('There is no engine file or payment processing in this preview.', 'Sandbox payments unlock only the test artifact; the engine release is not delivered.')
    .replaceAll('Payments and delivery of the engine are not connected yet.', 'Sandbox provider payments and verified test-artifact delivery are connected; the engine release is not delivered here.')
    .replaceAll('The package, payment connection, and delivery service still need to be connected. This preview does not contain an engine download.', 'The sandbox delivers only a test artifact after Synvora verifies the provider payment. It does not contain an engine download.')
    .replace(
      '<nav class="nav" id="primary-nav" aria-label="Main navigation">',
      '<nav class="nav" id="primary-nav" aria-label="Main navigation"><span id="react-account-slot"></span>',
    )
    .replace(
      '<div class="checkout-grid">',
      '<div id="react-secure-checkout"></div><div class="checkout-grid legacy-checkout-preview">',
    );
})();

const legacyScripts = [shopConfigUrl, shopScriptUrl, appScriptUrl];

const LegacyStorefront = memo(function LegacyStorefront({onReady}: {onReady: () => void}) {
  useEffect(() => {
    document.body.classList.add('react-storefront');
    (window as Window & {KELD_INITIAL_VIEW?: string}).KELD_INITIAL_VIEW = 'studio';
    onReady();
    let cancelled = false;
    void (async () => {
      for (const [index, src] of legacyScripts.entries()) {
        if (cancelled || document.querySelector(`script[data-keld-legacy="${index}"]`)) continue;
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.dataset.keldLegacy = String(index);
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Unable to load legacy storefront script ${index + 1}`));
          document.head.append(script);
        });
      }
    })().catch(error => console.error(error));
    return () => {
      cancelled = true;
      document.body.classList.remove('react-storefront', 'shop-active', 'shop-dialog-open');
    };
  }, [onReady]);
  return <div className="legacy-react-shell" dangerouslySetInnerHTML={{__html: legacyBody}}/>;
});

const messages: Record<string, string> = {
  'authentication-required': 'Sign in to continue. Your checkout remains saved in this tab.',
  'amount-invalid': 'Choose USD 50–1,000, with at most two decimal places.',
  'payment-creation-failed': 'This payment could not be created. Start a new checkout or choose another method.',
  'payment-outcome-uncertain': 'The outcome is not known yet. Resume this checkout instead of starting another payment.',
  'checkout-in-progress': 'The provider is still preparing this checkout. Wait a moment, then resume it.',
  'checkout-conflict': 'A different checkout is saved in this tab. Continue with its original price and method.',
  'checkout-not-pending': 'This checkout is no longer open. Restore it from history or ask Synvora to verify it.',
  'customer-checkout-pending': 'An earlier checkout is still pending for this account. Use Find my checkouts to restore it before starting another.',
  'start-new-checkout': 'This checkout is complete. Start a new checkout to choose another method.',
  'storage-unavailable': 'Session storage is required to preserve payment retries safely.',
  'signed-out-storage-unavailable': 'You are signed out, but this tab could not clear its saved checkout. Close the tab.',
  'delivery-not-authorized': 'Synvora has not verified this payment yet.',
  'not-owned': 'This checkout belongs to another account.',
};
function errorMessage(error: unknown): string { return error instanceof BuyerError ? messages[error.code] ?? 'The request could not finish. Your saved checkout remains safe to retry.' : 'The request could not finish. Your saved checkout remains safe to retry.'; }

type AuthState = 'checking' | 'authenticated' | 'anonymous' | 'unavailable';

function StorefrontApp() {
  const client = useMemo(() => createBuyerClient(), []); const [authState, setAuthState] = useState<AuthState>('checking'); const [sessionAttempt, setSessionAttempt] = useState(0); const [accountStatus, setAccountStatus] = useState(''); const [signingOut, setSigningOut] = useState(false); const [checkout, setCheckout] = useState<StoredCheckout | null>(null); const [legacyReady, setLegacyReady] = useState(false); const [bagAmount, setBagAmount] = useState('200'); const sync = useCallback(() => { try { setCheckout(client.pending()); } catch { setCheckout(null); } }, [client]);
  const markLegacyReady = useCallback(() => setLegacyReady(true), []);
  const retrySession = useCallback(() => setSessionAttempt(value => value + 1), []);
  useEffect(() => { let active = true; setAuthState('checking'); setAccountStatus(''); client.session().then(session => { if (active) setAuthState(session.authenticated ? 'authenticated' : 'anonymous'); }).catch(() => { if (active) { setAuthState('unavailable'); setAccountStatus('Account check unavailable. Retry before signing in or checking out.'); } }).finally(() => { if (active) sync(); }); return () => { active = false; }; }, [client, sessionAttempt, sync]);
  useEffect(() => {
    const captureBagAmount = (event: Event) => {
      const target = event.target instanceof Element ? event.target.closest('#review-checkout') : null;
      if (!target) return;
      const input = document.querySelector<HTMLInputElement>('#bag-price');
      const amount = input?.value || '200';
      setBagAmount(amount);
      event.preventDefault();
      event.stopImmediatePropagation();
      window.location.assign(`/checkout?amount=${encodeURIComponent(amount)}`);
    };
    document.addEventListener('click', captureBagAmount, true);
    return () => document.removeEventListener('click', captureBagAmount, true);
  }, []);
  useEffect(() => {
    if (!legacyReady) return;
    const secureSection = document.querySelector<HTMLElement>('#react-secure-checkout section.shop');
    const secureTitle = document.querySelector<HTMLElement>('#react-secure-checkout .checkout-heading h3');
    if (secureSection) secureSection.id = 'secure-checkout';
    if (secureTitle) secureTitle.id = 'secure-checkout-title';
  }, [legacyReady, authState]);
  const signOut = () => { if (signingOut) return; setSigningOut(true); setAccountStatus('Signing out…'); void client.logout().then(() => window.location.assign('/signed-out')).catch(error => { setAccountStatus(`Sign out was not completed. ${errorMessage(error)}`); }).finally(() => setSigningOut(false)); };
  const accountMount = legacyReady ? document.getElementById('react-account-slot') : null;
  return <>
    <LegacyStorefront onReady={markLegacyReady}/>
    {accountMount ? createPortal(<>{authState === 'authenticated' ? <button className="legacy-account-action" type="button" onClick={signOut} disabled={signingOut}>{signingOut ? 'Signing out…' : 'Sign out'}</button> : authState === 'anonymous' ? <><a className="legacy-account-action" href="/auth/login">Sign in</a><a className="legacy-account-action" href="/auth/register">Create account</a></> : authState === 'unavailable' ? <button className="legacy-account-action" type="button" onClick={retrySession}>Retry account check</button> : <span className="legacy-account-status">Checking account…</span>}<a className="legacy-account-action" href={ARE_PUBLIC_ORIGIN}>Explore ARE</a>{accountStatus ? <span className="legacy-account-status" role="status" aria-live="polite">{accountStatus}</span> : null}</>, accountMount) : null}
  </>;
}

export default function App() {
  return ['/checkout', '/purchase/return', '/purchase/cancel'].includes(window.location.pathname)
    ? <CheckoutPage/>
    : <StorefrontApp/>;
}
