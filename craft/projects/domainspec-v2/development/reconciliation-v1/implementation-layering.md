---
title: DomainSpec Reconciliation Implementation Layering
status: candidate-plan-not-executed
updatedAt: 2026-09-08
owner: DomainSpec product owner
scope: system
---

# DomainSpec reconciliation implementation layering

This adapts the implementation-layering template into five evidence-gated layers.
It is planning only. Authority effect: none.

## Context

- Target: existing DomainSpec semantics, compiler, formalization, runtime and product portfolio.
- Current state: substantial implemented and accepted work mixed with newer candidates and stale views.
- Consumers: direct DomainSpec authors, AlchLang, generated-code users, TDE/EVF and application/runtime products.
- Constraint: preserve existing meaning, user-owned bytes and exact authority/evidence boundaries.
- Sources: [EVIDENCE.json](EVIDENCE.json), [PLAN.md](PLAN.md) and [WORK-ITEMS.json](WORK-ITEMS.json).

## Layering method and boundary heuristic

Layer 0 is the smallest useful end-to-end proof, not an inventory-only milestone.
Later layers add one distinct confidence theme and preserve previous guarantees.

`Layer value = decision unlocked + user-visible outcome + risk reduced`

`Layer cost = implementation time + verification time + coordination burden`

Stop a layer when extra work no longer improves its specific decision as much as
starting the next decision layer. Five layers are justified here because core
representation, consumer agreement, failure/recomposition and exact distribution
are different questions.

A layer's evidence gate controls promotion/closure. Independent tasks may be
prepared in parallel according to WORK-ITEMS.json, but that does not declare a
later layer complete before prerequisite guarantees hold.

## Layer decision table

| Layer | Decision | Minimum proof | Main risk reduced |
| --- | --- | --- | --- |
| L0 | After this layer, we know whether one supported domain meaning can survive authoring, graph compilation and generated execution with exact provenance. | One typed Entity and Query, equivalent direct JSON and supported Alch input, one known read-only result, and wrong-endpoint/type negative controls. | Restarting from stale guides or treating compiler output as semantic proof. |
| L1 | After this layer, we know whether the selected core semantics can be represented, compiled and observed without collapsing distinct concepts. | Complete type/profile matrix and BMC contract crosswalk, followed by all supported metatype realization cells and semantic counterexamples. | Global multiplicity overconstraint, invented helper Operations, trigger/effect confusion, hidden untyped placeholders and missing tests. |
| L2 | After this layer, we know whether downstream execution and assurance consumers preserve the selected compiler meaning. | One nontrivial Mapping/Query/Rule/Calculation composition with generated/runtime parity, exact certificate closure and a bounded SFOL/TDE/EVF claim join. | Compilation certificates mistaken for proofs, absent EVF treated as passed, untyped runtime crashes and profile-version confusion. |
| L3 | After this layer, we know whether the selected four-product system remains coherent under failure, recovery and migration. | A local selected provider plus workflow/application path exercised across crash, retry, cancellation and migration boundaries, joined to exact compiler/EVF/recovery/legacy versions. | Lost intent, duplicate or unauthorized effects, trigger/output ambiguity reappearing in runtime, caller breakage and stale user docs. |
| L4 | After this layer, we know whether one exact installable product candidate substantiates the full reconciliation claim and is eligible for separately owned decisions. | Immutable source/evidence manifest, clean installed archive, full required corpus, whole-scope closeout and independent review. | Source/dist/archive drift, missing exported commands, hidden workspace dependencies, and admission/publication inferred from local PASS. |

## Capability progression

| Area | L0 | L1 | L2 | L3 | L4 |
| --- | --- | --- | --- | --- | --- |
| Meaning/source | One supported Entity/Query | Complete core/profile distinctions | Consumer-preserved bindings | Product/migration correspondence | Exact source manifest |
| Graph/code | Minimal compiled vertical | Complete selected representation | Composition execution and assurance | Failure/recovery composition | Installed artifact proof |
| Evidence | Exact input identity | Complete denominator/negative cases | Semantic/non-collapse/formal joins | Fault/restart/security evidence | Independent review |
| Portfolio | Current-state contract | All directories dispositioned | Formal/application counterparts | Existing four-product join | Whole-scope closeout |
| Operations | Preserve selected bytes | Stage-local tools/recovery | No implicit provider authority | Exact optional live envelopes | Separate admission/publication |

