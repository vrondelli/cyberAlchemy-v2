# Implementation Plan

## Objective

Add a deterministic feature-scoped route that generates and runs every
Financial Settlement structural node/edge test while preserving honest
behavioral gaps and complete-profile regression guarantees.

## Delivery Boundary

Included:

- `declared-subset` development coverage mode;
- source-backed Financial Settlement projection;
- collecting node/edge validation;
- exact catalogue/TestCase materialization;
- runnable Vitest emission and CLI;
- focused and full engine regression.

Excluded:

- source correction for failing Financial Settlement relationships;
- new business oracles for the 67 behavioral gaps;
- production/admission/lifecycle work;
- changes outside `projects/domainspec-v2/impl` except the generated development
  test artifact if explicitly selected during execution.

## Implementation Details

### Task 1 — Declared-Subset Coverage Mode

Inputs:

- `DevelopmentProject`
- the canonical 13-kind and 16-family allowed sets
- existing complete-profile fixture

Algorithm:

1. Add an explicit `coverage_mode` discriminator with
   `complete-profile | declared-subset`.
2. Default omitted mode to `complete-profile` for compatibility.
3. In complete-profile mode, retain exact 13/16 membership checks.
4. In declared-subset mode, require non-empty node membership, require every
   kind/family to belong to the canonical allowed set, and bind the exact
   declared sets into the build receipt.
5. Include coverage mode and declared-set digests in replay comparison.
6. Add a valid small subset fixture and negative unknown/empty subset fixtures.

Failure modes:

- accidental default change;
- empty subset accepted;
- extra kind/family accepted;
- replay ignores coverage-mode or declared-set mutation.

### Task 2 — Collecting Instance Validation

Inputs:

- projected node/edge records;
- formation rules and relationship contracts.

Algorithm:

1. Extract pure `validateDevelopmentNode` and `validateDevelopmentEdge`
   evaluators from the throwing compiler.
2. Return stable ordered diagnostics with subject ID, criterion/family, source
   anchor, and code.
3. Keep `compileDevelopmentProject` fail-closed by throwing the first ordered
   diagnostic.
4. Let feature generation call the collecting evaluators before build
   aggregation.
5. Change node-instance execution to evaluate complete body formation, not only
   kind equality.
6. Change edge-instance execution to evaluate endpoint existence, endpoint
   kinds, scope, direction, and order, not only family equality.
7. Add body and edge-contract mutants proving each instance test can go red.

Failure modes:

- compile and collecting paths disagree;
- one invalid row prevents other tests from materializing;
- per-instance tests merely repeat receipt status.

### Task 3 — Financial Settlement Projector

Inputs:

- `validation/poker-team/docs/features/financial-settlement/SPEC.md`;
- linked aspect documents;
- the feature directory containment root.

Algorithm:

1. Parse `Concepts` or `Concept Registry`; accept only explicit header aliases.
2. Normalize linked concept label, stable ID, backend kind, and source anchor.
3. Parse Feature Concept Graph; accept `Evidence` or `Source Evidence`.
4. Resolve every link/evidence anchor inside the feature root.
5. Project kind-specific formation bodies from anchored tables/prose using
   explicit adapters; never fill a missing fact merely from the kind label.
6. Project one stable edge per graph row.
7. Emit projection diagnostics without dropping valid sibling rows.
8. Assert the source snapshot census: 10 nodes, 9 kinds, 7 edges, 6 families.
9. Preserve the current `maps -> SettlementResult` incompatibility as a
   generated structural red.

Failure modes:

- helper parser nodes accidentally enter root membership;
- registry/aspect kind disagreement is silently resolved;
- path or anchor escapes the feature root;
- graph rows disappear after one invalid row.

### Task 4 — Runnable Structural Emitter And CLI

Inputs:

- projected project and diagnostics;
- exact catalogues, TestCases, and execution results.

Algorithm:

1. Materialize all six catalogues from declared membership even when individual
   source instances are red.
2. Render one Vitest `it` per structural TestCase; do not emit structural
   `todo` or `skip`.
3. Give each case a stable coverage key and source anchor.
4. Make the test body independently invoke the relevant node/edge evaluator.
5. Emit a JSON report separating generated, passed, failed, and behavioral-gap
   counts.
6. Add a CLI accepting feature directory and output path; reject undeclared
   writes and non-contained output paths.
7. Prove two invocations are byte-identical.
8. Run the generated suite and the full engine suite.

Expected Financial Settlement report:

- 52 structural tests generated;
- no missing structural member;
- current invalid relationship reported as red;
- behavioral report still records 79 total, 12 assertions, 1 property, and 67
  coverage gaps.

## Validation Strategy

| Slice | Validation |
| --- | --- |
| Subset mode | Focused mode/replay tests plus unchanged complete-profile tests |
| Instance validation | Node/edge mutant tests and compile/collector parity |
| Projection | Exact 10/9/7/6 census, containment, missing-anchor, and row-preservation tests |
| Emission | TypeScript transpilation, Vitest execution, byte stability, exact coverage keys |
| Closure | `npm run verify:bte`, full `engine:test`, targeted strict TypeScript check |
