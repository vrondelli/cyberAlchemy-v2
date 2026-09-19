# TASK-UOC-001 — Unified Projection

- SWU: `SWU-UOC-001`
- Primary behavior: normalize the complete source bundle into one immutable
  graph with stable IDs, explicit bridges/gaps, indexes, graph digest, and exact
  fixture/evaluation/constraint-origin profile fields.
- Independent acceptance: all source families/profiles present, zero dangling or
  duplicate IDs, reciprocal alignments agree, name-only bridges rejected,
  TypeScript facts/findings cannot activate under Python/Rust emphasis.
- Split analysis: per-family loaders cannot prove cross-family closure; layout and
  rendering are independently useful and remain 002+.
- Dependencies: none.
- Source anchors:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/MAPPINGS.md#presentation-mappings`;
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/ARCHITECTURE.md#unified-graph-contract`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/base-domain.profile.json`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/python-strict.profile.json`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/rust-strict.profile.json`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/typescript-observed-facts.json`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/typescript-evaluation.expected.json`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`
  symbols `buildMetaTypeGraph`, `buildTypeGraph`, `buildProfileGraph`,
  `buildFactsGraph`, `buildFindingsGraph`, and `buildGraph`.
- Related context: `work-pack/shared/context.md`.
- Product write scope:
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/unified-canvas-model.mjs`;
  `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-model.mjs`.
- Task Session receipt write scope:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/work-pack/results/SWU-UOC-001-RESULT.md`.
- Lifecycle receipt:
  `projects/domainspec-v2/development/implementation-conformance/unified-ontology-canvas/closeout/SWU-UOC-001-REFRESH-RECEIPT.json`.
- Done criteria: pure `.mjs` export; no DOM/browser globals; deterministic digest;
  explicit diagnostics; all planned positive/negative assertions pass; source
  JSON bytes unchanged.
- Failure posture: any invalid source/bridge/provenance blocks and emits a typed
  diagnostic; never return a partial graph as complete.
- Exact validation: `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-unified-canvas-model.mjs --mode projection`
  and `node projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs`.
- Acceptance evidence: exact command/stdout/exit, source and output digests,
  changed paths, blockers, residue in the Task Session result.
- Execution owner: Task Session local implementation.
- Handoff: stop after Refresh; 002 becomes eligible, not selected.
