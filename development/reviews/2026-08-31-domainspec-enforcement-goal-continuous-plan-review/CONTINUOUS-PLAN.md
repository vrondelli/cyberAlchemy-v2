# Continuous Plan: Craft Governed Construction

Status: planning candidate  
Goal candidate: `CA2-GOAL-CRAFT-GOVERNED-CONSTRUCTION`  
Project: `CA2-PROJECT-CRAFT`  
Authority effect: none

## Operating loop

This is a continuous evidence loop, not a linear promise that all later work is
already authorized:

```text
read exact frontier
  -> classify risk and dependency
  -> select one owner-bound gap
  -> bind exact inputs and expected effect
  -> execute only the admitted task
  -> validate and independently review
  -> ask the human at the declared gate
  -> promote only the accepted immutable candidate
  -> recompute the frontier
```

Every iteration must preserve `blocked` and `not_evaluable` successors. A new
gap becomes a typed frontier item; it does not silently expand the active task.

## Workstreams and waves

### W0 — Product commitment and Goal registration

Purpose: bind the continuous work to product meaning before implementation.

- review this Goal against the exact Product Thesis;
- confirm `CA2-PROJECT-CRAFT` as the single Project owner;
- decide the method-adoption wording by exact digest;
- repair the Goals-package baseline without refreshing drifting bindings during
  active source churn;
- register the Goal only after the package is schema-valid and owner-approved.

Exit evidence: exact owner decision, healthy Goals validation, bidirectional
Project/Goal references, `authority_effect: none`.

### W1 — Canonical definitions and Product Capability

Purpose: state what the Product needs before selecting a mechanism.

- reconcile DomainSpec v2/Craft lineage terminology;
- define construction stage, `ConstructionBinding`, conformance evidence,
  runtime evidence, enforcement result, and technical-debt disposition;
- adopt the first Product Capability with explicit failures and evidence;
- keep Product Capability distinct from a public Arcanum capability.

Exit evidence: accepted immutable definitions and Product Capability; no
implementation claim.

### W2 — Capability-local business ontology

Purpose: make product meaning machine-inspectable without turning ontology into
authority.

- select the exact Product, Project, Goal, Capability, EVF, BTE, binding,
  evidence, owner, and gap records required by the first slice;
- reconcile the existing DomainSpec product ontology, Craft identity graph,
  product ontology, governance ontology, and D65 first-invariant records;
- correct stale residue such as `GOV-RES-009` only through its owning ontology
  route;
- record selector-level dependencies so unrelated ontology drift stays
  diagnostic during the runtime suspension.

Exit evidence: admitted ontology candidate, dependency-closure receipt, and
explicit residue. The Python runtime remains diagnostic only.

### W3 — Authored DomainSpec source and deterministic projections

Purpose: realize the selected business meaning in DomainSpec v2/Craft source.

- select or create the exact authored source package for the first slice;
- resolve authored source only through an owner-selected immutable
  `canonical-current` record; a directory name or highest candidate number is
  not a selector;
- fix the kinds-registry digest epoch instead of bypassing it;
- repair formation composition so required Entity fields are evaluated by the
  real compiler entry point;
- produce two-run-equal graph, source manifest, human view, build receipt, and
  system ontology;
- keep generated projections non-authoritative.

Exit evidence: admitted source profile and deterministic receipts. Until the
profile is admitted, later stages remain `not_evaluable`.

### W4 — EVF/BTE evidence architecture closure

Purpose: make evidence membership, breadth, and consumption exact.

- EVF owns composition, provenance, weakest-claim preservation, and visible
  unsupported obligations;
- BTE owns node/relationship breadth, formation criteria, negative coverage,
  and exact denominator decisions;
- bind the red fixture validator to real producers and require non-empty
  `implementationProducerIds` at the actual production entry point;
- use exact binding resolution on both EVF and legacy BTE emitter paths;
- obtain the owner decision for the 16-versus-17 relationship denominator;
- materialize the eleven missing BTE owner artifacts and exact build-node/edge
  freeze evidence;
- establish an independently consumed vertical rather than a self-consumed
  fixture.

Exit evidence: current exact corpus, real producer provenance, unambiguous
binding resolution, independent consumer receipt, and no silently omitted
dependent check.

### W5 — Exact implementation binding

Purpose: bind one owner-accepted realization to the selected system ontology.

- select one implementation baseline by immutable digest;
- ensure the binding points to one exact system ontology and implementation;
- reconcile the live D65 registry with its stale residue and transition model;
- prohibit validators from admitting their own baselines or stages.

Exit evidence: owner-accepted realization baseline and closed candidate
`ConstructionBinding`; no production-wide claim.

### W6 — Independent conformance and runtime evidence

Purpose: prove only what the exact slice supports.

- run structural, semantic, negative-mutation, and consumer-conformance checks;
- separate static conformance from runtime observation;
- use EVF to compose compatible evidence without strengthening it;
- obtain independent review and owner acceptance of the exact evidence bundle.

Exit evidence: admitted static conformance plus bounded runtime evidence, with
all unsupported obligations visible.

### W7 — Arcanum technical-debt disposition

Purpose: remove accidental framework ownership from the private Product path.

For each dependency, decide `keep-as-public-tool`, `wrap`, `replace`, `migrate`,
or `retire`:

- routing and capability resolution;
- invoke/task-session lifecycle orchestration;
- inventory and context-packet helpers;
- dispatch ledger and subagent strategy;
- schemas, fixtures, validators, generated host packages, and compatibility
  aliases;
- old project paths, compiler paths, naming, and source snapshots.

An Arcanum mechanism may remain where it is a bounded public subsystem or tool.
Its existence cannot supply private product meaning, Project ownership,
admission, or enforcement authority.

