# SWU-UOC-008 Result — PASS

- Task Session: `TS-UOC-008-20260802T142034-0300`.
- Mutation admission: `admit`; material package and receipt passed exact owner,
  dependency, patch, and publication-boundary checks.
- Product: one `reduceViewportTransform` contract now owns bounded pan, zoom,
  fit-all, fit-selection, and reset. Pointer drag begins only on canvas
  background, while wheel zoom requires explicit focus on the canvas viewport.
- Acceptance: all transform numbers remained finite; scale clamped at `0.5..4`;
  fit-all was `{x:0,y:0,width:1790,height:5450,scale:1}`; fit-selection was
  distinct at scale `1.078`; `meta:DS-D1.7` survived every operation; reset was
  byte-equivalent on replay; outside wheel was not prevented and active-canvas
  wheel was prevented without page-scroll change.
- Live browser validation: `viewport`, `inspect`, `focus`, `visibility`, and
  `static` all returned `verdict: pass` with 95 nodes, 147 edges, five bands,
  zero external/failed requests, zero console/page errors, and server cleanup.
- Accepted product SHA-256: HTML
  `b82faadd05d4906a4031dc8bccb06ba2332cd40c36dab4ccee7df9c59972ea64`;
  browser validator
  `4cb53ed46f4d5fc8248d2ba3c12e434173c007ef06813caa825536f875b7b40f`.
- Claim ceiling: local candidate viewport behavior for the supplied graph only;
  no broad usability/accessibility, ontology admission, release, deployment, or
  production claim.
