---
artifact_id: CONTEXT-UIR-010-v1
task: SWU-UIR-010
mode: standard
strict_coverage: block
session_evidence: true
created: 2026-07-11
---

# SWU-UIR-010 Context Pack

## Summary

- Receipts selected: SWU-UIR-001 through SWU-UIR-009.
- Mechanical validation status: pass.
- Acceptance-critical gate coverage: blocked; DEC-UIR-007 through DEC-UIR-010
  remain open.
- Runtime: local; no integrated audit mutation is authorized until the gates
  named by the task input contract are closed.

## Satisfied Inputs

- Contract kernel, rule parity, duplicate/conflict preflight, and immutable
  mutation evidence are complete.
- Reroute, corpus, relationship-packet, dossier, and orchestration generations
  are immutable and schema-valid.
- Repair package tests pass 44/44; DomainSpec tools pass 69/69; typecheck,
  aggregate validation, and engine lint pass.
- Candidate status, DS-D1, DS-D8, and prior UIF history remain unchanged.

## Blocking Inputs

| Gate | Owner | Missing closure | Blocks |
| --- | --- | --- | --- |
| DEC-UIR-007 | empirical-review owner | bounded absence and neutral observation vocabulary | absence audit and evidence-complete dossier claims |
| DEC-UIR-008 | empirical/DS-D1 owners | corpus/style threshold and reviewer policy | portability audit and evidence-complete dossier claims |
| DEC-UIR-009 | DS-D1 owner | Form/Action independent-positive disposition | independent-positive audit |
| DEC-UIR-010 | DS-D8 owner | digest-bound choices for four relationship questions | relationship closure and destination identity audit |

## Gate Verdict

SWU-UIR-010 is `BLOCK` before integrated audit mutation. Running only the
mechanical checks would be useful evidence, but it would not satisfy this SWU's
explicit input requirement for closed acceptance-critical gates. The package
must remain blocked rather than being called verified or promotion-ready by
approximation.

## Allowed Next Mutation

Only durable decision records for DEC-UIR-007 through DEC-UIR-010 may be added.
Integrated audit manifests/results resume after all four gate groups close.