Exit evidence: dependency inventory, per-item disposition, migration tests,
public/private non-leak audit, and explicit residual dependencies.

The compiler/path item is intentionally split from Arcanum disposition. Its
bounded migration design is recorded in
`CRAFT-COMPILER-MIGRATION-EPOCH-DESIGN.md` and
`craft-compiler-migration-epoch.candidate.json`. That epoch treats the existing
MIG-B material as an unadmitted predecessor, requires a new frozen source and
consumer set, and traverses the normal W1/W2/W3/W5/W6 construction gates before
any consumer rebind or authority switch.

The versioned-candidate item is bounded separately in
`CANONICAL-CURRENT-MANIFEST-DESIGN.md` and
`canonical-current-manifest.candidate.json`. The complete source snapshot is
stale by 36 changed and 111 added entries. Materialization, rebound, and every
V1–V9 candidate have 63 manifest-to-output mismatches; V8 also contains 92
unmanifested build outputs. The migration-order revision explicitly forbids
numbered candidates as the control loop, the planned `cyberAlchemy-v2/craft`
root is absent, and no exact content artifact is currently eligible for a
`canonical-current` selector. Historical repair must be append-only; later
selection requires one owner-approved Craft Definition Snapshot and an
independently consumed exact selector.

The historical-repair contract is now bounded in
`MIG-B-EPOCH-DRIFT-RECEIPT-DESIGN.md` and
`mig-b-epoch-drift-receipt.candidate.json`. It binds all 11 immutable subject
manifests and their predecessor receipts, requires a complete sorted postimage
and delta denominator, preserves unknown transition provenance as `unknown`,
and routes every residue family to its owner. It also requires 12 negative
fixtures, two-run denominator and delta determinism, and a separate owner
decision before any successor epoch. This is a planning candidate: zero drift
receipts, owner dispositions, successor epochs, selections, or authority
changes have been produced.

The implementation boundary for that contract is now prepared in
`MIG-B-DRIFT-RECEIPT-IMPLEMENTATION-PACKET.md` and
`mig-b-drift-receipt-implementation-packet.candidate.json`. It isolates eight
new Node ESM files under `mig-b/drift/`, requires check-only zero-write defaults,
defines an atomic 11-receipt/11-delta observation, and separates seven owner
gates. In particular, A1 authorizes implementation only and A2 separately
authorizes one append-only observation. All seven approval tokens are null;
no implementation file or observation exists.

The public/private boundary item is specified in
`PUBLIC-PRIVATE-NON-LEAK-AUDIT-DESIGN.md` with Product Capability, business
ontology, and audit-contract candidates. The full scrub and sensitive negative
fixtures remain private; only a sanitized verdict may later cross into public
Arcanum. EVF preserves the weakest member claim and BTE freezes the exact changed
path/block denominator. Existing public bytes do not create disclosure
authority: Necronomicon and broader Craft/CyberAlchemy public prose remain
policy-epoch gaps for their owners.

### W8 — Governed Rust runtime enforcement

Purpose: enforce admitted construction bindings only after W0–W7 prerequisites.

- prove selector-level dependency closure;
- prove deterministic evaluation;
- distinguish candidate, validated, admitted, accepted, and enforced states;
- fail closed on missing, stale, ambiguous, or unadmitted selected dependencies;
- prove bounded behavior and negative mutants;
- keep unrelated ontology drift diagnostic.

Exit evidence: separately accepted Rust-kernel capability and enforcement
binding. The current Python ontology runtime cannot satisfy this wave.

### W9 — Continuous closure and evolution

Purpose: keep the method usable after the first vertical.

- recompute gaps after every accepted transition;
- route exactly one dependency-ready unit or an explicitly authorized series;
- challenge stale bindings when source meaning changes;
- repeat independent conformance for each new implementation slice;
- report achieved, blocked, deferred, and superseded states separately.

Exit evidence: no unexplained open frontier item and no claim beyond the latest
accepted evidence.

## Dependency order

`W0 -> W1 -> W2 -> W3 -> W5 -> W6 -> W8` is strict for construction and
enforcement claims. `W4` supplies evidence infrastructure and may advance in
parallel only where its exact predecessors are already valid. `W7` may inventory
in parallel but may not mutate an active dependency. `W9` runs after every
transition.

## Current first frontier

1. Review this Goal candidate and confirm Craft ownership.
2. Freeze and repair the Goals-package validation baseline.
3. Reconcile D65 registry evidence with `GOV-RES-009`.
4. Repair the D65 `capability-ontology` digest drift and the failing Governance
   Product ontology dependency through their owners.
5. Close the kinds-registry digest epoch and formation-schema composition.
6. Route the BTE 16-versus-17 decision and eleven missing owner artifacts.
7. Bind red fixtures to real producer IDs and exact production entry points.
8. Replace the legacy BTE first-match binding path with exact resolution.
9. Rebuild a current EVF/BTE corpus and synchronize plan/work-pack claims.
10. Select the first owner-accepted implementation baseline and independent
    consumer.
11. Review and authorize A1 for the exact eight-file MIG-B drift producer and
    validator, prove its 12 negative mutants and fail-closed path behavior,
    separately authorize A2 and emit one atomic 11-receipt observation, obtain
    explicit owner dispositions for the repeated 63-member residue and V8's 92
    extra outputs, create a separately reviewed successor epoch only where
    required, freeze one exact Craft Definition Snapshot, and prove a
    fail-closed independent `canonical-current` consumer.
12. Only after those closures, evaluate the Rust enforcement horizon.

## Claim ceiling

This plan orders work and evidence. It does not authorize any wave, admit any
artifact, select an implementation, accept a migration, enforce a rule,
publish, release, deploy, or prove the Goal achieved.
