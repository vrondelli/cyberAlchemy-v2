---
module: evolvable-validation-framework
status: current-architecture-progress-map
updatedAt: 2026-08-25
docType: architecture-progress-map
authorityScope: current-status-navigation-only
---

# EVF Architecture And Progress Map

## Why This Map Exists

A list of runs tells us what was touched. It does not tell us what capability
the system gained.

This map therefore relates every current work stream to the validation
architecture. Each stream must identify:

1. the architectural role it advances;
2. the transformation or decision that role owns;
3. its input and output contracts;
4. the evidence currently obtained;
5. the capability that evidence adds;
6. the claim ceiling it does not cross; and
7. the next architectural transition still missing.

Governance repairs are recorded as enablers. They count as architectural
progress only when they open or protect a real capability boundary; they do not
become domain or product evidence by themselves.

Cross-stream ordering and safe fan-out are derived in the private
[Validation Architecture Roadmap](../validation-architecture-roadmap/ROADMAP.md),
with a machine-readable [dependency graph](../validation-architecture-roadmap/DEPENDENCY-GRAPH.json)
and [concurrency matrix](../validation-architecture-roadmap/CONCURRENCY-MATRIX.json).
This map is the current status projection; the roadmap is the architecture and
dependency projection. Neither artifact grants execution or owner authority.

## Logical Validation Architecture

```text
DOMAIN MEANING
DomainSpec FormalClaim, feature semantics, and relationship decision owners
        |
        | exact source identity plus separately accepted semantic contracts
        v
VALIDATION GOVERNANCE
classifies the claim and admits one meaning-preserving executable projection
        |
        | ExecutableProjectionBinding
        v
OBLIGATION DERIVATION
TDE derives language-neutral obligations/cases and selects exact profiles
        |
        | provider request / rendered artifact
        v
EVIDENCE PROVIDERS
language runtimes | Souffle | Alloy | SMT | TLA/TLC | Lean/theorem providers
        |
        | typed raw and normalized receipts
        v
EVF EVIDENCE COMPOSITION
checks provenance/currentness, joins evidence, preserves failures and ceilings
        |
        | immutable bounded evidence handles
        v
INDEPENDENT CONSUMERS
IOLM | Body War | other applications and validation consumers
        |
        | independent consumer receipts
        v
AUTHORITY AND PROMOTION
CyberAlchemy v2 owner gates decide admission, promotion, release, or retirement
```

The architecture is logical, not directory-based. The physical
[`impl/test-derivation-engine`](../../impl/test-derivation-engine/) package
contains the original TDE plus later BTE and EVF additions. Co-location does not
merge their ownership:

- TDE owns deterministic obligation and case derivation.
- Relationship decision owners own canonical relationship meaning and must
  separately accept a versioned executable contract before downstream adoption.
- Evidence providers own tool execution and raw provider truth.
- EVF owns evidence intake, composition, receipts, and bounded claim ceilings.
- DomainSpec owns source meaning.
- CyberAlchemy v2 owns promotion authority.

## What The Current Portfolio Is Advancing

| Current stream | Architectural role | Capability gained so far | Current ceiling | Next architectural transition |
| --- | --- | --- | --- | --- |
| BMC relationship constraints | Upstream DomainSpec semantic authority | N01-N34 are selected; Option B fixes the target as the backend-active 17-row nonnumeric frontier; post-N34 sequencing selected `emits + ordering` and formed N35 | N35 remains unselected; the frontier, packet, and executable contract are not complete or accepted; no TDE/property/EVF adoption or implementation is authorized | Resolve N35, continue exact relation/facet owner gates, compile the versioned contract, obtain separate packet and executable-contract acceptance, then refresh downstream adopters |
| TDE multiformalism profile epoch | Obligation derivation | A designed and planned bridge from admitted FormalClaim projections to neutral obligations/cases, exact TypeScript/Python/Rust profiles, and Lean handle routing | Planning targets are materialized, but no TDE product implementation, profile admission, provider registration, or execution is selected | Repair preacceptance choreography, obtain exact owner acceptance, then select the first bounded implementation unit |
| EVF SMT provider | Evidence-provider integration | A solver-independent request/receipt protocol and bounded validation corpus exist | Protocol validation only; no admitted solver runtime and no domain claim | Resume SWU-SMTP-001 lifecycle recovery, then translation, runtime, R4 binding, and closure |
| Formal Model Proof Provider | Evidence provider | A six-unit TLA/TLC provider plan, terminal-receipt contracts, and contractual readiness exist | No owner approval, SWU selection, provider execution, or EVF adapter | Resolve two protected owner decisions, then select the provider chain; integrate through a separate EVF adapter |
| EVF graph-property spine | EVF evidence composition | L0/L1 evidence plus one bounded L2 reachability property across two providers and a non-inflating join | Does not prove cycle, closure, all graph laws, or unbounded correctness | Define one new property contract before extending the evaluator |
| EVF L3 breadth and BTE absorption | EVF breadth/migration | A 17-relationship denominator, creates oracle, L2 baseline, and exact W0 planning frontier exist | W0 is unapproved; no successor migration, BTE retirement, release, or production claim | Decide W0, freeze the frontier, refresh later units, then execute W1-W6 in dependency order |
| IOLM DSC-A | Independent consumer | The ownership boundary and predecessor decision are explicit | No passing independent consumer receipt; IOLM substrate remains blocked | Resolve IOLM `00C-B/C`, run DSC-A, and return an independently authored receipt |

