# Craft Governed Construction Goal Candidate

Status: planning candidate; not registered in the Goals package  
Proposed Goal ID: `CA2-GOAL-CRAFT-GOVERNED-CONSTRUCTION`  
Owning Project: `CA2-PROJECT-CRAFT`  
Target horizon: continuous, eventual, no deadline  
Authority effect: none

## Goal

Make Craft—the Product in the same lineage as DomainSpec v2—the governed
implementation method by which CyberAlchemy v2 turns accepted product meaning
into inspectable systems, while preserving human control and exact evidence at
every transition.

The Goal is achieved only when the selected product slice follows this exact
chain:

```text
canonical definitions
  -> adopted Product Capability
  -> capability-local business ontology
  -> DomainSpec v2 authored source
  -> deterministic compiled graph and system ontology
  -> exact implementation binding
  -> independent conformance evidence
```

The chain is `CAV2-D65`. A later runtime-enforcement horizon may enforce this
chain only after the construction evidence is complete and separately adopted.

## Product-thesis fit

This Goal realizes the Product Thesis by making the governed human-machine
interaction loop concrete at the implementation boundary:

- intent and product meaning remain owner-controlled;
- machine artifacts preserve exact selectors, digests, and provenance;
- evidence can block or inform but cannot impersonate an owner decision;
- every implementation claim is traceable back to accepted product meaning;
- failures and unsupported stages remain visible instead of being converted to
  optimistic PASS;
- public Arcanum mechanisms may assist the work but never become private
  CyberAlchemy product or routing authority.

The immediate thesis bindings are:

- `cyberAlchemy-v2/product/PRODUCT-THESIS.md`, `## Thesis`;
- `cyberAlchemy-v2/product/PRODUCT-THESIS.md`, `## First-Order Product Principles`, item 1, `Human agency`;
- `cyberAlchemy-v2/product/PRODUCT-THESIS.md`, `## First-Order Product Principles`, item 2, `Bounded and visible authority`;
- `cyberAlchemy-v2/product/PRODUCT-THESIS.md`, `## First-Order Product Principles`, item 6, `Evidence continuity`;
- `cyberAlchemy-v2/product/PRODUCT-THESIS.md`, `## First-Order Product Principles`, item 7, `Owner continuity`;
- `cyberAlchemy-v2/product/PRODUCT-THESIS.md`, `## First-Order Product Principles`, item 8, `Honest incompleteness`;
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`, `## CAV2-D65: DomainSpec-Governed Construction Invariant`;
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`, `## CAV2-D67: Product Capability`.

## Why this is a new Goal under Craft

`CA2-GOAL-CRAFT-PRODUCT-FEATURE-FOUNDATION` establishes the first Craft
Product Feature thesis and exposes its early definition and ontology decisions.
It does not own repository-wide adoption of the construction method, completion
of one exact D65 vertical, or later runtime enforcement. This candidate keeps
those concerns in the same Project while preserving three different claims:

1. **method adoption** — the Product owner chooses Craft/DomainSpec v2 as the
   governed implementation method;
2. **construction completion** — one exact slice proves all D65 predecessors,
   binding, and conformance;
3. **runtime enforcement** — a separately governed Rust kernel later evaluates
   admitted bindings fail-closed.

No one of these claims implies either of the others.

## Scope

- the exact owner decision adopting the governed construction method;
- canonical terms for the method, construction stages, bindings, evidence, and
  failure states;
- one Product Capability and capability-local business ontology for the first
  selected CyberAlchemy slice;
- authored DomainSpec v2 source plus deterministic graph and system ontology;
- one exact `ConstructionBinding` from meaning to implementation;
- independent static conformance and bounded runtime evidence;
- EVF as the evidence-composition surface and BTE as the breadth/completeness
  surface, without collapsing either into authority;
- retirement, replacement, or bounded adoption of Arcanum-derived technical
  mechanisms;
