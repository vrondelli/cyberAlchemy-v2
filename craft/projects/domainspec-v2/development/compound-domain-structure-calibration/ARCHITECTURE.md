---
artifact_id: CDSC-ARCH-v0.1
status: approved-planning-baseline
authority: development only
source_spec: SPEC.md
---

# Compound Domain Structure Calibration Architecture

## 1. Context View

The accepted research result is immutable upstream evidence. This package sits
between that result and any later decision to continue, collapse, or widen
compound-structure research.

```text
accepted research
       |
       v
candidate-only calibration package
       |                  |
       | read-only        | append-only
       v                  v
fixture repositories   receipts and generations
                              |
                              v
                    non-authority next route
```

DS-D1, DS-D8, architecture-pattern governance, candidates, and source
repositories remain external owners.

## 2. High-Level Structure View

```text
contract registry -------> fixture manifest
                                |
              +-----------------+-----------------+
              |                 |                 |
              v                 v                 v
         F1 receipt        F2 receipt        F3 receipt
              |                 |                 |
              +-----------------+-----------------+
                                |
                                v
                    deterministic evaluator
                      |                 |
                      v                 v
                 fixture results   suite verdict
                      |                 |
                      +--------+--------+
                               v
                     immutable generation index
                               |
                               v
                       independent replay/audit
```

The evaluator consumes reviewed predicates. It does not decide whether an
explanation is substantively valid.

## 3. Low-Level Components View

| Component | Inputs | Outputs | Failure state |
| --- | --- | --- | --- |
| contract registry | schema and outcome versions | admitted contract IDs | unknown-version |
| fixture manifest validator | fixture IDs, selectors, digests, expected evidence classes | frozen manifest | incomplete-fixture |
| evidence receipt builder | cited observations and reviewer states | immutable fixture receipt | unsupported-observation |
| predicate matrix validator | finite `A x Q` matrix | total frozen `sigma(a,q)` map | missing-cell/conflict |
| substitution validator | permitted/breaking cases and observed consequences | substitution result | indeterminate-substitution |
| usefulness validator | baseline and candidate decisions | deterministic `D` result | missing/zero/nondeterministic |
| residue evaluator | frozen `A`, `Q`, and predicate matrix | computed `R` | evaluator-contract-error |
| fixture classifier | evidence completeness, `R`, substitutions, invariant, `D` | one fixture outcome | non-total-outcome |
| suite classifier | three fixture outcomes and replay state | one suite verdict | control-failure/non-total-verdict |
| generation appender | semantic inputs, predecessor, results | immutable generation | predecessor-conflict |
| replay verifier | frozen generation | semantic equivalence report | replay-drift |

## 4. Workflow Process View

1. Select generation ID and predecessor.
2. Pin every fixture source selector and semantic content digest.
3. Freeze finite `G`, `A`, `Q`, `S`, `D`, and `U` records.
4. Review every `sigma(a,q)` value before evaluation begins.
5. Validate that the predicate matrix is finite, total, and conflict-free.
6. Capture permitted and breaking substitution evidence.
7. Compute `R` without changing any reviewed input.
8. Classify each fixture using the ordered four-outcome procedure.
9. Classify the suite using the control and replay rules.
10. Append results and generation index without overwriting predecessors.
11. Replay frozen inputs independently and compare semantic outputs.
12. Route the bounded result without changing authority or candidate state.

## 5. Decision Flow View

### Fixture Outcome

```text
required evidence complete? --no--> INSUFFICIENT-EVIDENCE
          |
         yes
          v
R empty? --------------------yes--> EXPLAINED
          |
         no
          v
boundary invariant + substitution pair + deterministic nonzero D?
          |                                      |
         no                                     yes
          v                                      v
     RUBRIC-FAIL                         RESIDUAL-SUPPORTED
```

### Suite Verdict

```text
any INSUFFICIENT-EVIDENCE? --yes--> CALIBRATION-DEFER
          |
         no
          v
F2 != EXPLAINED or any RUBRIC-FAIL or replay drift?
          |                                      |
         yes                                    no
          v                                      v
   CALIBRATION-FAIL                       CALIBRATION-PASS
```

No decision branch emits `type`, `pattern`, `replicated`, `authoritative`, or
`promoted`.

## 6. Dependency Interface View