## The Missing End-To-End Milestone

The architecture is not complete merely because each lane has local evidence.
The next system-level milestone is one bounded vertical that preserves identity
and claim ceilings across every boundary:

```text
one exact FormalClaim
  -> one admitted executable projection
  -> one deterministic TDE obligation/case set
  -> one exact provider execution receipt
  -> one EVF normalized/joined evidence handle
  -> one independently authored consumer receipt
```

No current receipt proves this complete vertical. The existing work advances
individual seams toward it:

- Relationship-constraint Design advances owner meaning toward one versioned,
  separately accepted executable semantic input.
- TDE advances claim-to-obligation derivation.
- SMT and formal-model providers advance obligation-to-tool evidence.
- Graph composability advances multi-provider evidence joining.
- L3 breadth advances coverage and legacy BTE absorption.
- IOLM advances independent consumption.

This is the architectural meaning of the work; the run count itself is not the
progress measure.

An accepted `owns` cycle/closure rule could later supply one bounded graph
property for this vertical. TDE would derive the obligation, Souffle and Alloy
could evaluate the same frozen facts, and EVF could join only exactly comparable
receipts. That is a candidate architecture path, not a current property,
provider, consumer, or execution selection.

## Stream Detail: Relationship Constraint Authority

This stream is upstream of TDE, graph providers, and EVF. It owns what canonical
relationship facts mean; it does not own provider truth or evidence composition.
The [Option B selection](../relationship-constraint-decisions/BMC-REL-001/decision-gate/BMC-REL-EVF-INTEGRATION-SCOPE-OWNER-SELECTION-RECEIPT.json)
sets the scope to the backend-active 17-row nonnumeric frontier. It expressly
does not select numeric bounds, runtime cardinality, typed per-fact
representation, full 31-row scope, packet mutation, or implementation.

The [current Design result](../relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/DESIGN-RESULT.md)
and [decision log](../relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/DESIGN-DECISION-LOG.md)
show that N01-N34 are selected, the next subject is `emits.ordering`, and N35 is
formed but unselected. The current
[aggregate validation](../relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/design/DESIGN-VALIDATION.json)
reports 2,502 checks and zero failures, but validation PASS neither selects N35
nor completes the frontier.

```text
N35 owner decision
  -> remaining exact relation/facet Design gates
  -> backend-active nonnumeric completion
  -> versioned contract compilation
  -> separate packet acceptance
  -> separate executable-contract acceptance
  -> refreshed TDE/property/EVF adoption plan
  -> obligation derivation and provider execution
```

The current EVF W0 candidate remains valid within its frozen BTE-migration
scope because it does not adopt this in-progress relationship contract. A later
accepted contract enters EVF only through P5-1 or another exact refreshed plan.
Souffle and Alloy remain possible bounded providers after an exact graph-property
binding; they do not decide relationship semantics.

## Stream Detail: TDE Multiformalism Profile Epoch

### Architectural role

TDE is an upstream obligation producer relative to EVF. It consumes an admitted
projection, derives stable language-neutral obligations and cases, renders them
through exact implementation profiles, and returns normalized evidence or typed
residue to EVF.

It is neither EVF core nor an EVF downstream consumer. EVF is downstream from
TDE for evidence, while TDE is downstream from DomainSpec meaning and validation
governance.

