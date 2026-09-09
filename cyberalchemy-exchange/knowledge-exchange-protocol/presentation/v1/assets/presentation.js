(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const counter = document.querySelector('[data-deck-counter]');
  const progress = document.querySelector('[data-progress]');
  const notesPanel = document.querySelector('[data-notes-panel]');
  const notesBody = document.querySelector('[data-notes-body]');
  let index = Math.max(0, Math.min(slides.length - 1, Number(location.hash.slice(1)) - 1 || 0));
  let notesOpen = false;

  slides.forEach((slide, slideIndex) => {
    const current = String(slideIndex + 1).padStart(2, '0');
    const total = String(slides.length).padStart(2, '0');
    const slideNumber = slide.querySelector('.slide-number');
    if (slideNumber) slideNumber.textContent = current;
    const footerCounter = slide.querySelector('.slide-foot span:last-child');
    if (footerCounter && /^\d{2}\s*\/\s*\d{2}$/.test(footerCounter.textContent.trim())) {
      footerCounter.textContent = `${current} / ${total}`;
    }
  });

  function fitDeck() {
    const compactStage = innerWidth / innerHeight <= 4 / 3;
    const deckWidth = compactStage ? 1200 : 1600;
    const deckHeight = 900;
    const scale = Math.min(innerWidth / deckWidth, innerHeight / deckHeight);
    document.documentElement.style.setProperty('--deck-width', `${deckWidth}px`);
    document.documentElement.style.setProperty('--deck-height', `${deckHeight}px`);
    document.documentElement.style.setProperty('--deck-scale', String(scale));
  }

  function render(pushHash = true) {
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === index);
      slide.classList.toggle('is-before', slideIndex < index);
      slide.setAttribute('aria-hidden', slideIndex === index ? 'false' : 'true');
    });
    counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    progress.style.width = `${((index + 1) / slides.length) * 100}%`;
    document.title = `${slides[index].dataset.title} · CyberAlchemy Exchange`;
    if (pushHash) history.replaceState(null, '', `#${index + 1}`);
    const notes = slides[index].querySelector('.speaker-notes');
    notesBody.innerHTML = notes ? notes.innerHTML : 'No notes for this slide.';
    notesPanel.hidden = !notesOpen;
  }

  function move(delta) { index = Math.max(0, Math.min(slides.length - 1, index + delta)); render(); }
  function toggleNotes() { notesOpen = !notesOpen; render(false); }
  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  function prepareOpeningOrb() {
    const motion = document.querySelector('[data-opening-orb-motion]');
    const still = document.querySelector('.presentation-orb-still');
    if (!motion || !still || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const loadMotion = () => {
      if (motion.dataset.loading === 'true') return;
      motion.dataset.loading = 'true';
      const source = document.createElement('source');
      source.src = motion.dataset.src;
      source.type = 'video/webm';
      motion.append(source);
      motion.addEventListener('canplay', () => {
        motion.play().then(() => requestAnimationFrame(() => {
          motion.classList.add('is-active');
          motion.parentElement.classList.add('has-motion');
        })).catch(() => {});
      }, { once: true });
      motion.load();
    };
    if (still.complete) requestAnimationFrame(loadMotion);
    else still.addEventListener('load', () => requestAnimationFrame(loadMotion), { once: true });
  }

  document.addEventListener('keydown', (event) => {
    if (['ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); move(1); }
    if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); move(-1); }
    if (event.key === 'Home') { index = 0; render(); }
    if (event.key === 'End') { index = slides.length - 1; render(); }
    if (event.key.toLowerCase() === 'n') toggleNotes();
    if (event.key.toLowerCase() === 'f') toggleFullscreen();
  });
  document.querySelector('[data-prev]').addEventListener('click', () => move(-1));
  document.querySelector('[data-next]').addEventListener('click', () => move(1));
  document.querySelector('[data-notes]').addEventListener('click', toggleNotes);
  document.querySelector('[data-fullscreen]').addEventListener('click', toggleFullscreen);
  document.addEventListener('click', (event) => {
    if (event.target.closest('button, a, .notes-panel')) return;
    move(event.clientX > innerWidth / 2 ? 1 : -1);
  });
  window.addEventListener('hashchange', () => {
    const requested = Number(location.hash.slice(1));
    if (Number.isInteger(requested) && requested >= 1 && requested <= slides.length) {
      index = requested - 1;
      render(false);
    }
  });
  window.addEventListener('resize', fitDeck);
  fitDeck();
  prepareOpeningOrb();
  render(false);
})();
