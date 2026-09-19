---
artifact_id: CDSC3-SPEC-v0.1
status: approved-planning-baseline
owner: DomainSpec v2 compound-domain-structure calibration generation 3
authority: development only
predecessor_generation: generation:sha256:24c4e0292197d0d8895bd5a668813437ba6d5c6f02cf6b549d85b2ae350ce683
promotion_eligible: false
---

# Generation 3 Discriminating Evidence Repair Specification

## Purpose

Test whether generation 2 remained insufficient because the F3 substitution
targets bundled independently explainable consequences, and whether
browser-level evidence plus a preregistered usefulness differential can make
the calibration input complete.

This package repairs discriminability and missing local observation. It does
not seek a preferred fixture outcome and does not define or promote a compound
type, Page kind, relationship, pattern, candidate, or authority artifact.

## Immutable Inputs

| Input | Handle or status | Use |
| --- | --- | --- |
| Generation 2 | `generation:sha256:24c4e0292197d0d8895bd5a668813437ba6d5c6f02cf6b549d85b2ae350ce683` | exact predecessor |
| Parent F3 | `record:sha256:6d2066bded781e8dc739eb65f09f5237b131a4c55e7a858a03de8d1f5118681a` | frozen explanations and substitutions |
| M1 | `record:sha256:26cbc95a46c790b819ac0c9ebbef94771eed89a5457927fa0fd0967d32ec0140` | prior permitted observation |
| M2 | `record:sha256:55f0f6a99f8df7f5d9c4bf6da8c218f9366733a300e689c24ff8a2672e4309bd` | prior breaking observation |
| Generation-2 overlay | `record:sha256:668ea537da92ee33b4640fe34175aaffa1b387b0809352984b552a7530dae8b5` | unresolved coordinate source |
| Generation-2 projection | `record:sha256:8fa5b9015945b56aa2a9cdbf47d0743281a1a299fe1f0e8751b33518cbb03ccd` | evaluator compatibility baseline |
| UI repair successor | `DEFER`; portability below 2/2/2 and independent positives missing | imported limit only |

Generations 1 and 2, their receipts, results, indexes, source slices, and audit
artifacts are read-only.

## Evidence Model

Generation 3 represents:

```text
E3(F3) = (B, A, T, O, Sigma, D, U)
```

| Field | Meaning |
| --- | --- |
| `B` | Exact baseline and predecessor handles. |
| `A` | The six unchanged parent explanation statements. |
| `T` | Six preregistered atomic target propositions derived from parent `S`. |
| `O` | Source-derived browser baseline and mutation observations. |
| `Sigma` | Reviewed total `A x T` adjudication matrix. |
| `D` | Preregistered finite downstream test-impact decision differential. |
| `U` | Missing, disputed, untested, or non-portable evidence. |

The frozen v1 evaluator remains the outcome authority. A generation-3
materializer may project this model into `cdsc.evidence-receipt.v1`; it may not
change the four fixture outcomes or three suite verdicts.

## Atomic Target Contract

Targets are frozen before browser observations. Each target must be one
independently observable consequence and must cite only the parent substitution
description or prediction.

| ID | Kind | Parent source | Atomic proposition |
| --- | --- | --- | --- |
| `T-P-01` | permitted | `S.permitted.description` | The replacement preserves the declared `onNext`/`onBack` interaction contract. |
| `T-P-02` | permitted | `S.permitted.prediction` | The selected rendered child changes. |
| `T-P-03` | permitted | `S.permitted.prediction` | Route coordination remains stable. |
| `T-P-04` | permitted | `S.permitted.prediction` | Guard behavior remains stable. |
| `T-B-01` | breaking | `S.breaking.description` | The committed step bypasses or differs from the guard result. |
| `T-B-02` | breaking | `S.breaking.prediction` | A previously blocked or premature request reaches a different committed destination. |

### Decomposition Rules

1. Split only at explicit conjunctions or separately asserted consequences in
   the frozen parent description/prediction.
2. Preserve modality and polarity; do not strengthen `may` into `must` or
   `different` into a specific destination.
3. Every target has one parent field selector and canonical text digest.
4. Observed consequences, explanation labels, matrix states, fixture outcomes,
   and suite verdicts are prohibited target inputs.
5. Missing, duplicate, overlapping, recombined, reordered-with-semantic-change,
   or outcome-shaped targets invalidate the package before browser execution.

## Browser Evidence Contract

