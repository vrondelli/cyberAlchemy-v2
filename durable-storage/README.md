# CyberAlchemy v2 Durable Capability State

Status: candidate model-first package
Visibility: private
Package owner: CyberAlchemy v2 durable-state capability owner
Authority effect: none

Runtime registration: `cav2.durable-storage.business` is registered as a
read-only candidate. Registration enables bounded currentness checks and
retrieval; it does not admit or accept the ontology.

This package defines the Product Capability and business-domain model for
declaring which capability-owned artifacts and working state must survive
process, session, workspace, or machine loss. It does not save an arbitrary
directory and it does not own the meaning of anything it preserves.

## Capability

`CA2-CAP-PRESERVE-DURABLE-CAPABILITY-STATE` gives each capability owner a
closed way to declare:

- the exact artifact kinds that require durability;
- whether material is authoritative, evidence, operational state, an immutable
  artifact, a rebuildable projection, a secret reference, or ephemeral;
- retention, mutability, integrity, privacy, and recovery expectations; and
- the owner route that must later approve a concrete storage binding.

The capability deliberately separates a `DurableStateRequirement` from a
later `StorageBinding`. A database, filesystem, object store, repository,
remote service, or other provider belongs to the later system ontology and
implementation binding. None is selected here.

## Package map

- `profile.json` — package identity, ontology type, lifecycle, and claim ceiling.
- `product-capability.json` — the CAV2-D67 Product Capability candidate.
- `product-capability-support.json` — unselected realization and obligations.
- `definitions.json` — exact CAV2-D65/D67 bindings plus package-local terms.
- `sources.json` — selector-bound definitions and exact capability sources.
- `storage-classes.json` — provider-neutral durability semantics.
- `storage-requirements.json` — one coverage row for every discovered subject.
- `nodes.json` and `relations.json` — capability-local business ontology.
- `residue.json` — registration evidence plus unselected system and completeness work.
- `schemas/durable-storage.schema.json` — closed package schemas.
- `scripts/validate.py` — deterministic check-only validation by default.
- `tests/test_negative_mutations.py` — hostile mutation coverage.
- `receipts/` — append-only receipts written only with `--write-receipt`.

## Coverage posture

The seed registry covers twelve CyberAlchemy Product Capability identities and
one external Agent Capability reference found in the exact sources bound by
`sources.json`. Coverage means every discovered subject has an explicit
storage posture. It does not mean every subject needs the same storage, that
the upstream capability inventory is complete, or that CyberAlchemy owns the
external Agent Capability.

Future discoveries must enter as `unknown` before a provider is selected. No
capability may silently inherit a default storage binding.

## Validate

From the repository root:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/durable-storage/scripts/validate.py
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/durable-storage/tests/test_negative_mutations.py
```

Materialize an append-only validation receipt explicitly:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/durable-storage/scripts/validate.py --write-receipt
```

## Construction boundary

This package materializes only the first three CAV2-D65 stages by reference and
candidate model: canonical definitions, Product Capability, and a
capability-local business ontology. DomainSpec v2 source, compiled graph,
system ontology, provider selection, implementation binding, recovery tests,
conformance, adoption, publication, release, deployment, and external effects
remain absent or `not_evaluable`.