The [current specification](../test-derivation-engine-next-epoch/invoke-define-design-plan/20260825T001515Z-tde-multiformalism-profile-epoch-r4/define/SPEC.md)
and [architecture](../test-derivation-engine-next-epoch/invoke-define-design-plan/20260825T001515Z-tde-multiformalism-profile-epoch-r4/design/ARCHITECTURE.md)
make this ownership boundary explicit.

### Current advancement

- The architecture and ten-unit Work Pack define neutral obligation/case IR,
  exact TypeScript/Python/Rust profile boundaries, semantic parity, and Lean
  handle routing.
- Eighty-four planning/governance targets are materialized and equal their
  staged postimages.
- Those 84 targets are not TDE implementation evidence.
- Candidate `dsv2-tde-multiformalism-profile-epoch@4` remains unapproved,
  unselected, and mutation-not-ready.

The latest [preacceptance blocker](../test-derivation-engine-next-epoch/invoke-preacceptance-closure/20260825T115450Z-tde-r4-preacceptance-closure/BLOCKER-RECEIPT.json)
is governance-only: the installed closure model cannot truthfully represent an
already-applied candidate whose pending effect is a non-mutating owner decision.
The recommended route is a fresh successor preacceptance before apply. It does
not authorize stretching the existing candidate acceptance.

## Stream Detail: Evidence Providers

### SMT provider

The EVF SMT lane advances the provider protocol for optional solver-backed
verify/witness work. The
[attempt-001 receipt](evidence/SWU-EVF-SMTP-001/attempt-001/validation-receipt.json)
proves protocol validation, not solver execution or semantic truth.

The latest [Task Session block](../../../../.arcanum/task-session/evf-smt-provider-epoch-001-SWU-EVF-SMTP-001-20260824T121304Z/attempt-002-runtime/route-scope-repair-v2-retry-001/TASK-SESSION-BLOCK-RECEIPT.json)
occurs before mutation admission because the retry context omitted native
top-level `task_id` and `swu_id`. The accepted execution contract remains
unchanged; the next transition is a fresh authorized retry with corrected
context identity.

The remaining provider chain is defined in the
[SMT Work Pack](development/refinement-runs/20260823T233323Z-evf-smt-provider-advance/plan/WORK-PACK-EVF-SMT-PROVIDER.md):
protocol closure -> translation -> admitted runtime -> R4 predicate binding ->
independent closure.

### Formal Model Proof Provider

The TLA/TLC Formal Model Proof Provider is a separately owned evidence provider.
It does not belong inside TDE, and its provider implementation does not itself
constitute EVF composition.

The [current parent refresh receipt](../formal-model-proof-provider/invoke-refresh/20260824T042948Z-wp-fmp-002-terminal-receipt-refresh/PARENT-REFRESH-RECEIPT.json)
records:

- a 44-target provider-plan candidate applied exactly;
- contractual readiness `PLAN_SEMANTIC_READY`;
- no configured Work Pack command executed;
- no selected unit and no runtime admission;
- two pending protected owner decisions: the factory material lock and exact
  Plan acceptance.

The Work Pack intentionally leaves the EVF-to-provider adapter outside the
provider chain. That adapter is a later, separately governed architecture seam.

## Stream Detail: EVF Evidence Composition

### Graph-property spine

The graph-composability work advances EVF's ability to evaluate and compose
formal obligations without inflating claims:

- L0 candidate-local evidence is retained.
- L1 repeatability and denominator evidence is retained.
- one exact-instance L2 reachability property has bounded Souffle and Alloy
  evidence plus typed provider receipts and a non-inflating join.

This proves the selected reachability property under declared bounds. It does
not generalize to cycle, closure, temporal rules, other graph laws, or unbounded
correctness. Each new property needs a separately authored contract. See the
[EVF Work Pack](WORK-PACK.md) and
[implementation layering](IMPLEMENTATION-LAYERING.md).

### L3 breadth and BTE absorption

This lane advances EVF from selected properties toward broad backend coverage
and replacement of the legacy BTE implementation surface:

```text
completed inputs
17 relationships | creates oracle | P0-P5 | L2 baseline
             |
             v
W0 exact frontier decision and six-file evidence freeze
             |
             v
P5-1 refresh and whole-pack readiness
             |
             v
W1 successor core -> W2 composition -> W3 parity/routing/BTE facade
             |
       +-----+-----+
       v           v
W4 consumers   W5 live references
       +-----+-----+
             v
W6 rollback and separate retirement decision
```

