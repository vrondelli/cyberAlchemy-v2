# Workspace control-center product and business ontologies

Private candidate ontology scaffolds derived from the approved
[product thesis](../PRODUCT-THESIS.md). Owner: CyberAlchemy v2 product owner.
Authority effect: none. JSON records own package state; this README is a human
navigation view. These models describe intended behavior, not running software.

## Product ontology

The `product` view in [views.json](views.json) has identity
`cav2.workspace.control-center.product`. It models the person served, parent
product, existing inspect capability, proposed control-center capability,
supporting capabilities, continuity outcome, evaluation, and value hypothesis.

Read [nodes.json](nodes.json) entries prefixed `P-`, then their typed edges in
[relations.json](relations.json). Product capabilities cover contextual chat,
delegation supervision, ergonomic arrangement, attention, and addon composition.
Expected benefits remain unmeasured hypotheses.

## Business ontology

The `business` view has identity `cav2.workspace.control-center.business`.
Entries prefixed `B-` describe conversation, request, visible target, assignment,
relevant context, result, artifact, evidence, surface, layout, layout proposal,
pinned arrangement, working state, attention request, addon provider, embedding
host, the first journey, and interaction rules.

A conversation contains requests; a request can delegate an assignment; an
assignment uses relevant context and returns a result. Surfaces present work,
layouts arrange surfaces, and proposals suggest arrangements. Pinned choices
and predictable adaptation constrain layout changes. Attention stays associated
with the work needing intervention.

`elaborated_by` edges connect product capabilities to business concepts. They
are meaning links within the business branch, not implementation-realization
claims. View relation lists include incident cross-view edges whose endpoints
resolve in the shared node registry.

## Ownership and source dependencies

[profile.json](profile.json) declares one durable `business-domain` package with
two views. The product view is a local specialization of this archetype, as in
the existing CyberAlchemy product ontology; no new global archetype is added.

[sources.json](sources.json) binds exact thesis bytes and selected sections,
plus existing Workspace node identities. The existing inspect-only ontology
remains untouched. Whole-file digests intentionally make edits to either
selected source file a refresh condition; unrelated ontology epochs are outside
the dependency set. There is no central ontology-runtime registration or
admission claim.

Each node records semantic handling, source references, evidence posture,
ownership, and its boundary. New concepts are candidate proposals; request
modeling is an explicit design inference. Addon wording specializes the thesis
only: conformance with exact Lab definitions remains an integration gap.

## Validation

From this directory, with Python 3 and the `jsonschema` package available:

```sh
python3 scripts/validate.py
python3 scripts/validate.py --receipt
```

The first command is check-only. The second explicitly appends a receipt using
exclusive file creation. Checks cover closed record shapes, unique IDs, source
digests and selectors, evidence references, reuse identities, typed endpoints,
per-relation cycle rules, view polarity and coverage, residue references, and
candidate authority ceilings. Historical receipts report whether their package
digest is current and never substitute for a fresh check.

PASS means structural integrity and source currency. It does not establish
runtime behavior, usability, product approval, ontology admission, or authority.
The package receipt also records the ontology-vault invocation evidence.

## Construction frontier

Product construction is at prototype ontology scaffolding. Interaction-contract
design and a layout prototype can proceed from these candidates. Integration
requires resolving the addon, target, persistence, and adapter questions to the
extent each contract depends on them. Product testing requires usability
thresholds and the existing performance campaign; budgets remain unchanged.

Operational support is deferred to the respective repository owners for later
Lab reconciliation, merge preparation, publication, and deployment. These
delivery tasks do not block the current ontology or interaction prototype.

## Open Questions

[residue.json](residue.json) owns eight open items: layout automation, target
selection, persistence, addon contract, successor adapter, usability evidence,
existing capability evolution, and Lab vocabulary binding. Each identifies
affected nodes, source evidence, an owner, and the stage it can block.
