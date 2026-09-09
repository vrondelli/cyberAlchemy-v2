# TASK-OEW-CODE-CONTEXT-001 — Scoped Understand-Anything Code Context

Layer/wave: L2 / W2
Dependencies: G-OEW-L1
Human gate: exact source allowlist and model/provider/data handling must be
approved before analysis.

## Implementation Detail

The default scope is only
`cyberAlchemy-v2/implementation/ontology-candidate-graph-prototype/`. Generate or
consume a UA `.ua/knowledge-graph.json`, bind scope/commit/tool/provider and
digest, then accept only explicit evidence-code mappings. The UI adds a
removable code lane. Evidence graph bytes, grounding closure, dispositions, and
authority status must remain unchanged.

## Smallest Working Units

### SWU-OEW-015 — Admit One Scoped UA Code Graph

- Primary behavior: bind one explicitly approved UA analysis output to exact
  scope and provenance.
- Dependencies: 014 plus G-OEW-L2-SCOPE.
- Target inventory:
  - `.../contracts/code-context-receipt.schema.json`
  - `.../src/code-context-admission.mjs`
  - `.../test/code-context-admission.test.mjs`
  - `.../generated/code-context/ocgp/knowledge-graph.json`
  - `.../generated/code-context/ocgp/scope-receipt.json`
- Done: allowlisted scope, commit/tool/provider/mode, no unexpected path, graph
  schema, and digest pass; broader/stale/unbound graph fails.
- Validation: `npm run verify:code-context`.
- Expected handle: `oew-code-context-scope/v1`.
- Execution owner: manual scoped analysis plus Task Session verification.
- Split analysis: code graph provenance is independent of mapping and UI.
- Closeout: shared contract; receipt `session-evidence/SWU-OEW-015/receipt.json`.

### SWU-OEW-016 — Validate Explicit Evidence-to-Code Mappings

- Primary behavior: admit only reviewed mappings from exact evidence refs to
  code node IDs.
- Dependencies: 015.
- Target inventory:
  - `.../contracts/evidence-code-map.schema.json`
  - `.../src/evidence-code-map.mjs`
  - `.../fixtures/poker-evidence-code-map.json`
  - `.../test/evidence-code-map.test.mjs`
- Algorithm: validate namespaces/existence → reject implicit/duplicate/reverse
  authority → canonicalize mapping → bind evidence/code digests.
- Done: explicit Poker mappings pass; missing target, implicit inference, or
  authority-effecting mapping fails.
- Validation: `npm run test:evidence-code-map`.
- Expected handle: `oew-evidence-code-map/v1`.
- Split analysis: mapping semantics can pass without rendering.
- Closeout: shared contract; receipt `session-evidence/SWU-OEW-016/receipt.json`.

### SWU-OEW-017 — Render a Separate Non-Interfering Code Lane

- Primary behavior: show mapped code context while evidence-only state remains
  identical and independently usable.
- Dependencies: 016.
- Target inventory:
  - `.../upstream/overlay/packages/dashboard/src/oew/CodeContextLane.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/CodeContextLane.test.tsx`
  - `.../upstream/overlay/packages/dashboard/src/oew/code-context.css`
  - `.../test/code-context-noninterference.test.mjs`
- Done: lane is labeled/removable; toggling it changes no evidence digest,
  grounding path, disposition, authority state, or evidence-only snapshot.
- Validation: `npm run test:code-context-lane`.
- Expected handle: `oew-code-context-lane/v1`.
- Split analysis: rendered lane and non-interference form one optional UI
  behavior; scale/upgrade/package are later.
- Closeout: shared contract; receipt `session-evidence/SWU-OEW-017/receipt.json`.

## Open Questions

See [../../../define/SPEC.md](../../../define/SPEC.md#open-questions).