The [current W0 request](development/refinement-runs/20260824T012120Z-evf-l3-breadth-consolidation/p5-invoke-plan/refresh-runs/20260824T232151Z-swu-evf3-001-v2-preacceptance-closure/preacceptance/OWNER-ACCEPTANCE-REQUEST-V2.json)
is still an exact owner-decision edge. W0 does not authorize later migration,
BTE retirement, release, or production.

The `creates` oracle and 16-to-17 denominator reconciliation are incorporated
inputs, not independent current execution streams.

## Stream Detail: Independent Consumption

IOLM is an independently owned consumer, not evidence EVF may author for itself.
The [DSC-A decision](decision-runs/20260823T201735Z-iolm-predecessor/DECISION.json)
selected the predecessor route while explicitly leaving the receipt absent. The
later [candidate review](dispatch-runs/20260823T232335Z-bte-iolm-owner-candidate-review/findings.md)
found the IOLM `00C-B/C` substrate blocked.

```text
resolve IOLM 00C-B/C
        -> execute DSC-A
        -> independently authored consumer receipt
        -> later EVF breadth/consumer join
```

Body War remains a later consumer family rather than a current executable lane.

## Progress Classification Rules

Every future status update should use one of these effects:

| Effect | Meaning |
| --- | --- |
| `capability-advanced` | A new bounded transformation works and has evidence at its declared ceiling. |
| `boundary-advanced` | An ownership, schema, or handoff seam is now explicit and validated. |
| `coverage-advanced` | An existing capability covers a larger exact denominator without changing its semantics. |
| `integration-advanced` | Two independently owned capabilities exchange exact handles and receipts successfully. |
| `governance-enabled` | Execution machinery was repaired or readied, but no domain capability ran. |
| `decision-only` | An owner selected a route; no implementation/evidence capability changed. |
| `historical-only` | Evidence is retained but opens no current edge. |

A PASS without one of these effects is operational status, not architectural
progress.

## Immediate Architecture Edges

There is no single global next action. The current edges are:

1. **TDE:** create a fresh successor preacceptance candidate before apply, then
   obtain exact acceptance before selecting an implementation unit.
2. **Relationship constraints:** resolve N35, then continue Option B's exact
   nonnumeric relation/facet gates; contract compilation and both acceptances
   remain later serialized edges.
3. **SMT provider:** resume SWU-SMTP-001 with corrected native context identity.
4. **Formal Model Proof Provider:** resolve the two protected owner decisions;
   only then may a provider unit be selected.
5. **Graph properties:** refine one exact additional property contract only from
   its admitted semantic input; a relationship property waits for the accepted
   executable relationship contract.
6. **L3 breadth:** decide W0, then freeze the frontier before materializing W1-W6.
7. **IOLM:** resolve `00C-B/C` and produce the independent DSC-A receipt.

The architectural integration milestone is reached only when a bounded claim
crosses the complete source -> projection -> derivation -> provider -> EVF ->
consumer chain without identity loss or claim inflation.

## Source And Authority Precedence

When status sources conflict:

1. use the latest terminal receipt within the same stream;
2. then the exact candidate's owner request or acceptance record;
3. then that stream's Work Pack and readiness result;
4. use the canonical [EVF overview](README.md) for EVF purpose and ceilings;
5. use older Handoff Notices and Craft entries only as historical navigation.

A newer receipt in one stream does not supersede another stream's receipt.
Directory co-location and Git status do not establish ownership or authority.

## Architecture Boundaries

- [DomainSpec v2](../../README.md) owns private source meaning and implementation.
- Relationship decision owners retain semantic authority until separately
  accepted contract bytes bind downstream consumers.
- TDE owns deterministic obligation and case derivation within its admitted
  profile boundaries.
- Providers own their tool execution and raw truth.
- EVF owns bounded evidence intake, composition, and receipt chains.
- [CyberAlchemy v2](../../../../cyberAlchemy-v2/README.md) owns authority and
  promotion gates.
- [Arcanum](../../../../arcanum/README.md) owns reusable public execution
  machinery; it does not own private DomainSpec meaning or EVF product claims.

The former `cyberAlchemy/agentic-system-deep-dive.md`,
`SATURN-LAYER-MAP.md`, and `CONCEPT-MAP.md` files are superseded pointer stubs.
They are neither current architecture authority nor work-progress evidence.
