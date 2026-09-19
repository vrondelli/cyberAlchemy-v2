---
module: domainspec-v2-validation-architecture-roadmap
status: current-navigation-roadmap
updatedAt: 2026-08-25
docType: implementation-layering-roadmap
authorityScope: private-planning-navigation-only
authorityEffect: none
executionAuthorized: false
---

# DomainSpec v2 Validation Architecture Roadmap

## Purpose And Authority Boundary

This roadmap turns the current validation work into an architecture-directed
sequence. It answers two different questions:

1. Which transformations must be serialized because one consumes the exact
   output or owner decision of another?
2. Which independently owned lanes may advance in parallel because their
   current exact write scopes and semantic responsibilities are disjoint?

It is private planning and navigation evidence. It does not accept a candidate,
select a unit, admit mutation, execute a Task Session, grant authority, or
promote, retire, release, deploy, commit, or push anything. Stream-local Work
Packs and their latest receipts remain authoritative for current gates. The
[dependency graph](DEPENDENCY-GRAPH.json) and
[concurrency matrix](CONCURRENCY-MATRIX.json) are machine-readable projections
of this document, not execution contracts.

## Target And Current Constraint

- **Target:** one coherent DomainSpec v2 validation architecture from exact
  source meaning to independently consumed evidence.
- **Current state:** partially implemented; several bounded lanes have design,
  planning, or local evidence, but no receipt proves the complete vertical.
- **Primary operators:** DomainSpec semantic owners, provider owners, EVF
  owners, independent consumer owners, and promotion owners.
- **Primary constraint:** preserve identity, ownership, failure truth, and claim
  ceilings at every seam while avoiding unnecessary serialization.
- **Progress measure:** decisions and capabilities proven at their declared
  ceilings, not the number of runs or files created.

The live status projection is the [EVF Architecture And Progress Map](../evolvable-validation-framework/THREAD-MAP.md).

## Logical Architecture

```text
DomainSpec FormalClaim, feature semantics, and relationship decision owners
        |
        | exact source identity plus separately accepted semantic contracts
        v
validation governance admits one meaning-preserving projection
        |
        v
TDE derives deterministic language-neutral obligations and cases
        |
        +--------------------+---------------------+-------------------+
        v                    v                     v                   v
 language runtimes       SMT provider        TLA/TLC provider   graph providers
                                                            Souffle + Alloy
        +--------------------+---------------------+-------------------+
                             |
                             v
        EVF normalizes receipts, preserves residue, and joins exact evidence
                             |
                             v
        independent consumer, initially one exact IOLM-controlled receipt
                             |
                             v
        CyberAlchemy v2 owner gates decide promotion, release, or retirement
```

The architecture is role-based, not directory-based:

- **Relationship-constraint Design** is an upstream semantic-authority lane.
  Its owner selects relationship meaning; EVF, TDE, and providers may consume
  only a separately accepted versioned executable contract and may not finish
  or reinterpret the decisions themselves.
- **TDE** is the upstream obligation producer. It does not own DomainSpec
  meaning and is not an EVF downstream consumer.
- **Evidence providers** own bounded tool execution and raw provider truth.
- **Souffle and Alloy** are existing bounded graph-property providers. Alloy
  maps SAT to a counterexample, UNSAT to no counterexample under declared
  bounds, and unknown to unresolved.
- **EVF** owns exact evidence intake, normalization, composition, residue, and
  non-inflating handles. Its graph join claims only
  `property-specific-consistency-over-shared-facts-only`.
- **IOLM** is an independently owned consumer. EVF cannot author its own
  independent consumer proof.
- **BTE absorption** is EVF L3 breadth and migration work, not a second
  validation architecture.

## Smallest System-Level Proof

Layer 0 is one exact vertical, not completion of every lane:

```text
one exact FormalClaim
  -> one admitted executable projection
  -> one deterministic TDE obligation/case set
  -> one selected provider execution receipt
  -> one EVF normalized or joined evidence handle
  -> one independently authored consumer receipt
```

