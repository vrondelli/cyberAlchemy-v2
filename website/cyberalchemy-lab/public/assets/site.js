'use strict';
// Navigation is progressively enhanced: without JS, every proposition stays readable.
function tabGroup(selector, panelSelector) {
  const group = document.querySelector(selector);
  const links = [...group.querySelectorAll('a')];
  const panels = [...document.querySelectorAll(panelSelector)];
  group.setAttribute('role', 'tablist');
  links.forEach(link => {
    link.setAttribute('role', 'tab');
    link.setAttribute('aria-controls', link.hash.slice(1));
  });
  panels.forEach(panel => panel.setAttribute('role', 'tabpanel'));
  function select(index, focus = false) {
    links.forEach((link, i) => {
      link.setAttribute('aria-selected', String(i === index));
      link.tabIndex = i === index ? 0 : -1;
    });
    panels.forEach((panel, i) => { panel.hidden = i !== index; });
    if (focus) links[index].focus();
  }
  links.forEach((link, i) => {
    link.addEventListener('click', event => {
      event.preventDefault();
      select(i);
      history.replaceState(null, '', link.hash);
    });
    link.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (i + 1) % links.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (i - 1 + links.length) % links.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = links.length - 1;
      if (next !== undefined) { event.preventDefault(); select(next, true); }
    });
  });
  function restore() {
    const match = links.findIndex(link => link.hash === location.hash);
    if (match >= 0) select(match);
  }
  select(0); restore();
  window.addEventListener('hashchange', restore);
}
tabGroup('[data-tabs="products"]', '.product-panel');
tabGroup('[data-tabs="steps"]', '.step-panel');
// Keep the same section when switching language.
document.querySelectorAll('.languages a').forEach(link => {
  link.addEventListener('click', () => { link.href = link.href.split('#')[0] + location.hash; });
});
