---
task_id: TASK-UIF-BASELINE
feature_code: UIF
layer: L0
status: completed
gate_status: completed
updatedAt: 2026-07-11
---

# TASK-UIF-BASELINE: Prove The Experiment Method

## Objective

Freeze falsifiable hypotheses and prove that one protocol can represent both a
plausible surviving distinction and a plausible collapse without changing rules
after results are observed.

## Source Contracts

- [Specification](../../SPEC.md)
- [Architecture](../../ARCHITECTURE.md)
- [Experiment plan](../../EXPERIMENTS.md)
- [Shared context](../shared/context.md)
- [UI11 attack evidence](../../../ds-d1-improvement-plan/reviews/2026-07-10-ui11-metatype-review/attacks.md)

## Algorithm

1. Build one hypothesis row per UI label with neighbors, witnesses, forbidden
   shortcuts, outcomes, and correction route.
2. Freeze the experiment/result schema and corpus provenance schema.
3. Build E0 fixtures for Form/Component and Adapter/Mapping.
4. Register expected results before execution.
5. Run E0 twice under one protocol version.
6. Compare outputs byte-for-meaning: verdict, reason class, evidence refs, and
   residue must agree.
7. Stop or version-and-rerun if the protocol cannot represent both survival and
   collapse outcomes.

## Smallest Working Units

### SWU-UIF-001 - Freeze hypothesis matrix

- Dependencies: none.
- Source anchors: `SPEC.md#Candidate Set`, `EXPERIMENTS.md#Per-Type Tension Matrix`.
- Related context: UI11 attack tables and non-collapse findings.
- Write scope: candidate matrix and decision-ledger artifacts under this
  development package only.
- Done: all 11 labels have hypothesis, neighbors, allowed witnesses, forbidden
  shortcuts, possible outcomes, and correction route.
- Acceptance: coverage count is 11; no row claims authority.
- Validation: manual matrix review and `git diff --check`.
- Execution owner: local-fallback.
- Handoff: return uncovered hypotheses as residue; do not invent semantic proof.

### SWU-UIF-002 - Freeze corpus and E0 fixtures

- Dependencies: UIF-001.
- Source anchors: `EXPERIMENTS.md#Corpus Contract`, `#Result Contract`, `#E0`.
- Related context: existing backend Mapping schema/card convention.
- Write scope: experiment manifest, corpus manifest, result schema, and E0
  fixture directories.
- Done: expected E0 outcomes and provenance are frozen before execution.
- Acceptance: YAML parses; both pairs have positive, malformed, and neighbor
  fixtures; synthetic/real provenance is explicit.
- Validation: YAML parse and fixture census.
- Execution owner: local-fallback.
- Handoff: flag missing real specimens; synthetic E0 may prove method only.

### SWU-UIF-003 - Run counterbalanced E0

- Dependencies: UIF-002.
- Source anchors: frozen E0 manifest and `EXPERIMENTS.md#Acceptance Thresholds`.
- Related context: current validator CLI/test idiom.
- Write scope: E0 prototype runner and E0 result paths only.
- Done: two identical reruns produce reviewable outcomes for both pairs.
- Acceptance: same protocol can represent a survival candidate and a collapse
  candidate; rules are not edited between lanes.
- Validation: focused experiment command twice plus result parse.
- Execution owner: subagent.
- Handoff: protocol failure blocks W1; return exact mismatch and repair route.

## Synchronization

Advance W1 only from a receipt proving E0 passed or from a versioned protocol
repair that invalidated and reran all E0 evidence.

## Execution Evidence

### SWU-UIF-001 - completed 2026-07-11

- Context: [CONTEXT-PACK.md](../../runs/SWU-UIF-001/CONTEXT-PACK.md)
- Candidate matrix: [CANDIDATE-HYPOTHESIS-MATRIX.md](../../baseline/CANDIDATE-HYPOTHESIS-MATRIX.md)
- Decision ledger: [DECISION-LEDGER.md](../../baseline/DECISION-LEDGER.md)
- Receipt: [TASK-SESSION-RESULT.md](../../runs/SWU-UIF-001/TASK-SESSION-RESULT.md)
- Validation: 11 unique rows (`DS-D1.15..25`), nine required columns,
  frontmatter/link/docs checks pass, no authority mutation.
- Next ready unit: `SWU-UIF-002`.

### SWU-UIF-002 - completed 2026-07-11

- Context: [CONTEXT-PACK.md](../../runs/SWU-UIF-002/CONTEXT-PACK.md)
- Protocol: [protocol.yml](../../experiments/protocol.yml)
- Corpus: [corpus.yml](../../experiments/corpus.yml)
- Result contract: [result.schema.yml](../../experiments/result.schema.yml)
- Fixtures: `experiments/fixtures/e0-form-component/` and
  `experiments/fixtures/e0-adapter-mapping/` (six total).
- Decision ledger: [DECISION-LEDGER.md](../../baseline/DECISION-LEDGER.md#swu-uif-002-decisions)
- Receipt: [TASK-SESSION-RESULT.md](../../runs/SWU-UIF-002/TASK-SESSION-RESULT.md)
- Validation: YAML/frontmatter parse, two-pair/six-fixture census, role and
  path cross-check, expectation freeze, promotion boundary, links/docs checks.
- Residue: corpus is synthetic-only and cannot support promotion-ready claims.
- Next ready unit: `SWU-UIF-003`.

### SWU-UIF-003 - completed 2026-07-11

- Context: [CONTEXT-PACK.md](../../runs/SWU-UIF-003/CONTEXT-PACK.md)
- Runner: [e0_runner.py](../../experiments/e0_runner.py)
- Run 1: `experiments/results/e0/run-1/`
- Run 2: `experiments/results/e0/run-2/`
- Final comparison: [comparison.yml](../../experiments/results/e0/final/comparison.yml)
- Human summary: [SUMMARY.md](../../experiments/results/e0/final/SUMMARY.md)
- Receipt: [TASK-SESSION-RESULT.md](../../runs/SWU-UIF-003/TASK-SESSION-RESULT.md)
- Validation: run directories are identical; final records satisfy the result
  contract; method outcomes match preregistration; provisional outcomes remain
  `not-adjudicated`; promotion remains false.
- Runtime: labeled local fallback; no subagents spawned.
- Recovery: an initial output path resolved to package-root `results/`; those
  generated files were discarded and the complete two-run sequence was rerun
  under `experiments/results/e0/` without protocol or fixture changes.
- Next ready units: `SWU-UIF-004`, `SWU-UIF-005`, and `SWU-UIF-006`.
