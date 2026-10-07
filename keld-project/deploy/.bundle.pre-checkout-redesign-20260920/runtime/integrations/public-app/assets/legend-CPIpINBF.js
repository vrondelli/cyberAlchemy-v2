/* Keld's illustrated legend. Uses local image assets; YouTube loads only on an explicit film request.
 * Manual chapter selection only. The viewer never autoplays or captures scroll.
 */
(() => {
  'use strict';
  const root = document.querySelector('#legend');
  if (!root) return;
  const tabs = [...root.querySelectorAll('[data-legend-chapter]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  const track = root.querySelector('.legend-chapter-track');
  const cinema = document.querySelector('#legend-cinema');
  const $ = selector => document.querySelector(selector);
  const previous = [$('#legend-prev'), $('#cinema-prev')];
  const next = [$('#legend-next'), $('#cinema-next')];
  let active = 0;
  let returnFocus = null;
  const pad = number => String(number).padStart(2, '0');
  const label = index => `SCENE ${pad(index + 1)} / ${pad(tabs.length)}`;

  function keepTabInView() {
    // Scroll this horizontal strip only: never jump the document vertically.
    const t = tabs[active].getBoundingClientRect();
    const r = track.getBoundingClientRect();
    if (t.left < r.left) track.scrollLeft -= r.left - t.left + 3;
    else if (t.right > r.right) track.scrollLeft += t.right - r.right + 3;
  }
  function syncCinema() {
    const panel = panels[active];
    const image = panel.querySelector('img');
    const output = $('#cinema-image');
    if (output.getAttribute('src') !== image.getAttribute('src')) output.src = image.getAttribute('src');
    output.alt = image.alt;
    $('#cinema-title').textContent = panel.querySelector('h3').textContent;
    $('#cinema-description').replaceChildren(...[...panel.querySelector('.legend-full-prose').childNodes].map(node => node.cloneNode(true)));
    $('#cinema-counter').textContent = label(active);
    cinema.querySelector('.cinema-caption').scrollTop = 0;
  }
  function select(index, { focus = false, announce = true } = {}) {
    if (!Number.isInteger(index)) return;
    const value = Math.max(0, Math.min(tabs.length - 1, index));
    active = value;
    panels.forEach((panel, i) => { panel.hidden = i !== active; });
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === active));
      tab.tabIndex = i === active ? 0 : -1;
    });
    // Asking for a chapter is an explicit request to load its image.
    panels[active].querySelector('img').loading = 'eager';
    previous.forEach(button => { button.disabled = active === 0; });
    next.forEach(button => { button.disabled = active === tabs.length - 1; });
    $('#legend-counter').textContent = label(active);
    if (announce) {
      const text = `Scene ${active + 1} of ${tabs.length}: ${panels[active].querySelector('h3').textContent}`;
      (cinema.open ? $('#cinema-announcement') : $('#legend-announcement')).textContent = text;
    }
    if (cinema.open) syncCinema();
    if (focus) tabs[active].focus({ preventScroll: true });
    if (announce) {
      keepTabInView();
      if (!cinema.open) {
        const viewer = root.querySelector('.legend-viewer');
        const r = viewer.getBoundingClientRect();
        const header = $('#site-header').getBoundingClientRect().bottom;
        // An explicit selection should reveal its result, not leave it under the header.
        if (r.top < header || r.top > innerHeight - 120 || (r.height <= innerHeight - header - 12 && r.bottom > innerHeight)) {
          window.scrollTo({top: scrollY + r.top - header - 12, behavior:'instant'});
        }
      }
    }
  }
  function keyNavigate(event, focus = false) {
    let index = active;
    if (event.key === 'ArrowRight') index = Math.min(active + 1, tabs.length - 1);
    else if (event.key === 'ArrowLeft') index = Math.max(active - 1, 0);
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = tabs.length - 1;
    else return;
    event.preventDefault();
    select(index, { focus });
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(i));
    tab.addEventListener('keydown', event => keyNavigate(event, true));
  });
  previous.forEach(button => button.addEventListener('click', () => select(active - 1)));
  next.forEach(button => button.addEventListener('click', () => select(active + 1)));
  panels.forEach(panel => panel.addEventListener('keydown', event => keyNavigate(event)));

  function openCinema() {
    if (cinema.open || typeof cinema.showModal !== 'function') return;
    returnFocus = document.activeElement;
    syncCinema();
    document.body.classList.add('legend-cinema-open');
    cinema.showModal();
    $('#cinema-close').focus({ preventScroll: true });
  }
  function closeCinema() { if (cinema.open) cinema.close(); }
  $('#legend-expand').addEventListener('click', openCinema);
  $('#cinema-close').addEventListener('click', closeCinema);
  cinema.addEventListener('cancel', event => { event.preventDefault(); closeCinema(); });
  cinema.addEventListener('close', () => {
    document.body.classList.remove('legend-cinema-open');
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  });
  cinema.addEventListener('keydown', event => keyNavigate(event));
  if (typeof cinema.showModal !== 'function') $('#legend-expand').hidden = true;

  // A horizontal swipe changes chapters; vertical movement remains page scroll.
  document.querySelectorAll('[data-legend-swipe]').forEach(surface => {
    let start = null;
    surface.addEventListener('touchstart', event => {
      start = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
    }, { passive: true });
    surface.addEventListener('touchend', event => {
      if (!start || !event.changedTouches.length) return;
      const end = event.changedTouches[0];
      const dx = end.clientX - start.x, dy = end.clientY - start.y;
      start = null;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) select(active + (dx < 0 ? 1 : -1));
    }, { passive: true });
    surface.addEventListener('touchcancel', () => { start = null; }, { passive: true });
  });
  const filmButton = $('#legend-film-play');
  const filmScreen = $('#legend-film-screen');
  let filmFrame = null;
  function stopFilm() {
    if (!filmFrame) return;
    filmFrame.remove(); filmFrame = null; filmButton.hidden = false;
  }
  filmButton.addEventListener('click', () => {
    if (location.protocol === 'file:') {
      window.open('https://www.youtube.com/watch?v=ZQU8JeN6nQQ', '_blank', 'noopener,noreferrer');
      return;
    }
    filmFrame = document.createElement('iframe');
    filmFrame.title = 'The Legend of Keld — YouTube video';
    filmFrame.src = 'https://www.youtube-nocookie.com/embed/ZQU8JeN6nQQ?autoplay=1&playsinline=1&cc_load_policy=1&cc_lang_pref=en';
    filmFrame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    filmFrame.allowFullscreen = true;
    filmFrame.referrerPolicy = 'strict-origin-when-cross-origin';
    filmButton.hidden = true;
    filmScreen.append(filmFrame);
    filmFrame.focus();
  });
  // Switching to the storefront must not leave narration playing out of sight.
  const studioView = $('#studio-view');
  new MutationObserver(() => { if (studioView.hidden) stopFilm(); })
    .observe(studioView, { attributes: true, attributeFilter: ['hidden'] });
  new MutationObserver(() => {
    if (document.querySelector('dialog[open]')) stopFilm();
  }).observe(document.body, {subtree:true, attributes:true, attributeFilter:['open']});
  window.addEventListener('pagehide', stopFilm);
  select(0, { announce: false });

  // Optional illustrated-legend entry point. Standard studio/shop URLs are unchanged.
  if (window.KELD_INITIAL_SECTION === 'legend' && !location.hash) {
    try { history.replaceState(null, '', '#legend'); }
    catch { location.hash = 'legend'; }
    window.dispatchEvent(new CustomEvent('keld:route'));
    const position = () => root.scrollIntoView({ behavior: 'instant', block: 'start' });
    requestAnimationFrame(() => requestAnimationFrame(position));
    window.addEventListener('load', position, { once: true });
  }
})();