## L0 - Minimum reconciled vertical

### Decision question

After this layer, we know whether one supported domain meaning can survive authoring, graph compilation and generated execution with exact provenance.

### Minimum working unit

One typed Entity and Query, equivalent direct JSON and supported Alch input, one known read-only result, and wrong-endpoint/type negative controls.

### Included scope

Selected preimage capture; current-state/support contract; candidate Definition Pack; minimal vertical DSR-001/003/006/007.

### Explicitly deferred scope

Full 70-directory closeout, richer relationship representation, new Calculation semantics, runtime orchestration, formal proof expansion, live services and packaging.

### Outcome and risk

- User/operator outcome: An inspectable end-to-end example that does not invent Operations or storage behavior.
- Risk reduced: Restarting from stale guides or treating compiler output as semantic proof.
- Main cost drivers: Source selection, defining exact equality/claim boundaries and isolated generated-code execution.

### Exit evidence

V01/V02/V04/V07/V08/V09; exact source and output identities; one positive and non-vacuous negative corpus. Check definitions are in [VALIDATION.md](VALIDATION.md).

### Promotion decision

Continue when the vertical works with truthful types and provenance. Repair the selected profile if it fails; do not hide failure behind a broader roadmap.

### Prior guarantees preserved

User-owned state, immutable baselines, no implicit effects and no authority gained from a prototype.

## L1 - Complete selected core contract

### Decision question

After this layer, we know whether the selected core semantics can be represented, compiled and observed without collapsing distinct concepts.

### Minimum working unit

Complete type/profile matrix and BMC contract crosswalk, followed by all supported metatype realization cells and semantic counterexamples.

### Included scope

DSR-002/004/008-019/029/032/041: portfolio mapping, BMC recovery/disposition, fields/references, orthogonal constraints, composition boundaries, pure calculations, mapper inputs, Rule/Policy, State Machine, Workflow, realizations, projections and suite discovery.

### Explicitly deferred scope

General composition assurance/runtime joins, new FormalClaim adoption, full durable provider execution and external release.

### Outcome and risk

- User/operator outcome: The core graph and code express the same selected contract; every excluded/candidate surface has an owner and visible disposition.
- Risk reduced: Global multiplicity overconstraint, invented helper Operations, trigger/effect confusion, hidden untyped placeholders and missing tests.
- Main cost drivers: Contract decisions, compatibility fixtures, changes across validators and three language realizations.

### Exit evidence

V03/V05/V10-V27/V45/V51/V60; 39-row expanded support matrix; complete decision-to-test correspondence. Check definitions are in [VALIDATION.md](VALIDATION.md).

### Promotion decision

Continue only after required core cells pass and all unsupported cells are explicit. Do not claim semantics are complete merely because all 13 generators exist.

### Prior guarantees preserved

L0 meaning/provenance guarantees, current accepted input behavior under its version, and immutable historical evidence.

## L2 - Composition, formalization and runtime agreement

### Decision question

After this layer, we know whether downstream execution and assurance consumers preserve the selected compiler meaning.

### Minimum working unit

One nontrivial Mapping/Query/Rule/Calculation composition with generated/runtime parity, exact certificate closure and a bounded SFOL/TDE/EVF claim join.

### Included scope

DSR-005/020-024/026/030/031: historical v3 recovery/disposition, composition assurance/runtime, FormalClaim version preservation, bounded EVF join, local workflow execution, generic application compiler, non-collapse and portability.

### Explicitly deferred scope

General durable claims, live inference/security assertions, production scale and public distribution.

### Outcome and risk

- User/operator outcome: A supported composition can be compiled, executed and verified within explicit proof and runtime profiles, without conflating those guarantees.
- Risk reduced: Compilation certificates mistaken for proofs, absent EVF treated as passed, untyped runtime crashes and profile-version confusion.
- Main cost drivers: Provider claim boundaries, formal preservation, replay/mutation evidence and cross-frontend/language equivalence.

### Exit evidence

V06/V28-V36/V40/V46-V50; exact profile/source/definition/provider identities and negative evidence. Check definitions are in [VALIDATION.md](VALIDATION.md).

### Promotion decision