The provider and consumer for this first slice must be explicitly selected
from evidence-ready branches. This roadmap does not silently choose SMT,
TLA/TLC, Souffle/Alloy, or IOLM bytes on an owner's behalf. No current receipt
proves the complete vertical.

After Option B closes and a separate executable relationship contract is
accepted, one exact `owns` cycle/closure rule is a plausible L0 property input:
TDE can derive the bounded obligation, Souffle and Alloy can evaluate the same
frozen facts, and EVF can join only comparable receipts. This is an architecture
candidate, not a provider, property, consumer, or execution selection.

## Layering Method

Each layer ends at the smallest slice that unlocks a responsible next decision:

```text
Layer value = decision unlocked + operator-visible outcome + risk reduced
Layer cost = implementation time + verification time + coordination burden
```

Work moves to a later layer when its next unit contributes less value to the
current decision than beginning the next decision. Every later layer must
preserve the exact identities, ceilings, residue, and independent evidence
established earlier.

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Operator-visible outcome | Principal risk reduced | Main cost drivers | Promotion decision |
| --- | --- | --- | --- | --- | --- | --- |
| L0 — bounded vertical | After this layer, we know whether one exact claim can cross source, projection, derivation, provider, EVF, and independent-consumer seams without identity loss or claim inflation. | One exact end-to-end vertical with one selected provider branch and one independent consumer receipt | A human can follow one immutable claim and its evidence across every owner boundary | The architecture may consist of locally valid parts that cannot safely compose | Seam adapter, exact selectors, owner coordination, end-to-end replay | Continue if the complete chain replays at the same ceiling; otherwise repair or narrow the failing seam |
| L1 — repeatability | After this layer, we know whether the bounded vertical is repeatable and independently reproducible rather than a one-run coincidence. | Replay the same vertical from frozen inputs plus one independent reproduction/closure receipt | The same input yields the same bounded result or the same typed residue | Hidden ambient state, stale handles, and irreproducible evidence | Runtime locks, replay, terminal closure, drift and tamper negatives | Harden if replay is exact; narrow or stop if identity/currentness cannot be reproduced |
| L2 — provider and language breadth | After this layer, we know whether multiple implementation languages and formal providers can advance in parallel without changing neutral obligations or provider truth. | TDE language/profile parity plus at least two separately owned provider lanes over frozen contracts | Operators can choose an admitted provider without changing DomainSpec meaning | Provider lock-in, translation drift, and false majority voting | Independent runtimes, correspondence checks, parity, owner gates | Expand only when each lane passes independently; disagreement remains unresolved evidence |
| L3 — EVF breadth and BTE absorption | After this layer, we know whether EVF can own the exact broad denominator while BTE becomes forwarding-only and real consumers retain behavior. | W0 freeze, successor core/composition, parity, routing/facade, consumers/references, and rollback | One EVF-owned breadth surface with reversible compatibility | Denominator drift, semantic migration error, hidden live references, irreversible cutover | Whole-pack refresh, exact inventories, parity, consumer coordination, rollback | Retain facade or proceed to a separate retirement decision based on current evidence |
| L4 — promotion and retirement | After this layer, we know whether the evidenced capability merits promotion, packaging, release, or legacy retirement under current authority. | Independent closure, current rollback proof, exact owner decisions, and release-specific evidence | A bounded owner decision with explicit residue and reversal path | Treating validation evidence as authority or shipping claims | Independent review, security/release evidence, current inventories, owner decisions | Promote, release, retire, defer, or reject; never infer authority from technical PASS |

## Layer Definitions

### L0 — One Bounded End-To-End Vertical

**Included scope**

- One immutable FormalClaim and admitted executable projection.
- The smallest TDE chain needed to produce one deterministic obligation/case
  set and one admitted first trust lane.
- One explicitly selected provider execution with exact runtime, request,
  translation, scope, and receipt identity.
- One separately planned EVF seam that normalizes or joins that receipt without
  widening its claim.
- One independently authored consumer receipt over the exact EVF handle.

**Explicitly deferred**

- Python/Rust parity, broad solver/model corpora, additional graph laws, the
  17-relationship EVF denominator, BTE migration, Body War breadth, packaging,
  release, deployment, and production claims.

