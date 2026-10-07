/* Synvora static site. No analytics.
   Set contactEmail below to a real, authorized studio inbox before launch.
   A mailto link prepares a draft in the visitor's mail app; it does not send it. */
window.KELD_CONFIG = Object.assign({ contactEmail: '' }, window.KELD_CONFIG || {});
(() => {
  'use strict';
  const $ = (s, parent = document) => parent.querySelector(s);
  const $$ = (s, parent = document) => [...parent.querySelectorAll(s)];
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let manualReducedMotion = false;
  let lastFocus = null;
  let dialogOrigin = '';
  let suppressHash = false;
  let activeDialog = null;
  const reduceMotion = () => motionQuery.matches || manualReducedMotion;
  const contactEmail = String(window.KELD_CONFIG.contactEmail || '').trim();
  const validStudioEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) && !/[\r\n]/.test(contactEmail);
  const modalIds = new Set($$('dialog.content-dialog').map(el => el.id));

  function notify(text) {
    const toast = $('#toast');
    toast.textContent = text;
    toast.classList.add('visible');
    window.clearTimeout(notify.timer);
    notify.timer = window.setTimeout(() => toast.classList.remove('visible'), 3000);
  }
  function getHash() {
    try { return decodeURIComponent(location.hash.slice(1)); }
    catch { return ''; }
  }
  function replaceHash(hash) {
    // Sandboxed previews and file:// may restrict history. Navigation still works.
    try { history.replaceState(null, '', hash ? '#' + hash : location.pathname + location.search); }
    catch { suppressHash = true; location.hash = hash; }
    window.dispatchEvent(new CustomEvent('keld:route'));
  }
  function closeDialog({ restore = true, keepHash = false } = {}) {
    if (!activeDialog) return;
    const dialog = activeDialog;
    activeDialog = null;
    dialog.close();
    document.body.classList.remove('dialog-open');
    if (!keepHash && modalIds.has(getHash())) replaceHash(dialogOrigin);
    if (restore && lastFocus && lastFocus.isConnected) lastFocus.focus({ preventScroll: true });
  }
  function openDialog(id, { updateHash = true } = {}) {
    const dialog = document.getElementById(id);
    if (!dialog || !modalIds.has(id)) return;
    if (activeDialog) closeDialog({ restore: false, keepHash: true });
    else {
      lastFocus = document.activeElement;
      const hash = getHash();
      dialogOrigin = modalIds.has(hash) ? '' : hash;
    }
    activeDialog = dialog;
    document.body.classList.add('dialog-open');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else { dialog.setAttribute('open', ''); dialog.style.position = 'fixed'; dialog.style.inset = '0'; }
    dialog.scrollTop = 0;
    if (updateHash && getHash() !== id) {
      try { history.pushState({ keldDialog: id }, '', '#' + id); }
      catch { suppressHash = true; location.hash = id; }
    }
    $('[data-close]', dialog)?.focus({ preventScroll: true });
  }
  function goToSection(id, interest) {
    if (interest) $('#contact-interest').value = interest;
    closeDialog({ restore: false, keepHash: true });
    replaceHash(id);
    const target = document.getElementById(id);
    target?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
    // Move focus to the destination heading without scrolling twice.
    const heading = target?.querySelector('h1,h2');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
  }

  $$('[data-open]').forEach(trigger => trigger.addEventListener('click', event => {
    event.preventDefault(); openDialog(trigger.dataset.open);
  }));
  $$('[data-close]').forEach(trigger => trigger.addEventListener('click', () => closeDialog()));
  $$('[data-close-to]').forEach(trigger => trigger.addEventListener('click', event => {
    event.preventDefault(); goToSection(trigger.dataset.closeTo, trigger.dataset.interest);
  }));
  $$('[data-switch]').forEach(trigger => trigger.addEventListener('click', event => {
    event.preventDefault(); openDialog(trigger.dataset.switch);
  }));
  $$('dialog.content-dialog').forEach(dialog => {
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog();
    });
  });
  window.addEventListener('hashchange', () => {
    if (suppressHash) { suppressHash = false; return; }
    const id = getHash();
    if (modalIds.has(id)) {
      if (activeDialog?.id !== id) openDialog(id, { updateHash: false });
    } else if (activeDialog) closeDialog({ restore: false, keepHash: true });
  });
  // popstate is needed for History API routes when the hash is unchanged.
  window.addEventListener('popstate', () => {
    const id = getHash();
    if (!modalIds.has(id) && activeDialog) closeDialog({ restore: false, keepHash: true });
    else if (modalIds.has(id) && activeDialog?.id !== id) openDialog(id, { updateHash: false });
  });

  // Responsive navigation: Escape, focus loop, and automatic close on section navigation.
  const menuToggle = $('.menu-toggle');
  const nav = $('#primary-nav');
  function toggleMenu(open) {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    nav.classList.toggle('is-open', open);
  }
  menuToggle.addEventListener('click', () => toggleMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', nav).forEach(link => link.addEventListener('click', () => toggleMenu(false)));
  document.addEventListener('keydown', event => {
    if (menuToggle.getAttribute('aria-expanded') !== 'true') return;
    if (event.key === 'Escape') { toggleMenu(false); menuToggle.focus(); }
    if (event.key === 'Tab') {
      const focusables = [menuToggle, ...$$('a', nav)];
      const first = focusables[0], last = focusables.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.header') && menuToggle.getAttribute('aria-expanded') === 'true') toggleMenu(false);
  });
  window.matchMedia('(min-width: 681px)').addEventListener('change', event => { if (event.matches) toggleMenu(false); });

  // WAI-style roving tabs: buttons, visible panels, and arrow/Home/End controls.
  function setupTabs(selector, panelPrefix, vertical) {
    const buttons = $$(selector);
    const activate = (index, focus = false) => {
      buttons.forEach((button, i) => {
        const active = i === index;
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
        button.classList.toggle('active', active);
        document.getElementById(panelPrefix + i).hidden = !active;
      });
      if (focus) buttons[index].focus();
    };
    buttons.forEach((button, i) => {
      button.addEventListener('click', () => activate(i));
      button.addEventListener('keydown', event => {
        let next = null;
        if (event.key === (vertical ? 'ArrowDown' : 'ArrowRight')) next = (i + 1) % buttons.length;
        if (event.key === (vertical ? 'ArrowUp' : 'ArrowLeft')) next = (i - 1 + buttons.length) % buttons.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = buttons.length - 1;
        if (next !== null) { event.preventDefault(); activate(next, true); }
      });
    });
  }
  setupTabs('[data-title]', 'title-panel-', true);
  setupTabs('[data-concept]', 'concept-panel-', false);

  $('#assembly-toggle').addEventListener('click', event => {
    const button = event.currentTarget;
    const assembled = button.getAttribute('aria-pressed') !== 'true';
    button.setAttribute('aria-pressed', String(assembled));
    $('#artifact-visual').classList.toggle('assembled', assembled);
    button.innerHTML = assembled ? 'Separate <span aria-hidden="true">−</span>' : 'Assemble <span aria-hidden="true">+</span>';
  });
  const motionButton = $('#motion-toggle');
  function syncMotion() {
    const reduced = reduceMotion();
    document.documentElement.classList.toggle('reduced-motion', reduced);
    motionButton.setAttribute('aria-pressed', String(reduced));
    motionButton.textContent = reduced ? 'Motion reduced' : 'Reduce motion';
    motionButton.title = motionQuery.matches ? 'Reduced motion follows your device preference.' : 'Toggle nonessential motion';
  }
  motionButton.addEventListener('click', () => {
    if (motionQuery.matches) { notify('Motion is reduced to match your device settings.'); return; }
    manualReducedMotion = !manualReducedMotion; syncMotion();
  });
  motionQuery.addEventListener('change', syncMotion);
  syncMotion();

  // Never hide readable content unless an observer is available.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .08, rootMargin: '0px 0px 25px 0px' });
    $$('.reveal').forEach(el => observer.observe(el));
    document.documentElement.classList.add('js');
  }
  const progress = $('.scroll-progress');
  let ticking = false;
  function updateProgress() {
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = Math.max(0, Math.min(100, scrollable > 0 ? scrollY / scrollable * 100 : 0)) + '%';
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(updateProgress); ticking = true; } }, { passive: true });
  updateProgress();
  $('#copyright-year').textContent = String(new Date().getFullYear());

  // Inquiry handling is explicitly draft-only. No fetch(), fake success, or silent submission.
  if (validStudioEmail) {
    $('#form-mode-note').textContent = 'Prepare a draft, then open it in your email app. Nothing is sent automatically.';
    $('#draft-setup').textContent = 'Your email application will let you review the recipient and message before sending.';
  }
  $('#contact-form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const interest = String(data.get('interest') || '').trim();
    const message = String(data.get('message') || '').trim();
    if (!name || message.length < 12) { notify('Please include your name and a little more about your question.'); return; }
    const subject = `Synvora inquiry — ${interest}`;
    const draft = `To: ${validStudioEmail ? contactEmail : '[studio address not connected]'}\nSubject: ${subject}\nFrom: ${name} <${email}>\n\nHello Synvora,\n\n${message}\n\n${name}\n${email}`;
    $('#draft-content').value = draft;
    $('#copy-status').textContent = '';
    const mailLink = $('#email-draft');
    mailLink.hidden = !validStudioEmail;
    if (validStudioEmail) mailLink.href = 'mailto:' + encodeURIComponent(contactEmail).replace('%40', '@') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(`Hello Synvora,\n\n${message}\n\n${name}\n${email}`);
    openDialog('inquiry-draft');
  });
  $('#copy-draft').addEventListener('click', async () => {
    const field = $('#draft-content');
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(field.value); copied = true; }
    } catch { /* Fall back below for file previews or blocked clipboard access. */ }
    if (!copied) {
      field.focus(); field.select(); field.setSelectionRange(0, field.value.length);
      try { copied = document.execCommand('copy'); } catch { copied = false; }
    }
    $('#copy-status').textContent = copied ? 'Copied. This is still a draft; it has not been sent.' : 'Copy access is blocked. The text is selected so you can copy it manually.';
  });
  if (modalIds.has(getHash())) openDialog(getHash(), { updateHash: false });
})();

