---
task_id: TASK-UIF-CANDIDATES
feature_code: UIF
layer: L2
status: completed
gate_status: completed
updatedAt: 2026-07-11
---

# TASK-UIF-CANDIDATES: Harden Surviving Candidates

## Objective

Turn only adjudicated survivors into complete candidate human/machine twins and
prove schema, validator, fixture, and generated-instance agreement.

## SWU-UIF-008 - Candidate twins and fixtures

- Dependencies: UIF-007.
- Source anchors: verdict matrix survivor rows, existing schema/card examples,
  `SPEC.md#Artifact Contract`.
- Related context: formalism and non-collapse findings.
- Write scope: `candidate-meta-types/ui/` and survivor fixture/test paths.
- Algorithm: author card and `.schema.yml`; encode only bounded witnesses;
  create positive, malformed, and neighbor fixtures; add correction contract;
  add black-box test; rerun cross-type pair.
- Edge cases: unsupported semantic criterion becomes residue; no placeholder
  schema to satisfy counts.
- Done: artifact census exactly matches survivor list.
- Acceptance: all three fixture classes discriminate and cards agree with
  schemas.
- Validation: candidate content tests and schema/YAML parse.
- Execution owner: subagent, one disjoint type path per worker if approved.
- Handoff: shared validator changes are deferred to UIF-009.

## SWU-UIF-009 - Bounded validator rules and instance round trip

- Dependencies: UIF-008.
- Source anchors: survivor schemas, current `validate-content` and `instances`
  rule implementations, `EXPERIMENTS.md#E5`.
- Related context: total rule-class map and public/private boundary findings.
- Write scope: experiment harness validator support and candidate instance tests;
  no canonical validator mutation unless separately owner-approved.
- Algorithm: inventory rule kinds; reuse existing kinds; specify each new rule's
  inputs/output/table walk; implement centrally; make classification total;
  generate example; validate; mutate separating field; require rejection.
- Edge cases: unknown rule blocks; semantic inference reroutes; shared helper
  changes are serialized.
- Done: all survivor instances round-trip and targeted mutations reject.
- Acceptance: rule map is total and every new rule has black-box tests.
- Validation: focused tools tests plus candidate instance generate/validate.
- Execution owner: local-fallback.
- Handoff: return rule gaps to validation governance.