**Exit evidence**

- One immutable cross-seam inventory with exact paths, sizes, and digests.
- Recomputable TDE, provider, EVF, and consumer receipts whose references form
  one continuous chain.
- Negative validation showing a stale, mismatched, widened, or owner-collapsed
  handle fails closed.
- An explicit residue list and unchanged authority effect.

**Promotion decision**

- Continue when the complete chain independently replays without identity loss
  or claim inflation.
- Pivot when a narrower provider or consumer branch can isolate one failed
  seam without changing source meaning.
- Stop when the source-to-evidence mapping cannot be made exact or the consumer
  cannot remain independent.

**Value/cost boundary:** extra providers and languages do not improve the core
composition decision enough to belong in L0; they begin L2 after repeatability.

### L1 — Repeatability And Independent Closure

**Included scope**

- Freeze all L0 inputs, tool identities, environment-sensitive selectors, and
  replay rules.
- Repeat the exact vertical and obtain an independently authored reproduction
  or closure receipt.
- Exercise currentness, tamper, missing-provider, unknown-result, and partial-
  failure paths without turning unresolved evidence into PASS.

**Explicitly deferred:** new languages, provider breadth, broad denominators,
migration, packaging, and authority decisions.

**Operator outcome:** the first useful chain is repeatable and diagnosable.

**Risk reduced:** ambient discovery, stale evidence, and one-run coincidence.

**Main cost:** exact runtime locks, replay fixtures, hostile mutations, and
independent review.

**Exit evidence:** two exact runs or one run plus independent reproduction,
with equal semantic results or equal typed residue and no hidden skips.

**Promotion decision:** expand only if L0 guarantees survive independent replay.

### L2 — Provider And Language Breadth

**Included scope**

- Complete the TDE TypeScript trust lane, then independently add Python and
  Rust lanes and prove semantic parity; keep Lean/DTT as a typed handle.
- Advance the SMT chain from protocol through translation, admitted runtime,
  owner-authored R4 binding, and independent closure.
- Advance the serial TLA/TLC factory-provider chain under its two owner gates.
- Freeze a new graph-property contract, then run Souffle and Alloy in parallel
  and join only exactly comparable receipts.

**Explicitly deferred:** majority-vote semantics, generic formal-method proof,
unbounded correctness, EVF broad migration, and release admission.

**Operator outcome:** multiple evidence routes remain selectable without moving
DomainSpec meaning into a runtime.

**Risk reduced:** provider lock-in, omission/invention in translation, and
syntactic parity masquerading as semantic parity.

**Main cost:** independent runtimes, translations, correspondence validators,
corpora, profile admission, and cross-provider replay.

**Exit evidence:** each lane passes independently at its own ceiling; provider
disagreement or unknown remains unresolved; no majority vote grants truth.

**Promotion decision:** retain only independently credible lanes and preserve
residue from every rejected or unresolved lane.

### L3 — EVF Breadth And BTE Absorption

**Included scope**

- Exact W0 evidence freeze and P5-1 refresh.
- Contracts/fixtures, semantic validation, formation, proof, composition,
  parity, routing, and forwarding facade in their declared order.
- Independent consumer and live-reference work in parallel after the facade,
  when refreshed exact write sets remain disjoint.
- Current rollback rehearsal followed by a separate retirement request.

**Explicitly deferred:** automatic BTE removal, release, deployment, production,
and authority changes.

**Operator outcome:** EVF owns the 17-relationship breadth behavior while the
legacy surface remains reversible and compatibility evidence is current.

**Risk reduced:** denominator drift, behavior-changing migration, masked
constituent failure, and irreversible routing.

**Main cost:** exact family materialization, full parity, shared package/index
coordination, independent consumers, reference classification, and rollback.

**Exit evidence:** successor-only formation/proof/composition, exact old/new
parity, facade purity, independent consumer receipts, zero unresolved live
references, and current rollback evidence.

**Promotion decision:** ask separately whether the facade may be retired; a
technical PASS never performs retirement.

### L4 — Promotion, Packaging, Release, And Retirement Decisions

**Included scope**

