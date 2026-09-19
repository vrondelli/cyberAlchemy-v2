---
title: DomainSpec whole-product reconciliation
status: candidate-plan-partially-executed
updatedAt: 2026-09-08
owner: DomainSpec product owner
scope: existing DomainSpec portfolio, compiler, formalization, runtime and consumers
authority_effect: none
---

# DomainSpec whole-product reconciliation plan

Package: `DSV2-RECONCILIATION-001`. DSR-001 preservation, DSR-003 candidate
state-matrix authoring and DSR-006 candidate definitions are complete;
DSR-007's DomainSpec-only vertical passes while its Alch comparison is deferred
by the user. The remaining 39 units are not executed.
See the [preservation report](recovery/REPORT.md) and
[current matrix report](contracts/REPORT.md), plus the
[Definition Pack report](definition-pack/REPORT.md).
The current execution evidence is the [DomainSpec vertical report](evidence/l0/REPORT.md).
DomainSpec is the current focus; Alch reconciliation is deferred, not removed from the final product obligations.
It does not register an admitted Goals state or authorize implementation,
canonical changes, publication, deployment or external effects.

## Read this package

| Artifact | Purpose |
| --- | --- |
| [PLAN.md](PLAN.md) | Outcome, boundaries, architecture, sequence, work-item cards and closeout. |
| [WORK-ITEMS.json](WORK-ITEMS.json) | Planning source for all 43 work items, dependencies, roles, proposed touchpoints, deliverables, decisions and 62 validation cases. Not an executable runtime plan. |
| [implementation-layering.md](implementation-layering.md) | Five decision-first layers, minimum proof, value/cost boundaries and promotion evidence. |
| [VALIDATION.md](VALIDATION.md) | Required positive, negative, semantic, orthogonality, runtime, package and evidence checks. All product checks are planned, not run. |
| [DECISIONS.md](DECISIONS.md) | Thirteen proposed decisions, existing constraints, exact affected stages and owner boundaries. |
| [EVIDENCE.json](EVIDENCE.json) | Current source hashes, baseline drift, missing BMC references, Git state and complete pre-plan 70-directory inventory. |

## 1. Outcome and meaning of complete

The target is one coherent DomainSpec product in which a supported promise can
be followed from its meaning and ontology through its source contract, graph,
compiler, generated code, runtime, validation, documentation and exact package.

There are three deliberately separate outcomes:

1. **Inventory-reconciled:** every current or historical capability has an exact
   source, responsible owner, state, consumers, disposition and next action.
   Missing artifacts and exclusions are explicit. This is not functionality.
2. **Tested-product-reconciled:** every promised cell in the selected support
   matrix works through its required end-to-end path, fails correctly for its
   required negative cases, and is delivered by the exact tested package.
   Merely labeling a broken promised feature unsupported does not close it.
3. **Canonically-reconciled:** after exact product tests and product approval,
   separately authorized owners admit the selected definitions/profile/baseline
   changes and synchronize their derived views. An approved candidate alone is
   not canonical admission.

Publication, production deployment and external operations are separate outcomes.
They remain visible, but are not silently included in this planning request.

“All DomainSpec” means all portfolio surfaces receive a disposition and all
selected supported promises close. It does not mean implementing every abandoned
experiment or admitting every UI/research candidate. In particular, the existing
explicit UI exclusion from v1.0 remains unchanged. Any release-scope expansion
requires a separate decision and revised denominator.

## 2. Current evidence and known inconsistencies

The prior audit inspected the full portfolio and CLI packages. This planning
turn refreshed 42 selected source hashes, all 847 baseline members and the
exact current BMC frontier references. See [EVIDENCE.json](EVIDENCE.json).

| Surface | Observed starting state | Reconciliation obligation |
| --- | --- | --- |
| Core meaning | 13 backend metatypes; 31 canonical relationship signatures, including 17 backend | Preserve distinctions and specify each profile's meaning and limits. |
| Realizations | 39 TypeScript/Python/Rust rows; semantic depth differs by typed/untyped profile | Prove behavior, not only generator registration. |
| Frozen baseline | Current pointer names @10; 847 members exist; 811 hash-match and 36 differ | Classify divergence, preserve @10 and propose a new exact candidate if needed. |
| Working tree | 13 tracked modifications and 69 untracked paths before this plan | Preserve provenance and review selected work; do not call current source an accepted archive. |
| BMC work | Decisions/design through N45; seven current hash-bound references absent | Recover exact evidence or use a fresh candidate epoch; reconcile the stale packet. |
| Composition | Earlier Mapping/Query/Rule/Calculation support is already packaged; newer snapshot/shared-ontology work is a candidate | Reuse working code, complete profile semantics, assurance and runtime joins. |
| Application runtime | Generic application, request, streaming, custody and security work exists in the working tree | Review ownership, lifecycle, test inclusion, guarantees and packaging. |
| Formalization | TDE SFOL/v2 implementation; v3 historical candidate; FormalClaim v4 design unadopted | Separate carrier, logic, API and provider versions; prove conversions and exact joins. |
| Documentation | Guide says four types/three edges; Craft says @2; drift audit says @6 | Derive current views from exact selected evidence without rewriting historical receipts. |
| Release | Accepted successor and output-layout selections do not equal the newest package or current source | Select and test one exact installable candidate; preserve independent approval/publication states. |

Correction: the preceding response counted eight missing BMC references. The
fresh direct inspection counts **seven**, all absent. This package uses seven.
The receipt count is not a decision about whether the underlying work occurred.

Historical v3 recovery is based on the prior turn's original-session inspection:
patches and final audits targeted a now-missing temporary checkout. This turn
does not claim to have recovered or freshly tested those bytes.

## 3. Existing work is the starting point, not a second competing roadmap

This plan coordinates and reconciles the following work; it does not overwrite
its decisions, receipts or accepted bytes:

- [Current implemented baseline](../../definitions/meta-types/current-implementation.json)
  and [immutable @10 manifest](../meta-type-instantiation-cli/CANONICAL-IMPLEMENTED-BASELINE.v10.json).
- [BMC cardinality decisions](../relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md),
  their nested nonnumeric design and the [frontier binding](../../.craft/artifacts/BMC-REL-FRONTIER-BINDING.json).
- [Shared compilation reconciliation](../compilation-reconciliation/PLAN.md):
  review the existing implemented candidate instead of recreating it.
- [Accepted CLI successor](../cli-successor-candidate/acceptance-v2/decision.json)
  and [prepared output-layout package](../output-layout/release-preparation-v1/candidate.json).
- [Four-product completion plan revision 2](../completion-dag/v2/PLAN.md):
  compiler, bounded compiler/EVF integration, recovery/ORODI and legacy migration.
  Preserve its P01 compatibility and P02 review/product-decision boundaries.
- [Formalization package](../../formalization/README.md),
  [SFOL test closure](../../capabilities/sfol-test-closure/README.md) and
  [durable recovery architecture](../../architecture/durable-recovery/ARCHITECTURE.md).
- The 70 development directories enumerated in EVIDENCE.json. DSR-002 maps each
  to current work; DSR-041 gives every residual or historical capability an owner
  and explicit disposition.

