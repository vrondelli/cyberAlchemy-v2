# CyberAlchemy Governance Ontology

Status: candidate
Visibility: private
Ontology type: authority-governance
Package owner: CyberAlchemy v2 governance-model owner
Authority effect: none
Enforcement effect: none

This is the self-contained Governance module inside CyberAlchemy v2. It owns an
authority-governance ontology at this root and a business product ontology in
`product/`. Together they define governance meaning, business intent, relation
contracts, identity axes, source bindings, internal product links, and residue
without making any rule active or implementing an admitted enforcement runtime.

The JSON registries are the package state. This README is a human navigation
view. Canonical CAV2 meanings remain owned by the definitions and authority
surfaces cited in `sources.json`; this ontology references them and does not
replace them.

## What This Project Owns

- 17 candidate DomainSpec v2-aligned governance concept types;
- 15 typed governance relation contracts;
- 2 candidate governed invariant instances and 2 candidate operational rule instances;
- separate semantic, lifecycle, currentness, authority, product, and evidence
  identity axes;
- 9 target-level bindings into a 43-node Governance business product ontology;
- 1 non-authoritative D65 revision-2 ontology scaffold and 1 exact prototype
  construction binding;
- 6 candidate perennial documents covering product, domain, authority,
  lifecycle, evidence, and runtime intent;
- residue that prevents missing evidence or future runtime work from looking
  complete; and
- deterministic package validation and append-only receipts.

It does not own canonical definitions, owner decisions, Constitution adoption,
admitted runtime components, enforcement points, product outcomes, publication,
or deployment.

## Module Boundary

`module.json` declares two required, independently validated ontologies:

```text
Governance module
├── cav2.governance-model  (authority-governance)
└── governance.product     (business-domain)
```

The module is located inside CyberAlchemy v2 through a `module_of` host-context
link. It retains selector-level dependencies on canonical CAV2 and DomainSpec
authority sources, but its `product_ontology_dependency` is `none`: it does not
load or hash the CyberAlchemy-wide product ontology to validate itself. This is
structural autonomy inside the private host, not an extraction or release
claim. Future system-runtime and business-system bridge packages remain planned
rather than being inferred from product intent.

## Candidate Perennial Documents

`documents.json` registers six long-lived candidate specifications:

- `docs/PRODUCT.md` — product meaning, actors, problems, capabilities,
  outcomes, rules, and value measures;
- `docs/DOMAIN-MODEL.md` — concepts, relations, DomainSpec v2 mappings, and
  non-collapse boundaries;
- `docs/AUTHORITY.md` — owners, decision rights, Constitution boundaries, and
  effect ceilings;
- `docs/LIFECYCLE.md` — supporting asset, rule, assessment,
  reference-currentness, and hash lifecycle separation;
- `docs/EVIDENCE.md` — harm and risk basis, observations, assessments,
  friction measures, privacy, and missing evidence; and
- `docs/RUNTIME.md` — future runtime intent and enforcement preconditions.

Perennial means intended to endure and be maintained. These documents are
still candidates with `canonical_status: not-admitted`; durability grants no
authority and does not activate their content.

## Core Model

```text
Governance Axiom --grounds--> Governance Invariant
Governance Invariant --is operationalized by--> Governance Rule

Governance Evidence --supports--> Governance Assessment
Assess Governance --produces--> Governance Assessment
Governance Assessment --is evaluated under--> Governance Policy
Governance Policy --may inform--> Governance Decision
Governance Decision --adopts exact--> Governance Constitution
Governance Constitution --contains rule--> Governance Rule
Governance Constitution --contains policy--> Governance Policy

Governance Discipline --is realized by--> Run Governance Discipline
Run Governance Discipline --coordinates--> Assess Governance
Governance Rule --is scoped by--> Governance Authority
Governance Rule --is measured by--> Friction Metric Contract
```

This is a typed graph, not a mandatory linear process. Every relation has
`authority_effect: none` and `enforcement_effect: none`.

The first concrete instance registration keeps the type and instance layers
separate:

```text
CAV2-D64 --registered as--> GOV-INV-CAV2-D64
GOV-INV-CAV2-D64 --is operationalized by-->
  GOV-RULE-D64-BINDING-COMPLETE
```

The invariant is active in canonical definition authority. Its ontology
registration and operational rule remain candidate, review-only, not adopted,
and non-effectful. The missing semantic version, axiom grounding, Constitution,
concrete binding evaluation, and runtime integration remain explicit residue.
The Project package's closed empty binding registry makes the record shape and
reference direction first-class without claiming a binding exists.

The second concrete registration adds the DomainSpec-governed construction
invariant:

```text
CAV2-D65 --registered as--> GOV-INV-CAV2-D65
GOV-INV-CAV2-D65 --is operationalized by-->
  GOV-RULE-D65-CONSTRUCTION-STAGES-COMPLETE
```

Revision 2 records a prototype-first sequence: prototype definitions and
agent-facing ontology scaffolds guide iterative product, business, DomainSpec,
compiled-system, and implementation prototypes until one exact product
candidate can be tested. Only after current tests pass may product approval be
requested, and only after that approval may separate authority decisions be
requested. Product approval itself grants no authority. The legacy machine
`ConstructionBinding` registry and evaluator still encode the superseded
stage-admission sequence and remain quarantined diagnostics.

