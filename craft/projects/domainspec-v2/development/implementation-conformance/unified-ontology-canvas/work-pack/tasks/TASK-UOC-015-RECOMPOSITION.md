# TASK-UOC-015 — Composed Browser Journey

- SWU: `SWU-UOC-015`
- Primary behavior: add and run one end-to-end browser journey over all accepted
  behaviors without changing product HTML.
- Independent acceptance: load -> Rule trace -> profile emphasis/no-evaluation ->
  inspect -> navigator -> canvas keyboard -> viewport -> popovers -> responsive ->
  reduced motion -> non-color; zero external requests/errors; visible claim ceiling.
- Split analysis: assertions form one recomposition proof; unit modes already own
  independent behaviors.
- Dependencies: closed 014 receipt.
- Source anchors:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/ARCHITECTURE.md#significant-behavior-scenario`;
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/UX-PLAN.md#acceptance-signals`.
- Product write scope:
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs` only.
- Task Session receipt write scope: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-015-RESULT.md`.
- Lifecycle receipt: `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/closeout/SWU-UOC-015-REFRESH-RECEIPT.json`.
- Done criteria: `journey` mode composes all prior selectors/actions and reruns
  model/layout/ontology validators; no HTML/source JSON changes.
- Failure posture: any unit regression, external request, error, cleanup failure,
  provenance/authority wording mismatch blocks.
- Exact validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-browser.mjs --mode journey`.
- Acceptance evidence: full step/assertion trace, environment binding, request and
  error audit, server cleanup.
- Execution owner: Task Session local validation implementation.
- Handoff: stop after Refresh; product-read-only VERIFY becomes eligible.
