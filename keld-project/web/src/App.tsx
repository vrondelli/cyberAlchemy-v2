import {memo, useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent} from 'react';
import {createPortal} from 'react-dom';
import {BuyerError, createBuyerClient, parsePrice, paymentPresentation, type OrderSummary, type Provider, type StoredCheckout} from './checkout/client.ts';
import legacyDocument from '../../prototype/index.html?raw';
import shopConfigUrl from '../../prototype/assets/shop-config.js?url';
import shopScriptUrl from '../../prototype/assets/shop.js?url';
import appScriptUrl from '../../prototype/assets/app.js?url';
import legendScriptUrl from '../../prototype/assets/legend.js?url';

const legacyBody = (() => {
  const match = legacyDocument.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!match) throw new Error('The KELD legacy body could not be loaded');
  return match[1]
    .replaceAll('href="/are/"', 'href="https://are.keld.studio/"')
    .replaceAll('Checkout preview. No payment is taken.', 'Sandbox checkout. No real money is charged.')
    .replaceAll('Preview only. No payment is taken and no engine file is delivered.', 'Sandbox checkout only. No real money is charged and no engine release is delivered.')
    .replaceAll('Preview only. Nothing will be charged.', 'Sandbox only. No real money will be charged.')
    .replaceAll('CHECKOUT PREVIEW', 'SANDBOX CHECKOUT')
    .replaceAll('checkout and delivery are not connected in this preview.', 'the sandbox checkout verifies test payments before test delivery.')
    .replaceAll('There is no engine file or payment processing in this preview.', 'Sandbox payments unlock only the test artifact; the engine release is not delivered.')
    .replaceAll('Payments and delivery of the engine are not connected yet.', 'Sandbox provider payments and verified test-artifact delivery are connected; the engine release is not delivered here.')
    .replaceAll('The package, payment connection, and delivery service still need to be connected. This preview does not contain an engine download.', 'The sandbox delivers only a test artifact after KELD verifies the provider payment. It does not contain an engine download.')
    .replace(
      '<nav class="nav" id="primary-nav" aria-label="Main navigation">',
      '<nav class="nav" id="primary-nav" aria-label="Main navigation"><span id="react-account-slot"></span>',
    )
    .replace(
      '<div class="checkout-grid">',
      '<div id="react-secure-checkout"></div><div class="checkout-grid legacy-checkout-preview">',
    );
})();

const legacyScripts = [shopConfigUrl, shopScriptUrl, appScriptUrl, legendScriptUrl];

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

const providerNames: Record<Provider, string> = {stripe: 'Card · Stripe', mercadopago: 'Pix · Mercado Pago', paypal: 'PayPal'};
const messages: Record<string, string> = {
  'authentication-required': 'Sign in to continue. Your checkout remains saved in this tab.',
  'amount-invalid': 'Choose USD 50–1,000, with at most two decimal places.',
  'payment-creation-failed': 'This payment could not be created. Start a new checkout or choose another method.',
  'payment-outcome-uncertain': 'The outcome is not known yet. Resume this checkout instead of starting another payment.',
  'checkout-in-progress': 'The provider is still preparing this checkout. Wait a moment, then resume it.',
  'checkout-conflict': 'A different checkout is saved in this tab. Continue with its original price and method.',
  'checkout-not-pending': 'This checkout is no longer open. Restore it from history or ask KELD to verify it.',
  'customer-checkout-pending': 'An earlier checkout is still pending for this account. Use Find my checkouts to restore it before starting another.',
  'start-new-checkout': 'This checkout is complete. Start a new checkout to choose another method.',
  'storage-unavailable': 'Session storage is required to preserve payment retries safely.',
  'signed-out-storage-unavailable': 'You are signed out, but this tab could not clear its saved checkout. Close the tab.',
  'delivery-not-authorized': 'KELD has not verified this payment yet.',
  'not-owned': 'This checkout belongs to another account.',
};
const legend = [
  {name: 'The threshold', title: 'The workshop of Keld', image: '01-threshold.webp', thumb: '01-threshold-thumb.webp', alt: 'A hooded maker at a workbench in a vaulted workshop.', copy: 'Some knew what he built. Others only knew what he kept. There was a workshop where abandoned mechanisms, unfinished ideas, and questions without answers were given a place on the shelves.'},
  {name: 'The archive', title: 'Hoarder of Secrets', image: '02-archive.webp', thumb: '02-archive-thumb.webp', alt: 'Keld searches a wall of archive drawers and catalogued parts.', copy: 'Keld collected what others discarded: failed experiments, crossed-out notebooks, and components for machines that had never existed.'},
  {name: 'The forge', title: 'Cyber Blacksmith', image: '03-forge.webp', thumb: '03-forge-thumb.webp', alt: 'The cyber blacksmith assembles a luminous instrument.', copy: 'There was heat in the workshop, and metal, and the patient sound of something being shaped. Some evenings, the machines continued working after the lights went out.'},
  {name: 'The unmade', title: 'Keeper of the Unmade', image: '04-unmade.webp', thumb: '04-unmade-thumb.webp', alt: 'Keld reaches toward an unfinished geometric instrument.', copy: 'On the highest shelves stood unfinished instruments, each waiting for a missing piece. Beside one: For a problem that has not arrived yet.'},
  {name: 'The instruments', title: 'Tools for another mind', image: '05-instruments.webp', thumb: '05-instruments-thumb.webp', alt: 'A prepared set of fictional cognitive instruments.', copy: 'The minds at his door came with questions they could not hold and intentions they could not turn into action. Keld did not offer to think in their place.'},
  {name: 'The maker’s mark', title: 'Even minds need tools.', image: '06-makers-mark.webp', thumb: '06-makers-mark-thumb.webp', alt: 'The completed Keld hex-core artifact glows on a pedestal.', copy: 'Every finished piece bore the same small mark: a core surrounded by carefully fitted forms. The workshop still carries his name.'},
];

