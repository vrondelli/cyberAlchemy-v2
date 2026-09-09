# Intent-schema experiment implementation layering

Status: planned; private; no schema promotion effect.

## Global decision boundaries

| Layer | Decision it must unlock | Required evidence | Promotion criterion | Deferred work |
|---|---|---|---|---|
| L0 — mechanics witness | Can the candidate row shapes and invariants distinguish a known pass from a known failure? | Two JSON schemas, deterministic JSONL validator, passing fixture, failing fixture, command receipt. | `g4-evidence-mechanics` passes with unchanged shape/semantic boundary. | General schema library, external package, broad fixture suite. |
| L1 — one live corpus | Can one frozen 12+3 local corpus be populated, held out, validated, and reduced without defaults or mid-run schema repair? | Manifest, JSONL, metrics, result, terminal Task Session receipt. | `g5-live-population` passes; result is eligible for owner review. | Repeated corpora, independent annotators, statistical reliability. |
| L2 — local selection/governance | Which candidate fields should be retained, revised, split, rejected, or left unresolved? | L1 field evidence cards, CAV2-D39/D56 source, failure consequences, operator + owner approval. | `g6-schema-selection` records a local revisable decision and residue. | Canonical definition/schema amendment and promotion. |
| L3 — repeatable harness/productization | Should the experiment become a reusable governed capability? | Multiple witnessed runs, stable owner demand, version/migration policy, observability, packaging evidence. | Separate lifecycle owner admits a reusable capability. | Entirely outside this dispatch. |

Layer movement is evidence-gated. A validator pass cannot promote L0 to L2;
population frequency cannot select fields; a local selection cannot promote a
canonical CAV2 schema.

## Active layer window

This plan executes L1 only after L0 is supplied by dispatch step
`s5-evidence-mechanics`. It then stops at the L2 human decision gate. L3 remains
explicitly deferred.

## Dependency and rollback

- L0 artifacts are immutable inputs to the L1 run and are hash-pinned in the
  terminal receipt.
- A drifted protocol/schema/validator or source manifest blocks L1 and requires a
  new run ID; it is not repaired in place.
- L1 writes are append/new-artifact only under the run directory plus its receipt.
- The experiment is reversible by superseding the candidate run; it mutates no
  source/canonical/public artifact.

## Technique trace

`sequence` orders L0→L1→L2; `scu_swu_reduction` selects one complete live run;
`recomposition_proof` requires that its result answer the experiment decision;
`validation_loop` binds fixtures and live rows; `owner_boundary_check` reserves
selection/promotion; `residue_ledger` preserves unresolved values; and
`execution_receipt_handoff` defines the Task Session result.
