# SWU-OEW-004 Attempt 002 Context Pack

Status: strict coverage pass
Mode: Context Builder standard
Artifact class: private session evidence

## Objective

Create and independently verify one immutable, deterministic Poker Team O13
adapter run containing an Understand-Anything-compatible `KnowledgeGraph`, a
lossless exact-evidence sidecar, and a terminal receipt written last.

## Obligations

| ID | Obligation | Controlling evidence | Status |
| --- | --- | --- | --- |
| O1 | add the approved `verify:adapter` package entrypoint within the ten-target inventory | option-A Refresh; manifest | covered |
| O2 | canonicalize JSON deterministically and reject unsupported values | task algorithm; OEW-V-03 | covered |
| O3 | compose the existing total node and edge projections into the pinned UA `KnowledgeGraph` root shape | pinned UA types; projectors | covered |
| O4 | preserve exact source kinds, relations, policy, diagnostics, grounding, evidence refs, digests, and authority ceiling in the sidecar | architecture; OEW-V-02/OEW-V-04 | covered |
| O5 | compare two independent in-memory builds byte-for-byte before persistence | task acceptance | covered |
| O6 | create only a new run directory, write graph then sidecar, hash them, and write receipt last | operations; adapter-writer contract | covered |
| O7 | independently verify containment, exact three-file inventory, schema/state, digests, total mapping, and authority ceiling | receipt ceiling; verifier boundary | covered |
| O8 | prove overwrite, partial, tamper, receipt-last, and two-build behavior | SWU acceptance | covered |
| O9 | modify exactly ten targets and preserve protected scopes | manifest; closeout contract | covered |
| O10 | emit a distinct resumed Task Session receipt and preserve the original block | option-A Refresh receipt | covered |

## Selected Evidence

- `planning/work-pack/swu-manifest.json` — SWU-004 inventory, validation, receipt.
- `planning/work-pack/tasks/TASK-OEW-ADAPTER-001.md` — algorithm and acceptance.
- `define/operations.md` — `projectForViewer` and failure order.
- `design/ARCHITECTURE.md` — adapter components and data contracts.
- `design/VALIDATION-CONTRACTS.md` — determinism, totality, authority, isolation.
- `design/UPSTREAM-BASELINE.md` — pinned UA commit and contract digests.
- `src/presentation-nodes.mjs` and `src/presentation-edges.mjs` — admitted
  projection behavior.
- `fixtures/poker-source-subset.json` — verified bounded Poker node witness.
- `SWU-OEW-003/receipt.json` — predecessor result and relation handle.
- `decision-gate/refresh-A/refresh-receipt.json` — option-A owner amendment.
- pinned upstream `types.ts`/`schema.ts` at commit
  `2cda14e89535049e49120198886bc0b82e9e630f` — root graph shape.

## Write Scope

Exactly the ten paths in the current SWU-OEW-004 manifest, including
`package.json`, six new code/schema/test files, and the three new generated run
files.

## Constraints

- Node 22 ESM and built-in modules only.
- Writer may import projectors; independent verifier may not import the writer
  or projectors.
- Output directory is create-only. Existing output is a hard failure.
- A directory without its receipt is incomplete and must fail verification.
- `authority_effect` remains `none` everywhere.
- Generated values are deterministic; no current clock or random identifier.
- Poker Team, IOLM, Craft, authority, ontology, Arcanum, and OCGP source bytes
  remain unchanged.
- No live implementation target is written before material and mutation
  admission pass.

## Validation

`npm test && npm run verify:adapter` from
`cyberAlchemy-v2/implementation/ontology-evidence-workbench`.

Strict coverage: **PASS**. Blockers: **0**.
