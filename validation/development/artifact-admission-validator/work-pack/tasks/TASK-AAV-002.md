# TASK-AAV-002: Policy Loader And Two-Phase Evaluator

## Objective

Implement the deterministic core that consumes the L0 contract and live CAV2
policy sources without creating a shadow authority registry.

## Layer And Slice

- Layers: L0-L1
- Slice: S-AAV-1
- Wave: W1

## Source Contracts

- [Shared context](../shared/context.md)
- [Traceability](../shared/traceability.md)
- TASK-AAV-001 receipts

## Dependencies

TASK-AAV-001 complete.

## Implementation Detail

### Strict Canonical Kinds loader

1. Read `ontology/canonical-kinds/CANONICAL-KINDS.md` from the resolved repository root.
2. Locate exactly one `## Enumeration` section.
3. Select the first Markdown table before the next level-2 heading.
4. Parse rows with one dedicated escaped-pipe-aware table parser.
5. Build a normalized header map and require `Canonical kind`, `Process`,
   `Authority kind`, and `Durability` columns.
6. Strip presentation markup only through named normalization functions; retain
   raw row evidence in receipts.
7. Reject empty/duplicate kind IDs, missing cells, unknown durability, duplicate
   headers, or absent section/table.
8. Return a policy map plus source path and SHA-256 digest.

The unresolved `axiom` authority kind remains a loaded row with an unresolved
marker; a canonical axiom admission returns `defer`, not a guessed rollup.

### Evaluator

1. Parse and structurally validate the admission JSON.
2. Resolve target paths beneath the repository root using normalized paths and
   existing-parent resolution; reject traversal and symlink-parent escape.
3. Resolve `inherits_from` records with cycle detection and bounded depth.
4. Evaluate classification rules and forbidden claims.
5. For canonical records, compare kind membership, exact normalized process,
   authority-kind rollup, default durability, and authority state.
6. Require a promotion/decision reference for promoted or demoted authority.
7. Treat durability overrides according to G-AAV-003.
8. In `pre`, do not require planned targets to exist; require existing owner surface.
9. In `post`, require targets, parent entrypoint, and record linkage to exist.
10. Invoke selector checks for durable areas and load-bearing trees.
11. Aggregate checks by declared precedence and emit deterministic receipts.

### CLI

Planned interface:

```text
python3 cyberAlchemy-v2/validation/artifact-admission/validate_artifact_admission.py \
  --repo-root <path> --phase pre|post --record <admission.json> \
  --format text|json
```

No command mutates target files or authority surfaces.

## Smallest Working Units

### SWU-AAV-003

- Goal: implement the strict Canonical Kinds loader and tests.
- Source anchors: Canonical Kinds `Enumeration`/`Rules` and [shared context](../shared/context.md).
- Related context: [G-AAV-002](../shared/cross-task-gaps.md) and parser decision.
- Dependencies: SWU-AAV-001.
- Write scope: policy module and policy-loader tests only.
- Done criteria: valid table yields unique policy rows and malformed variants fail closed with stable error IDs.
- Acceptance evidence: tests for reordered columns, missing table, duplicate kind, malformed row, unresolved axiom, and source digest.
- Verification: targeted Python unittest module.
- Execution owner: local-fallback.
- Handoff note: do not create JSON/YAML Canonical Kinds authority; parse the current source directly.

### SWU-AAV-004

- Goal: implement model validation, inheritance, path containment, canonical checks, phases, aggregation, and CLI.
- Source anchors: C18, C7, C14, D51, D52, and [shared context](../shared/context.md).
- Related context: [cross-task decisions](../shared/cross-task-decisions.md).
- Dependencies: SWU-AAV-002 and SWU-AAV-003.
- Write scope: validator package modules, entry script, and focused tests.
- Done criteria: every L0 fixture returns expected verdict/exit/check IDs; pre/post behavior differs only where specified.
- Acceptance evidence: unit and CLI test receipts with policy digest.
- Verification: full validator unittest suite.
- Execution owner: local-fallback.
- Handoff note: fail closed on policy/tool errors; never coerce unresolved authority into pass.

## Edge Cases And Failures

- Missing registry is tool error, not block and not empty-policy pass.
- Nonexistent target is allowed only in pre phase.
- Existing symlink parents must resolve inside the repo boundary.
- Inheritance cycles and missing parent admission records block.
- Canonical process comparison must expose raw and normalized values on mismatch.
- `authority_state: candidate` is not promoted authority.

## Blocker And Gap State

G-AAV-002 requires a strict source parser. G-AAV-003 forces durability overrides
to block or defer. Neither prevents default-kind evaluation after W0 passes.

## Synchronization

Record source digests and fixture receipts in the work-pack before W2 begins.
