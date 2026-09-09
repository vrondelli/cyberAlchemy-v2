---
document_id: cav2-domainspec-v2-migration-decision/v1
status: pass-route-selected
authority_effect: migration-route-selected-only
visibility: private
updated_at: 2026-08-30
---

# DomainSpec v2 Migration Decision

Decision ID: `CAV2-DECISION-DOMAINSPEC-V2-MIGRATION-001`

Status: `PASS — MIG-B staged successor route selected; successor baseline unadmitted`

Admissibility receipt: [option-admissibility-receipt.json](option-admissibility-receipt.json)

Request digest: `9bf68ad1331ecf8fa45a0c13697db0bd35dd843537dc90e9c263a4687ceb2f5c`

Inventory digest: `377362acdbaa687839389790d92f1e6e5be9352cdcaf460f081daca12d13114d`

Selection: [selection.json](selection.json)

Selected option: `MIG-B-STAGED-SUCCESSOR`, chosen explicitly by the user acting as the
`CyberAlchemy v2 authority owner and DomainSpec v2 owner` on `2026-08-30T18:51:18Z`.

## Decision Question

How should the active private DomainSpec v2 product become part of CyberAlchemy v2 while preserving the current
baseline, frozen evidence, pre-existing dirty bytes, exact path consumers, and the public/private boundary?

## Admissible Options

### `MIG-A-GOVERNED-ADOPTION`

Make the new CyberAlchemy product, architecture, and ontology entry surfaces authoritative, keep the current
physical DomainSpec root, and start new work from CyberAlchemy.

- Benefit: smallest change; preserves every current path and baseline.
- Cost: leaves the active implementation physically outside CyberAlchemy and maintains two roots.
- Choose when: governance consolidation matters more than physical consolidation.
- Reversibility: the authority decision is durable; additive documents remain mechanically reversible before use.

### `MIG-B-STAGED-SUCCESSOR` — recommended

Materialize a dependency-closed active DomainSpec successor across CyberAlchemy layers, rebind all active
consumers, mint and validate a new baseline, switch authority explicitly, and retain old frozen evidence.

- Benefit: actually moves the active product into CyberAlchemy while preserving reproducibility and rollback.
- Cost: temporary duplication and a larger validation surface.
- Choose when: the intended end state is one CyberAlchemy-native active product.
- Reversibility: additive until authority switch; the switch itself is a durable owner decision.

### `DEFER-DOMAINSPEC-MIGRATION`

Retain the exact inventory and candidate documentation without promoting or relocating anything.

### `STOP-DOMAINSPEC-MIGRATION`

End this migration line. Current DomainSpec authority and implementation paths remain unchanged.

Standing non-decision option: ask for `Explain / more context`. This does not resolve the gate.

## Rejected Option

`MIG-C-DIRECT-RELOCATION` is structurally inadmissible. The source snapshot is dirty, the active runtime baseline
binds old paths, and 433 active external files contain the literal source root. Migration-preparation references
are excluded so the count does not recursively grow. A direct move would invalidate evidence
before a successor baseline exists and would mix migration changes with owner-authored work.

## Exact Subject

- Inventory index: `../../../inventory/domainspec-v2/index.json`
- Exact source manifest: `../../../inventory/domainspec-v2/source-manifest.json`
- Path consumers: `../../../inventory/domainspec-v2/path-consumers.json`
- Product successor candidate: `../../../product/domainspec-v2/`
- Architecture successor candidate: `../../../architecture/domainspec-v2/`
- Ontology successor candidate: `../../../ontology/domainspec-v2/`
- Migration contract: `../../../architecture/domainspec-v2/MIGRATION-CONTRACT.md`
- Current active source: `projects/domainspec-v2/`

## Claim Ceiling

Inventory and candidate documentation are complete preparation only. They do not select an option, promote a
canonical source, admit a successor baseline, copy or move implementation, rewrite consumers, delete old paths,
publish, release, deploy, or prove production readiness.

## Open Questions

- Which exact successor baseline will pass independent review and owner admission?
- When that baseline passes, will the owner authorize the separate active-authority switch?
- Optional deletion of any old-root byte remains outside this selection and requires a destructive-action gate.
