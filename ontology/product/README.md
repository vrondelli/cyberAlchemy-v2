# CyberAlchemy v2 Product Thesis Ontology

Status: candidate
Visibility: private
Package owner: CyberAlchemy v2 ontology route
Meaning owner: CyberAlchemy v2
Authority effect: none

This package is the first business ontology for the CyberAlchemy v2 product
thesis. The JSON registries are the machine-readable source for this ontology
package. The underlying candidate product meaning comes from the source records
listed in `sources.json`, especially the documents in
[`../../product/`](../../product/README.md). This README is a human navigation
view. Neither the JSON nor this view is canonical definition authority.

The graph now treats Agent Reasoning Engine as a first-class child Product of
CyberAlchemy, links it to its Product Thesis, and records its owned Product
Capability. Those nodes describe the exact candidate package; they do not grant
product approval or canonical adoption.

## Product Documentation

- [Product documentation map](../../product/README.md)
- [Product thesis](../../product/PRODUCT-THESIS.md)
- [Product journeys](../../product/PRODUCT-JOURNEYS.md)
- [Outcome model](../../product/OUTCOME-MODEL.md)

## Product Thesis

`CAV2-D63` owns the canonical meaning of Product Thesis.
`CA2-PRODUCT-THESIS-CYBERALCHEMY` is the stable ID of the current committed
CyberAlchemy thesis proposition. `CA2-THESIS-GOVERNED-HMI` is the ontology view
of that proposition. The document and ontology view remain candidate artifacts;
they do not prove that the product has been realized or that its outcomes exist.

> CyberAlchemy helps people and machines build and evolve complex systems
> together through an ergonomic, governed work loop. It keeps intent, meaning,
> evidence, decisions, action, feedback, and ownership connected. It shapes the
> next move to fit the person, task, and moment while preserving domain priority,
> owner boundaries, and human control.

The shorter public-safe candidate remains:

> Governed human-machine integration for complex knowledge work.

The thesis and its principles are committed product direction. Neither sentence
is a promoted definition or validated market claim, and commitment does not
claim that a finished realization already delivers the intended outcomes.

## Product Shape

```text
Human Participant + Machine Collaborator + Work Owner
                         |
                         v
                 Governed Work Loop
                         |
            +------------+------------+
            |                         |
            v                         v
    Reviewable Next Step        Work Continuity
            |
            v
   Build and evolve systems
```

CyberAlchemy currently has two different product concepts that must remain
separate:

- value proposition: governed human-machine integration;
- intended delivery form: a governed base repository.

The ontology does not yet decide whether the repository is the whole product,
one distribution form, or one product in a larger suite.

The governed base repository requires the candidate product rule
`CA2-RULE-DOMAINSPEC-GOVERNED-CONSTRUCTION`: implementation-bearing systems
advance from exact definitions through product and capability business meaning,
DomainSpec v2 source, deterministic compiled graph and system ontology, an
owner-accepted implementation binding, and conformance evidence. This is
product intent only. It does not create the construction registry, admit a
system ontology, authorize implementation, or activate enforcement.

## Language-Guided Define

The product now makes the agent consultation boundary explicit:

```text
Language registries
    -> Resolve Bounded Language Context
    -> Language Context View
    -> consumed by Define
    -> Definition Pack preserves the view digest and applied bindings
```

The view is bounded to one language, context, intended use, and exact source
epoch. It carries usable meanings, realization candidates, relationship
vocabulary, conflicts, owners, evidence, and blocked uses. Define reuses those
bindings or exposes a gap; it cannot silently invent equivalence or select an
open realization. These are product commitments and candidate ontology nodes,
not an accepted view schema, resolver runtime, or proof of correct agent use.

## Governance Enforcement Inside The Product

The ontology represents governance enforcement as a business capability, not
as a runtime implementation:

```text
Governance Enforcement
  requires Only Active Rules Enforce
  requires Keep Authority Bounded And Visible
  requires Governance Serves The Work
  enables Controlled Consequences
```

`Governance Enforcement` means evaluating a proposed consequence against the
exact active rule, applicable subject, authority envelope, and enforcement
binding that may affect it. `Controlled Consequences` is the intended outcome:
allowed effects stay inside those boundaries and prohibited effects are stopped
or routed to the responsible owner.

These nodes do not implement a runtime, activate a rule, adopt a Constitution,
attach a Validator or Gate, or prove that any consequence is currently
controlled. A separate business-system bridge must later show how the business
capability is realized by a system-runtime ontology and Rust implementation.

## First-Order Product Principle: Dynamic Human-Machine Work Fit

Product ergonomics means making the right governed capability available at the
right moment, in a form that fits the work, the person's explicit context and
attention, domain priority, evidence, and ownership boundary. The system carries
avoidable memory, routing, reconstruction, and coordination burden while the
human retains consequential judgment.

The ontology represents this as `CA2-RULE-WORK-ERGONOMICS`. The product thesis
and the governed work loop both require the rule. Its
`commitment_confidence: committed` expresses a first-order product belief.
Reviewable Next Step and Work Continuity remain desired outcomes, and the open
proof residue records that task-moment fit, usability, and burden reduction have
not yet been measured.

## First-Order Product Principles: Governance And Authority

The product ontology represents two connected beliefs:

- `CA2-RULE-AUTHORITY-BOUNDED-VISIBLE` — a consequential action must show the
  holder, action, target, scope, conditions, and lifecycle point of the
  authority that can make it real;