- Current exact inventories, independent closure, non-regression, rollback,
  security/release evidence, and explicit promotion or retirement decisions.

**Explicitly deferred:** any claim not supported by the exact selected evidence,
including generic correctness, production fitness, or public shipping.

**Operator outcome:** owners can make a bounded, reversible decision from
current evidence rather than from plan/readiness status.

**Risk reduced:** conflating technical evidence with authority.

**Main cost:** independent review, release-specific evidence, owner
coordination, and preservation of private/public boundaries.

**Exit evidence:** exact owner receipts tied to the final candidate and its
current validation/rollback inventory.

**Promotion decision:** promote, package, release, retire, defer, or reject.

## Current Status Overlay

| Lane | Architecture role and advancement | Current gate | Current claim ceiling |
| --- | --- | --- | --- |
| Relationship constraints | Upstream DomainSpec semantic authority; N01-N34 are selected and owner Option B fixes the scope to the backend-active 17-row nonnumeric frontier | Post-N34 sequencing selected `emits + ordering`; N35 is formed but unselected at its owner decision. Current aggregate Design validation reports 2,502 checks and zero failures, but does not select N35 or finish the frontier | Scope and Design-decision evidence only; packet acceptance, executable-contract acceptance, TDE/property binding, EVF adoption, implementation, and execution remain false |
| TDE multiformalism epoch | Upstream obligation producer; ten-unit neutral-IR and profile architecture is planned | Candidate `dsv2-tde-multiformalism-profile-epoch@4` has 84 materialized planning targets but is blocked on truthful successor preacceptance before owner acceptance and selection | Planning and blocker evidence only; no TDE product implementation or profile admission |
| SMT provider | Provider protocol and bounded solver-free validation corpus exist | Fresh authorized SWU-001 retry needs a strict context pack with native top-level `task_id` and `swu_id`; later runtime and R4 gates remain | Protocol evidence only; no admitted solver execution or domain truth |
| Formal Model Proof Provider | Six-unit TLA/TLC provider plan and terminal receipt contracts are ready | Factory material lock and exact Plan acceptance are pending; no unit selected | Frozen-input contractual readiness only; no provider execution or EVF adapter |
| Graph-property spine | One exact reachability property has bounded Souffle and Alloy evidence plus a non-inflating join | One separately authored next property contract must precede provider extension | Property-specific consistency over shared facts under declared bounds only |
| EVF L3 breadth/BTE absorption | Exact 17-relationship denominator and current W0 planning frontier are represented | Current W0 exact candidate request is pending owner decision; later families need P5-1 refresh | Owner-request/planning evidence only; no migration, retirement, release, or production claim |
| IOLM DSC-A | Independently owned consumer route is selected | `00C-B/C` substrate remains blocked, so no passing DSC-A receipt exists | Selection-only evidence; no independent consumer proof |

Status sources:

- [Relationship Option B selection](../relationship-constraint-decisions/BMC-REL-001/decision-gate/BMC-REL-EVF-INTEGRATION-SCOPE-OWNER-SELECTION-RECEIPT.json),
  [current Design result](../relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/DESIGN-RESULT.md),
  and [current Design validation](../relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/DESIGN-VALIDATION.json)
- [TDE Work Pack](../test-derivation-engine-next-epoch/invoke-define-design-plan/20260825T001515Z-tde-multiformalism-profile-epoch-r4/plan/WORK-PACK.md)
  and [preacceptance blocker](../test-derivation-engine-next-epoch/invoke-preacceptance-closure/20260825T115450Z-tde-r4-preacceptance-closure/BLOCKER-RECEIPT.json)
- [SMT Work Pack](../evolvable-validation-framework/development/refinement-runs/20260823T233323Z-evf-smt-provider-advance/plan/WORK-PACK-EVF-SMT-PROVIDER.md)
  and [latest Task Session block](../../../../.arcanum/task-session/evf-smt-provider-epoch-001-SWU-EVF-SMTP-001-20260824T121304Z/attempt-002-runtime/route-scope-repair-v2-retry-001/TASK-SESSION-BLOCK-RECEIPT.json)
