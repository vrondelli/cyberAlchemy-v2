# SWU-UOC-011 Result — PASS

- Task Session: `TS-UOC-011-20260802T150200-0300`.
- Surface contract: Explore is explicitly nonmodal; Details and Help are modal.
  All three surfaces are inert while hidden or closed.
- Entry focus: Explore focuses the navigator search. Details focuses its close
  button after exact graph-object activation. Help focuses its close button.
- Containment and return: modal Tab stays inside Details and Help. Escape closes
  each surface and restores the exact opener; Explore restores
  `#open-explore`, Details restores `meta:DS-D1.7`, and Help restores
  `#open-help`.
- Hidden controls: inert or closed surface descendants are absent from ordinary
  keyboard operation.
- Live browser validation: `popovers`, `canvas-keyboard`, `navigator`,
  `viewport`, `inspect`, `focus`, `visibility`, and `static` all
  passed with zero failed requests, zero console/page errors, and confirmed
  server cleanup. Scoped whitespace validation passed.
- Accepted SHA-256: HTML
  `910b4d14a07a90c4afff97c3189300f3cea3e2c588b9b162054d61077b0f5e95`;
  validator
  `b1c8f976d7cc8d585e5df017b15c9e97dc565a821d6d58244cb02a9bcaca29cb`.
- Claim ceiling: local candidate surface behavior in the named browser harness,
  not broad accessibility certification, release, deployment, or production
  readiness.
