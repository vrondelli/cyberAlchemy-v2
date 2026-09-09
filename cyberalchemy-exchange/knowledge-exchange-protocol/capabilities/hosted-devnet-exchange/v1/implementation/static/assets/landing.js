if(location.hash==='#white-paper'||location.hash.startsWith('#paper-'))location.replace('/white-paper'+(location.hash==='#white-paper'?'':location.hash));

(() => {
  const hero = document.querySelector('.hero');
  const control = document.querySelector('.motion-control');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let inView = false;
  let paused = false;
  function sync() {
    hero.classList.toggle('motion-running', inView && !document.hidden && !reduced.matches && !paused);
    control.hidden = reduced.matches;
    control.textContent = paused ? 'Play motion' : 'Pause motion';
    control.setAttribute('aria-pressed', String(paused));
  }
  control.addEventListener('click', () => { paused = !paused; sync(); });
  document.addEventListener('visibilitychange', sync);
  reduced.addEventListener('change', sync);
  new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, {threshold:0}).observe(hero);
  sync();
})();