The new folder itself is not part of that original 70-directory denominator.
Future newly discovered capabilities are added explicitly, not hidden by keeping
the old count fixed.

## 4. Non-negotiable semantic boundaries

### Domain concepts and fields

An Entity has identity; a Value Object has value semantics; an Enum has a closed
variant space. Shared typed-record representation does not erase those meanings.
A domain Entity is not automatically a database table, an embedded Entity is not
automatically an identity reference, and a reference is not automatically an
ownership edge or foreign key.

Specify scalar, declared-type reference, optional, list, set and sum composition.
Specify null/absence, identity projection, nesting, uniqueness, ordering, cycles,
unknown/open content, exact numeric limits and cross-language error behavior.
Public Alch names and arrow/field-reference syntax are design candidates until
the selected contracts and parser support are verified.

### Three different representations

| Representation | Owns | Must not imply |
| --- | --- | --- |
| Canonical domain graph | DS-D8 meanings, endpoints, scopes and selected constraint profiles | Execution order or arbitrary runtime calls from a graph arrow alone. |
| Composition-reference graph | Scoped calls/dependencies, mapping roles, bindings and result roots | Admission of a new DS-D8 verb or widening canonical endpoints. |
| Typed value bindings | Field/argument types, calculation values, mapper inputs and projections | Ownership, IO, database storage or state changes without their own contract. |

Canonical `maps` is not interchangeable with composition `maps-to`.
A scoped `depends-on` reference does not settle the deferred canonical verb.
A Calculation is pure and takes explicit inputs; it cannot gain implicit Entity
reads or justify an invented state-changing Operation. A real consuming Operation
may retain its lawful `calculates` relation.

A Rule remains a Boolean assertion/gate. A Policy selects a declared strategy;
selection does not execute it. Prefer reuse of declared Rules in the candidate
authoring model while adapting existing inline-predicate profiles explicitly.

An Event causing a State Machine transition is not the transition's output Event.
Workflow Operation identity is not step-occurrence identity. Graph degree is not
field cardinality, event occurrence count or workflow step count.

### Evidence and authority

Definitions, prototype ontology, implementation, tests, product approval,
canonical admission and publication are separate states. Preserve exact historical
artifacts. Never refresh a digest to conceal drift, manufacture a receipt, or
treat an old local PASS as present product acceptance.

## 5. Construction chain and selected dependencies

The implementation program follows this candidate chain:

```text
existing meaning and recovery evidence
  -> native Define Definition Pack and product/business ontology candidates
  -> versioned source/constraint/composition contracts
  -> explicit DomainSpec JSON and supported Alch authoring
  -> compiled graph and system-ontology projections
  -> generated code and selected runtime candidates
  -> exact product corpus and immutable package candidate
  -> current tests and independent review
  -> product approval
  -> separately authorized canonical admission or operational effects
```

Prototype contracts/scaffolds are not promoted authority. Do not force unsupported
Alch syntax to express the model before the model is selected; DomainSpec keeps
its direct authoring path and must not import Alch or ARE runtime/configuration.

Selected semantic dependencies are the 13 DS-D1 meanings, all 31 DS-D8 signature
records, D18-D30 distinction/axis rules, D31-D49 implementation/recovery/binding
meanings, typed contract/property identities, exact composition roles and selected
FormalClaim definitions/projections. Bind only the exact used records and source
hashes. An ambient ontology-runtime epoch does not block independent construction.

Before implementing any unit, issue a bounded construction sheet with exact
candidate inputs, selected records, affected files, tests, write allowance and
effect ceiling. The touchpoints in WORK-ITEMS.json are planning estimates, not
blanket cross-repository write authorization. Consumer changes in AlchLang,
Body War, Auth Foundation or another product require their exact scoped envelope.

## 6. Layering and scheduling

Detailed layer decisions are in [implementation-layering.md](implementation-layering.md).

| Layer | Decision unlocked | Main outcome |
| --- | --- | --- |
| L0 | Can one supported meaning survive source, graph and executable target under exact provenance? | Entity/Query minimum vertical plus current-state contract. |
| L1 | Can the complete selected core be represented and compiled without semantic collapse? | Fields, BMC profiles, mapping/policy/state/workflow contracts and 39-row coverage. |
| L2 | Can composition and formal/runtime consumers preserve that meaning? | Composition assurance/runtime, SFOL/EVF bridge and portable semantic evidence. |
| L3 | Can the existing selected products compose under failure and migration? | Bounded durable/application behavior, four-product join, docs and migration. |
| L4 | Does the exact installable candidate substantiate the reconciled product claim? | Full package proof, independent review and separate owner decision envelopes. |

There is no calendar promise: sizes S/M/L indicate relative effort and review
risk, not estimates of elapsed days. After L0, calibrate estimates using actual
implementation and verification time. Relationship representation, formalization
preservation and durable fault proof dominate uncertainty.

Potential critical chain:
`DSR-001 -> 003 -> 006 -> 007 -> 012 -> 013/018 -> 019 -> 020 -> 021 -> 024 -> 025 -> 033 -> 035 -> 036 -> 042 -> 038`.
This is an orientation, not a substitute for the full DAG. DSR-025 also depends
on persistence DSR-028; DSR-033 also requires the EVF/application/migration joins.

### Current frontier and first execution packet

Current state: **DSR-001 preservation and DSR-003 candidate matrix completed**. This
artifact grants no general execution authority. Current results are in the
[latest execution report](contracts/REPORT.md); original plan bytes and subsequent
synchronization preimages are preserved in their respective evidence packages.
The first packet is:

1. DSR-001: preserve and identify exact current inputs — completed.
2. DSR-003: establish support-state semantics and the matrix — candidate authored and validated; final owner selection remains separate.
3. DSR-006: candidate Definition Pack using existing language and distinctions.
4. DSR-007: minimal Entity/Query end-to-end proof.

After DSR-001, test-denominator repair DSR-029 and toolchain inspection DSR-032
can be prepared independently. BMC and SFOL recovery are parallel evidence lanes,
not global prerequisites for DSR-007. Do not dispatch agents automatically;
roles in this plan are assignments to make, not delegation authorization.

## 7. Work-item index

The machine work pack has 43 units: 36 product-construction and seven
operational-support. All are `planned-not-started`.