// A.R.E: work produces evidence, alternatives are compared, a connection returns.
// Repeat the narrative with a quiet interval; allow explicit pause and resume.
(() => {
  const art = document.querySelector('.engine-cycles-art');
  if (!art) return;
  const svg = art.querySelector('svg');
  const paths = ['work', 'improve'].map(name => svg.querySelector(`#are-${name}-orbit`));
  const lengths = paths.map(path => path.getTotalLength());
  const trails = [...svg.querySelectorAll('.are-trail')];
  const nodes = [...svg.querySelectorAll('.are-node')];
  const signal = svg.querySelector('.are-signal');
  const core = svg.querySelector('.are-core');
  const alternative = svg.querySelector('.are-alternative');
  const control = art.querySelector('.are-motion-toggle');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = 12000;
  let elapsed = 0, last = null, frame = null, visible = false, paused = false;
  const clamp = value => Math.max(0, Math.min(1, value));
  const ease = value => value * value * (3 - 2 * value);
  const reduced = () => preference.matches || document.documentElement.classList.contains('reduced-motion');
  function still() {
    signal.style.opacity = '0'; alternative.style.opacity = '0';
    core.style.transform = '';
    trails.forEach(trail => { trail.style.opacity = '0'; });
    nodes.forEach(node => node.classList.remove('is-active'));
  }
  function render(ms) {
    const t = ms / 1000;
    // The core lifts into position, then remains the stable centre of both cycles.
    core.style.transform = elapsed < duration ? `translateY(${(1 - ease(clamp(t / 1.2))) * 10}px)` : '';
    const cycle = t < 4.8 ? 0 : 1;
    const progress = clamp((t - (cycle ? 4.8 : 1.2)) / (cycle ? 3.8 : 3.6));
    const p = paths[cycle].getPointAtLength(progress * lengths[cycle]);
    signal.setAttribute('transform', `translate(${p.x} ${p.y})`);
    signal.style.opacity = t >= 1.2 && t <= 8.6 ? String(Math.min(1, progress * 14, (1 - progress) * 14)) : '0';
    trails.forEach((trail, i) => {
      trail.style.strokeDasharray = String(lengths[i]);
      trail.style.strokeDashoffset = String(lengths[i] * (1 - (i === cycle ? progress : i < cycle ? 1 : 0)));
      trail.style.opacity = String(t > 8.6 ? .5 * (1 - clamp((t - 8.6) / 1.4)) : i === cycle ? .65 : i < cycle ? .15 : 0);
    });
    nodes.forEach((node, i) => node.classList.toggle('is-active', Math.floor(i / 3) === cycle && t >= 1.2 && t < 8.6 && Math.abs(progress - [.23, .5, .77][i % 3]) < .14));
    alternative.style.opacity = String(.5 * ease(clamp((t - 5.7) / .6)) * (1 - ease(clamp((t - 7) / .8))));
    art.dataset.motionState = cycle ? 'improve' : t < 1.2 ? 'connect' : 'work';
  }
  function stop() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null; last = null;
  }
  function tick(now) {
    if (last !== null) elapsed += now - last;
    last = now;
    const position = elapsed % duration;
    art.dataset.motionLoop = String(Math.floor(elapsed / duration));
    if (position < 10000) render(position);
    else { still(); art.dataset.motionState = 'rest'; }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    control.hidden = false;
    control.disabled = reduced();
    control.textContent = reduced() ? 'Motion off' : paused ? 'Resume' : 'Pause';
    control.setAttribute('aria-pressed', String(paused || reduced()));
    control.setAttribute('aria-label', reduced() ? 'Animation disabled by motion preference' : `${paused ? 'Resume' : 'Pause'} the A.R.E animation`);
    if (reduced()) {
      stop(); still(); elapsed = 0; art.dataset.motionState = 'reduced'; return;
    }
    if (paused) { stop(); art.dataset.motionState = 'paused'; return; }
    if (!visible || document.hidden) { stop(); return; }
    if (frame === null) frame = requestAnimationFrame(tick);
  }
  control.addEventListener('click', () => { paused = !paused; sync(); });
  new MutationObserver(sync).observe(document.documentElement, {attributes:true, attributeFilter:['class']});
  preference.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; sync();
    }, {threshold:.2}).observe(art);
  } else { visible = true; sync(); }
})();