- [Formal Model Proof Provider Work Pack](../formal-model-proof-provider/invoke-plan/20260824T042948Z-fmp-six-unit-candidate-r2/WORK-PACK.md)
  and [parent refresh receipt](../formal-model-proof-provider/invoke-refresh/20260824T042948Z-wp-fmp-002-terminal-receipt-refresh/PARENT-REFRESH-RECEIPT.json)
- [EVF breadth Work Pack](../evolvable-validation-framework/development/refinement-runs/20260824T012120Z-evf-l3-breadth-consolidation/p5-invoke-plan/WORK-PACK.md)
  and [current W0 request](../evolvable-validation-framework/development/refinement-runs/20260824T012120Z-evf-l3-breadth-consolidation/p5-invoke-plan/refresh-runs/20260824T232151Z-swu-evf3-001-v2-preacceptance-closure/preacceptance/OWNER-ACCEPTANCE-REQUEST-V2.json)
- [IOLM predecessor decision](../evolvable-validation-framework/decision-runs/20260823T201735Z-iolm-predecessor/DECISION.json)
  and [candidate review](../evolvable-validation-framework/dispatch-runs/20260823T232335Z-bte-iolm-owner-candidate-review/findings.md)
- [Graph-property layering](../evolvable-validation-framework/IMPLEMENTATION-LAYERING.md),
  [Alloy provider adapter](../../impl/test-derivation-engine/src/minted-project/l2/alloy.ts),
  and [exact join](../../impl/test-derivation-engine/src/minted-project/l2/join.ts)

## Global Wave Backbone

| Global wave | Serialized objective | Parallel-eligible work inside the wave | Exit condition |
| --- | --- | --- | --- |
| G0 — truthful gates | Resolve each lane's own prerequisite before its product edge | Relationship N35 owner decision and remaining Option B Design; TDE successor preacceptance; SMT fresh context identity; two FMP owner decisions; EVF W0 decision; IOLM exact target inventory and substrate decision; next graph-property contract design | Each advancing branch has its own current exact owner/admission evidence; no cross-lane gate substitutes for another |
| G1 — first bounded lane evidence | Preserve each stream's internal order | Relationship nonnumeric completion, contract compilation, and separate acceptance; TDE 001-004; SMT 001-003 after runtime admission; FMP 001-003 after both owner gates; EVF evidence-only W0; graph providers after an exact accepted property binding; IOLM DSC-A after substrate and exact inventory freeze | At least one eligible semantic contract, provider, and consumer branch can support a proposed L0 slice |
| G2 — L0 integration | Select one exact vertical, plan/admit its EVF seam, then execute and independently replay it | Non-selected lanes may continue only within their own exact gates and disjoint scopes | One complete source-to-consumer receipt chain exists at a bounded ceiling |
| G3 — repeatability and breadth | Preserve lane-local dependencies and freeze shared contracts before fan-out | TDE Python/Rust/extension/Lean branches; SMT and FMP serial internals; new graph provider runs; independent reproduction | L1 replay passes and L2 branches have independent receipts, not majority-vote truth |
| G4 — EVF migration | Freeze W0/P5-1 baselines after relevant upstream changes, then serialize contracts -> semantics -> formation -> proof -> composition -> parity -> routing -> facade | Provider lanes that do not touch shared contracts/package routing may continue in isolated scopes | Successor behavior is exact, parity holds, and BTE is forwarding-only |
| G5 — consumers, references, rollback | After facade, run disjoint consumer/reference classes; join them before rollback; ask retirement only afterward | W4 independent consumers and W5 refreshed reference classes | Independent consumers and references close, rollback passes, and a separate owner decision handles retirement |

## Required Serialization Inside Each Lane

### Relationship constraints

```text
Option B scope selection
  -> exact relation/facet sequencing
  -> owner decision for that facet (currently N35 emits.ordering)
  -> repeat until the backend-active 17-row nonnumeric frontier is closed
  -> compile one versioned relationship-constraint contract
  -> separate packet acceptance
  -> separate executable-contract acceptance
  -> refresh any adopting TDE/property/EVF plan
  -> derive obligations and execute providers from the frozen accepted contract
```