- `CA2-RULE-GOVERNANCE-SERVES-WORK` — the system carries routine checking and
  routing burden and concentrates human-visible gates where a real consequence
  changes.

The product thesis and the Governed Work Loop both require these rules. Harmless
reading, exploration, drafting, preview, and reversible local work should remain
lightweight. Candidate-to-canonical, recommendation-to-decision,
preview-to-execution, local-to-shared or public, and accepted-scope-to-effect
transitions must preserve the narrowest responsible authority route.

These business rules reference the active
[`../../authority/AUTHORITY-MODEL.md`](../../authority/AUTHORITY-MODEL.md).
They explain why authority boundaries matter to the product; they do not replace
that model, grant authority, approve an envelope, or prove runtime enforcement.
Ownership, participation, evidence, recommendations, validation, and handoffs
remain distinct from authority.

## Define Inside The Thesis

Define is the first concrete product capability represented here:

```text
Project goal + past evidence
            |
            v
   Define Shared Meaning
            |
            v
Reuse | Specialize | Define new | Keep open
            |
            v
      Definition Pack
            |
            v
  Reviewable next step for Design
```

The simple product rule is:

> Every required concept has a supported decision or remains a visible open
> question. Nothing important is silently dropped.

Define contributes to the CyberAlchemy thesis because it joins human judgment
with machine evidence search and checking while keeping scope, ownership, and
unanswered questions visible.

Its progressive context rule is:

```text
explicit intent context + related references
  -> current context window when needed
  -> current saved Define Session when still needed
  -> sufficient | insufficient | indeterminate
  -> ask whether the person wants to provide more context unless sufficient
```

Current-window and session-derived material remains provenance-marked candidate
context. It does not become a user answer, private human state, approval, or
authority. The private semantic-judgment evaluator is a bounded feasibility
witness for deterministic insufficiency and residue, not an implemented Define
adapter or a complete reasoning engine.

Define does not make a definition canonical, approve Design, authorize
implementation, release a registry, or transfer lifecycle ownership.

## Project, Goal, Research, And Experiment

The product ontology now carries one concrete evidence chain:

```text
CyberAlchemy product thesis
          ^
          | tests_realization_of
PythonConstraint Project
          |
          +-- Goal: desired result and success evidence
          +-- Research: benchmark-selection evidence and open questions
          +-- Experiment: prepared protocol, with no run evidence yet
```

Research informs the Goal. The Experiment is designed to test it. Neither
relationship achieves the Goal or proves the thesis. The source records remain
owned by `goals/`, `research/`, and `experiments/`; this package is their
candidate product-meaning projection.

## Craft Product, Project, And Method

Craft deliberately carries one name across three typed identities:

```text
CA2-PRODUCT-CYBERALCHEMY
          |
          +-- contains_product --> CA2-PRODUCT-CRAFT
                                      |-- claims_value_through --> CA2-PRODUCT-THESIS-CRAFT
                                      |-- coordinated_by ------> CA2-PROJECT-CRAFT
                                      `-- embodies_method -----> CAV2-D20 Craft Method
                                                                   ^
                                                                   |
                                              CA2-PROJECT-CRAFT -- uses_method
```

The Product owns the proposition and supplies context for its Product Features.
The Project coordinates the Product's development and evolution. The Method is
CyberAlchemy's governed way of building systems; ledgering preserves continuity
through that method but is not the whole method. These relations do not merge
their identities or authority.

Craft is the current name of the DomainSpec v2 Product lineage, not a separate
successor Product. The legacy `projects/domainspec-v2` and
`cyberAlchemy-v2/product/domainspec-v2` paths remain migration and provenance
surfaces. `CA2-RES-CRAFT-RENAME-MIGRATION` blocks any claim that naming alone
moved files, imports, consumers, package identities, or authority bindings.

`CA2-PRODUCT-FEATURE-SYSTEM-CONSTRUCTION` remains a project-local candidate.
`CA2-RES-CRAFT-PRODUCT-FEATURE-KIND` keeps its definition and its relationship
to `CAV2-D67 Product Capability` open rather than silently admitting it.

## Package Files

| File | Purpose |
| --- | --- |
| `profile.json` | Package identity, owners, visibility, and authority ceiling. |
| `sources.json` | Source paths, postures, owners, and exact digests. |
| `nodes.json` | Product, actor, problem, thesis, capability, output, outcome, and rule nodes. |
| `relations.json` | Package-local business relation vocabulary and edges. |
| `residue.json` | Open product decisions and explicitly deferred work. |
| `schemas/product-ontology.schema.json` | Closed candidate record shapes. |
| `scripts/validate.py` | Deterministic source, shape, closure, and boundary validation. |
| `receipts/` | Append-only validation history. |

## Validate

From the repository root:

```bash
python3 cyberAlchemy-v2/ontology/product/scripts/validate.py
```

Validation checks package shape, source currency, stable ID uniqueness,
relation endpoint closure, residue references, private visibility, and the
`authority_effect: none` ceiling.

## Deferred Work

- interactive Define CLI and chat realization;
- business-system bridge and Rust realization for Governance Enforcement;
- DomainSpec node and relation projection;
- product proof and measurable value outcomes;
- stable actor vocabulary;
- public wording and boundary review;
- promotion of the HMI definition candidate.

These remain in `residue.json`; they are not silently treated as complete.
