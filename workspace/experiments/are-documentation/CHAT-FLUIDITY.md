# Chat fluidity revision

2026-09-18, local owner-directed prototype. No provider/backend changes or deployment.

## Research and decision

[MDN overscroll behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overscroll-behavior) documents that `contain` prevents scroll chaining. The previous chat combined it with a470px inner log, so scrolling over the conversation could trap page navigation. Remove that inner scroller entirely: messages flow in the document, with no stream-driven page scrolling or forced focus. The composer textarea remains a native editable control.

[NN/g progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) recommends deferring secondary controls. Preferences, route history, retention explanation and resets now live in one native Session controls disclosure. Turn allowance and provider identity remain visible; privacy/tool scope remains visible before sending. Suggested prompts are open initially and disclosed after a turn. Native details provides keyboard interaction without popup positioning or focus traps.

## Changes and checks

Shorten empty-state spacing, remove duplicate context/control summaries from the primary path, preserve44px controls and single16px narrow gutters. Keep session isolation/reset semantics and API limits unchanged. Route is CA2-ROUTE-IMPLEMENT; write ceiling is this prototype. No ontology selectors or paid model calls required. Browser verification covers actual wheel movement over empty/long conversation, closed/open controls, suggestions and simulated reply rendering at desktop/mobile/sidebar widths. Simulated network replies belong only to tests, not the product.

## Open Questions

Long conversations intentionally increase document length. A future dedicated chat route could offer an opt-in focused workspace; it should not reintroduce scroll trapping in the landing page. User testing can determine whether compact prompt suggestions help more than a blank composer.
