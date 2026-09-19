---
artifact_id: CONTEXT-UIR-013-v1
task: SWU-UIR-013
mode: standard
strict_coverage: pass
session_evidence: true
created: 2026-07-12
---

# SWU-UIR-013 Context Pack

## Objective

Convert DEC-UIR-008/009 into a typed immutable evaluation. Count portability
evidence separately for each current UI formation candidate, apply the fixed
2-corpus/2-style/2-independent-reviewer threshold, and record Form and Action
independent positives as `missing` without changing candidate status.

## Finite Candidate Scope

The accepted UIF replication matrix owns nine `candidate-schema-ready` rows:
`DS-D1.15` Page, `.16` Layout, `.17` Component, `.18` View Model, `.19` Hook,
`.20` Form, `.21` Action, `.22` Guard, and `.23` Binding. Adapter and State
Indicator are excluded because the same verdict matrix routes them to
merge/split dispositions rather than the nine-candidate replication route.

## Authority Order

1. `TASK-UIR-DOSSIER-POLICY.md`.
2. DEC-UIR-008 and DEC-UIR-009.
3. Accepted UIF verdict/replication matrices.
4. Corpus generations 001/002 and dossier generation 001.
5. Canonical envelope and immutable publisher conventions.

## Obligation Coverage

| ID | Required proof | Coverage |
| --- | --- | --- |
| O1 | Exactly nine current candidates receive rows | complete |
| O2 | Evidence is grouped per candidate and never pooled | complete |
| O3 | Threshold is fixed at 2 real corpora, 2 styles, 2 independent agreeing reviewers | complete |
| O4 | Corpus aliases and repeated authors cannot inflate counts | complete |
| O5 | Reviewer role duplication, non-independence, and disagreement cannot inflate counts | complete |
| O6 | Every row reports observed and required counts plus `pass` or `missing` | complete |
| O7 | Form and Action independent-positive state is exactly `missing` | complete |
| O8 | `fail`, `absent`, `collapsed`, `demoted`, and kill classifications reject | complete |
| O9 | Immutable replay and source-handle verification are testable | complete |

## Gate Verdict

`PASS`. The current evidence is intentionally below threshold, so missing new
corpora is an output fact, not a blocker to this evaluator. No candidate may
pass portability in this generation. Form and Action retain partial
correspondence handles but receive no independent-positive credit.

## Mutation Boundary

- `contracts/dossier-policy-evaluation.schema.yml`
- `evidence/dossier-policy-evaluation.mjs`
- `evidence/build-dossier-policy-generation.mjs`
- `fixtures/contracts/dossier-policy-*`
- `evidence/results/dossier-policy/generation-001/`
- `tests/dossier-policy-evaluation.test.mjs`
- SWU-UIR-013 run evidence and synchronized work-pack evidence

No corpus, dossier generation 001, candidate, DS-D1, or authority artifact may
be mutated.
