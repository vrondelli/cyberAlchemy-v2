/* Keld storefront: local preview by default. No SDK, card fields, or payment secrets. */
(() => {
  'use strict';
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const raw = window.KELD_SHOP_CONFIG || {};
  const ids = ['release'];
  const validUrl = value => {
    try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password; }
    catch { return false; }
  };
  // Prices are always integer USD cents. The server must enforce the same bounds.
  const defaults = {
    release: { name: 'Downloadable release', audience: 'For independent builders and teams', amount: 20000,
      minimumAmount: 5000, maximumAmount: 100000, presets: [5000,10000,20000,50000,100000], priceSuffix: 'one-time purchase' }
  };
  const offers = Object.fromEntries(ids.map(id => [id, Object.assign({}, defaults[id], raw.offers?.[id] || {})]));
  const offer = offers.release;
  const validBound = value => Number.isSafeInteger(value) && value >= 1;
  if (![offer.amount,offer.minimumAmount,offer.maximumAmount].every(validBound) ||
      offer.minimumAmount > offer.amount || offer.amount > offer.maximumAmount) Object.assign(offer, defaults.release);
  const currency = 'USD';
  const MIN = offer.minimumAmount, MAX = offer.maximumAmount, BASE = offer.amount;
  let lowerUnlocked = false; // Discovery is a UI state, never an entitlement or payment boundary.
  const validAmount = cents => Number.isSafeInteger(cents) && cents >= MIN && cents <= MAX;
  const priced = id => id === 'release' && validAmount(BASE);
  const formatMoney = cents => !validAmount(cents) ? '—' : new Intl.NumberFormat('en-US', {
    style:'currency', currency, minimumFractionDigits:cents % 100 ? 2 : 0, maximumFractionDigits:2
  }).format(cents / 100);
  const fieldValue = cents => cents % 100 ? (cents / 100).toFixed(2) : String(cents / 100);
  const parseAmount = value => {
    const text = String(value).trim();
    if (!text) return {error:'Enter your price in US dollars.'};
    if (!/^\d{1,9}(?:\.\d{1,2})?$/.test(text)) return {error:'Enter a dollar amount with up to two decimal places.'};
    const [dollars, decimals = ''] = text.split('.');
    const cents = Number(dollars) * 100 + Number(decimals.padEnd(2,'0'));
    if (cents > MAX) return {error:'Choose an amount no more than ' + formatMoney(MAX) + ' USD.'};
    if (cents < MIN) return {error:lowerUnlocked ? 'Choose an amount of at least ' + formatMoney(MIN) + ' USD.' : 'This amount is outside the available range.'};
    return {cents};
  };
  // A fixed-price link cannot carry a buyer's custom price. Create checkout on a
  // same-origin HTTPS server endpoint; never trust the browser price for payment.
  const checkoutEndpoint = (() => {
    try {
      if (typeof raw.checkoutEndpoint !== 'string' || !raw.checkoutEndpoint.trim()) return '';
      const u = new URL(raw.checkoutEndpoint, location.href);
      return u.protocol === 'https:' && u.origin === location.origin && !u.username && !u.password ? u.href : '';
    } catch { return ''; }
  })();
  const live = raw.mode === 'live' && raw.approvedForSale === true && raw.fulfillmentReady === true &&
    raw.currency === 'USD' && raw.licenseId === 'Apache-2.0' && raw.earlySupporter?.entitlementReady === true && Boolean(checkoutEndpoint) &&
    [raw.deliverySummary, raw.releaseSummary].every(v => typeof v === 'string' && v.trim()) &&
    [raw.termsUrl, raw.privacyUrl, raw.refundUrl].every(validUrl) && priced('release');
  const storageKey = 'keld-bag-flexible-usd-' + (live ? 'live' : 'preview') + '-v1';
  let selectedId = 'release';
  let selectedCents = BASE;
  let bagId = null, bagCents = null, bagDraftValid = true;
  let checkoutBusy = false;
  let galleryId = 'artifact';
  let activeModal = null;
  let originFocus = null;
  let view = window.KELD_INITIAL_VIEW === 'shop' ? 'shop' : 'studio';
  let zoomCount = 0;
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    if (saved?.id === 'release' && saved.currency === currency && validAmount(saved.amountCents)) {
      bagId = saved.id; bagCents = saved.amountCents; selectedCents = bagCents; lowerUnlocked = bagCents < BASE;
    }
  } catch { /* Storage may be unavailable; keep in-memory state. */ }
  if (raw.contactEmail) window.KELD_CONFIG = Object.assign({}, window.KELD_CONFIG, { contactEmail: raw.contactEmail });
  function saveBag() {
    try {
      if (bagId && validAmount(bagCents)) sessionStorage.setItem(storageKey, JSON.stringify({id:bagId, amountCents:bagCents, currency}));
      else sessionStorage.removeItem(storageKey);
    } catch { /* The current visit still works with storage disabled. */ }
  }
  const put = (selector, text) => $$(selector).forEach(el => { el.textContent = text; });
  function announce(text) {
    $('#shop-status').textContent = '';
    requestAnimationFrame(() => { $('#shop-status').textContent = text; });
  }
  function fieldError(input, messageId, error = '') {
    const message = document.getElementById(messageId);
    input.setCustomValidity(error);
    input.setAttribute('aria-invalid', String(Boolean(error)));
    message.textContent = error;
    message.hidden = !error;
  }
  // Visible bounds start at BASE. Actual allowable payment bounds remain MIN..MAX.
  const visibleMin = () => lowerUnlocked ? MIN : BASE;
  function updatePricingCopy() {
    put('[data-base-price]', formatMoney(BASE));
    put('[data-minimum-price]', formatMoney(MIN));
    put('[data-visible-minimum-price]', formatMoney(visibleMin()));
    put('[data-maximum-price]', formatMoney(MAX));
    $('#price-slider').min = String(visibleMin() / 100);
    ['#custom-price','#bag-price'].forEach(selector => {
      // Do not announce the secret minimum through a spinbutton before discovery.
      const input = $(selector);
      if (lowerUnlocked) input.min = String(MIN / 100); else input.removeAttribute('min');
    });
    $('#hidden-shelf').hidden = !lowerUnlocked;
    $('#bag-secret-note').hidden = !lowerUnlocked;
    $('.price-choice').classList.toggle('shelf-unlocked', lowerUnlocked);
    $('#price-help').textContent = lowerUnlocked
      ? 'Choose any amount from ' + formatMoney(MIN) + ' to ' + formatMoney(MAX) + '. Same release. Same license.'
      : 'Start at ' + formatMoney(BASE) + '. Set your price, up to ' + formatMoney(MAX) + '. Same release. Same license.';
    $('#bag-secret-note').textContent = 'The hidden shelf is open. Choose from ' + formatMoney(MIN) + '; the release and license stay the same.';
    $('#faq-pricing').textContent = 'The base price is ' + formatMoney(BASE) + ' USD. ' + (lowerUnlocked
      ? 'You found the hidden shelf: choose any amount from ' + formatMoney(MIN) + ' to ' + formatMoney(MAX) + '. '
      : 'Set your amount using the price selector, up to ' + formatMoney(MAX) + '. ')
      + 'Every price buys the same downloadable release under Apache 2.0, with no subscription or license tiers. For the first 100 customers, the purchase also includes one year of ongoing ARE upgrades and direct support from the maker, at every accepted price. Applicable taxes will be shown at checkout.';
  }
  function unlockLower() {
    if (lowerUnlocked || MIN >= BASE) return;
    lowerUnlocked = true;
    updatePricingCopy();
    $('#hidden-shelf').classList.add('just-discovered');
    announce('You found the hidden shelf. Prices from ' + formatMoney(MIN) + ' are now available. Same release. Same license.');
  }
  function syncSelected() {
    const valid = validAmount(selectedCents);
    put('[data-selected-price]', valid ? formatMoney(selectedCents) : 'Enter price');
    put('[data-mobile-price-label]', 'Alpha · Apache 2.0');
    $('#add-to-bag').disabled = !valid;
    $('#mobile-add').disabled = !valid;
    $('#reset-price').disabled = valid && selectedCents === BASE;
    $('#price-decrease').disabled = valid && lowerUnlocked && selectedCents === MIN;
    $('#price-increase').disabled = valid && selectedCents === MAX;
    $('#add-to-bag').setAttribute('aria-label', valid ? 'Add downloadable alpha release to bag for ' + formatMoney(selectedCents) + ' USD' : 'Enter a valid price to add to bag');
    $$('[data-price-preset]').forEach(button => button.setAttribute('aria-pressed', String(valid && Number(button.dataset.pricePreset) === selectedCents)));
    if (valid) {
      // A typed draft is not committed until blur, change or Enter. This prevents
      // the '1', '10', '100' in typing '1000' from opening the hidden shelf.
      const shown = Math.max(visibleMin(), selectedCents);
      $('#price-slider').value = String(shown / 100);
      $('#price-slider').setAttribute('aria-valuetext', formatMoney(shown) + ' US dollars');
      $('#price-slider').style.setProperty('--price-progress', ((shown - visibleMin()) / Math.max(1,MAX - visibleMin()) * 100) + '%');
    }
  }
  function applySelected(cents, discover = true) {
    if (!validAmount(cents)) return;
    if (discover && cents < BASE) unlockLower();
    selectedCents = cents;
    $('#custom-price').value = fieldValue(cents);
    fieldError($('#custom-price'), 'price-error');
    syncSelected();
  }
  function syncBag(resetInput = false) {
    $('#bag-empty').hidden = Boolean(bagId);
    $('#bag-filled').hidden = !bagId;
    put('[data-bag-count]', bagId ? '1' : '0');
    $('#open-bag').setAttribute('aria-label', `Open shopping bag, ${bagId ? '1 item' : 'empty'}`);
    if (bagId) {
      put('[data-bag-price]', bagDraftValid ? formatMoney(bagCents) : '—');
      put('[data-bag-license]', 'Apache License 2.0');
      if (resetInput) {
        $('#bag-price').value = fieldValue(bagCents);
        fieldError($('#bag-price'), 'bag-price-error');
      }
    }
    $('#review-checkout').disabled = !bagId || !bagDraftValid || !validAmount(bagCents);
    put('[data-total-label]', live ? 'Subtotal' : 'Preview subtotal');
    put('[data-currency-label]', live ? 'USD · taxes calculated at checkout' : 'USD · taxes not calculated · no payment in preview');
    saveBag();
  }
  ['#custom-price','#bag-price','#price-slider'].forEach(selector => {
    const input = $(selector);
    input.max = String(MAX / 100); input.step = '0.01';
  });
  $('#reset-price').setAttribute('aria-label', 'Reset price to the ' + formatMoney(BASE) + ' base');
  const presets = [...new Set((Array.isArray(offer.presets) ? offer.presets : defaults.release.presets).filter(validAmount))].sort((a,b)=>a-b);
  function presetButton(cents) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.pricePreset = String(cents); button.textContent = formatMoney(cents);
    button.setAttribute('aria-pressed', String(cents === selectedCents));
    button.setAttribute('aria-label', 'Choose ' + formatMoney(cents) + ' USD' + (cents === BASE ? ', base price' : ''));
    button.addEventListener('click', () => { applySelected(cents); announce('Your price: ' + formatMoney(cents) + ' USD.'); });
    return button;
  }
  $('#price-presets').replaceChildren(...presets.filter(cents=>cents>=BASE).map(presetButton));
  $('#hidden-price-presets').replaceChildren(...presets.filter(cents=>cents<BASE).map(presetButton));
  updatePricingCopy();
  // A click on a purchase CTA must not be lost when field blur reveals a panel
  // and moves that CTA. Its click handler commits/reveals just before opening
  // the next dialog instead. Other blur and keyboard commits reveal in place.
  let pointerCommitTarget = null;
  document.addEventListener('pointerdown', event => {
    pointerCommitTarget = event.target instanceof Element ? event.target.closest('#add-to-bag,#mobile-add,#review-checkout') : null;
  }, true);
  document.addEventListener('pointerup', () => { setTimeout(() => {pointerCommitTarget=null;},0); }, true);
  document.addEventListener('pointercancel', () => {pointerCommitTarget=null;}, true);
  // A committed lower number is an attempt, even when it is below the true floor.
  function discoverFromField(input) {
    const text = input.value.trim();
    if (/^-?\d+(?:\.\d{1,2})?$/.test(text) && Number(text) * 100 < BASE) unlockLower();
  }
  function readProductPrice(commit = false) {
    const input = $('#custom-price');
    if (commit && !pointerCommitTarget) discoverFromField(input);
    const result = parseAmount(input.value);
    selectedCents = result.error ? null : result.cents;
    fieldError(input, 'price-error', result.error);
    syncSelected();
    if (commit && validAmount(selectedCents)) input.value = fieldValue(selectedCents);
  }
  $('#custom-price').addEventListener('input', () => readProductPrice());
  $('#custom-price').addEventListener('change', () => readProductPrice(true));
  $('#custom-price').addEventListener('blur', () => readProductPrice(true));
  $('#custom-price').addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); readProductPrice(true); addToBag(); }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const current = validAmount(selectedCents) ? selectedCents : BASE;
      applySelected(Math.max(MIN, Math.min(MAX, current + (event.key === 'ArrowDown' ? -100 : 100))));
    }
  });
  $('#reset-price').addEventListener('click', () => { applySelected(BASE); announce('Price reset to ' + formatMoney(BASE) + ' USD.'); });
  $('#price-decrease').addEventListener('click', () => applySelected(Math.max(MIN,(validAmount(selectedCents) ? selectedCents : BASE)-2500)));
  $('#price-increase').addEventListener('click', () => applySelected(Math.min(MAX,(validAmount(selectedCents) ? selectedCents : BASE)+2500)));
  const slider = $('#price-slider');
  slider.addEventListener('input', event => {
    const result = parseAmount(event.target.value);
    if (!result.error) applySelected(result.cents);
  });
  // Home lands at the currently visible start, not the undiscovered floor.
  slider.addEventListener('keydown', event => {
    const delta = ['ArrowRight','ArrowUp'].includes(event.key) ? 100 : ['ArrowLeft','ArrowDown'].includes(event.key) ? -100 : event.key === 'PageUp' ? 5000 : event.key === 'PageDown' ? -5000 : 0;
    if (delta || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const current = Math.round(Number(event.target.value) * 100);
      applySelected(event.key === 'Home' ? visibleMin() : event.key === 'End' ? MAX : Math.max(MIN,Math.min(MAX,current + delta)));
    }
  });
  // Pointer handling allows a real attempt past the initial left edge, which a
  // native range clamped to $200 cannot report. Vertical touch scroll is retained.
  let drag = null;
  slider.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    slider.focus({preventScroll:true});
    const box = slider.getBoundingClientRect();
    const inset = matchMedia('(max-width:680px)').matches ? 11 : 8.5;
    const width = Math.max(1, box.width-inset*2), start = box.left+inset;
    const floor = visibleMin(), span = MAX-floor;
    const current = validAmount(selectedCents) ? Math.max(floor,selectedCents) : BASE;
    const thumb = start+(current-floor)/Math.max(1,span)*width;
    const onThumb = Math.abs(event.clientX-thumb)<=18;
    const anchor = onThumb ? current : Math.max(floor,Math.min(MAX,Math.round(floor+(event.clientX-start)/width*span)));
    applySelected(anchor);
    drag = {id:event.pointerId,x:event.clientX,y:event.clientY,anchor,span,width,moved:false};
    slider.setPointerCapture(event.pointerId);
  });
  slider.addEventListener('pointermove', event => {
    if (!drag || event.pointerId !== drag.id) return;
    const dx=event.clientX-drag.x, dy=event.clientY-drag.y;
    // Ignore tiny taps/jitter; a downward scroll is not a lower-price gesture.
    if (!drag.moved && (Math.abs(dx)<6 || Math.abs(dy)>Math.abs(dx))) return;
    drag.moved=true;
    event.preventDefault();
    const cents=Math.round(drag.anchor+dx/drag.width*drag.span);
    applySelected(Math.max(MIN,Math.min(MAX,cents)));
  },{passive:false});
  function endDrag(event) {
    if (drag && event.pointerId===drag.id) {
      drag=null;
      if (slider.hasPointerCapture(event.pointerId)) slider.releasePointerCapture(event.pointerId);
    }
  }
  slider.addEventListener('pointerup',endDrag);
  slider.addEventListener('pointercancel',endDrag);
  slider.addEventListener('lostpointercapture',()=>{drag=null;});
  function readBagPrice(commit = false) {
    const input=$('#bag-price');
    if (commit && !pointerCommitTarget) discoverFromField(input);
    const result=parseAmount(input.value);
    bagDraftValid=!result.error;
    fieldError(input,'bag-price-error',result.error);
    if (bagDraftValid) { bagCents=result.cents; applySelected(bagCents,commit && !pointerCommitTarget); }
    syncBag();
    if (commit && bagDraftValid) input.value=fieldValue(bagCents);
  }
  $('#bag-price').addEventListener('input',()=>readBagPrice());
  $('#bag-price').addEventListener('change',()=>readBagPrice(true));
  $('#bag-price').addEventListener('blur',()=>readBagPrice(true));
  $('#bag-price').addEventListener('keydown',event=>{
    if (event.key==='Enter') {event.preventDefault();readBagPrice(true);if(!$('#review-checkout').disabled)$('#review-checkout').click();}
    if (event.key==='ArrowDown'||event.key==='ArrowUp') {
      event.preventDefault();
      const current=bagDraftValid && validAmount(bagCents)?bagCents:BASE;
      const cents=Math.max(MIN,Math.min(MAX,current+(event.key==='ArrowDown'?-100:100)));
      $('#bag-price').value=fieldValue(cents);readBagPrice(true);
    }
  });

  function setView(next) {
    view = next;
    $('#shop-view').hidden = next !== 'shop';
    $('#studio-view').hidden = next !== 'studio';
    document.body.classList.toggle('shop-active', next === 'shop');
    document.title = next === 'shop' ? 'The Keld Shop — ARE Alpha · First 100' : 'Keld — Agent gear. Even minds need tools.';
    const shopNav = $('.shop-link');
    if (next === 'shop') shopNav.setAttribute('aria-current', 'page'); else shopNav.removeAttribute('aria-current');
    requestAnimationFrame(updateMobileBar);
  }
  function getHash() { try { return decodeURIComponent(location.hash.slice(1)); } catch { return ''; } }
  function route() {
    const id = getHash();
    const next = id.startsWith('shop') ? 'shop' : ['top','gear','legend','studio','notes','contact'].includes(id) ? 'studio' : view;
    const changed = view !== next;
    setView(next);
    if (changed) requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' }); else window.scrollTo(0, 0);
    });
  }
  if (!location.hash && view === 'shop') {
    try { history.replaceState(null, '', '#shop'); } catch { /* The view still opens as the shop. */ }
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('popstate', route);
  window.addEventListener('keld:route', route);
  // Activate the target before native anchor scrolling runs; keep normal link semantics.
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', () => {
    const id = a.getAttribute('href').slice(1);
    if (id.startsWith('shop')) setView('shop');
    else if (['top','gear','legend','studio','notes','contact'].includes(id)) setView('studio');
  }));
  function closeModal(restore = true) {
    const current = activeModal;
    activeModal = null;
    if (current?.open) current.close();
    document.body.classList.remove('shop-dialog-open');
    if (restore && originFocus?.isConnected) originFocus.focus({ preventScroll: true });
  }
  function openModal(id) {
    const target = document.getElementById(id);
    if (!target) return;
    if (!activeModal) originFocus = document.activeElement;
    else closeModal(false);
    activeModal = target;
    document.body.classList.add('shop-dialog-open');
    target.showModal();
    target.scrollTop = 0;
    $('[data-shop-close]', target)?.focus({ preventScroll: true });
  }
  $$('[data-shop-close]').forEach(button => button.addEventListener('click', () => closeModal()));
  $$('.shop-dialog').forEach(dialog => {
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeModal(); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const b = dialog.getBoundingClientRect();
      if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) closeModal();
    });
  });
  function addToBag() {
    if (!validAmount(selectedCents)) { $('#custom-price').focus(); return; }
    if (selectedCents < BASE) unlockLower();
    bagId = selectedId; bagCents = selectedCents; bagDraftValid = true;
    syncBag(true);
    announce(`${offers[bagId].name} added to your ${live ? '' : 'preview '}bag at ${formatMoney(bagCents)} USD.`);
    openModal('shop-bag-dialog');
  }
  $('#add-to-bag').addEventListener('click', addToBag);
  $('#mobile-add').addEventListener('click', addToBag);
  $('#open-bag').addEventListener('click', () => { syncBag(); openModal('shop-bag-dialog'); });
  $$('[data-shop-license]').forEach(button => button.addEventListener('click', () => openModal('shop-license-dialog')));
  $('#remove-from-bag').addEventListener('click', () => {
    bagId = null; bagCents = null; bagDraftValid = true; syncBag(); announce('Removed. Your bag is empty.');
    $('.bag-empty .button').focus();
  });
  $('#review-checkout').addEventListener('click', () => {
    if (!bagId || !bagDraftValid || !validAmount(bagCents)) return;
    if (bagCents < BASE) unlockLower();
    $('#checkout-error').hidden = true;
    syncBag(); $('#shop-checkout-dialog').setAttribute('aria-labelledby', 'checkout-title'); $('#checkout-review').hidden = false; $('#checkout-finish').hidden = true;
    openModal('shop-checkout-dialog');
  });
  $('#back-to-bag').addEventListener('click', () => openModal('shop-bag-dialog'));
  $('#complete-preview').addEventListener('click', async () => {
    if (!bagId || !bagDraftValid || !validAmount(bagCents) || checkoutBusy) return;
    if (live) {
      const button = $('#complete-preview');
      const error = $('#checkout-error');
      const previousText = button.textContent;
      checkoutBusy = true; button.disabled = true; button.textContent = 'Preparing secure checkout…'; error.hidden = true;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        // This request is a proposal. The server MUST revalidate bounds, product,
        // currency and quantity, and create the provider session at that amount.
        const response = await fetch(checkoutEndpoint, {
          method:'POST', headers:{'Content-Type':'application/json'}, credentials:'same-origin',
          signal:controller.signal,
          body:JSON.stringify({productId:'agent-reasoning-engine', offerId:bagId, amountCents:bagCents, currency, quantity:1})
        });
        if (!response.ok) throw new Error('Checkout not available');
        const data = await response.json();
        if (!validUrl(data.checkoutUrl)) throw new Error('Invalid checkout destination');
        window.location.assign(data.checkoutUrl);
      } catch {
        error.textContent = 'Checkout could not be opened. Your chosen price is still in the bag. Please try again; no payment has been confirmed here.';
        error.hidden = false;
      } finally {
        clearTimeout(timeout); checkoutBusy = false; button.disabled = false; button.textContent = previousText;
      }
      return; // Never show a simulated paid/download result in live mode.
    }
    $('#checkout-review').hidden = true; $('#checkout-finish').hidden = false;
    $('#shop-checkout-dialog').setAttribute('aria-labelledby', 'preview-finish-title');
    $('#shop-checkout-dialog').scrollTop = 0;
    $('#checkout-finish h2').setAttribute('tabindex', '-1');
    $('#checkout-finish h2').focus({ preventScroll: true });
    announce('Preview complete. No payment, order, or product access.');
  });
  $('#finish-explore').addEventListener('click', () => {
    closeModal(false); setView('shop'); location.hash = 'shop'; window.scrollTo({top:0,behavior:'instant'});
    $('#shop-title').setAttribute('tabindex','-1'); $('#shop-title').focus({preventScroll:true});
  });
  $('#download-summary').addEventListener('click', () => {
    if (!bagId || live) return;
    const text = `KELD — DOWNLOADABLE RELEASE PREVIEW\n\nNOT AN ORDER, RECEIPT, LICENSE GRANT, OR ENGINE PACKAGE\n\nProduct: Agent Reasoning Engine (ARE)\nRelease status: alpha\nFormat: downloadable software\nPlanned software license: Apache License 2.0\nChosen price: ${formatMoney(bagCents)}${currency ? ' ' + currency : ''}\nBase price: ${formatMoney(BASE)} USD\n${lowerUnlocked ? 'Discovered range: ' + formatMoney(MIN) + '–' + formatMoney(MAX) + ' USD' : 'Maximum price: ' + formatMoney(MAX) + ' USD'}\nBilling: one-time purchase\nTaxes: not calculated\nPayment: not made\nOrder: not placed\nEngine file: not delivered\n\nApache 2.0 permits use, modification and redistribution, including commercial use and resale, subject to its terms. There are no Individual/Team software-rights tiers.\nRelease maturity: alpha; bugs and breaking changes are possible.\nEarly-supporter offer: first 100 customers.\nIncluded: 12 months of ongoing ARE updates and upgrades as released, plus direct maker support for the same period from purchase.\nSupport: setup and usage questions, troubleshooting, reporting issues, feedback, and discussion of improvements.\nThe benefits are the same at every accepted price within the first 100 customers.\nNo fixed release cadence, response-time guarantee, or commitment to implement every request.\nEligibility: not confirmed in this preview. No place reserved, no entitlement granted, and no support period started.\nNo automatic renewal. Later update/support arrangements are not defined.\n\nAuthoritative license: https://www.apache.org/licenses/LICENSE-2.0\n`;
    const url = URL.createObjectURL(new Blob([text], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a'); link.href = url; link.download = 'keld-store-preview-summary.txt';
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  });
  const galleryButtons = $$('[data-gallery]');
  const captions = { artifact: 'CONCEPT ART / NOT PHYSICAL HARDWARE', schematic: 'CONCEPT STUDY / NOT A TECHNICAL ARCHITECTURE', seal: 'THE MAKER’S MARK / KELD' };
  function selectGallery(id, focus = false) {
    galleryId = id;
    galleryButtons.forEach(button => {
      const selected = button.dataset.gallery === id;
      button.setAttribute('aria-selected', String(selected)); button.tabIndex = selected ? 0 : -1;
      document.getElementById('gallery-' + button.dataset.gallery).hidden = !selected;
      if (focus && selected) button.focus();
    });
    $('#exhibit-caption').textContent = captions[id];
  }
  function rovingTabs(buttons, activate) {
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => activate(index, false));
      button.addEventListener('keydown', e => {
        const next = e.key === 'ArrowRight' ? (index + 1) % buttons.length : e.key === 'ArrowLeft' ? (index + buttons.length - 1) % buttons.length : e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : null;
        if (next !== null) { e.preventDefault(); activate(next, true); }
      });
    });
  }
  rovingTabs(galleryButtons, (i, focus) => selectGallery(galleryButtons[i].dataset.gallery, focus));
  $('#expand-art').addEventListener('click', () => {
    const clone = document.getElementById('gallery-' + galleryId).cloneNode(true);
    clone.removeAttribute('id'); clone.removeAttribute('role'); clone.removeAttribute('aria-labelledby');
    // Namespace SVG ids so duplicate artwork never introduces duplicate DOM identifiers.
    const prefix = 'zoom' + (++zoomCount) + '-';
    const mapping = new Map();
    $$('[id]', clone).forEach(node => { const old = node.id; mapping.set(old, prefix + old); node.id = prefix + old; });
    [clone, ...$$('*', clone)].forEach(node => {
      for (const attr of [...node.attributes]) {
        let value = attr.value;
        for (const [old, next] of mapping) {
          value = value.split('url(#' + old + ')').join('url(#' + next + ')');
          if ((attr.name === 'href' || attr.name === 'xlink:href') && value === '#' + old) value = '#' + next;
          if (attr.name === 'aria-labelledby' || attr.name === 'aria-describedby') value = value.split(' ').map(t => t === old ? next : t).join(' ');
        }
        if (value !== attr.value) node.setAttribute(attr.name, value);
      }
    });
    $('#zoom-content').replaceChildren(clone); openModal('shop-zoom-dialog');
  });
  const studyTexts = [
    'Start with the question. What is the goal, what is known, and what still needs to be understood?',
    'Consider the possibilities. Which alternatives deserve attention, and which assumptions need to be examined?',
    'Make the next step deliberate. An action should follow from the question and the information available.'
  ];
  const studyButtons = $$('[data-study]');
  rovingTabs(studyButtons, (index, focus) => {
    studyButtons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index)); button.tabIndex = i === index ? 0 : -1;
      if (focus && i === index) button.focus();
    });
    $('#study-panel').setAttribute('aria-labelledby', 'study-tab-' + index);
    $('#study-text').textContent = studyTexts[index];
  });
  let scrollQueued = false;
  function updateMobileBar() {
    const visible = view === 'shop' && $('#add-to-bag').getBoundingClientRect().bottom < 0;
    $('#mobile-buy-bar').classList.toggle('visible', visible);
    scrollQueued = false;
  }
  window.addEventListener('scroll', () => { if (!scrollQueued) { requestAnimationFrame(updateMobileBar); scrollQueued = true; } }, {passive:true});
  window.addEventListener('resize', updateMobileBar);
  if (live) {
    $('#preview-ribbon').hidden = true;
    $$('[data-preview-label]').forEach(el => { el.hidden = true; });
    put('[data-total-label]', 'Subtotal');
    put('[data-tax-note]', 'Calculated at hosted checkout');
    put('[data-mobile-price-label]', 'Alpha · Apache 2.0');
    put('[data-currency-label]', currency + ' · taxes calculated at checkout');
    $('#release-fact').textContent = raw.releaseSummary;
    $('#purchase-note').textContent = 'Final total and payment are handled at hosted checkout.';
    $('#bag-safe-note').textContent = 'Review your order before continuing to hosted checkout.';
    $('#checkout-mode-label').textContent = 'ORDER REVIEW';
    $('#checkout-intro').textContent = 'Review your selection, then continue to the hosted payment page. No card details are collected on this website.';
    $('#payment-method-title').textContent = 'Continue to hosted checkout';
    $('#payment-method-copy').textContent = 'Payment and the final total are handled on the configured provider’s checkout page.';
    $('#checkout-delivery-title').textContent = 'Delivery';
    $('#checkout-delivery-note').textContent = raw.deliverySummary;
    $('#checkout-final-note').textContent = 'Continue to review applicable terms and the final amount before paying.';
    $('#complete-preview').textContent = 'Continue to payment →';
    $('#delivery-description').textContent = raw.deliverySummary;
    $('#faq-can-buy').textContent = raw.releaseSummary + ' Review the downloadable release and continue to hosted checkout to purchase.';
    updatePricingCopy();
    $('#faq-delivery').textContent = raw.deliverySummary;
    const legal = document.createElement('p'); legal.className = 'purchase-links';
    [['Purchase terms', raw.termsUrl], ['Privacy', raw.privacyUrl], ['Refunds', raw.refundUrl]].forEach(([label,url]) => {
      const a = document.createElement('a'); a.textContent = label; a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; legal.append(a);
    });
    $('.product-purchase').append(legal);
  }
  applySelected(selectedCents); syncBag(true); route();
})();