- a continuous frontier that discovers, routes, verifies, and closes every
  evidenced gap without skipping predecessors.

## Exclusions

- changing a status or digest to manufacture admission;
- treating a compiler, schema, validator, EVF, BTE, plan, handoff, or passing
  focused test as Product adoption or owner acceptance;
- making the suspended Python ontology runtime a repository gate;
- treating public Arcanum prose or capability names as CyberAlchemy authority;
- broad migration, publication, release, deployment, credentials, or external
  effects;
- claiming all implementations conform from one successful vertical;
- marking the Goal achieved while any required stage is blocked or
  `not_evaluable`.

## Success conditions

| ID | Condition | Required evidence |
|---|---|---|
| `SC-CGC-01` | The Product owner adopts or rejects the method wording. | Exact-digest decision over this Goal and its selected thesis selectors. |
| `SC-CGC-02` | Goal ownership closes through Craft. | Schema-valid bidirectional Project/Goal references with no duplicate Project identity. |
| `SC-CGC-03` | Required concepts are canonical and non-collapsed. | Accepted definitions distinguishing Product, Project, Goal, Product Capability, business ontology, DomainSpec source, system ontology, implementation, evidence, and enforcement. |
| `SC-CGC-04` | The first slice has an adopted Product Capability. | Owner-bound capability record with scope, responsibilities, dependencies, failures, and evidence requirements. |
| `SC-CGC-05` | The slice has a capability-local business ontology. | Validated and admitted ontology records with exact selected dependencies and explicit residue. |
| `SC-CGC-06` | DomainSpec source deterministically realizes that meaning. | Authored source, source manifest, two-run equal compiled graph, and system-ontology projection. |
| `SC-CGC-07` | One exact implementation is bound. | Owner-accepted realization baseline and closed `ConstructionBinding` with exact digests. |
| `SC-CGC-08` | Conformance is independently established. | Mutation-resistant static evidence and bounded runtime evidence whose claims do not exceed the selected slice. |
| `SC-CGC-09` | EVF/BTE gaps are closed without denominator or binding ambiguity. | Exact evidence membership, independent consumer proof, real producer IDs, exact resolver behavior, and current plan/corpus parity. |
| `SC-CGC-10` | Arcanum-derived debt has an explicit disposition. | Per-dependency keep, wrap, replace, migrate, or retire decision with public/private and authority boundaries. |
| `SC-CGC-11` | Runtime enforcement is separately admitted. | Governance-selected Rust kernel evidence for selector closure, deterministic evaluation, candidate/admitted separation, and bounded fail-closed behavior. |
| `SC-CGC-12` | The continuous frontier is empty or explicitly owner-deferred. | Every discovered gap is closed, superseded, rejected, or retained with owner, reason, evidence, and next gate. |

## Current condition

`native-goal-active; durable-goal-registration-blocked; project-owner-evidenced;
method-adoption-open; d65-first-vertical-fail-closed; evf-bte-gaps-open;
runtime-enforcement-suspended`

The active Goals package currently reports source-digest and inherited-contract
drift. This candidate must not be copied into the registry until that baseline
is frozen and repaired by its owners. Refreshing digests during source churn is
not a repair.

## Challenge and approval route

- Product meaning and adoption: CyberAlchemy v2 Product owner and Craft Product
  owner.
- Project coordination: Craft Project owner.
- inherited DomainSpec/Craft meaning: DomainSpec v2 owner until an exact
  transfer decision closes.
- definitions and ontology: their named definition and ontology owners.
- construction and compiler evidence: DomainSpec/Craft construction owners.
- implementation and conformance: implementation owner plus an independent
  evidence owner.
- runtime enforcement: governance-selected Rust-kernel owner under a separate
  acceptance decision.

## Claim ceiling

This document is a Goal candidate and continuous-planning anchor. It creates no
repository Goal registration, Product adoption, ontology admission,
implementation authority, conformance verdict, enforcement effect,
publication, release, deployment, or external effect.
