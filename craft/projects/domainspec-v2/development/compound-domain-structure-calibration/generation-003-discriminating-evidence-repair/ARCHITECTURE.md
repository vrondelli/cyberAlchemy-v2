---
artifact_id: CDSC3-ARCH-v0.1
status: approved-planning-baseline
source_spec: SPEC.md
authority: development only
---

# Generation 3 Architecture

## Design Intent

Create an append-only evidence path that separates target decomposition,
browser observation, human adjudication, deterministic evaluation, and
authority routing. Every stage consumes stable handles and may fail without
rewriting an earlier stage.

## 1. Context View

```text
closed calibration generations 1/2 --------+
                                             |
read-only Savvy source slices ---------------+--> generation-3 package
                                             |       |
closed UI-repair DEFER handles --------------+       +--> non-authority result
                                                     |
external DS-D1 / DS-D8 / pattern owners <------------+
```

The package writes only its generated contracts, harness, observations,
adjudication, results, audit, and one append-only generation entry. Savvy,
generation 1, generation 2, UI-repair evidence, and authority stores are
read-only imports.

## 2. High-Level Structure View

```text
protected-input registry
          |
          v
atomic-target contract ---> decomposition validator
          |                         |
          +------------+------------+
                       v
             browser harness manifest
                       |
              baseline equivalence
                 /             \
                v               v
        M3-P observation   M3-B observation
                 \             /
                  +-----+-----+
                        v
             usefulness differential
                        |
                        v
              adjudication overlay
                        |
                        v
             v1 compatibility projection
                        |
                        v
             frozen evaluator + suite
                        |
                        v
             generation-3 append
                        |
                        v
             independent replay/audit
```

## 3. Low-Level Components View

| Component | Inputs | Outputs | Failure State |
| --- | --- | --- | --- |
| protected-input validator | generation-2 index and imported handles | accepted predecessor frame | drift or wrong-tail block |
| target decomposer | frozen parent `S` text and decomposition rules | six target records/digests | combined, missing, overlapping, or outcome-shaped target |
| target schema/direct validator | contract schema and target fixture vectors | parity receipt | vocabulary or direct-rule drift |
| browser source manifest | pinned Savvy selectors and digests | generated-source boundary | source drift |
| browser baseline runner | generated route tree and vectors | baseline witness | mount unavailable or baseline mismatch |
| `M3-P` runner | accepted baseline and child adapter mutation | permitted observation receipt | edit-surface or observation incompleteness |
| `M3-B` runner | accepted baseline and commit adapter mutation | breaking observation receipt | edit-surface or observation incompleteness |
| usefulness planner | finite test catalog, fixed coverage, mutation handles | baseline set, residual set, `D` | nondeterminism or post-result rule change |
| atomic adjudicator | six explanations, six targets, observations | reviewed 36-cell overlay | missing/conflicting/disputed hidden coordinate |
| compatibility materializer | predecessor layers, `D`, uncertainty, overlay | parent-valid v1 receipt | provenance, vocabulary, or replay drift |
| fixture/suite evaluator | v1 receipt and stable F1/F2 results | total results | evaluator contract error |
| generation appender | current exact tail and result handles | generation-3 index entry | duplicate or predecessor conflict |
| replay/audit verifier | all immutable handles and bytes | closeout and Inventory read model | byte, provenance, authority, or route failure |

## 4. Workflow Process View

1. Validate the exact generation-2 tail and protected bytes.
2. Derive and freeze the six target propositions from parent `S`.
3. Reject every invalid decomposition vector before browser work.
4. Pin source slices and generate the isolated browser harness.
5. Prove browser baseline equivalence.
6. Execute `M3-P` and `M3-B` against disjoint generated adapters.
7. Freeze structured observations and bounded visual support.
8. Run the preregistered baseline and residual test-impact planners.
9. Review every explanation/target coordinate without viewing evaluator output.
10. Materialize and replay the compatibility receipt.
11. Evaluate F3 and the suite with unchanged v1 code.
12. Append generation 3 once after the exact generation-2 tail.
13. Rebuild all outputs in a fresh process and audit authority boundaries.
14. Append a bounded Inventory read model and close.

No stage may skip a failed predecessor gate. Observation tasks never adjudicate;
adjudication never evaluates; evaluation never promotes.

## 5. Decision Flow View

### Pre-Observation Gate

```text
generation-2 handles exact? --no--> BLOCK
          |
         yes
          v
six targets valid and outcome-independent? --no--> BLOCK
          |
         yes
          v
browser available and baseline equivalent? --no--> BLOCK with preflight receipt
          |
         yes
          v
run mutations
```

### Evidence And Evaluation

```text
observations total? --no--> freeze truthful indeterminate evidence
          |
         yes or bounded-indeterminate
          v
36 reviewed coordinates + D + U valid? --no--> BLOCK
          |
         yes
          v
materialize deterministic v1 projection
          |
          v
frozen evaluator returns one total outcome
          |
          v
suite returns DEFER | FAIL | PASS
          |
          v
append and audit without promotion
```

An `INSUFFICIENT-EVIDENCE`, `EXPLAINED`, `RUBRIC-FAIL`, or
`RESIDUAL-SUPPORTED` F3 result is valid execution output. No branch has an
outcome preference.

## 6. Dependency Interface View

| Boundary | Contract | Allowed Direction | Violation Response |
| --- | --- | --- | --- |
| generation 2 -> generation 3 | exact index tail and stable record handles | read/import only | block |
| parent `S` -> target decomposer | description/prediction text and selectors | deterministic derivation | block outcome-derived target |
| Savvy -> browser harness | pinned source slices and generated copies | read then generate locally | discard on source drift or Savvy write |
| UI repair -> generation 3 | stable DEFER/corpus-policy handles | bounded context only | block portability inference |
| baseline -> mutation runners | exact baseline witness | execute generated adapter mutation | block before observation |
| observations -> adjudicator | stable receipts | evidence handle handoff | block hidden missing evidence |
| adjudicator -> materializer | complete reviewed overlay | deterministic projection | block coordinate/provenance drift |
| projection -> evaluator | parent-valid v1 receipt | evaluation only | block evaluator mutation |
| suite -> generation index | exact predecessor/result entry | atomic append once | reject conflict |
| audit -> Inventory | bounded summary and source handles | read-model append | block authority claim |
| calibration -> DS-D1/DS-D8/pattern owners | non-authority result | explicit future owner route only | no direct mutation |

## State Namespaces

| Namespace | Owner | Policy |
| --- | --- | --- |
| `generation-001/002` | closed calibration cycles | immutable/read-only |
| `ui-repair successor` | UI repair cycle | immutable import; no reinterpretation |
| `contracts/fixtures` | CDSC3 L0 | versioned, frozen before observations |
| `harness/baseline` | CDSC3 L0/L1 | source-derived, deterministic |
| `experiments/evidence` | CDSC3 L1 | disjoint per mutation |
| `adjudication/projection` | CDSC3 L2a | reviewed and deterministic |
| `results/generation-003` | CDSC3 L2b | immutable after append |
| `runs/SWU-CDSC3-009` | independent audit | may write audit only |
| `.arcanum/inventory` | Inventory | non-authority append-only read model |

## Architecture Invariants

- Target text precedes and cannot depend on observations.
- Browser evidence precedes adjudication.
- Adjudication precedes evaluation.
- Evaluation results never mutate their inputs.
- A source-derived harness is not the source repository.
- A complete local result is not portability evidence.
- A changed downstream test set is not identity evidence.
- Every append has one exact predecessor and one independent replay.