| ID | Layer | Lane | Deliverable focus |
| --- | --- | --- | --- |
| [DSR-001](#dsr-001) | L0 | Operations | Capture and preserve source identities |
| [DSR-002](#dsr-002) | L1 | Construction | Account for the entire DomainSpec portfolio |
| [DSR-003](#dsr-003) | L0 | Construction | Define the current-state and support matrix |
| [DSR-004](#dsr-004) | L1 | Operations | Recover or disposition the seven missing BMC receipts |
| [DSR-005](#dsr-005) | L2 | Operations | Recover the historical SFOL v3 candidate safely |
| [DSR-006](#dsr-006) | L0 | Construction | Create the reconciliation Definition Pack |
| [DSR-007](#dsr-007) | L0 | Construction | Prove one minimal reconciled vertical |
| [DSR-008](#dsr-008) | L1 | Construction | Reconcile all BMC decisions with the candidate contract |
| [DSR-009](#dsr-009) | L1 | Construction | Reconcile field types, identity and references |
| [DSR-010](#dsr-010) | L1 | Construction | Implement versioned relationship constraints consistently |
| [DSR-011](#dsr-011) | L1 | Construction | Specify the three composition representations |
| [DSR-012](#dsr-012) | L1 | Construction | Reconcile the existing shared snapshot compilation work |
| [DSR-013](#dsr-013) | L1 | Construction | Remove the pure-calculation support-Operation mismatch |
| [DSR-014](#dsr-014) | L1 | Construction | Make mapper inputs and computed dependencies explicit |
| [DSR-015](#dsr-015) | L1 | Construction | Reconcile Rule and Policy composition |
| [DSR-016](#dsr-016) | L1 | Construction | Separate transition triggers from emitted effects |
| [DSR-017](#dsr-017) | L1 | Construction | Represent workflow steps independently of Operation identity |
| [DSR-018](#dsr-018) | L1 | Construction | Close all 13 metatype realization contracts |
| [DSR-019](#dsr-019) | L1 | Construction | Regenerate contract projections and verify targets |
| [DSR-020](#dsr-020) | L2 | Construction | Extend assurance to the composition contract |
| [DSR-021](#dsr-021) | L2 | Construction | Make composition executable through the supported runtime |
| [DSR-022](#dsr-022) | L2 | Construction | Reconcile FormalClaim and SFOL version contracts |
| [DSR-023](#dsr-023) | L2 | Construction | Close the bounded compiler-to-SFOL/TDE/EVF join |
| [DSR-024](#dsr-024) | L2 | Construction | Execute workflow occurrences and recovery intent |
| [DSR-025](#dsr-025) | L3 | Construction | Prove a bounded durable recovery provider |
| [DSR-026](#dsr-026) | L2 | Construction | Reconcile the candidate application compiler as a generic product |
| [DSR-027](#dsr-027) | L3 | Construction | Close request, stream, custody and security contracts |
| [DSR-028](#dsr-028) | L3 | Construction | Separate domain types from database realization |
| [DSR-029](#dsr-029) | L1 | Construction | Make the test denominator complete and runnable |
| [DSR-030](#dsr-030) | L2 | Construction | Prove semantic distinctions, non-collapse and orthogonality |
| [DSR-031](#dsr-031) | L2 | Construction | Prove cross-language and cross-frontend equivalence |
| [DSR-032](#dsr-032) | L1 | Operations | Verify the selected toolchain without changing it |
| [DSR-033](#dsr-033) | L3 | Construction | Recompose the existing four-product completion plan |
| [DSR-034](#dsr-034) | L3 | Construction | Generate accurate product documentation and examples |
| [DSR-035](#dsr-035) | L4 | Construction | Freeze one exact reconciled product candidate |
| [DSR-036](#dsr-036) | L4 | Construction | Build and test the installable package in isolation |
| [DSR-037](#dsr-037) | L3 | Construction | Close compatibility and legacy migration |
| [DSR-038](#dsr-038) | L4 | Construction | Independently review and request exact product approval |
| [DSR-039](#dsr-039) | L4 | Operations | Obtain separate canonical admission and migration authority |
| [DSR-040](#dsr-040) | L4 | Operations | Prepare separately authorized publication and operation |
| [DSR-041](#dsr-041) | L1 | Construction | Disposition UI, research, calibration and historical work |
| [DSR-042](#dsr-042) | L4 | Construction | Audit whole-scope reconciliation closure |
| [DSR-043](#dsr-043) | L3 | Operations | Arrange optional live provider access only when required |

## 8. Operational-support lane and causal blockers

| Unit | Owner | Exact affected stage | Blocking rule |
| --- | --- | --- | --- |
| DSR-001 preservation | Repository custodian | Any mutation of selected source | Missing exact preimages or an active writer blocks the overlapping mutation only. |
| DSR-004 BMC recovery | Evidence custodian | DSR-008 correspondence and any old-receipt completion claim | Recover exact bytes or record unavailable and plan a fresh epoch; unrelated prototypes continue. |
| DSR-005 v3 recovery | SFOL custodian | Selection of recovered code in DSR-022/023 | Missing fragments block that reuse, not current v2 inventory or other compilation work. |
| DSR-032 toolchain | Toolchain owner | Particular build/test cells | Missing runtime/compiler blocks its cells; no arbitrary global install. |
| DSR-039 admission | Relevant canonical owners | Canonical cutover only | Tested candidate construction can finish without admission; no canonical claim before it. |
| DSR-040 publication | Release/deployment owners | External distribution/operation only | No dependency on local prototype progress. |
| DSR-043 live access | Provider/service owner | Only a test that claims live provider behavior | Local deterministic tests continue; missing live evidence cannot satisfy a live claim. |

Current evidence blockers: unavailable BMC completion receipts, uncertain recovered
v3 source closure, unresolved prototype contract choices and unproved provider
guarantees. None is an excuse to suppress independent construction or report
missing evidence as PASS. New safety/privacy/credential/destructive boundaries
must identify the exact affected unit and owner.

## 9. Acceptance corpus and verification strategy

Reuse existing Pricing, Body War, Auth and four-product fixtures where their
profile is applicable. Add one proposed Commerce corpus to cover relationships
between concepts; do not present its Alch syntax as implemented in advance.

The Commerce corpus should include Order identity and reference projections,
nested value objects and enums, optional/list/set/sum fields, a pure OrderTotal,
a mapping with an explicit total input, declared Rules and Policy, a write
Operation with atomic state/outbox, trigger/output-separated state transitions,
repeated qualified workflow occurrences and failure/compensation intent.
Store trigger events, output intents, type bindings and relationship dimensions
as distinct facts. This is a test design, not an authored language feature claim.

Every supported cell requires:
positive semantics; specific invalid/unknown cases; mutation/non-collapse witness;
orthogonality where applicable; deterministic regeneration; frontend/language
equivalence within stated scope; exact evidence and clean installed-consumer proof.

The 62 check families in [VALIDATION.md](VALIDATION.md) define the denominator.
The 39 realization rows are not 39 sufficient tests. Expand their typed/untyped,
input, error, effect and portability obligations explicitly. Required skips,
unavailable providers and absent suites remain visible non-passing cells.

## 10. Compatibility, versioning and publication boundaries

Never edit @10 or accepted package archives in place. Changed contract semantics
require a new versioned profile/candidate and an explicit compatibility strategy.
Do not require byte-equality of different frontend source provenance when the
contract calls for semantic equality; do require exact hashes where acceptance
binds exact bytes.

Retain old input fixtures, legacy ontology adapters and explicit local-compat
paths until a selected migration proves replacement and retirement is separately
authorized. No silent backend fallback. New unsupported constructs must reject
with a clear upgrade/profile diagnostic.

Build and test a new archive outside the checkout. Installed consumers must not
depend on sibling source trees, development-directory code, local host paths or
undeclared tools. Qualify all advertised commands and exports, including newly
exposed application/formalization behavior.

The final product review must bind one exact archive and its source/evidence
manifest. It cannot approve “whatever is currently in dist.” Product approval
does not publish, deploy, admit a profile or authorize a submodule/branch change.

## 11. Unit execution, handoff and rollback contract

Each future unit begins by refreshing only its selected input hashes and known
predecessor evidence. Its handoff must contain unit ID, responsible role/person,
definition and ontology refs, profile versions, exact file allowlist, preimages,
required tests, artifact identities, effect boundaries and causal blockers.

A unit closes only when deliverables exist, required tests are current, consumer
links agree and a reviewer can reproduce the claim from exact inputs. A task
status edit is not evidence. Record failed/not_evaluable checks collect-all
without skipping dependent obligations.

Use additive candidates for semantic changes and recovery. If the candidate
fails, leave the previous accepted profile usable; correct the candidate in a
new evidence epoch. Re-run affected predecessor and downstream tests. Never use
reset/checkout deletion, rewrite accepted history, or copy unverifiable old
receipts as rollback.

The plan may schedule independent owners in parallel, but each concurrent writer
needs a disjoint or explicitly coordinated write scope. Shared contract changes
must land before dependent code is accepted. An independent reviewer must not
be represented as independent if it is merely the same author rechecking.

## 12. Detailed work-item cards

These cards mirror WORK-ITEMS.json. That file carries the full inputs, proposed
touchpoints, sizes and execution-authorized flags as planning data.

## DSR-001

### Capture and preserve source identities

- Layer/lane: L0; operational-support. Owner role: Repository custodian; person unassigned.
- Dependencies: none.
- Work: Capture tracked and untracked preimages, exact paths/hashes, package identities and active-writer boundaries; compare source, dist and archive as separate states.
- Deliverables: recovery/source-snapshot.json; recovery/preservation-manifest.json.
- Done only when: Every selected input is digest-addressed; missing or changing inputs are reported; no reset, cleanup, commit or baseline rewrite.
- Validation: [V01](VALIDATION.md#v01), [V02](VALIDATION.md#v02). Decisions: [DEC-01](DECISIONS.md#dec-01).

Execution: **completed-evidence-only**, 2026-09-08. Preserved 1,291 existing
selected files and 26 HEAD/index preimages; recorded seven missing references.
V01/V02 pass for the exact [snapshot](recovery/source-snapshot.json), with
[verification](recovery/verification.json) and [report](recovery/REPORT.md).
This does not complete the inventory or the broader first phase.

## DSR-002

### Account for the entire DomainSpec portfolio

- Layer/lane: L1; product-construction. Owner role: Reconciliation lead; person unassigned.
- Dependencies: DSR-001.
- Work: Assign each capability a disposition and owner; collapse duplicate evidence references, not meanings; map every existing work pack to this plan without replacing its history.
- Deliverables: inventory/capability-register.json; inventory/predecessor-map.json.
- Done only when: No directory or discovered capability lacks an owner, source, disposition, consumer and successor task; excluded caches are explicit.
- Validation: [V03](VALIDATION.md#v03). Decisions: no additional design gate.

## DSR-003

### Define the current-state and support matrix

- Layer/lane: L0; product-construction. Owner role: DomainSpec product owner; person unassigned.
- Dependencies: DSR-001.
- Work: Separate authored, canonical, implemented, tested, accepted, packaged and published states; enumerate every type/language/profile/command combination.
- Deliverables: contracts/support-matrix.json; contracts/reconciliation-charter.md.
- Done only when: No single PASS or version number substitutes for these independent states; all 13 types and all 31 relationship signatures are accounted for.
- Validation: [V04](VALIDATION.md#v04). Decisions: [DEC-01](DECISIONS.md#dec-01).

Execution: **completed-candidate-evidence**, 2026-09-08. The
[matrix](contracts/support-matrix.json) records 13 types, 39 realizations,
31 relationships, 24 commands, 25 selected profiles and 247 normalized cells.
[V04 validation](contracts/validation.json) passes; see the
[charter](contracts/reconciliation-charter.md) and [report](contracts/REPORT.md).
No fresh DomainSpec product test, owner decision or admission is asserted.

## DSR-004

### Recover or disposition the seven missing BMC receipts

- Layer/lane: L1; operational-support. Owner role: Evidence custodian; person unassigned.
- Dependencies: DSR-001.
- Work: Search exact paths/hashes in authorized checkouts, archives and session evidence; retain provenance; if unavailable, record unavailable and propose a fresh evidence epoch instead of fabricating an old receipt.
- Deliverables: recovery/bmc-receipt-dispositions.json.
- Done only when: Each reference is exact-recovered, demonstrably relocated, or unavailable; textual N45 design is not substituted for a missing completion receipt.
- Validation: [V05](VALIDATION.md#v05). Decisions: [DEC-02](DECISIONS.md#dec-02).

## DSR-005

### Recover the historical SFOL v3 candidate safely

- Layer/lane: L2; operational-support. Owner role: SFOL evidence custodian; person unassigned.
- Dependencies: DSR-001.
- Work: Reconstruct patch order in an isolated durable recovery folder, record preimages and omissions, compare to current v2 and v4 contracts; never execute copied session commands automatically.
- Deliverables: recovery/sfol-v3/provenance.json; recovery/sfol-v3/reconstruction-report.md.
- Done only when: Recovered bytes are isolated, attributable and retested before reuse; unavailable bytes remain unavailable; no claim of prior canonical integration.
- Validation: [V06](VALIDATION.md#v06). Decisions: [DEC-03](DECISIONS.md#dec-03).

## DSR-006

### Create the reconciliation Definition Pack

- Layer/lane: L0; product-construction. Owner role: DomainSpec meaning owner; person unassigned.
- Dependencies: DSR-003.
- Work: Use native Define ownership to consolidate intent, consumers, metatype distinctions, data/behavior boundaries, product/business ontology and acceptance meanings; retain existing canonical IDs.
- Deliverables: definition-pack/; ontology/business-candidate.json.
- Done only when: Entity is not a table or arbitrary record; pure behavior is not a state change; product semantics precede compiler representation; no promotion claimed.
- Validation: [V07](VALIDATION.md#v07). Decisions: no additional design gate.

Execution: **completed-candidate-evidence**, 2026-09-08. Native Define produced
a structurally valid candidate with 88 source reuses, 15 proposals and 3 open
dispositions. The definition-backed business ontology preserves all 13 backend
metatypes, 31 signatures and D18-D49, including D26's superseded status.
Fourteen bounded checks pass; source and prior-artifact preservation is verified.
See [full result](definition-pack/DEFINE-RESULT.md) and [evidence](definition-pack/REPORT.md).
Open authoring, formalization and admission selections still block dependent
handoff. This does not implement compiler syntax or promote definitions.

## DSR-007

### Prove one minimal reconciled vertical

Execution: **partially-completed-domain-only**, 2026-09-08. The user selected
DomainSpec-first work and deferred Alch reconciliation. Eighteen checks pass for
direct JSON -> typed graph -> generated TypeScript -> compiled JavaScript execution:
Entity identity, Query filtering/projection, explicit-snapshot read-only behavior,
deterministic generation, artifact verification and fail-before-output negative inputs.
The original Alch comparison and unsupported frontend controls remain pending;
V08/V09 are partial passes, not full passes. No compiler or Alch files changed.
See [example](verticals/entity-query/README.md) and [report](evidence/l0/REPORT.md).

- Layer/lane: L0; product-construction. Owner role: Compiler owner; person unassigned.
- Dependencies: DSR-006.
- Work: Compile equivalent direct JSON and supported Alch source to a normalized graph and generated target; execute a known read-only result and negative endpoint/type controls in an isolated consumer.
- Deliverables: verticals/entity-query/; evidence/l0/.
- Done only when: Exact identities and read-only meaning survive authoring, graph and code; unsupported frontend constructs fail explicitly; no fictitious Operation or hidden database IO.
- Validation: [V08](VALIDATION.md#v08), [V09](VALIDATION.md#v09). Decisions: no additional design gate.

## DSR-008

### Reconcile all BMC decisions with the candidate contract

- Layer/lane: L1; product-construction. Owner role: Relationship meaning owner; person unassigned.
- Dependencies: DSR-006, DSR-004.
- Work: Build a decision-to-definition-to-schema-to-validator-to-test matrix; separate decisions with current exact evidence from source history and unrecoverable receipt claims; propose a versioned constraint contract.
- Deliverables: contracts/relationship-profile-candidate.json; inventory/bmc-trace.json.
- Done only when: Every numeric/nonnumeric facet has a resolved prototype meaning or a local gate; old packet and current metadata cannot masquerade as implementation.
- Validation: [V10](VALIDATION.md#v10). Decisions: [DEC-02](DECISIONS.md#dec-02), [DEC-04](DECISIONS.md#dec-04).

## DSR-009

### Reconcile field types, identity and references

- Layer/lane: L1; product-construction. Owner role: Type-system owner; person unassigned.
- Dependencies: DSR-006.
- Work: Specify scalar, declared-type reference, optional/list/set/sum composition; distinguish embedded values, entity references, graph ownership and persistence keys; specify reference projections without selecting public syntax prematurely.
- Deliverables: contracts/field-and-reference-model.json; type conformance fixtures.
- Done only when: Optionality is encoded consistently; nested records and entity identities stay distinct; cycles, dangling refs, union ambiguity and numeric limits have deterministic outcomes.
- Validation: [V11](VALIDATION.md#v11), [V12](VALIDATION.md#v12), [V13](VALIDATION.md#v13). Decisions: [DEC-05](DECISIONS.md#dec-05).

## DSR-010

### Implement versioned relationship constraints consistently

- Layer/lane: L1; product-construction. Owner role: Relationship compiler owner; person unassigned.
- Dependencies: DSR-008, DSR-009.
- Work: Implement explicit endpoint degree, ownership dimension, membership kind, cycle and closure rules in a selected candidate profile; align validators and obligation projections; retain versioned compatibility behavior.
- Deliverables: shared relationship contract/validator; positive and negative graph corpus.
- Done only when: Same selected profile yields the same decisions in Markdown and JSON; independent dimensions/kinds do not collapse; incomplete closure is not PASS.
- Validation: [V14](VALIDATION.md#v14), [V15](VALIDATION.md#v15), [V16](VALIDATION.md#v16), [V17](VALIDATION.md#v17). Decisions: [DEC-04](DECISIONS.md#dec-04).

## DSR-011

### Specify the three composition representations

- Layer/lane: L1; product-construction. Owner role: Composition owner; person unassigned.
- Dependencies: DSR-006, DSR-009.
- Work: Define canonical domain edges, scoped composition-reference roles, and typed value bindings as separate representations with explicit projection rules and source provenance.
- Deliverables: contracts/composition-boundary.json; ontology/composition-candidate.json.
- Done only when: calls/maps-from/maps-to/depends-on are not silently promoted DS-D8 verbs; mapping to a VO in a reference graph does not widen canonical maps.
- Validation: [V18](VALIDATION.md#v18). Decisions: [DEC-06](DECISIONS.md#dec-06).

## DSR-012

### Reconcile the existing shared snapshot compilation work

- Layer/lane: L1; product-construction. Owner role: Compiler owner; person unassigned.
- Dependencies: DSR-007, DSR-011.
- Work: Review and integrate only selected candidate changes; make all generation consumers use one validated immutable snapshot; retain source-currentness and direct-JSON/Alch provenance.
- Deliverables: reviewed compilation candidate; stale/fabricated snapshot tests.
- Done only when: No source reread or mutable graph can change output after validation; legacy profiles are explicit and parity is measured, not presumed.
- Validation: [V19](VALIDATION.md#v19), [V20](VALIDATION.md#v20). Decisions: no additional design gate.

## DSR-013

### Remove the pure-calculation support-Operation mismatch

- Layer/lane: L1; product-construction. Owner role: Calculation and lowering owners; person unassigned.
- Dependencies: DSR-010, DSR-011, DSR-012.
- Work: Select a truthful pure-calculation composition/profile rule; preserve calculates for a real consuming Operation; eliminate fabricated evaluation Operations; document migration of old generated views.
- Deliverables: pure calculation lowering contract and migration fixtures.
- Done only when: Standalone or mapper-consumed calculations have explicit lawful support without inventing a business state change; old profile behavior is never silently reinterpreted.
- Validation: [V21](VALIDATION.md#v21). Decisions: [DEC-06](DECISIONS.md#dec-06).

## DSR-014

### Make mapper inputs and computed dependencies explicit

- Layer/lane: L1; product-construction. Owner role: Mapping owner; person unassigned.
- Dependencies: DSR-009, DSR-011, DSR-012.
- Work: Support declared computed values as mapper inputs in a reviewed composition contract; retain lawful declared Calculation calls; bind source/target roles and distinguish reuse from repeated evaluation.
- Deliverables: mapper input/binding contracts; pricing and order fixtures.
- Done only when: Arguments, defaults, nullability, target coverage and dependency traces agree; no hidden IO, implicit calculation relationship or unstable evaluation order.
- Validation: [V22](VALIDATION.md#v22). Decisions: [DEC-05](DECISIONS.md#dec-05), [DEC-06](DECISIONS.md#dec-06).

## DSR-015

### Reconcile Rule and Policy composition

- Layer/lane: L1; product-construction. Owner role: Behavior owner; person unassigned.
- Dependencies: DSR-006, DSR-011, DSR-012.
- Work: Select a versioned public contract that reuses declared Rules; retain Policy strategy selection and Rule Boolean meaning; adapt legacy predicates explicitly without duplicating authority.
- Deliverables: Rule/Policy contract crosswalk; compatibility fixtures.
- Done only when: Policy selection and execution remain distinct; changing a referenced Rule has an observable effect; no unauthorized inlining or Rule-to-Policy metatype collapse.
- Validation: [V23](VALIDATION.md#v23). Decisions: [DEC-07](DECISIONS.md#dec-07).

## DSR-016

### Separate transition triggers from emitted effects

- Layer/lane: L1; product-construction. Owner role: State Machine owner; person unassigned.
- Dependencies: DSR-010, DSR-011.
- Work: Define separate event trigger, guard and output intent bindings; version input shape; align validators, all generated languages and runtime; retain unsupported canonical output edges as unsupported.
- Deliverables: State Machine candidate contract and migration fixtures.
- Done only when: Trigger Event A cannot silently become emitted Event B; guards precede transition; rejected transitions neither mutate state nor emit effects.
- Validation: [V24](VALIDATION.md#v24). Decisions: [DEC-08](DECISIONS.md#dec-08).

## DSR-017

### Represent workflow steps independently of Operation identity

- Layer/lane: L1; product-construction. Owner role: Workflow owner; person unassigned.
- Dependencies: DSR-008, DSR-010, DSR-011.
- Work: Introduce versioned step occurrence identities, qualified Operation references, order and compensation links; keep concept adjacency separate from occurrence sequence.
- Deliverables: workflow occurrence model and three-language fixtures.
- Done only when: Repeated occurrences and same node_id in different features are unambiguous; invalid order/duplicate step identity rejects; graph degree is not step count.
- Validation: [V25](VALIDATION.md#v25). Decisions: [DEC-08](DECISIONS.md#dec-08).

## DSR-018

### Close all 13 metatype realization contracts

- Layer/lane: L1; product-construction. Owner role: Metatype implementation owners; person unassigned.
- Dependencies: DSR-009, DSR-013, DSR-014, DSR-015, DSR-016, DSR-017.
- Work: Implement missing promised semantics or explicitly version-reject unsupported forms; remove placeholder success and Rust panic paths from supported contracts; distinguish code generation from execution claims.
- Deliverables: 39-row executable conformance matrix; profile-specific negative cases.
- Done only when: Every supported cell has positive behavior and semantic negative evidence; every unsupported cell has a typed diagnostic, not a cast failure or placeholder result.
- Validation: [V26](VALIDATION.md#v26). Decisions: no additional design gate.

## DSR-019

### Regenerate contract projections and verify targets

- Layer/lane: L1; product-construction. Owner role: Projection and conformance owner; person unassigned.
- Dependencies: DSR-010, DSR-018.
- Work: Make catalogs, schemas, relationship obligations, target observers and profile manifests derive from selected inputs; check semantic markers and exact inventories.
- Deliverables: projection regeneration reports; observer regression fixtures.
- Done only when: Two generations are deterministic; unknown/stale/mutated outputs fail; historical frozen artifacts are not overwritten.
- Validation: [V27](VALIDATION.md#v27). Decisions: no additional design gate.

## DSR-020

### Extend assurance to the composition contract

- Layer/lane: L2; product-construction. Owner role: Assurance owner; person unassigned.
- Dependencies: DSR-012, DSR-019.
- Work: Add versioned composition identity/dependency/binding coverage to checked interchange and selected proof projection; preserve unsupported outcomes where proof is unavailable.
- Deliverables: composition assurance profile; adversarial certificate fixtures.
- Done only when: Compilation certificate is not relabeled a proof; changed dependency or meaning breaks verification; provider capability and proof scope are explicit.
- Validation: [V28](VALIDATION.md#v28), [V29](VALIDATION.md#v29). Decisions: [DEC-09](DECISIONS.md#dec-09).

## DSR-021

### Make composition executable through the supported runtime

- Layer/lane: L2; product-construction. Owner role: Runtime owner; person unassigned.
- Dependencies: DSR-013, DSR-014, DSR-015, DSR-016, DSR-017, DSR-020.
- Work: Select generated functions from verified bindings, validate input contracts before dispatch, and carry composition evidence into runtime receipts without reinterpreting arbitrary ASTs.
- Deliverables: composition runtime path and receipt profile.
- Done only when: Same fixture result holds in generated and runtime paths; cycles, undeclared effects, missing typed contracts and unauthorized entry points reject predictably.
- Validation: [V30](VALIDATION.md#v30), [V31](VALIDATION.md#v31). Decisions: no additional design gate.

## DSR-022

### Reconcile FormalClaim and SFOL version contracts

- Layer/lane: L2; product-construction. Owner role: Formalization meaning owner; person unassigned.
- Dependencies: DSR-006, DSR-005.
- Work: Define version/role crosswalk and supported preservation-backed conversions; review explicit definition closure and evaluation/interpretation separation; do not confuse carrier version with logic or API version.
- Deliverables: formalization compatibility matrix; versioned candidate adapters.
- Done only when: No silent downcast or relabeling; unsupported claims fail capability assessment; existing accepted v2 evidence remains immutable.
- Validation: [V32](VALIDATION.md#v32). Decisions: [DEC-03](DECISIONS.md#dec-03), [DEC-10](DECISIONS.md#dec-10).

## DSR-023

### Close the bounded compiler-to-SFOL/TDE/EVF join

- Layer/lane: L2; product-construction. Owner role: TDE and EVF owners; person unassigned.
- Dependencies: DSR-020, DSR-022.
- Work: Expose explicit CLI/API assess/project/derive/verify behavior with source, definition, projection and provider lineage; recover useful v3 controls only after fresh correspondence checks.
- Deliverables: bounded integration profile; API/CLI corpus; exact evidence joins.
- Done only when: Zero-case, survivor, stale, mismatched-profile and fabricated evidence reject; missing EVF remains not_requested; no unsupported proof becomes PASS.
- Validation: [V33](VALIDATION.md#v33), [V34](VALIDATION.md#v34), [V35](VALIDATION.md#v35). Decisions: [DEC-09](DECISIONS.md#dec-09), [DEC-10](DECISIONS.md#dec-10).

## DSR-024

### Execute workflow occurrences and recovery intent

- Layer/lane: L2; product-construction. Owner role: Workflow runtime owner; person unassigned.
- Dependencies: DSR-017, DSR-021.
- Work: Implement declared ordered execution and failure/compensation intent for the selected local profile; distinguish pure planning, dispatch and successful effects.
- Deliverables: local workflow executor; failure and retry corpus.
- Done only when: Workflow actually executes selected steps; compensation ordering and failure outcomes are deterministic; no exactly-once effect claim without provider evidence.
- Validation: [V36](VALIDATION.md#v36). Decisions: no additional design gate.

## DSR-025

### Prove a bounded durable recovery provider

- Layer/lane: L3; product-construction. Owner role: Recovery and integration owners; person unassigned.
- Dependencies: DSR-024, DSR-028.
- Work: Implement and test persistence, atomic state/outbox, claim/lease, fenced dispatch, attempt identity, retry and restart reconciliation for one bounded provider; keep guarantees concern-specific.
- Deliverables: local durable provider; crash/restart and competing-worker receipts.
- Done only when: No lost committed intent; duplicate attempts are detected; unknown outcomes remain unknown; lease/fencing/replay behavior survives process death.
- Validation: [V37](VALIDATION.md#v37), [V38](VALIDATION.md#v38), [V39](VALIDATION.md#v39). Decisions: [DEC-11](DECISIONS.md#dec-11).

## DSR-026

### Reconcile the candidate application compiler as a generic product

- Layer/lane: L2; product-construction. Owner role: Application compiler owner; person unassigned.
- Dependencies: DSR-012, DSR-018.
- Work: Review DomainSpec ownership without imports from Alch/ARE; include the commands in capability/help/schema contracts at a deliberate lifecycle; bind core models and adapters explicitly.
- Deliverables: reviewed application profile; CLI discoverability and no-frontend-dependency checks.
- Done only when: Direct JSON and Alch compile equivalent declared semantics; DomainSpec does not depend on ARE configuration; arbitrary open record is never claimed fully validated.
- Validation: [V40](VALIDATION.md#v40). Decisions: [DEC-12](DECISIONS.md#dec-12).

## DSR-027

### Close request, stream, custody and security contracts

- Layer/lane: L3; product-construction. Owner role: Application runtime and security owners; person unassigned.
- Dependencies: DSR-021, DSR-026, DSR-028.
- Work: Specify authorization before effects, bounded parsing, redaction, cancellation, SSE/JSON distinction, durable custody and reconciliation; verify with local deterministic adapters before optional live runs.
- Deliverables: application runtime contract matrix; local security and fault corpus.
- Done only when: Malformed/oversized/unauthorized requests cannot trigger effects; cancellation and retry have explicit custody states; secrets never enter generated artifacts or logs.
- Validation: [V41](VALIDATION.md#v41), [V42](VALIDATION.md#v42), [V43](VALIDATION.md#v43). Decisions: [DEC-12](DECISIONS.md#dec-12).

## DSR-028

### Separate domain types from database realization

- Layer/lane: L3; product-construction. Owner role: Persistence binding owner; person unassigned.
- Dependencies: DSR-009, DSR-019, DSR-026.
- Work: Define explicit table/document/value mapping, identity/reference encoding, transaction boundary, migrations and failure taxonomy in provider bindings; do not infer a database from Entity or record.
- Deliverables: persistence binding contract; isolated migration/rollback fixtures.
- Done only when: Embedding, referencing, optional/list/set/sum and domain identity preserve meaning across storage; migration is explicit and no DDL/IO occurs implicitly.
- Validation: [V44](VALIDATION.md#v44). Decisions: [DEC-05](DECISIONS.md#dec-05), [DEC-11](DECISIONS.md#dec-11).

## DSR-029

### Make the test denominator complete and runnable

- Layer/lane: L1; product-construction. Owner role: Test infrastructure owner; person unassigned.
- Dependencies: DSR-001.
- Work: Discover the declared test inventory, map every test to an explicit suite, identify provider prerequisites and required/optional classifications, fail CI on orphaned tests or unexplained skips.
- Deliverables: test inventory; suite registry; CI denominator checks.
- Done only when: All four omitted suites are included or explicitly classified; required suite failure/absence cannot disappear behind a green aggregate.
- Validation: [V45](VALIDATION.md#v45). Decisions: no additional design gate.

## DSR-030

### Prove semantic distinctions, non-collapse and orthogonality

- Layer/lane: L2; product-construction. Owner role: Semantic validation owner; person unassigned.
- Dependencies: DSR-010, DSR-014, DSR-015, DSR-016, DSR-017, DSR-029.
- Work: Create paired fixtures that differ in one semantic property; remove/change an edge, role, dimension or constraint and measure observable consequences; preserve a nonzero intended differential.
- Deliverables: semantic witness matrix; mutation and orthogonality receipts.
- Done only when: Expected semantic changes are detected; unrelated dimensions remain unchanged; nonzero corpus and killed required mutants prevent vacuous PASS.
- Validation: [V46](VALIDATION.md#v46), [V47](VALIDATION.md#v47), [V48](VALIDATION.md#v48). Decisions: no additional design gate.

## DSR-031

### Prove cross-language and cross-frontend equivalence

- Layer/lane: L2; product-construction. Owner role: Conformance owner; person unassigned.
- Dependencies: DSR-018, DSR-019, DSR-021, DSR-029.
- Work: Execute the same bounded semantics in supported languages and frontends; compare normalized graph identity separately from source provenance; cover Unicode and exact numeric boundaries.
- Deliverables: portable conformance corpus and deterministic two-run report.
- Done only when: Every supported cross-language cell agrees on normalized outcomes/errors; byte equivalence is only required where specified; provenance remains distinct.
- Validation: [V49](VALIDATION.md#v49), [V50](VALIDATION.md#v50). Decisions: no additional design gate.

## DSR-032

### Verify the selected toolchain without changing it

- Layer/lane: L1; operational-support. Owner role: Toolchain owner; person unassigned.
- Dependencies: DSR-001.
- Work: Check required runtimes and package managers; record exact image/tool versions; name only the stages affected by missing prerequisites; no automatic installation or global configuration changes.
- Deliverables: evidence/toolchain-preflight.json.
- Done only when: A missing provider/compiler blocks only its required test cells; optional live credentials cannot block unrelated local prototype work.
- Validation: [V51](VALIDATION.md#v51). Decisions: no additional design gate.

## DSR-033

### Recompose the existing four-product completion plan

- Layer/lane: L3; product-construction. Owner role: Integration product owner; person unassigned.
- Dependencies: DSR-023, DSR-025, DSR-027, DSR-031, DSR-037.
- Work: Map revised compiler, EVF, recovery and migration outputs back to existing acceptance scopes; run composed compatibility and failure scenarios; preserve UI exclusion.
- Deliverables: P01 successor closure candidate; exact four-product compatibility report.
- Done only when: No old individual PASS stands in for composed behavior; all four products use compatible selected versions; no UI or external-publication gate is injected.
- Validation: [V52](VALIDATION.md#v52). Decisions: no additional design gate.

## DSR-034

### Generate accurate product documentation and examples

- Layer/lane: L3; product-construction. Owner role: Documentation owner; person unassigned.
- Dependencies: DSR-003, DSR-019, DSR-023, DSR-026, DSR-031, DSR-041.
- Work: Regenerate supported type/relationship/profile/version views; write user-facing install, authoring, graph, generated-code, errors and migration guidance; keep internal decisions separate.
- Deliverables: updated guides; executable examples; documentation drift checks.
- Done only when: No four-type/@2/@6 stale current claim survives; examples compile as documented; no user guide presents open internal design questions as product behavior.
- Validation: [V53](VALIDATION.md#v53). Decisions: no additional design gate.

## DSR-035

### Freeze one exact reconciled product candidate

- Layer/lane: L4; product-construction. Owner role: Candidate custodian; person unassigned.
- Dependencies: DSR-019, DSR-029, DSR-030, DSR-031, DSR-033, DSR-034.
- Work: Create a new immutable candidate inventory and source/package identities; evaluate proposed baseline successor without rewriting @10 or labeling candidate bytes admitted.
- Deliverables: candidate/source-manifest.json; candidate/product-matrix.json; candidate/baseline-successor-proposal.json.
- Done only when: All selected source/contract/evidence identities close; candidate changes restart affected tests and review; historical admissions remain exact.
- Validation: [V54](VALIDATION.md#v54). Decisions: [DEC-13](DECISIONS.md#dec-13).

## DSR-036

### Build and test the installable package in isolation

- Layer/lane: L4; product-construction. Owner role: Packaging owner; person unassigned.
- Dependencies: DSR-035, DSR-032.
- Work: Build, pack, install in clean temporary consumers; verify files/exports/help/commands, no workspace imports, deterministic archive payload and supported platform behavior.
- Deliverables: candidate/package/; isolated-consumer and reproducibility reports.
- Done only when: Installed artifact, not local source, passes the declared product suite; archive identity is exact; release version is deliberately selected.
- Validation: [V55](VALIDATION.md#v55). Decisions: [DEC-13](DECISIONS.md#dec-13).

## DSR-037

### Close compatibility and legacy migration

- Layer/lane: L3; product-construction. Owner role: Migration owner; person unassigned.
- Dependencies: DSR-012, DSR-022, DSR-026, DSR-031.
- Work: Provide versioned adapters or explicit rejection paths; retain old fixtures and immutable archives; stage migration/rollback and caller deprecation rather than deleting compatibility.
- Deliverables: compatibility matrix; migration/reversal receipts; L-product correspondence.
- Done only when: No silent semantic migration; old accepted inputs keep defined behavior or a precise upgrade error; retirement requires separate authority.
- Validation: [V56](VALIDATION.md#v56). Decisions: [DEC-06](DECISIONS.md#dec-06), [DEC-10](DECISIONS.md#dec-10).

## DSR-038

### Independently review and request exact product approval

- Layer/lane: L4; product-construction. Owner role: Independent reviewer and product owner; person unassigned.
- Dependencies: DSR-036, DSR-042.
- Work: Review failure cases, scope and test denominator independently; close P02 correspondence; present exact candidate for product approval after tests, not earlier.
- Deliverables: candidate/independent-review.json; exact product decision when actually issued.
- Done only when: No open required defect, unverifiable gate or unsupported promised cell remains; any changed accepted bytes invalidate the decision request.
- Validation: [V57](VALIDATION.md#v57). Decisions: no additional design gate.

## DSR-039

### Obtain separate canonical admission and migration authority

- Layer/lane: L4; operational-support. Owner role: Definition/profile/admission owners; person unassigned.
- Dependencies: DSR-038.
- Work: Seek only the required owner decisions; promote synchronized canonical definitions and immutable baseline successor only within exact granted scope; do not equate product approval with admission.
- Deliverables: exact owner decisions; admitted projections if authorized.
- Done only when: Authority sources and versions agree; no forged receipt, in-place old baseline change, silent cutover or admission by status edit.
- Validation: [V58](VALIDATION.md#v58). Decisions: no additional design gate.

## DSR-040

### Prepare separately authorized publication and operation

- Layer/lane: L4; operational-support. Owner role: Release and deployment owners; person unassigned.
- Dependencies: DSR-038.
- Work: Prepare local release notes, provenance and installation verification; request exact destination/version/publication/deployment authorization separately; preserve rollback and support boundaries.
- Deliverables: release preparation dossier; external receipts only if later authorized.
- Done only when: Local reconciliation never claims registry publication or production deployment; no credentials, billing, remote mutation or external service is used implicitly.
- Validation: [V59](VALIDATION.md#v59). Decisions: no additional design gate.

## DSR-041

### Disposition UI, research, calibration and historical work

- Layer/lane: L1; product-construction. Owner role: Portfolio and meaning owners; person unassigned.
- Dependencies: DSR-002, DSR-006.
- Work: Give each nonselected capability an evidence-backed disposition: current, candidate successor, compatibility-only, superseded, excluded, deferred with owner, or unrecoverable; retain links and promotion boundaries.
- Deliverables: inventory/residue-register.json; historical/current navigation crosswalk.
- Done only when: UI remains excluded from v1.0 unless separately changed; CALIBRATION-DEFER is not PASS; no lost directory or unowned deferred promise.
- Validation: [V60](VALIDATION.md#v60). Decisions: no additional design gate.

## DSR-042

### Audit whole-scope reconciliation closure

- Layer/lane: L4; product-construction. Owner role: Reconciliation reviewer; person unassigned.
- Dependencies: DSR-002, DSR-004, DSR-005, DSR-030, DSR-033, DSR-034, DSR-036, DSR-037, DSR-041.
- Work: Evaluate every required cell and every residue against the two completion boundaries; link each result to exact evidence; independently report not_evaluable instead of compressing missing work into PASS.
- Deliverables: candidate/reconciliation-closure.json.
- Done only when: All required product promises are implemented/tested/packaged; all other capabilities have explicit owner-approved dispositions; no false all-complete claim.
- Validation: [V62](VALIDATION.md#v62). Decisions: no additional design gate.

## DSR-043

### Arrange optional live provider access only when required

- Layer/lane: L3; operational-support. Owner role: Provider/service owner; person unassigned.
- Dependencies: DSR-032.
- Work: Record who owns credentials, local/remote resources, cost, privacy and authorization; use deterministic local fixtures until an exact live test is authorized.
- Deliverables: operational/live-validation-envelope.json or explicit not_requested.
- Done only when: No absent optional credential blocks local contract construction; only a claim requiring live provider evidence depends on this task.
- Validation: [V61](VALIDATION.md#v61). Decisions: [DEC-11](DECISIONS.md#dec-11), [DEC-12](DECISIONS.md#dec-12).

## 13. Closeout and claim ceiling

DSR-042 performs whole-scope technical reconciliation closure against the exact
candidate; DSR-038 independently reviews it for product approval; DSR-039 is the
separate canonical admission lane. Do not merge these outcomes.

Required closeout conditions:

- Complete capability inventory, source/owner/consumer links and dispositions.
- No unsupported required product promise, semantic collapse, stale selected
  baseline binding, orphaned required test or hidden package dependency.
- Current behavior, schemas, graph/reference/value contracts, generated targets,
  runtime, documentation and selected package agree for the claimed profiles.
- BMC and historical SFOL evidence have honest recoverable/unavailable outcomes;
  fresh claims use fresh current evidence.
- Four-product completion scope closes without silently reintroducing UI.
- All required checks are current and passing; no vacuous corpus or removed
  test silently changes the denominator.
- Approved/admitted/published states remain separate, exact and owner-bound.
- Every nonselected research/UI/provider residue has an owner, reason, affected
  stages and next route. Deferral cannot substitute for a promised behavior.

## Planning-package validation

The authored package passed 973 structural/reference checks: unique work and
check IDs, complete dependency/test/decision references, an acyclic 43-unit DAG,
local document links and anchors, the six-file write allowance, and preservation
of all 42 selected source hashes. JSON parsing and the existing tracked diff
whitespace check also passed. This is validation of the plan, not execution of
any work item or a fresh DomainSpec product test result.

## Open Questions

Owned by [DECISIONS.md](DECISIONS.md). They are bounded engineering decisions,
not questions to expose in the user-facing product guide. This planning package
does not resolve them by implication or block unrelated work because they exist.