N01-N34 are closed Design decisions, not an executable contract. The live N35
gate is formed and cumulative Design validation currently passes, but N35 is
unselected. Option B does not include numeric, runtime-cardinality, typed
representation, the full 31-row UI/backend packet, packet mutation, or product
implementation. The current EVF W0 candidate remains unaffected within its
frozen BTE-migration scope; adoption starts only through a later exact refresh.

### TDE

```text
fresh successor preacceptance + exact owner acceptance
  -> 001 contracts
  -> 002 admitted projection disposition
  -> 003 neutral obligations/cases
  -> 004 TypeScript trust lane
       +-> 005 Python --------+
       +-> 006 Rust ----------+-> 009 semantic parity --+
       +-> 007 extension gate ---------------------------+-> 010 independent reproduction
  -> 008 Lean/DTT handle --------------------------------+
```

Units 003 and 008 may advance after 002 on different branches. Units 005, 006,
and the remaining 007 dependency may advance after 004. Unit 009 waits for all
three runtime lanes; unit 010 waits for extension, Lean-handle, and parity
evidence.

### SMT provider

```text
fresh native-identity context retry
  -> 001 protocol
  -> 002 translation
  -> runtime owner admission
  -> 003 observed runtime
  -> semantic owner R4 predicate
  -> 004 exact R4 binding
  -> 005 independent closure
```

### Formal Model Proof Provider

```text
factory material-lock decision + exact Plan acceptance
  -> implementation-readiness selection
  -> 001 semantic kernel
  -> 002 factory seam
  -> 003 registered provider
  -> 004 Bolina corpus
  -> 005 Order Saga corpus
  -> 006 integration and closure
```

The EVF-to-factory adapter remains a separately planned seam after provider
evidence; it is not silently added to this provider Work Pack.

### Graph property

```text
freeze one exact property, facts, universe, mapping, and scope contract
       +-> Souffle execution --+
       +-> Alloy execution ----+-> EVF exact-comparability join
```

Provider executions may run in parallel only after the shared contract is
immutable. The join is serialized after both receipts and blocks or remains
unresolved when identity, scope, mapping, or outcomes are not comparable.

### EVF L3 breadth and BTE absorption

```text
W0 decision/execution -> P5-1 refresh
  -> contracts/fixtures -> semantic validation -> formation -> proof
  -> composition -> parity -> routing -> facade
       +-> independent consumers --+
       +-> live reference classes --+-> rollback -> retirement owner decision
```

Disjoint implementation files never permit bypassing semantic dependencies.
Routing changes to `projects/domainspec-v2/impl/package.json` and
`projects/domainspec-v2/impl/test-derivation-engine/src/index.ts` are serialized
integration hotspots.

### IOLM independent consumer

```text
resolve 00C-B/C substrate -> execute DSC-A -> independent receipt -> EVF consumer join
```

## Cross-Lane Parallelism

At the current frozen or no-write scopes, the following branches are
parallel-eligible after their own gates:

- Relationship Design decisions and planning may proceed while unrelated
  evidence-only or provider-planning work advances. Concurrent mutation is
  `unknown-block` until the relationship lane freezes exact future targets.
- TDE epoch work under
  `projects/domainspec-v2/impl/test-derivation-engine/src/epoch/v1/**`.
- SMT provider product work under
  `projects/domainspec-v2/impl/test-derivation-engine/src/sfol/smt/**`, with its
  exact EVF contracts, fixtures, and evidence.
- Formal Model Proof Provider work under
  `projects/domainspec-v2/impl/architecture-conformance/**`.
- EVF W0's six evidence-only outputs.
- IOLM-controlled planning and substrate resolution. IOLM mutation remains
  `unknown-block` until its owner freezes an exact target inventory; only then
  may it be reclassified for concurrent execution.
- A new graph-property contract design whose exact write inventory is separately
  frozen before provider fan-out.

This is permission to schedule only when each stream-local gate already permits
the work; it is not authority to execute. Required conditions are:

