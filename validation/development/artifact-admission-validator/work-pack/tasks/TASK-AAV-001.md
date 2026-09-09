# TASK-AAV-001: Admission Contract And Verdict Fixtures

## Objective

Define the machine input/output contract for C18 before implementation commits to
repository parsing or path behavior.

## Layer And Slice

- Layer: L0
- Slice: S-AAV-0
- Wave: W0

## Source Contracts

- [Shared context](../shared/context.md)
- [Cross-task decisions](../shared/cross-task-decisions.md)
- [Work-pack](../../WORK-PACK.md)

## Dependencies

None. This is the first execution task.

## Implementation Detail

### Admission record

Use JSON Schema Draft 2020-12 as a documentary and fixture contract. Required for
all records: `schema_version`, `admission_id`, `classification`, `phase`,
`targets`, `owner_surface`, `rule_refs`, and `record_location`.

Conditional rules:

- `working`: permit `inherits_from`; forbid canonical metadata, durability,
  authority claims, `new_repository_area: true`, and `load_bearing: true`.
- `governed`: require intent, parent entrypoint, provenance/source boundary,
  canonical posture, validation surface, residue list, and next/challenge/drift route.
- canonical posture `canonical`: require D51 fields and promotion reference when
  authority state is `promoted` or `demoted`.
- canonical posture `non-canonical`: forbid D52 durability assignment.
- load-bearing tree: require the D42/C14 tree interface object.
- durable area: require a C7 area contract and planned/existing entrypoint.

### Receipt

Define a stable receipt with `run_id`, `record`, `phase`, `verdict`, `exit_code`,
`checks`, `policy_sources`, `targets`, `blockers`, `flags`, `deferrals`, and
`residue`. Every check has a stable ID, rule ref, result, evidence, and message.

### Exit and aggregation contract

- tool/input error: exit 2, outside policy verdict aggregation;
- block: exit 1;
- defer: exit 4;
- flag: exit 3;
- pass: exit 0.

Aggregate policy checks by `block > defer > flag > pass`.

## Smallest Working Units

### SWU-AAV-001

- Goal: write the admission schema, working/governed examples, receipt schema, and README contract.
- Source anchors: C18, D51, D52, and [shared context](../shared/context.md).
- Related context: [cross-task decisions](../shared/cross-task-decisions.md).
- Dependencies: none.
- Write scope: `cyberAlchemy-v2/validation/artifact-admission/{README.md,admission-record.schema.json,admission-record.example.json,receipt.schema.json}`.
- Done criteria: all JSON parses; conditional fields map to C18/D51/D52; examples contain no invented authority semantics.
- Acceptance evidence: schema parse output and review table mapping each field to a source rule.
- Verification: `python3 -m json.tool` for each JSON file plus a focused contract review.
- Execution owner: local-fallback.
- Handoff note: read C18, D51, D52 and shared decisions; do not implement CLI or policy parser.

### SWU-AAV-002

- Goal: add the expected-verdict fixture manifest and minimum pass/flag/block/defer records.
- Source anchors: C18 verdict semantics and [shared context](../shared/context.md).
- Related context: [traceability](../shared/traceability.md).
- Dependencies: SWU-AAV-001 pass receipt.
- Write scope: `cyberAlchemy-v2/validation/artifact-admission/fixtures/` and initial tests only.
- Done criteria: exact cases cover working inheritance, governed canonical pass, draft residue flag, unknown owner defer, and false canonical claim block.
- Acceptance evidence: fixture manifest with expected verdict, exit code, and required check IDs.
- Verification: fixture JSON parse and manifest referential-integrity test.
- Execution owner: local-fallback.
- Handoff note: fixtures express source rules; they must not compensate for schema ambiguity with prose-only expectations.

## Edge Cases And Failures

- Duplicate admission IDs are a post-L0 concern but must be representable in receipts.
- Empty target arrays, absolute paths, and `..` escapes are invalid input.
- A working child that overrides role/kind/authority cannot inherit silently.
- Schema success alone is not a policy pass; later evaluator checks remain required.

## Blocker And Gap State

No blocker affects SWU-AAV-001. G-AAV-001 limits authority claims but does not
prevent candidate schema work. SWU-AAV-002 waits for the schema receipt.

## Synchronization

After each SWU, append its receipt to WORK-PACK evidence and select the next SWU
only if dependencies pass.
