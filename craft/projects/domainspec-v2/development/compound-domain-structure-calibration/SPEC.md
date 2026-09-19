---
artifact_id: CDSC-SPEC-v0.1
status: approved-planning-baseline
owner: DomainSpec v2 compound-domain-structure calibration development cycle
authority: development only
discovery_source: ../ui-meta-type-repair/research/2026-07-11-compound-domain-structures/findings.md
promotion_eligible: false
---

# Compound Domain Structure Calibration Specification

## Purpose

Build a candidate-only experiment that tests whether bounded aggregates leave
observable obligations after existing type, role, projection, relationship,
pattern, aggregation, sequencing, and named-instance explanations are applied.

This package calibrates a research method. It does not define a compound kind,
admit a DS-D1 type, alter DS-D8, or promote Page, Layout, Component, Hook,
Guard, Binding, Importer, or Processor.

## Source Contract

- Accepted finding:
  `../ui-meta-type-repair/research/2026-07-11-compound-domain-structures/findings.md`.
- Verbatim research transcript:
  `../ui-meta-type-repair/research/2026-07-11-compound-domain-structures/research.md`.
- Current DS-D1 and DS-D8 boundary:
  `../../definitions/DEFINITIONS.md:1053-1065,1111-1159`.
- Current relationship signatures:
  `../../definitions/relationships/relationships.yml`.

The finding is the experiment authority. The transcript supplies evidence and
dissent but cannot override the accepted finding.

## Capability Map

```text
freeze finite specimen and explanations
                  |
                  v
capture cited observations and substitution results
                  |
                  v
apply fixed subtraction predicates -> compute residue
                  |
                  v
classify fixture outcome -> classify suite calibration
                  |
                  v
append immutable result and route without promotion
```

## Experiment Envelope

For each bounded specimen `X`, the package shall represent:

```text
H(X) = (G, A, Q, R, S, D, U)
```

| Field | Required meaning |
| --- | --- |
| `G` | Finite observed graph, boundary, behavior, state, and evidenced edges. |
| `A` | Finite preregistered existing explanations and their declared scope. |
| `Q` | Finite preregistered observables and expected evidence shape. |
| `R` | Computed observables unexplained by every predicate in `A`. |
| `S` | One permitted and one breaking substitution with predicted consequence. |
| `D` | Deterministic difference in a preregistered downstream decision. |
| `U` | Missing, disputed, or portability-limited evidence. |

For every `a` in `A` and `q` in `Q`, a reviewer-approved predicate result
`sigma(a,q)` shall be frozen before evaluation. The evaluator shall compute:

```text
R = { q in Q | for every a in A, sigma(a,q) = not-explained }
```

The evaluator must not infer predicate values from labels, prose similarity,
filenames, framework conventions, or its own model judgment.

## Fixtures

| ID | Specimen | Calibration role | Source boundary |
| --- | --- | --- | --- |
| `F1` | GoldenQuill fabrication gate | likely residual lead | gate, placement, and focused tests cited by the finding |
| `F2` | Savvy `useHasMounted` | collapse control | the bounded hook implementation cited by the finding |
| `F3` | Savvy Page | disputed case | page orchestration and replication row cited by the finding |

The fixture set is frozen for generation 1. Additional fixtures require a new
generation and cannot rewrite generation 1.

## Per-Fixture Outcome Procedure

Outcomes are ordered and mutually exclusive:

1. `INSUFFICIENT-EVIDENCE`: a required observation, predicate, substitution
   result, or usefulness measurement is unavailable or indeterminate.
2. `EXPLAINED`: evidence is complete and `R` is empty.
3. `RUBRIC-FAIL`: evidence is complete and `R` is nonempty, but no
   boundary-owned invariant remains, the substitution pair lacks its predicted
   consequence, or `D` is zero or nondeterministic.
4. `RESIDUAL-SUPPORTED`: evidence is complete, `R` is nonempty, every residual
   condition passes, and `D` is deterministic and nonzero.

`RESIDUAL-SUPPORTED` supports further research into the residual method only.
It does not establish identity, irreducibility, portability, or promotion.

## Suite Calibration

The suite verdict is separate from the fixture outcomes:

| Verdict | Condition |
| --- | --- |
| `CALIBRATION-DEFER` | Any fixture is `INSUFFICIENT-EVIDENCE`. |
| `CALIBRATION-FAIL` | F2 is not `EXPLAINED`, any fixture is `RUBRIC-FAIL`, or replay changes a frozen outcome. |
| `CALIBRATION-PASS` | All evidence is complete, F2 is `EXPLAINED`, no fixture is `RUBRIC-FAIL`, and replay is identical. |

F1 and F3 may be either `EXPLAINED` or `RESIDUAL-SUPPORTED` under
`CALIBRATION-PASS`. The experiment tests the rubric; it does not require the
compound hypothesis to survive.

## Acceptance Criteria

| ID | Criterion |
| --- | --- |
| `AC-01` | `G`, `A`, `Q`, `S`, `D`, `U`, selectors, and every `sigma(a,q)` are finite and frozen before evaluation. |
| `AC-02` | Every predicate result cites an admitted source selector and records reviewer state. |
| `AC-03` | The evaluator computes `R`; it does not author or revise predicate values. |
| `AC-04` | The four fixture outcomes are total, ordered, and mutually exclusive. |
| `AC-05` | The three suite verdicts are total, ordered, and mutually exclusive. |
| `AC-06` | F2 acts as a closed negative: any non-`EXPLAINED` result prevents `CALIBRATION-PASS`. |
| `AC-07` | Semantic input changes create a new generation; volatile metadata does not change the semantic digest. |
| `AC-08` | Independent replay of frozen inputs produces byte-equivalent semantic results. |
| `AC-09` | Every result preserves uncertainty and prohibited inferences. |
| `AC-10` | No output changes DS-D1, DS-D8, candidate, validator, pattern, or promotion state. |

## Invariants

- Recurrence does not establish identity.
- Usefulness and identity remain separate.
- A nonempty residue establishes only unresolved residue.
- DS-D8 endpoint validity does not establish endpoint formation.
- Page and Layout remain roles with unreplicated pattern pressure.
- "Not admitted" always means not admitted by current evidence.
- Missing evidence cannot be coerced into `EXPLAINED` or
  `RESIDUAL-SUPPORTED`.
- A failed control cannot be repaired by adding explanations after the run.
- Generation 1 inputs and results are append-only.

## Scope

In scope: development-only schemas, manifests, evidence receipts, deterministic
subtraction, outcome computation, immutable generations, replay, audit, and a
non-authority next-route recommendation.

Out of scope: source-repository mutation, live UI or pipeline behavior changes,
new DS-D1 definitions, DS-D8 signature changes, pattern promotion, candidate
promotion, generalization beyond the three fixtures, and canonical publication.
