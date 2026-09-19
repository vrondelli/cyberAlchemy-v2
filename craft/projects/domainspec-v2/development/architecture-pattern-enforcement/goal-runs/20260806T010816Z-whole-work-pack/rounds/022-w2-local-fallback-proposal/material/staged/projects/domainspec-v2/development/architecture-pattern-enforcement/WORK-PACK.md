---
module: architecture-pattern-enforcement
feature_code: APE
status: candidate-plan-ready
updatedAt: 2026-08-05
docType: work-pack
---

# Work Pack: Ontology-Guided Architecture Enforcement

## Control fields

| Field | Value | Notes |
| --- | --- | --- |
| workPackGateStatus | pass; W0 and W1 receipts current; W2 local-fallback amendment applied | Design, task, wave, and Distill validation remain controlling |
| complexity | high | multiple owners, three languages, proof-provider integration |
| outputMode | split | task contracts and shared SWU manifest are canonical |
| activeLayerWindow | L2 | independent Python and Rust observation lanes |
| selectedSWU | none | Invoke does not select or execute |
| nearestCandidate | `SWU-APE-ENUM-PY-001` | Python is the next unselected lane; Rust follows only after Python closeout synchronization |
| designRef | [architecture-bundle.md](architecture-bundle.md) | six-view candidate design |
| layeringRef | [implementation-layering.md](implementation-layering.md) | L0-L3 decision model |
| implementationPlanRef | [IMPLEMENTATION-PLAN.md](IMPLEMENTATION-PLAN.md) | algorithm and validation details |
| executionPackRef | [execution-pack.md](execution-pack.md) | wave choreography |
| swuManifestRef | [work-pack/shared/SWU-MANIFEST.json](work-pack/shared/SWU-MANIFEST.json) | exact SWU inventory |
| closeoutRef | [work-pack/shared/CLOSEOUT-CONTRACT.md](work-pack/shared/CLOSEOUT-CONTRACT.md) | every mutation-capable SWU |

## Objective and completion boundary

Prove one complete ontology-guided realization cycle for active `DS-D1.3
Enum`: model portable implementation properties, validate profile-local
realizations from real TypeScript/Python/Rust evidence, compare exact semantic
obligations, and emit a bounded replayable completion receipt. Then generate a
recommendation for the next type from remaining evidence burden.

This Work Pack does not execute work, mutate source packages, admit profiles,
promote ontology, select the next type, release, deploy, or establish production
readiness.

## Task board

| Task | Layer | Outcome | Status |
| --- | --- | --- | --- |
| [TASK-APE-L0-ENUM-ONTOLOGY](work-pack/tasks/TASK-APE-L0-ENUM-ONTOLOGY.md) | L0 | Enum realization, properties, profiles, provenance, causal scenarios, and composition graph | ONT-001..006 complete |
| [TASK-APE-L1-ENUM-TYPESCRIPT](work-pack/tasks/TASK-APE-L1-ENUM-TYPESCRIPT.md) | L1 | real TypeScript projection, discriminating fixtures, trust proof, frozen observation contract | TS-001..004 complete |
| [TASK-APE-L2-ENUM-PARITY](work-pack/tasks/TASK-APE-L2-ENUM-PARITY.md) | L2 | independent Python/Rust lanes, exact parity, bounded Enum closeout | Python nearest and unselected; sequential local-fallback execution approved |
| [TASK-APE-L3-SCALE](work-pack/tasks/TASK-APE-L3-SCALE.md) | L3 | exact coverage, evidence-burden recommendation, next-type packet, bounded CI aggregation | planned |

## SWU summary

| Wave | SWUs | Gate |
| --- | --- | --- |
| W0 | APE-ONT-001..006 | sequential ontology/profile/composition closure |
| W1 | APE-ENUM-TS-001, 001A, 001B, 002..004 | decision, runtime provider, profile activation, adapter trust, and freeze |
| W2 | APE-ENUM-PY-001, APE-ENUM-RS-001 | sequential local fallback: Python closes before Rust selection |
| W3 | APE-ENUM-PARITY-001, APE-ENUM-CLOSE-001 | all lane receipts joined |
| W4 | APE-SCALE-001..004 | Enum closeout current and deterministic |

Exact contracts are in the [SWU manifest](work-pack/shared/SWU-MANIFEST.json).

## Selection rule

`SWU-APE-ENUM-TS-004` is complete and its current receipt binds the passing
TypeScript proof, replay, mutation denominator, scenario readiness, and frozen
observation contract. `SWU-APE-ENUM-PY-001` is the only nearest candidate and
is not selected. The Rust lane remains semantically independent and consumes
the same frozen contract, but its lifecycle selection waits for Python
closeout. Before Python mutation, Task Session must:

1. bind the TS-004 receipt and frozen observation digest;
2. bind the absent Python package/receipt baselines and CPython 3.12.3;
3. build a strict Context Builder runtime pack for the exact Python scope;
4. validate the Python closeout synchronization contract;
5. receive exact Python SWU selection through the authorized package route.

After Python passes and Invoke Refresh makes its receipt current, the same
sequence repeats for Rust with Cargo 1.94.1, rustc 1.94.1, rustfmt 1.8.0, and
dependency-free locked Cargo resolution. This sequencing is lifecycle-only:
Rust must not consume Python artifacts or results.

No successor becomes eligible from a prose status change. It requires the
predecessor receipt and all declared gate evidence.

The TS-001 decision selects the owned const-object protocol. TS-001A proves the
exact provider and its focused runtime/type behavior. TS-001B activates that
exact provider-bound protocol and blocks missing or stale evidence. TS-002
proves the bounded real-source adapter and typed unsupported route. TS-003
proves the total discriminating fixture denominator. TS-004 proves the replayed
trust boundary and frozen observation contract. The approved local-fallback
amendment changes only W2 execution ownership and ordering; it does not count
either language lane as selected or complete.

## Global acceptance

`Enum complete-witnessed` requires:

- exact current canonical Enum and profile handles;
- all applicable portable obligation IDs accounted for;
- real positive and exact-cause negative source evidence in all three lanes;
- typed unsupported accounting with no required unsupported result;
- language lanes joined and closed against the same frozen contract;
- deterministic findings, receipts, and replay from raw evidence;
- explicit runtime-plane N/A rationale for Enum;
- a claim ceiling limited to the selected profiles, tools, fixtures, and
  obligations.

## Preserved evidence

Completed APE and BTE evidence is not rewritten. See
[HISTORICAL-EVIDENCE-MAP.md](HISTORICAL-EVIDENCE-MAP.md). It may support
preflight or provider reuse but cannot substitute for Enum evidence.

## Open blockers

- eight active types remain without reciprocal realization mappings;
- no Python or Rust native adapter exists;
- Python third-party test/type tools are absent; the lane is standard-library
  only unless a later exact dependency change is approved;
- BTE has not adopted the now-representable causal scenario contract;
- ontology/MTCI/canvas work is untracked and BTE has modified/untracked bytes;
- direct-leaf versus public-index import remains a profile-owner decision for
  relevant later types.

These block their affected execution units, not the authoring validity of this
plan.
