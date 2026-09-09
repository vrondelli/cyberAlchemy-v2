# CyberAlchemy v2 Capability Ontology

Status: canonical shared ontology package
Visibility: private
Owner: CyberAlchemy v2 capability owner
Ontology type: `business-system-bridge`
Canonical definitions: `CAV2-D67` Product Capability and public
`DEF-ARC-CAPABILITY` Agent Capability

## Why this package exists

CyberAlchemy already describes several things as capabilities, but those records
use different local shapes. Without a shared ontology, “capability” can mean a
product outcome, an agent behavior, a component, a command, a permission, or a
passing run. Those meanings are not interchangeable.

This package makes the distinction explicit:

- a **Product Capability** says what useful outcome CyberAlchemy must enable;
- an **Agent Capability** says what reusable work an agent can perform under an
  owned contract;
- a **Capability Realization** is an agent or system mechanism that may realize
  part of a Product Capability;
- a **Capability Reference** points to a source-owned capability without taking
  ownership of it.

The shared package is canonical for the private reference grammar, lifecycle
axis separation, typed relation signatures, and bridge rules. It is not the
owner of Define, Language, Registry Context, or any other capability
instance.

The graph now also projects the source-owned
`CA2-CAP-REASON-AND-MANAGE-CONTEXT` candidate from the first-class
[`../agent-reasoning-engine/`](../agent-reasoning-engine/README.md) Product
package. That reference grants no product approval, canonical adoption,
realization, or conformance.

## Authority split

| Meaning | Canonical authority | Local posture here |
| --- | --- | --- |
| Agent Capability | `arcanum/definitions/DEFINITIONS.md#DEF-ARC-CAPABILITY` | external canonical reference |
| Product Capability | `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md#CAV2-D67` | canonical reference |
| Capability Reference | this package schema | package-owned private grammar |
| Capability instances | each source module | source-bound projection only |
| Realization and conformance | realization owner and evidence owner | separate, never inferred |

There is deliberately no CAV2-owned generic `Capability` base definition. The
machine sum type is:

```text
CapabilityReference =
  ProductCapabilityReference | AgentCapabilityReference
```

## Lifecycle model

`state-model.json` applies `CAV2-D23`. A reference preserves the source's own
status vocabulary and keeps status, evidence, commitment, provenance, owner,
and residue separate. Realization and conformance have independent postures.

Therefore:

```text
definition promotion =/=> instance adoption
schema validity =/=> working realization
implementation =/=> conformance
conformance =/=> product value
repeated use =/=> authority or maturity
```

## Current source-bound records and projections

- `CA2-CAP-DEFINE-SHARED-MEANING` — first owner-local, schema-conforming
  candidate record shape, owned under `cyberAlchemy-v2/define/capabilities/`;
- `CA2-CAP-RESOLVE-LANGUAGE-CONTEXT`
- `CA2-CAP-RESOLVE-REGISTRY-CONTEXT`
- `CA2-CAP-RESOLVE-CONSEQUENTIAL-DECISIONS` — review-owned candidate Product Capability;
- `CA2-CAP-EXPLAIN-COMPLEXITY-WITHOUT-MEANING-DRIFT` — review-owned candidate Product Capability;
- private projections of the standalone Define CLI, public Decision Gate, and Complexity
  Example Ladder Agent Capability contracts.

Define remains not adopted and behaviorally not assessed. Its standalone runtime
binding is candidate and substantial, and saved-session plus CLI/chat continuity is
a known product gap. Language and Registry Context remain unmigrated
projections; their migration stays with their module owners in `residue.json`.
The two review Product Capabilities are also not adopted and behaviorally not
assessed; their public bindings are source-reported candidate contributions,
not complete realization or conformance.

## Package map

- `profile.json` — package identity, owner, visibility, and output ceiling.
- `sources.json` — exact source identities and selector digests.
- `definitions.json` — canonical definition bindings without redefinition.
- `capability-references.json` — source-owned capability references.
- `state-model.json` — orthogonal lifecycle, realization, and conformance axes.
- `nodes.json` — business, system, and projection nodes.
- `relations.json` — typed relation vocabulary and evidence-bound edges.
- `views.json` — business, system, and bridge views.
- `residue.json` — unresolved migrations and proof gaps.
- `schema-amendment-product-capability-v1.json` — exact schema preimage and
  postimage witness for owner-local records.
- `migration.json` — digest-bound manifest of the seven Define-owned records.
- `schemas/capability.schema.json` — closed agent-facing shapes.
- `scripts/validate.py` — deterministic check-only validator.
- `tests/test_negative_mutations.py` — hostile mutation checks.
- `receipts/` — append-only validation history.

## Validate

```bash
python3 cyberAlchemy-v2/capability/scripts/validate.py
python3 cyberAlchemy-v2/capability/tests/test_negative_mutations.py
python3 cyberAlchemy-v2/capability/scripts/validate.py --write-receipt
```

A PASS proves package and owner-local record shape, exact source and manifest
currency, graph closure, branch polarity, reference-kind separation,
lifecycle-axis separation, and the `authority_effect: none` ceiling. It does
not adopt a capability instance, accept a Definition Pack, prove complete
realization or behavioral conformance, implement saved sessions or interface
parity, establish product value, publish, release, deploy, or authorize an
external effect.
