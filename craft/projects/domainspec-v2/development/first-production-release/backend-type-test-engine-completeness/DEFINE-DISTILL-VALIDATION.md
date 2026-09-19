---
artifact: distill-validation
status: pass
mode: standard
target: invoke-define
updatedAt: 2026-07-21
executionPath: local-proposer-balancer-simulation
---

# Distill Validation — BTE Define

## Verdict

**PASS for Define; Decision Gate required before Design and subsequently passed
with Option 2.**

The smallest responsible definition unit is one all-backend structural proof
contract owned by the existing BTE package. It reuses the EVF object vocabulary
as evidence, keeps current-v1 compatibility separate from successor breadth,
and refuses to create a third implementation package.

No subagent dispatch was authorized for this authoring step. The Proposer and
Balancer roles were simulated locally and are not represented as independent
review. The validated dispatch reserves independent agents for the later
complete-package audit after Define, Design, and Plan exist.

## Proposer Result

Proposed unit:

> A versioned source-to-receipt proof contract containing distinct source,
> graph, derivation, execution, evidence, replay, and consumer responsibilities,
> with current-v1 formation compatibility as the first decision-gated boundary.

Why this is one unit:

- all objects contribute to one bounded claim and exact-set equation;
- BTE already owns the all-backend execution lane;
- EVF remains reusable design evidence and the optional narrow proof;
- consumers close an application-use claim only after core and cannot become
  core authority.

## Balancer Objections And Reconciliation

| ID | Objection | Disposition | Reconciliation |
| --- | --- | --- | --- |
| `OBJ-DEFINE-001` | A thirteen-object contract set may become a taxonomy instead of an implementable boundary. | accept | Objects are grouped by one causal chain and stable requirements; field-level schemas wait for Design. |
| `OBJ-DEFINE-002` | Calling YAML canonical can silently erase current-v1 JSON formation declarations. | accept/block downstream | Define exposed the conflict without guessing; the later Option 2 decision requires a distinct version, retirement map, and migration proof. |
| `OBJ-DEFINE-003` | The number 16 is used for both criteria and relationship families and may inflate proof. | accept | `D_form` and `D_rel` are named, separately owned sets; 21/29 expansions stay unselected. |
| `OBJ-DEFINE-004` | Existing completed kernel/adapter work may be accidentally invalidated. | accept | Their receipts remain preserved narrow facts; the new blocker concerns omitted compatibility and breadth. |
| `OBJ-DEFINE-005` | Consumer proof could be used to self-certify the core. | accept | IOLM and Body War run only after core with independent contracts/replay and cannot author core truth. |
| `OBJ-DEFINE-006` | A broad definition could prematurely dictate implementation layering. | accept | Define records the stale-layering gap only; Design and Plan remain separate active modes. |

All objections are reconciled in `DEFINE.md` and `REQUIREMENTS.md`; none is
hidden as prose-only residue.

## Technique Trace

| Technique | Trigger/inspection | Emitted result | Decision |
| --- | --- | --- | --- |
| `abstraction_level_guard` | purpose, capability, contract objects, later implementation layers | Define owns claim/capability/contract boundaries; algorithms and components remain later-stage | pass |
| `recomposition_proof` | source, graph, obligation, test, binding, evaluator, result, mutation, receipt, aggregate, consumers | objects recompose through one exact source-to-receipt chain; no anonymous “manager” glue | pass |
| `evolution_profile` | new profiles, criteria, relationships, evaluators, consumers | smallest extension boundary is versioned profile/catalogue/evaluator contracts; universal solver remains deferred | pass |
| `frame_expiry_note` | formation choice and mutable machine sources | Option 2 is recorded; rerun Define if its contract boundary, profile admission, denominator, authority owner, or audit baseline changes | pass |
| `cognitive_load_check` | more than three object roles and multiple denominators | reading path, role table, grouped requirements, glossary, and exact set symbols keep added structure navigable | pass |
| `requisite_variety_check` | 13 kinds, 16 criteria, selected relationships, two consumers, several failure modes | internal variety is proportionate: typed roles and evaluator scopes without a universal meta-framework | pass |
| `boundary_object_check` | profile, definitions, compiler, engine, validators, and consumers share terms | stable meaning is the identity/digest-bound chain; local schemas may vary; formation conflict routes to owner | route/pass-for-Define |
| `concept_vs_knowledge_status` | candidate contract roles mixed with live source observations | current paths/counts/compiler behavior are evidence-backed; future schemas and successor admission are explicitly candidate/missing | pass |
| `premortem_pass` | medium/high risk breadth | likely failure: authority/count inflation produces another false completeness claim; guardrail: exact sets, decision gate, non-authority labels, replay | pass |
| `navigable_result_check` | full Define output family | `DEFINE.md` supplies start order, changes, unresolved items, and exact next route | pass |

## Recomposition Statement

The contract roles recompose as follows:

```text
Profile selects exact machine sources
  + NodeSource/EdgeSource preserve authored intent
  -> Graph preserves admitted normalized structure
  + independent O_spec defines what must be proved
  -> O_gen/TestCase derive runnable checks
  + Binding/Evaluator make checks executable and bounded
  -> ExecutionResult/MutationResult provide raw outcomes
  -> Receipt/replay join outcomes to sources and governing contracts
  -> AggregateReceipt proves the exact core set
  -> independent consumer receipts prove bounded application use
```

Hidden glue: none at Define altitude. Concrete schemas, precedence, interfaces,
and failure types remain explicit Design obligations.

## Premortem And Frame Expiry

Six months later, the likely failure would be a new passing aggregate that
compares counts while omitting one governing contract, or treats a consumer
literal pass as independent proof. The guardrail is identity-based exact-set
comparison, explicit authority at every handoff, independent replay, and seeded
missing/stale/empty/duplicate/self-asserted negatives.

This frame expires and Define must be rerun when any of these changes:

- `DEC-BTE-FORMATION-AUTHORITY-001` is accepted with conditions that alter the
  object boundary;
- a successor profile or relationship denominator is admitted;
- the 13-kind or 16-criterion inventory changes;
- a new evaluator class or consumer is made part of the bounded claim;
- a later audit invalidates a source selector or authority classification.

## Next Route

Post-validation update: Decision Gate `DEC-BTE-FORMATION-AUTHORITY-001` passed
on 2026-07-21 with Option 2. The next route is Invoke Design for a distinct
versioned YAML-owned replacement and explicit JSON retirement/migration
contracts. Do not run Plan, Task Session, or source implementation from this
result.
