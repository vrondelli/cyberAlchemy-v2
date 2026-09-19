---
artifact: distill-validation
status: pass
mode: standard
target: invoke-design
updatedAt: 2026-07-22
executionPath: independent-proposer-balancer
---

# Distill Validation — BTE Design

## Verdict

**PASS for Design; handoff is limited to Invoke Plan.**

The smallest coherent design unit is one
`AdmittedStructuralObligationProof`: an independently expected obligation and a
graph-derived obligation joined to one pre-run TestCase, exact role bindings,
independent bounded evaluation of raw execution, a fresh child-lineage mutant,
and a separately replayed proof receipt.

A smaller unit loses independence, executability, discrimination, or replay.
Larger proof claims recompose these units through exact per-catalogue
`coverage_key` sets. Formation/source migration is prerequisite; consumers are
downstream; UI is outside the lane.

## Proposer Result

The proposer supplied six views and a target architecture with four planes:
contract/admission, source/compiler/graph, proof/evidence, and
consumer/lifecycle. It recommended:

- one canonical graph/manifest input rather than a proof-owned graph;
- distinct current and successor profile/formation/source paths;
- validation-owned `O_spec` and graph-derived `O_gen`;
- exact bindings, bounded evaluators, clean mutations, replay, and fail-closed
  aggregates;
- extending the existing test-derivation engine rather than creating a third
  engine or promoting its Markdown compatibility path.

## Balancer Objections And Reconciliation

| ID | Objection | Disposition | Design reconciliation |
| --- | --- | --- | --- |
| `OBJ-DES-001` | One 16-count formation equation would hide 13 required-structure obligations and dynamic instances. | accepted | six separately owned catalogues; `D_structure=13`; equality per `coverage_key` |
| `OBJ-DES-002` | O_spec, tests, or evaluator could share the generator/compiler defect. | accepted | validation-owned expectations; tests created only after exact comparison; evaluator forbidden imports |
| `OBJ-DES-003` | A proof IR could become a second semantic graph. | accepted | immutable `ProofContext` handles the canonical graph/manifest; projections require ID/digest bijection |
| `OBJ-DES-004` | First-match bindings can false-green. | accepted | exactly one explicit binding per `(test_id, case_role)`; zero or multiple fails before execution |
| `OBJ-DES-005` | A mutation could be “killed” only because bytes became stale. | accepted | fresh child lineage, recomputed digests, expected phase/code or causal delta |
| `OBJ-DES-006` | Receipt/consumer literal pass could validate itself. | accepted | BuildReceipt, ProofReceipt, ReplayResult, and aggregate have separate owners/altitudes; consumer-owned raw run gets BTE-owned replay |
| `OBJ-DES-007` | Current and successor YAML paths could mutate v1 in place. | accepted | successor isolated at `impl/spec/meta-types/formation-v2/`; current paths/bytes/digests frozen; explicit profile dispatch/no fallback |
| `OBJ-DES-008` | Required node proof had no evaluator and looked like scope expansion. | accepted | four bounded evaluator interfaces cover all catalogues; node causality traces to accepted FPR-02 Resolved Decision 9; missing Requirements row is a Plan trace repair |
| `OBJ-DES-009` | Candidate work could be prevented before admission. | accepted | candidate validation may emit non-admitting evidence; admission gates core eligibility and terminal proof |
| `OBJ-DES-010` | Extra diagnostic cases could vanish from exact equality. | accepted | diagnostic namespace is separate; any extra record inside a required catalogue fails |

The targeted Balancer recheck returned PASS on the successor isolation,
node-causality/evaluator coverage, and upstream decision trace. No unresolved
Design contradiction remains.

## Technique Trace

| Technique | Inspection | Result |
| --- | --- | --- |
| `abstraction_level_guard` | architecture contracts versus Plan tasks/files | logical components, machine families, trust boundaries, and command semantics retained; no SWUs/waves scheduled |
| `recomposition_proof` | smallest unit through catalogues/aggregates | one obligation proof unit recomposes by exact keys without hidden glue |
| `evolution_profile` | new kinds, criteria, relations, evaluators, consumers | change enters through versioned catalogues/handles and explicit admissions; no universal host |
| `frame_expiry_note` | denominator/profile/authority/evaluator changes | expiry conditions recorded in layering seed |
| `cognitive_load_check` | six catalogues and many artifact roles | six views, glossary pairings, workflow, failure table, and layering seed make the design navigable |
| `requisite_variety_check` | static/dynamic denominators, four proof interfaces, two consumers | variety is represented explicitly without merging authority or building a general solver |
| `boundary_object_check` | graph, ProofContext, receipt, consumer handoff | exact typed handles preserve shared meaning; ownership remains local |
| `concept_vs_knowledge_status` | current code facts versus target contracts | reuse/replace table and candidate/admitted distinctions prevent proposals from being stated as live |
| `premortem_pass` | likely false-green paths | independent expectations, exact bindings, child-lineage mutation, separate replay, and consumer verification close them |
| `navigable_result_check` | start path and continuation | Design Start Here, six views, risks/gates, glossary, layering seed, and exact Plan handoff pass |

## Recomposition Statement

```text
versioned semantic/admission handles
  -> exact source set -> one canonical graph build
  + validation-owned O_spec
  -> exact O_spec/O_gen join
  -> TestCase + exact bindings + independent evaluator
  -> ExecutionResult + fresh primary MutationResult
  -> ProofReceipt -> independent ReplayResult
  -> per-catalogue exact set -> core aggregate
  -> independent consumer handshakes -> terminal aggregate
```

Hidden glue: none at Design altitude. Plan must assign concrete contract homes,
validators, tasks, fixtures, owners, and gates without weakening these joins.

## Premortem

The likely six-month false green would be a generator that authors its own
expectations, a first-match binding, a mutant rejected only by stale bytes, and
consumer receipts whose literal `pass` fields are counted by the terminal gate.
The architecture makes each of those paths structurally ineligible for a
successful replay.

## Frame Expiry

This result expires if the successor profile/source topology, the 13/16/13/16
static memberships, canonical graph ownership, formation replacement decision,
four evaluator interfaces, `O_spec` independence, replay ownership, or consumer
trust boundary changes.

## Next Route

Invoke Plan may regenerate the stale Plan, implementation layering, work pack,
and requirement trace. No Task Session, SWU selection, implementation,
admission, consumer execution, or release promotion is authorized here.