| Boundary | Contract | Violation response |
| --- | --- | --- |
| Invoke -> Task Session | execute one selected SWU with explicit write scope and receipt | block execution |
| package -> research finding | cite immutable accepted finding; no reinterpretation as authority | block claim |
| package -> GoldenQuill | read cited F1 sources only; write no source file | block and discard run |
| package -> Savvy | read cited F2/F3 sources only; write no source file | block and discard run |
| receipt builder -> evaluator | provide total reviewed predicates; evaluator cannot infer missing cells | `INSUFFICIENT-EVIDENCE` or invalid input |
| evaluator -> DS-D1 | fixture results are evidence only | owner route required |
| evaluator -> DS-D8 | edge validity remains external and read-only | owner route required |
| evaluator -> pattern governance | pattern pressure is not pattern admission | later research only |
| generation -> predecessor | append successor; never update predecessor | predecessor-conflict |

## Data Contracts

### Fixture Manifest

Required fields:

```text
contract_version, fixture_id, generation_id, specimen_name,
source_repository, selectors[], semantic_source_digest,
calibration_role, prohibited_inferences[]
```

### Evidence Receipt

Required fields:

```text
fixture_id, generation_id, G, A[], Q[], sigma_matrix[], S, D, U,
reviewers[], reviewed_at, semantic_digest
```

Every predicate matrix row records `explanation_id`, `observable_id`,
`explained | not-explained | indeterminate`, source selectors, rationale, and
review state. `indeterminate` makes the fixture evidence incomplete.

### Evaluation Result

Required fields:

```text
fixture_id, generation_id, residue_observable_ids[], evidence_complete,
residual_conditions, fixture_outcome, prohibited_inferences[], input_digest,
evaluator_version, semantic_result_digest
```

### Suite Result

Required fields:

```text
generation_id, fixture_result_handles[], control_fixture_id,
replay_state, suite_verdict, next_route, prohibited_inferences[]
```

## Deterministic Evaluation Rules

```text
for each fixture:
  validate required fields and total A x Q matrix
  if any required value is absent or indeterminate:
    outcome = INSUFFICIENT-EVIDENCE
  else:
    R = all q where every sigma(a,q) is not-explained
    if R is empty:
      outcome = EXPLAINED
    else if boundary_invariant is not supported
         or permitted_substitution is not preserved
         or breaking_substitution has no predicted consequence
         or D is zero or nondeterministic:
      outcome = RUBRIC-FAIL
    else:
      outcome = RESIDUAL-SUPPORTED

for suite:
  if any fixture is INSUFFICIENT-EVIDENCE:
    verdict = CALIBRATION-DEFER
  else if F2 is not EXPLAINED
       or any fixture is RUBRIC-FAIL
       or replay differs:
    verdict = CALIBRATION-FAIL
  else:
    verdict = CALIBRATION-PASS
```

## Decisions And Alternatives

| Decision | Selected | Rejected alternative |
| --- | --- | --- |
| predicate ownership | reviewed finite input | evaluator invents explanations |
| outcome structure | fixture outcome plus suite verdict | one overloaded status |
| negative control | F2 must collapse | all fixtures allowed to support residue |
| positive lead | F1 may collapse or support | force F1 to validate the hypothesis |
| generations | append-only semantic records | update latest result in place |
| authority | evidence-only routing | automatic DS-D1/pattern promotion |

## Risks And Controls

- **Circular residue:** prohibit evaluator-authored predicates and late changes.
- **Framework bias:** require label-erased observables and preserve F2 control.
- **Positive-fixture bias:** allow F1 to return `EXPLAINED` without treating the
  run as failed.
- **Missing evidence disguised as collapse:** classify indeterminate values as
  `INSUFFICIENT-EVIDENCE` before residue computation.
- **Usefulness substituted for identity:** report `D` separately and retain the
  prohibited-inference list in every result.
- **Replay mistaken for semantic truth:** replay proves deterministic treatment
  of frozen inputs only.
- **Cross-repository mutation:** fixture repositories are read-only and absent
  from every SWU write scope.

## Dependency Order

L0 freezes contracts, fixtures, and deterministic rules. L1 may build the three
fixture receipts in parallel after L0. L2 evaluates only joined, frozen L1
receipts. L3 independently replays and audits the package. No later layer may
repair an earlier generation in place.