function errorMessage(error: unknown): string { return error instanceof BuyerError ? messages[error.code] ?? 'The request could not finish. Your saved checkout remains safe to retry.' : 'The request could not finish. Your saved checkout remains safe to retry.'; }
function money(cents: number, currency = 'USD') { return new Intl.NumberFormat('en-US', {style: 'currency', currency}).format(cents / 100); }

function Header({authenticated, signOut}: {authenticated: boolean | null; signOut: () => void}) {
  return <header className="site-header"><a className="brand" href="#top" aria-label="KELD home"><img src="/assets/keld-wordmark.svg" alt="KELD"/><span>Tools for independent builders</span></a><nav aria-label="Main navigation"><a href="#gear">The gear</a><a href="#legend">The legend</a><a href="#studio">The studio</a><a href="#shop">Shop</a><a href="https://are.keld.studio/">Explore ARE</a>{authenticated ? <button className="text-button" type="button" onClick={signOut}>Sign out</button> : null}</nav></header>;
}
function Hero() {
  return <section className="hero" id="top" aria-labelledby="hero-title"><div className="hero-copy"><p className="eyebrow">Independent studio · Agent gear</p><h1 id="hero-title">Even minds<br/>need <em>tools.</em></h1><p className="lead">KELD makes instruments around intelligence—designed to give agent work structure, continuity, and a connection to the world.</p><div className="hero-actions"><a className="button copper" href="#gear">Explore the gear ↗</a><a className="quiet-link" href="#legend">Meet the maker →</a></div></div><div className="hero-art"><img src="/assets/artifact.svg" alt="The KELD maker’s mark imagined as a precision instrument"/></div></section>;
}
function Gear() {
  return <section className="gear section-light" id="gear" aria-labelledby="gear-title"><div className="section-label">The gear <span>001</span></div><div className="gear-grid"><div><p className="eyebrow dark">Featured work · Alpha software</p><h2 id="gear-title">Not another agent.<br/><em>The gear behind it.</em></h2></div><article className="engine-card"><div><span className="serial">K—001</span><h3>Agent<br/>Reasoning Engine<span>.</span></h3><p>A second skin for your agent. Keep language, context, memory, and tools connected as the work grows.</p></div><div className="engine-cycle" aria-label="Goal, action, evidence, comparison, and refinement form two connected cycles">{['goal', 'action', 'evidence', 'comparison', 'refinement'].map(item => <figure key={item}><img src={`/assets/are-icons/${item}.webp`} alt=""/><figcaption>{item}</figcaption></figure>)}</div><div className="card-actions"><a className="button ink" href="https://are.keld.studio/">Explore A.R.E ↗</a><a className="quiet-link" href="#shop">Shop the engine →</a></div></article></div></section>;
}
function Legend() {
  const [active, setActive] = useState(0); const [cinema, setCinema] = useState(false); const scene = legend[active];
  const dialog = useRef<HTMLDivElement>(null); const returnFocus = useRef<HTMLElement | null>(null);
  const move = (delta: number) => setActive(index => (index + delta + legend.length) % legend.length);
  const openCinema = () => { returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setCinema(true); };
  const closeCinema = () => setCinema(false);
  useEffect(() => { if (!cinema && returnFocus.current) { const target = returnFocus.current; returnFocus.current = null; target.focus(); } }, [cinema]);
  const keys = (event: KeyboardEvent) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); move(1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); }
    if (event.key === 'Escape') { event.preventDefault(); closeCinema(); }
    if (event.key === 'Tab' && cinema && dialog.current) {
      const focusable = [...dialog.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(node => !node.hasAttribute('disabled'));
      const first = focusable[0]; const last = focusable.at(-1);
      if (first && last && event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (first && last && !event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  };
  return <section className="legend section-dark" id="legend" aria-labelledby="legend-title"><div className="legend-intro"><div><p className="eyebrow">The legend</p><h2 id="legend-title">He was known<br/><em>by many titles.</em></h2></div><p>Step into the workshop.<br/>Follow the instruments.<br/>Meet the maker.</p></div><div className="film-card"><img src="/assets/legend/07-film-poster.webp" alt="The Legend of Keld film poster"/><div><p className="eyebrow">The Legend of Keld · 3 min 12 sec</p><h3>A fictional maker.<br/>A real studio.</h3><a className="button copper" href="https://www.youtube.com/watch?v=ZQU8JeN6nQQ" target="_blank" rel="noreferrer">Watch the film ↗</a></div></div><div className="story-reader" onKeyDown={keys}><div className="scene-top"><span>Scene {String(active + 1).padStart(2, '0')} / 06</span><div><button type="button" onClick={() => move(-1)} aria-label="Previous scene">←</button><button type="button" onClick={() => move(1)} aria-label="Next scene">→</button><button type="button" onClick={openCinema}>View scene</button></div></div><button className="scene-image" type="button" onClick={openCinema} aria-label={`View ${scene.title} full screen`}><img src={`/assets/legend/${scene.image}`} alt={scene.alt}/></button><div className="scene-copy"><div><p className="eyebrow">{scene.name}</p><h3>{scene.title}</h3></div><p>{scene.copy}</p></div><div className="chapter-tabs" role="tablist" aria-label="Legend chapters">{legend.map((item, index) => <button key={item.name} role="tab" aria-selected={index === active} onClick={() => setActive(index)}><img src={`/assets/legend/${item.thumb}`} alt=""/><span>{item.name}</span></button>)}</div></div>{cinema ? <div ref={dialog} className="modal cinema" role="dialog" aria-modal="true" aria-labelledby="cinema-title" onKeyDown={keys}><button className="modal-close" type="button" onClick={closeCinema} autoFocus>Close ×</button><img src={`/assets/legend/${scene.image}`} alt={scene.alt}/><div><p className="eyebrow">Scene {active + 1} / 6</p><h2 id="cinema-title">{scene.title}</h2><p>{scene.copy}</p><div className="cinema-controls"><button onClick={() => move(-1)}>← Previous</button><button onClick={() => move(1)}>Next →</button></div></div></div> : null}</section>;
}
function Studio() {
  return <><section className="studio section-light" id="studio" aria-labelledby="studio-title"><div className="studio-grid"><div className="maker-mark"><img src="/assets/keld-mark.svg" alt="KELD’s hexagonal maker’s mark"/><img src="/assets/keld-wordmark.svg" alt=""/></div><div><p className="eyebrow dark">The studio</p><h2 id="studio-title">Not the adventurer.<br/><em>The one who equips them.</em></h2><p>Keld is an independent studio making agent gear. The name belongs to an imagined maker. The work belongs to the people building here, now.</p><p>We care about the instruments around intelligence: how they are made, how they fit together, and how they become useful.</p></div></div><div className="principles"><article><span>01</span><h3>No smoke. No mirrors.</h3><p>Let the story be mysterious. Let the work be understandable.</p></article><article><span>02</span><h3>Useful before impressive.</h3><p>Start with a real question. Build for a real task.</p></article><article><span>03</span><h3>Care, all the way down.</h3><p>The fit, the interface, and the explanation all belong to the craft.</p></article></div></section><section className="manifesto"><p>Reasoning · Memory · Context · Action</p><blockquote>“Keld did not offer to think in their place. He cleared a space on the workbench and began making what they needed.”</blockquote></section></>;
}

function Checkout({authenticated, client, checkout, sync, initialAmount}: {authenticated: boolean | null; client: ReturnType<typeof createBuyerClient>; checkout: StoredCheckout | null; sync: () => void; initialAmount: string}) {
  const [amount, setAmount] = useState(checkout ? (checkout.input.amountCents / 100).toFixed(2) : initialAmount); const [provider, setProvider] = useState<Provider>(checkout?.input.provider ?? 'stripe'); const [email, setEmail] = useState(checkout?.input.payerEmail ?? '');
  const [status, setStatus] = useState(() => window.location.pathname === '/purchase/return' ? 'Welcome back. Ask KELD to verify the provider result.' : window.location.pathname === '/purchase/cancel' ? 'You returned without completing approval. The saved checkout remains available.' : 'Choose a sandbox payment method.');
  const [busy, setBusy] = useState(false); const [history, setHistory] = useState<OrderSummary[]>([]); const [nextPage, setNextPage] = useState<string | null>(null); const [historyOpen, setHistoryOpen] = useState(false); const [shelf, setShelf] = useState(false); const result = checkout?.result ? paymentPresentation(checkout.result) : null;
  useEffect(() => { if (checkout) { setAmount((checkout.input.amountCents / 100).toFixed(2)); setProvider(checkout.input.provider); setEmail(checkout.input.payerEmail ?? ''); } else { setAmount(initialAmount); } }, [checkout, initialAmount]);
  const run = async (work: () => Promise<void>) => { if (busy) return; setBusy(true); try { await work(); } catch (error) { setStatus(errorMessage(error)); } finally { setBusy(false); sync(); } };
  const create = (event: FormEvent) => { event.preventDefault(); void run(async () => {
    setStatus(provider === 'mercadopago' ? 'Preparing a frozen BRL quote and Pix payment…' : `Preparing one retry-safe ${providerNames[provider]} checkout…`);
    let created = await client.create({provider, amountCents: parsePrice(amount), ...(provider === 'mercadopago' ? {payerEmail: email} : {})});
    for (const delay of [1000, 2000, 4000]) { if (created.checkoutState !== 'preparing' || Date.now() >= (created.expiresAt ?? 0) * 1000) break; setStatus('Mercado Pago is still preparing the Pix code…'); await new Promise(resolve => setTimeout(resolve, delay)); created = await client.create({provider, amountCents: parsePrice(amount), payerEmail: email}); }
    setStatus(created.checkoutState === 'verification-required' ? 'The Pix details require provider verification. Resume later with this same checkout.' : created.checkoutState === 'expired' ? 'The payment window ended. Check the provider result before starting again.' : created.pixCode ? 'Pix is ready. Copy the code, pay in the sandbox, then ask KELD to verify it.' : 'The hosted payment is ready. Open the provider to continue.');
  }); };
  const confirm = () => void run(async () => { setStatus('KELD is checking the provider directly…'); const value = await client.confirm(); setStatus(value.status === 'paid' ? 'Payment verified by KELD. Your test artifact is ready.' : value.status === 'paid-review' ? 'Payment arrived after the reservation window and needs review.' : 'The provider has not confirmed payment yet. Retry this same checkout.'); });
  const download = () => void run(async () => { const blob = await client.download(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'are-sandbox-fixture.bin'; link.click(); window.setTimeout(() => URL.revokeObjectURL(url), 10_000); setStatus('Verified artifact downloaded.'); });
  const reset = () => void run(async () => { client.reset(); setHistoryOpen(false); setStatus('Choose a payment method for a new checkout.'); });
  const loadHistory = (before?: string) => void run(async () => { const page = await client.orders(before); setHistory(old => before ? [...old, ...page.orders] : page.orders); setNextPage(page.next); setHistoryOpen(true); setStatus(page.orders.length ? 'Choose a checkout to restore.' : 'No previous checkouts were found for this account.'); });
  const restore = (orderId: string) => void run(async () => { const recovered = await client.restore(orderId); setStatus(recovered.ledgerStatus === 'expired' || recovered.ledgerStatus === 'paid-review' ? 'Checkout restored. Its status did not change; review may be required.' : 'Checkout restored from your account.'); });
  return <section className="shop section-light" id="shop" aria-labelledby="shop-title"><div className="shop-heading"><div><p className="eyebrow dark">The KELD collection · 001</p><h2 id="shop-title">Equip your<br/><em>workbench.</em></h2></div><div className="price"><span>Base price</span><strong>$200</strong><small>USD · one-time</small></div></div><div className="product-grid"><div className="product-art"><img src="/assets/artifact.svg" alt="Agent Reasoning Engine concept artwork"/><p>Concept artwork · downloadable software, not physical hardware</p></div><div className="product-copy"><span className="serial">K—001 / ALPHA SOFTWARE</span><h3>Agent Reasoning Engine.</h3><p className="product-deck">Keep the work connected as the task grows.</p><ul><li>Downloadable alpha release</li><li>Apache License 2.0</li><li>Same release at every accepted price</li><li>Verified payment before delivery</li></ul><button className="quiet-link shelf-link" type="button" onClick={() => setShelf(value => !value)} aria-expanded={shelf}>{shelf ? 'Close the hidden shelf' : 'Open the hidden shelf'}</button>{shelf ? <p className="shelf-note">Choose any price from $50 to $1,000. Price does not change the release or license.</p> : null}</div></div><div className="checkout-shell"><div className="checkout-heading"><div><p className="eyebrow dark">Secure sandbox checkout</p><h3>Choose the instrument.</h3></div><span className="sandbox-badge">Sandbox</span></div><p className="status" role="status" aria-live="polite">{authenticated === false ? 'Sign in when you are ready to checkout. The studio remains open to browse.' : status}</p>{authenticated === false ? <a className="button ink" href="/auth/login">Sign in to checkout</a> : null}{authenticated ? <><form className="checkout-form" onSubmit={create}><fieldset disabled={busy || Boolean(checkout)}><div><label htmlFor="amount">Your price in USD</label><div className="amount-field"><span>$</span><input id="amount" value={amount} onChange={event => setAmount(event.target.value)} inputMode="decimal" required/></div></div><div><label htmlFor="provider">Payment method</label><select id="provider" value={provider} onChange={event => setProvider(event.target.value as Provider)}>{Object.entries(providerNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>{provider === 'mercadopago' ? <div className="wide"><label htmlFor="payer-email">Pix payer email</label><input id="payer-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required/></div> : null}</fieldset><button className="button ink" type="submit" disabled={busy || checkout?.state === 'paid' || checkout?.state === 'failed'}>{checkout ? 'Resume this checkout' : 'Continue to sandbox payment'}</button></form>{result ? <div className="payment-panel"><p className="eyebrow dark">02 / Provider result</p><h3>{money(result.amountCents, result.currency)} · {result.currency}</h3>{result.currency === 'BRL' ? <p>Frozen from {money(result.usdAmountCents ?? checkout!.input.amountCents)} USD{result.quoteReference ? ` · quote ${result.quoteReference}` : ''}.</p> : null}<p>Returning from a provider never marks this order paid. KELD verifies it before delivery.</p>{result.checkoutState === 'expired' ? <p className="warning">The provider payment window ended. Verify before starting another attempt.</p> : null}{result.pixCode && checkout?.state !== 'paid' ? <div className="pix"><label htmlFor="pix-code">Pix copy-and-paste code</label><textarea id="pix-code" readOnly rows={4} value={result.pixCode}/><button type="button" className="quiet-link" onClick={() => void navigator.clipboard.writeText(result.pixCode!)}>Copy Pix code</button></div> : null}<div className="button-row">{result.checkoutUrl && checkout?.state !== 'paid' ? <a className="button outline" href={result.checkoutUrl}>Open {providerNames[checkout!.input.provider]} ↗</a> : null}<button className="button outline" type="button" onClick={confirm} disabled={busy}>Check payment status</button>{checkout?.state === 'paid' ? <button className="button ink" type="button" onClick={download} disabled={busy}>Download verified artifact</button> : null}</div></div> : null}<div className="account-tools"><button type="button" className="quiet-link" onClick={() => loadHistory()} disabled={busy}>Find my checkouts</button>{checkout && ['paid', 'failed'].includes(checkout.state) ? <button type="button" className="quiet-link" onClick={reset} disabled={busy}>Start a new checkout</button> : null}</div>{historyOpen ? <div className="history" aria-live="polite"><h4>Your checkout history</h4>{history.map(order => <button type="button" key={order.orderId} onClick={() => restore(order.orderId)}><span>{providerNames[order.provider]}</span><strong>{money(order.amountCents)}</strong><span>{order.status} · {new Date(order.createdAt * 1000).toLocaleDateString()}</span></button>)}{nextPage ? <button className="quiet-link" type="button" onClick={() => loadHistory(nextPage)}>Load older checkouts</button> : null}</div> : null}</> : null}</div><div className="product-notes"><details open><summary>What alpha means</summary><p>ARE is an early release. Features, interfaces, and behavior may change. Test it with your own setup before relying on it.</p></details><details><summary>License and delivery</summary><p>The software is delivered under Apache 2.0 after KELD verifies payment. Purchasing does not create exclusive rights.</p></details><details><summary>Payment and privacy</summary><p>Payment credentials stay with Stripe, Mercado Pago, or PayPal. The browser never decides whether an order is paid.</p></details></div></section>;
}
function Contact() {
  const [draft, setDraft] = useState(''); const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const data = new FormData(event.currentTarget); setDraft(`Name: ${data.get('name')}\nEmail: ${data.get('email')}\nInterest: ${data.get('interest')}\n\n${data.get('message')}`); };
  return <section className="contact section-dark" id="contact" aria-labelledby="contact-title"><div><p className="eyebrow">Contact</p><h2 id="contact-title">Every instrument<br/>begins with<br/><em>a question.</em></h2><p>Tell us what you are building, what gets in the way, and where you want to go.</p></div><form onSubmit={submit}><div className="form-pair"><label>Your name<input name="name" autoComplete="name" required maxLength={100}/></label><label>Email<input name="email" type="email" autoComplete="email" required/></label></div><label>What brings you here?<select name="interest"><option>Agent Reasoning Engine</option><option>Potential collaboration</option><option>A question or an idea</option></select></label><label>Your question<textarea name="message" rows={5} required minLength={12} maxLength={6000}/></label><button className="button copper" type="submit">Prepare inquiry ↗</button><small>This creates a local draft. Nothing is sent.</small>{draft ? <div className="draft"><label>Your prepared inquiry<textarea readOnly rows={9} value={draft}/></label><button type="button" className="quiet-link" onClick={() => void navigator.clipboard.writeText(draft)}>Copy inquiry</button></div> : null}</form></section>;
}
export default function App() {
  const client = useMemo(() => createBuyerClient(), []); const [authenticated, setAuthenticated] = useState<boolean | null>(null); const [checkout, setCheckout] = useState<StoredCheckout | null>(null); const [legacyReady, setLegacyReady] = useState(false); const [bagAmount, setBagAmount] = useState('200'); const sync = useCallback(() => { try { setCheckout(client.pending()); } catch { setCheckout(null); } }, [client]);
  const markLegacyReady = useCallback(() => setLegacyReady(true), []);
  useEffect(() => { let active = true; client.session().then(() => { if (active) setAuthenticated(true); }).catch(() => { if (active) setAuthenticated(false); }).finally(() => { if (active) sync(); }); return () => { active = false; }; }, [client, sync]);
  useEffect(() => {
    const captureBagAmount = (event: Event) => {
      const target = event.target instanceof Element ? event.target.closest('#review-checkout') : null;
      if (!target) return;
      const input = document.querySelector<HTMLInputElement>('#bag-price');
      if (input?.value) setBagAmount(input.value);
      window.setTimeout(() => document.getElementById('shop-checkout-dialog')?.setAttribute('aria-labelledby', 'secure-checkout-title'));
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
  }, [legacyReady, authenticated]);
  const signOut = () => { void client.logout().then(() => window.location.assign('/signed-out')); };
  const checkoutMount = legacyReady ? document.getElementById('react-secure-checkout') : null;
  const accountMount = legacyReady ? document.getElementById('react-account-slot') : null;
  return <>
    <LegacyStorefront onReady={markLegacyReady}/>
    {checkoutMount ? createPortal(<><Checkout authenticated={authenticated} client={client} checkout={checkout} sync={sync} initialAmount={bagAmount}/>{authenticated === false ? <div className="checkout-signup">New to KELD? <a href="/auth/register">Create your account</a>.</div> : null}</>, checkoutMount) : null}
    {accountMount ? createPortal(<>{authenticated ? <button className="legacy-account-action" type="button" onClick={signOut}>Sign out</button> : <><a className="legacy-account-action" href="/auth/login">Sign in</a><a className="legacy-account-action" href="/auth/register">Create account</a></>}<a className="legacy-account-action" href="https://are.keld.studio/">Explore ARE</a></>, accountMount) : null}
  </>;
}