1. rehash exact baselines immediately before admission;
2. use isolated worktrees or equivalent exact-output isolation;
3. keep tests, temporary output, and evidence namespaces attempt-specific;
4. block on any newly overlapping exact target;
5. do not touch shared package routing, common EVF contracts, or common adapters
   without a refreshed serialized integration plan; and
6. join only terminal receipts whose identities and claim ceilings are exact.

The complete pairwise projection is in the
[concurrency matrix](CONCURRENCY-MATRIX.json).

## Integration Hotspots That Force Serialization Or Refresh

| Hotspot | Why it serializes | Required response |
| --- | --- | --- |
| `projects/domainspec-v2/impl/package.json` | EVF W3 changes canonical commands while provider/TDE tests may depend on those commands | Finish or freeze relevant upstream product bytes, rehash, then admit the routing unit alone |
| `projects/domainspec-v2/impl/test-derivation-engine/src/index.ts` | EVF W3 changes the shared export surface | Refresh after TDE/SMT changes; block on unexpected export drift |
| Common EVF request/receipt contracts | Provider translation and EVF normalization depend on the same semantic boundary | Freeze schema/version/digest before provider execution; changed contracts require new receipts |
| Accepted relationship contract and its TDE/property/EVF adapters | The semantic owner must finish and accept meaning before downstream owners derive obligations or bind providers | Compile and accept one versioned executable contract, then refresh every adopting plan; serialize or rehash shared contract and adapter targets |
| EVF provider adapters and handle schemas | They join independently owned evidence and therefore define a claim boundary | Plan as a separate seam; do not infer it from provider readiness |
| One exact target or baseline touched by two lanes | Directory-level disjointness no longer proves byte-level independence | Stop both affected apply edges, assign one owner/order, and recapture baselines |

## Non-Regression Guardrails

All later layers must preserve:

1. DomainSpec owners, not runtimes, own claim meaning.
2. Relationship decisions remain upstream owner evidence until separately
   compiled and accepted as an executable contract; downstream lanes do not
   infer missing facets.
3. TDE derives obligations deterministically and does not judge Lean/DTT or
   provider semantics.
4. Providers report their native bounded truth totally; failure and unknown
   never become semantic PASS.
5. EVF never inflates a provider claim, hides constituent failure, or joins
   mismatched request, facts, universe, property, mapping, or scope.
6. Souffle/Alloy consistency remains property-specific and bounded.
7. Independent consumers author their own receipts.
8. Each acceptance, selection, admission, promotion, release, or retirement
   edge remains separately authorized on current exact bytes.
9. BTE history remains immutable; migration affects only refreshed live
   surfaces and keeps a tested rollback path.
10. Parallel scheduling never stretches a stale baseline over concurrent bytes.
11. Private DomainSpec/CyberAlchemy meaning never leaks into public Arcanum.

## Recommended Next Layer

**Recommended next layer: L0.** First make one provider and one consumer branch
evidence-ready under their own gates, then explicitly select and plan the
smallest source-to-consumer vertical. Do not wait for every TDE language,
provider corpus, graph property, or BTE migration unit before proving the
architecture can compose once.

The most important deferred scope is EVF L3 breadth/BTE absorption. It should
begin product migration only after W0/P5-1 freezes a frontier that accounts for
the upstream bytes relevant to routing and shared contracts. Promotion,
retirement, release, deployment, and production remain L4 owner decisions.

In parallel, complete the owner-selected Option B relationship Design frontier.
Do not rebind current W0: only a later accepted executable contract may trigger
a refreshed TDE/property/EVF adoption plan.

## Maintenance Rule

- Derive lane status from the latest terminal receipt in that lane, then its
  exact owner request/acceptance record, then its Work Pack/readiness evidence.
- Update `status`, `current_gate`, and source refs in
  [DEPENDENCY-GRAPH.json](DEPENDENCY-GRAPH.json); never infer completion from
  Git status, file presence, a PASS in another lane, or an older handoff.
- Recompute [CONCURRENCY-MATRIX.json](CONCURRENCY-MATRIX.json) whenever an exact
  write target, common contract, package route, or execution output changes.
- Treat a changed acceptance-bound byte as a new candidate with new inventory,
  review, digest, and acceptance; never stretch an older acceptance.
