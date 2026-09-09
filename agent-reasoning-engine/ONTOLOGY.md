# Agent Reasoning Engine ontology

Status: private first-class candidate package. Authority effect: none.

## Purpose

This durable ontology package defines the Agent Reasoning Engine as the
CyberAlchemy-v2 capability for both governed reasoning and context management.
It keeps business meaning, DomainSpec-authored system structure, generated
system projections, implementation evidence, and unresolved gaps distinct.
The current bounded system branch includes checkpointed append-only Reasoning
State recovery, disposable-index rebuilding, and a measured evolution cycle
with isolated variants and reversible controlled-local activation. Production
research providers, automatic code materialization, deployment, repair,
cross-process coordination, and Session semantics remain outside the realization.

The package uses the `business-system-bridge` ontology archetype because the
requested capability spans product meaning and runtime structure. Its business
branch defines the outcomes, actors, concepts, workflows, and non-collapse
rules. Its system branch is authored in DomainSpec v2 and compiled
deterministically. The bridge links only what current evidence supports.

## D65 construction state

| Stage | State | Meaning |
|---|---|---|
| Canonical definitions | validated | Exact CAV2-D65 and CAV2-D67 sections are source-bound. |
| Product ontology | referenced | The capability belongs to the existing CyberAlchemy product. |
| Product Capability | candidate | Stable combined reasoning/context outcome; not adopted by file presence. |
| Business ontology | candidate | Capability-local product meaning and rules. |
| DomainSpec source | candidate | Package-local authored nodes under `domainspec/`. |
| Compiled graph | candidate-generated | Deterministic projection, not independent authority. |
| System ontology | candidate-generated | Deterministic projection; profile admission is not granted. |
| Bridge validation | candidate | Partial realization and gaps are explicit. |
| Implementation | candidate partial realizations | Routing, context, context-bound semantic integrity, journal, app-server, reusable reasoning-state, exact-dispatch, checkpoint, fail-closed recovery, and measured evolution verticals have bounded evidence; they do not constitute the whole engine. |
| Static conformance | not evaluable | No accepted exact implementation binding. |
| Runtime evidence | not evaluable | No complete engine or context manager. |

## Key files

- [`product-capability.json`](product-capability.json) owns the candidate stable
  product outcome.
- [`product.json`](product.json) owns the first-class Product identity and
  package boundary.
- [`business-ontology.json`](business-ontology.json) owns business meaning.
- [`domainspec/`](domainspec/) owns the authored system source and generated
  projections.
- [`bridge.json`](bridge.json) owns cross-branch traceability and evidence gaps.
- [`sources.json`](sources.json) binds the exact selected dependencies.
- [`residue.jsonl`](residue.jsonl) preserves unresolved construction state.

## Validation

From the repository root:

```text
python3 cyberAlchemy-v2/agent-reasoning-engine/scripts/validate.py --verify-build
python3 -m unittest discover cyberAlchemy-v2/agent-reasoning-engine/tests
```

Check-only validation writes nothing. A validation receipt is materialized only
with the separate `--write-receipt --receipt-name <unique-name>` operation.

The current candidate projection includes checkpointed completed-turn Reasoning
State Frontiers. They preserve explicit semantic and continuation results for
zero-call recovery replay, but do not acknowledge downstream successor delivery,
create a durable Session, or grant authority.

It also includes fail-closed context-bound semantic integrity: the binding,
Problem Frame, entry gate, authority snapshot, selected Context Items, freshness,
and claim ceiling must agree exactly, and context-bound receipts retain those
identities without changing historical unbound receipt bytes.

## Claim ceiling

A PASS proves that this candidate package is internally coherent, its selected
sources are current, its business and system endpoints close, bounded
realization edges carry implementation evidence, and its generated artifacts
replay deterministically. It does not adopt the Product Capability or decision
profile, admit the DomainSpec profile or system ontology, provide general
context management, integrate the whole engine, accept an implementation
binding, prove conformance, publish, release, deploy, or authorize an effect.

## Understanding and learning product view

Derived from the added stable IDs in `business-ontology.json`, not a separate
ontology source. These are intended business relationships; the new bridge gaps
explicitly mark missing objective/learning integration. No new realization edge
or generated system node is claimed.

```text
reasoning request -> consumes -> reusable reasoning state
objective resolution -> consumes -> reasoning request
objective resolution -> consumes -> reusable reasoning state
objective resolution -> produces -> interpretation
objective resolution -> produces -> objective transition
objective resolution -> produces -> current objective
objective resolution -> precedes -> request routing
request context -> preserves -> current objective
reusable reasoning state -> preserves -> interpretation
reusable reasoning state -> preserves -> current objective
reusable reasoning state -> preserves -> scoped lesson
reusable reasoning state -> preserves -> reasoning counterevidence
reasoning state epoch -> preserves -> reusable reasoning state
context formation -> consumes -> reusable reasoning state
understanding validation -> consumes -> interpretation
understanding validation -> consumes -> expected outcome
understanding validation -> consumes -> observed outcome
understanding validation -> produces -> understanding assessment
interaction learning -> consumes -> understanding assessment
interaction learning -> produces -> scoped lesson
scoped lesson -> preserves -> communication preference
interaction learning -> produces -> lesson application
lesson application -> consumes -> scoped lesson
interaction learning -> produces -> application assessment
application assessment -> consumes -> lesson application
application assessment -> consumes -> observed outcome
interaction learning -> produces -> improvement signal
engine evolution -> consumes -> improvement signal
understanding requires evidence -> constrains -> understanding validation
objective is not route -> constrains -> objective resolution
preference reuse is scoped -> constrains -> interaction learning
```

Product-local definitions and examples:
[Understanding, objectives and reusable reasoning state](REASONING-AND-LEARNING.md).
The selected design sources are CAP-SEL-ARE-REASONING-LEARNING-EXPLANATION,
CAP-SEL-ARE-INTERACTION-LEARNING-PLAN and CAP-SEL-ARE-APPROVED-FORMAT-EXAMPLE.
No canonical CyberAlchemy definition is changed. Existing node/edge shapes and
relation vocabulary are reused; no schema migration is needed.

## Open Questions

See [the explanation's open questions](REASONING-AND-LEARNING.md#open-questions)
and bridge gaps CA2-ARE-GAP-OBJECTIVE-TRANSITION-CLASSIFICATION and
CA2-ARE-GAP-EVIDENCE-BOUND-INTERACTION-LEARNING. Package source drift and pending
rematerialization are recorded in CA2-ARE-RES-010.
