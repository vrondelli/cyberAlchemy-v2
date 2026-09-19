# SWU-UOC-010 Result — PASS

- Task Session: `TS-UOC-010-20260802T145000-0300`.
- Product: SVG nodes now use one roving `tabindex=0`; all other nodes and every
  edge remain `-1`. The canvas viewport is programmatically focusable for wheel
  intent but not another tab stop. `role="application"` remains absent.
- Spatial navigation: plain arrows select the nearest node in the requested
  half-plane by squared center distance, then exact node ID. Replaying
  DS-D1.7 + Right deterministically reached
  `type:architecture.DomainConceptImplementation`.
- Typed relations: `Alt+Right` from DS-D1.7 followed exact outgoing
  `candidate-aligns-to`; `Alt+Left` from RuleImplementation followed the first
  sorted incoming `applies-to` edge. Help copy documents both commands and the
  presentation-only tie-break.
- Focus/selection: the focused node has a 5px non-color focus stroke, canvas and
  navigator selection agree, and Escape clears the trace while retaining one
  focused roving origin.
- Live browser validation: `canvas-keyboard`, `navigator`, `viewport`,
  `inspect`, `focus`, `visibility`, and `static` all passed with zero external
  or failed requests, zero console/page errors, and server cleanup.
- Accepted SHA-256: HTML
  `99a0c5fa331965ef3e4246b9ff152129be7c9f9cc85aa52e40130e77d6b2eb77`;
  validator
  `6e8f06f44d34b40a550ca59751cb37efd1547143d245f3347d743d3150cf632d`.
- Claim ceiling: local candidate custom keyboard behavior, not broad assistive
  technology certification, release, deployment, or production readiness.