The harness is generated from pinned Savvy source slices into this package. It
must run a real React/browser rendering path while keeping the Savvy checkout
read-only.

### Baseline

- Mount the source-derived route tree and step registry.
- Exercise declared permitted and blocked navigation vectors.
- Observe rendered child identity, interaction availability, guard result,
  notice state, requested step, committed step, and route-tree state.
- Match the frozen source-derived expected outputs before either mutation runs.

### Permitted Mutation `M3-P`

Replace the step-9 child with an alternate implementation exposing the same
`onNext` and `onBack` contract. Observe all four permitted targets. Any edit
outside the generated step-registry adapter is invalid.

### Breaking Mutation `M3-B`

Commit the requested step instead of the guard result. Observe both breaking
targets plus guard and notice state. Any edit outside the generated commit
adapter is invalid.

Screenshots may support visual assertions, but structured DOM/route state is
the machine evidence. A screenshot alone cannot satisfy a target.

## Usefulness Differential

The package preregisters a finite test catalog:

```text
unit:screen-contract
unit:guard-rule
unit:navigation-sequencing
integration:route-tree
browser:journey
```

Two deterministic planners consume the same mutation and observation handles:

- baseline planner: unchanged explanation-to-target coverage only;
- residual planner: baseline coverage plus a hypothetical compound-boundary
  claim represented as an explicit non-authority input.

Each planner returns a sorted unique test set. Define:

```text
D = symmetric_difference(baseline_test_set, residual_test_set)
```

`D` may be empty. The planner contract, coverage table, and inputs freeze before
the result is computed. A nonempty `D` demonstrates only a changed downstream
decision, not identity or usefulness sufficient for promotion.

## Adjudication

For each `a` in `A` and `t` in `T`:

1. Bind the target digest and matching browser observation handle.
2. Mark `explained` only when the unchanged explanation accounts for the full
   atomic proposition and the observation supports it.
3. Mark `not-explained` when it does not account for that proposition.
4. Mark `indeterminate` for missing/conflicting evidence, partial coverage of
   an atomic target, or reviewer dispute.
5. Preserve every uncertainty and reviewer state.

The matrix must contain exactly 36 coordinates. No cell may be selected to
obtain `EXPLAINED`, `RESIDUAL-SUPPORTED`, or `CALIBRATION-PASS`.

## Evaluation And Generation

1. Materialize a deterministic v1 F3 projection from immutable generation-2
   inputs, atomic targets, browser observations, adjudication, `D`, and `U`.
2. Evaluate F3 with unchanged `cdsc-evaluator-v1`.
3. Reuse stable F1/F2 results.
4. Evaluate the suite with predecessor equal to generation 2.
5. Accept any total result.
6. Append generation 3 exactly once.
7. Rebuild in a fresh process and compare all semantic bytes and handles.

## Acceptance Criteria

| ID | Criterion |
| --- | --- |
| `AC3-01` | Exact generation-2 predecessor and all imported handles validate before mutation. |
| `AC3-02` | Six atomic targets derive only from frozen parent substitution text. |
| `AC3-03` | Decomposition validator rejects outcome-shaped, combined, missing, duplicate, and overlapping targets. |
| `AC3-04` | Browser baseline equivalence passes before `M3-P` or `M3-B`. |
| `AC3-05` | Mutations change only declared generated adapters and emit total structured observations. |
| `AC3-06` | The 6 x 6 adjudication matrix is total and preserves dispute/uncertainty. |
| `AC3-07` | The usefulness planner is preregistered, deterministic, and accepts empty `D`. |
| `AC3-08` | Compatibility projection is parent-valid and deterministic. |
| `AC3-09` | Generation 3 appends once after generation 2 and rejects duplicate/wrong-tail writes. |
| `AC3-10` | Fresh replay reproduces target, observation, projection, result, and generation handles. |
| `AC3-11` | No source repository or generations 1/2 artifact changes. |
| `AC3-12` | No output changes DS-D1, DS-D8, pattern, candidate, activation, or promotion state. |

## Scope

In scope: contracts, negative fixtures, source-derived browser harness,
baseline and two mutations, atomic adjudication, usefulness differential,
compatibility projection, generation-3 evaluation/append, replay, audit, and
Inventory read model.

Out of scope: collecting new cross-domain portability corpora, Form/Action
positive witnesses, Savvy source mutation, UI feature work, evaluator decision
table changes, canonical definitions, candidate admission, pattern promotion,
or authority mutation.