Continue when each required consumer sees the same selected meaning and rejected/missing evidence remains fail-closed. Unsupported proof scope cannot satisfy a required product promise.

### Prior guarantees preserved

All L0/L1 core and compatibility guarantees, explicit graph/value/reference boundaries and no stale evidence inflation.

## L3 - Failure, migration and selected-product recomposition

### Decision question

After this layer, we know whether the selected four-product system remains coherent under failure, recovery and migration.

### Minimum working unit

A local selected provider plus workflow/application path exercised across crash, retry, cancellation and migration boundaries, joined to exact compiler/EVF/recovery/legacy versions.

### Included scope

DSR-025/027/028/033/034/037 and optional exact-envelope DSR-043: durable provider, request/stream/custody/security, storage bindings, four-product compatibility, product documentation and compatibility migration.

### Explicitly deferred scope

Unselected provider implementations, production load/availability promises, public publication and operational rollout.

### Outcome and risk

- User/operator outcome: Users can follow tested examples and migration guidance, while local failure/recovery guarantees match the declared selected bindings.
- Risk reduced: Lost intent, duplicate or unauthorized effects, trigger/output ambiguity reappearing in runtime, caller breakage and stale user docs.
- Main cost drivers: Fault injection, process restart, transaction/fencing/replay behavior, composed compatibility and security review.

### Exit evidence

V37-V44/V52/V53/V56 and V61 only for requested live claims; zero hidden required provider gaps. Check definitions are in [VALIDATION.md](VALIDATION.md).

### Promotion decision

Continue when the selected local product corpus and migrations pass. Keep unrelated operational access pending; do not substitute a local demo for a production guarantee.

### Prior guarantees preserved

L0-L2 semantic, proof-scope, package-independent source and compatibility guarantees; UI remains excluded from v1.0.

## L4 - Exact package and owner decisions

### Decision question

After this layer, we know whether one exact installable product candidate substantiates the full reconciliation claim and is eligible for separately owned decisions.

### Minimum working unit

Immutable source/evidence manifest, clean installed archive, full required corpus, whole-scope closeout and independent review.

### Included scope

DSR-035/036/042/038: candidate freeze, installed-package proof, scope closure and product review. DSR-039/040 are subsequent separately authorized operational/admission lanes, not automatic layer effects.

### Explicitly deferred scope

External publication, deployment, canonical cutover or operational claims without their explicit owner decisions.

### Outcome and risk

- User/operator outcome: An exact package with trustworthy support documentation and evidence, rather than a moving source tree or ambiguous version label.
- Risk reduced: Source/dist/archive drift, missing exported commands, hidden workspace dependencies, and admission/publication inferred from local PASS.
- Main cost drivers: Isolated installations, full replay, archive reproducibility, independent review and immutable candidate management.

### Exit evidence

V54/V55/V57/V62; V58/V59 only when their separate effects are actually requested and authorized. Check definitions are in [VALIDATION.md](VALIDATION.md).

### Promotion decision

Request product approval only for the exact tested candidate. Then seek separate canonical admission and publication decisions if requested; changed bytes start a new evidence/review epoch.

### Prior guarantees preserved

All prior guarantees, exact historical admissions and archives, explicit approval/admission/publication separation.

## Implementation wave backbone

- W0: DSR-001/003/006/007 for the minimum proof.
- W1: contract/representation branches and DSR-029/032 test/tool preparation.
- W2: composition, runtime, formalization and semantic equivalence joins.
- W3: selected provider failure proof, four-product compatibility, migration and docs.
- W4: exact package, complete review and separate owner decision envelopes.

Use the full work-item DAG, not this shorthand, to decide readiness. Operational
tasks block only their exact affected stages as described in PLAN.md.

## Non-regression guardrails

Preserve type meanings, graph/reference/value boundaries, identity/cardinality,
explicit effects, immutable baselines, deterministic evidence, compatibility
profiles, user-owned dirty state and the existing release scope. No layer may
trade a required negative test or proof obligation for a green dashboard.

## Recommended next layer

L0, beginning with DSR-001 after an explicit execution request. The primary
decision is whether one actual supported meaning can be traced and reproduced
end to end; the minimum vertical does not wait for every historical receipt.

## Open Questions

Owned by [DECISIONS.md](DECISIONS.md). Provider selection, versioning and canonical
admission are not silently chosen by a layer boundary.