The parallel revision-2 prototype runtime is now materialized in:

- `ontology-scaffolds.json` — agent navigation records that must remain
  `prototype-scaffold`, `non-authoritative`, and `authority_effect: none`;
- `prototype-constructions.json` — exact artifact bindings, frozen candidate,
  product-test contract and evidence, optional product approval, and optional
  post-approval authority-request candidates;
- `scripts/validate-prototype-construction.py` — deterministic freezing,
  selected-byte currentness, and eligibility calculation; and
- `tests/test_d65_prototype_construction.py` — positive and hostile checks for
  vacuity, drift, scaffold authority, freezing, and request ordering.

The current exact prototype is tested and therefore eligible for a
product-approval request. No product approval record exists, so authority
requests remain ineligible. Validator `PASS` is product evidence only.

## DomainSpec v2 Meta-Types

The package uses the active DS-D1 meanings rather than a parallel type system:

- `Entity`: Axiom, Evidence, Assessment, Decision, Discipline, Constitution,
  Authority, and Friction Metric Contract;
- `Value Object`: Product Binding;
- `Enum`: Governance Rule Kind and Governance Mode;
- `Calculation`: Assess Governance;
- `Rule`: Governance Invariant and Governance Rule;
- `Policy`: Governance Policy;
- `Workflow`: Run Governance Discipline; and
- `Event`: Governance Observation.

These are semantic mappings. They do not claim DomainSpec-generated code or
runtime conformance.

## Link To The Governance Product

`product-bindings.json` links selected governance meanings to the business
product ontology owned inside this module:

```text
cav2.governance-model  -> Governance Product
cav2.governance-model  -> Validate And Enforce Applicable Governance
GovernanceConstitution -> Only Adopted Applicable Governance May Enforce
GovernanceAuthority    -> Only Adopted Applicable Governance May Enforce
GovernanceRule         -> Only Adopted Applicable Governance May Enforce
GovernanceRule         -> Governance Must Name Its Basis
GovernanceAssessment   -> Governance Evaluation product output
FrictionMetricContract -> Governance Refresh Churn
cav2.governance-model  -> Controlled Consequences
```

The validator resolves only those selected product nodes and checks their
identity, role, candidate status, and authority ceiling. It deliberately does
not hash the whole product ontology. Therefore an unrelated product-node change
does not become governance drift or a lifecycle refresh.

These are internal module view bindings owned here. They do not add edges to
the product ontology and do not prove that Governance enforcement is
implemented. The module can validate without loading the CyberAlchemy-wide
product ontology.

## Identity And Hashing

Semantic identity, lifecycle state, reference currentness, authority state,
product contribution, and observation evidence remain separate axes.

Import hashes preserve the provenance of the snapshots used to build this
package. Live currentness is checked only for selected records and selectors;
whole-file drift is intentionally not a lifecycle signal. The package material
digest identifies a validation snapshot only. Neither kind of digest can
activate governance, change a rule version, reopen a lifecycle, grant
authority, or force unrelated refreshes. See `identity-policy.json`.

## Package Files

| File | Purpose |
| --- | --- |
| `profile.json` | Package identity, ownership, visibility, and effect ceiling. |
| `sources.json` | Materialization sources, import provenance, and live selector bindings. |
| `nodes.json` | Governance concept types and DomainSpec v2 meta-type mappings. |
| `relations.json` | Allowed typed governance relations. |
| `invariants.json` | Candidate registrations of concrete canonical invariants. |
| `rules.json` | Candidate operational rules and typed invariant links. |
| `product-bindings.json` | Target-level links to module-owned Governance product meaning. |
| `product/` | Standalone Governance business product ontology package. |
| `identity-policy.json` | Separation of identity, currentness, lifecycle, and digest roles. |
| `residue.json` | Explicit unresolved work and claim limits. |
| `migration.json` | Selective seed import, exclusions, and superseded bindings. |
| `schema-amendment-d64.json` | Candidate profile-v2 migration and rollback witness. |
| `module.json` | Standalone module identity, owned ontologies, and CyberAlchemy host context. |
| `documents.json` | Registry and heading contract for candidate perennial documents. |
| `docs/` | Maintained human specifications for the Governance project. |
| `schemas/governance-ontology.schema.json` | Closed package record shapes. |
| `scripts/validate.py` | Deterministic authority-ontology and internal-binding validator. |
| `scripts/validate-module.py` | Aggregate check for both owned ontologies. |
| `receipts/` | Append-only validation history. |

## Validate

From the repository root:

```bash
python3 cyberAlchemy-v2/ontology/governance/scripts/validate.py
```

To materialize one append-only receipt after a passing check:

```bash
python3 cyberAlchemy-v2/ontology/governance/scripts/validate.py --write-receipt
```

Validate the complete standalone module:

```bash
python3 cyberAlchemy-v2/ontology/governance/scripts/validate-module.py
```

Append receipts for both ontologies and the combined module explicitly:

```bash
python3 cyberAlchemy-v2/ontology/governance/scripts/validate-module.py --write-receipts
```

## Current Boundary

The next project is a separate system-runtime ontology and business-system
bridge for the Rust Governance Enforcement runtime. This ontology remains the
governance-domain source for that work; it is not the runtime itself.
