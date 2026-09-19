---
artifact_id: CDSC2-THREE-LAYER-PROTOCOL-v0.1
status: proposed
decision_source: DEC-CDSC2-009
---

# Three-Layer F3 Adjudication Protocol

## Purpose

Represent what was believed before mutation, what the mutations observed, and
how frozen explanations are judged afterward without rewriting history or
forcing two substitution outcomes into one matrix coordinate.

## Layer 1: Pre-Observation Baseline

Authority: the immutable generation-1 F3 receipt.

The layer contributes:

- frozen `G`, `A`, `Q`, `sigma_matrix`, `S`, `D`, `U`, and reviewers;
- the parent record and generation handles;
- preregistered permitted and breaking substitution descriptions/predictions;
- historical `Q-06`, which truthfully records that mutation observations were
  absent in generation 1.

Generation 2 references this receipt by handle. It never copies and edits it.

## Layer 2: Mutation Observations

Authority: the immutable M1 and M2 observation receipts.

The layer contributes only:

- mutation identity and kind;
- frozen prediction and observed consequence;
- total vector outputs and comparison states;
- supported, refuted, or indeterminate observation state;
- bounded uncertainty and prohibited inferences.

Observation receipts do not decide which explanation accounts for an outcome.

## Layer 3: Adjudication Overlay

Authority: a new `cdsc.adjudication-overlay.v1` envelope.

Required semantic fields:

```yaml
fixture_id: F3
baseline_receipt_handle: record:sha256:<digest>
baseline_generation_id: generation:sha256:<digest>
observation_bindings:
  - substitution_kind: permitted
    substitution_id: F3-S-PERMITTED
    mutation_id: M1
    observation_receipt_handle: record:sha256:<digest>
  - substitution_kind: breaking
    substitution_id: F3-S-BREAKING
    mutation_id: M2
    observation_receipt_handle: record:sha256:<digest>
adjudication_matrix:
  - explanation_id: A-01
    substitution_id: F3-S-PERMITTED
    state: explained | not-explained | indeterminate
    evidence_handles: [record:sha256:<digest>]
    rationale: <bounded rationale>
    review_state: approved | disputed
usefulness_adjudication:
  state: retained | revised | indeterminate
  deterministic: <boolean>
  nonzero: <boolean>
  rationale: <bounded rationale>
  evidence_handles: [<stable handles>]
uncertainty_resolutions:
  - parent_uncertainty_id: F3-U-01
    state: resolved | retained | disputed
    evidence_handles: [record:sha256:<digest>]
    rationale: <bounded rationale>
carried_uncertainty:
  - uncertainty_id: <stable id>
    state: missing | disputed | untested | non-portable
    statement: <bounded statement>
reviewers:
  - reviewer_id: <stable id>
    state: approved | disputed
```

The matrix must be total over `parent.A x {parent.S.permitted,
parent.S.breaking}`. It may not contain a new explanation or a combined
permitted/breaking coordinate.

## Adjudication Rule

For each explanation/substitution coordinate:

1. Take the target proposition only from the parent substitution description
   and prediction.
2. Bind the corresponding frozen observation receipt by exact handle.
3. Mark `explained` only when the unchanged explanation statement accounts for
   the full preregistered consequence and the observation supports it.
4. Mark `not-explained` when the explanation does not account for the full
   consequence, even if it describes nearby structure.
5. Mark `indeterminate` when coverage is partial, evidence conflicts, or a
   reviewer disputes the judgment.
6. Never use the desired fixture/suite verdict as evidence.

## Deterministic Compatibility Projection

The frozen v1 evaluator remains unchanged. A new materializer derives one
`cdsc.evidence-receipt.v1` compatibility receipt from the three layers:

- copy parent `G` and `A` byte-for-byte;
- copy parent `Q-01` through `Q-05` and their matrix cells byte-for-byte;
- do not copy historical absence coordinate `Q-06` into the current evaluation
  view;
- derive evaluation `Q-06` from parent `S.permitted.description/prediction`;
- derive evaluation `Q-07` from parent `S.breaking.description/prediction`;
- map overlay permitted cells to `Q-06` and breaking cells to `Q-07`;
- derive `S` observation states from M1/M2 receipts while preserving parent
  descriptions, predictions, and selectors;
- derive `D` only from the overlay usefulness adjudication;
- remove parent substitution uncertainties only when an approved overlay
  resolution cites the matching observation handle;
- carry all unresolved and non-portable uncertainty forward;
- set input handles to the parent receipt, M1, M2, and overlay record IDs;
- retain every required prohibited inference.

The materializer must produce identical semantic bytes and record handle on
repeated runs. The compatibility receipt is an evaluation projection, not a new
interpretive baseline or authority artifact.

## Failure Policy

Block materialization or evaluation on:

- parent, observation, or overlay handle mismatch;
- changed parent explanations or substitution predictions;
- missing, duplicate, combined, or extra matrix coordinates;
- observation binding M1 to breaking or M2 to permitted;
- rationale or target proposition derived from an observed outcome;
- partial coverage marked `explained`;
- unresolved/disputed cells hidden as complete;
- dropped uncertainty or prohibited inference;
- nondeterministic compatibility bytes;
- any generation-1 mutation.

## Authority Boundary

The protocol can produce a total calibration outcome. It cannot establish a
Page kind, compound DS-D1 type, DS-D8 relationship, architecture pattern,
cross-domain portability, candidate admission, activation, or promotion.
