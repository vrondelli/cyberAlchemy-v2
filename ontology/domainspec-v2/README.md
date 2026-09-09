---
document_id: cav2-domainspec-v2-ontology-entry/v1
status: candidate-successor
authority_effect: none
visibility: private
updated_at: 2026-08-30
---

# DomainSpec v2 Product and System Ontology

This directory is the proposed CyberAlchemy home for the private DomainSpec business/system/bridge ontology.
It currently acts as a digest-bound entry surface; the machine ontology remains at
`projects/domainspec-v2/ontology/` until the migration decision and successor baseline pass.

## Current machine source

| Artifact | Inventoried SHA-256 |
| --- | --- |
| `profile.json` | `faf18d783a4a8fd900f1c6921aa0a3c72cf7ab2a7d6cdd46ac7617202303b998` |
| `nodes.json` | `db9462c6e374ab2ce8dd7f87859319342f85605a5832db9397b8bcb783751a97` |
| `relations.json` | `6bd62df22972bfa37db9cab9d5e0858c58769d810dee4d6b59299a880df246ed` |
| `residue.json` | `cb648e5e97e0b3f1530ebdde201844fed48a0f36716cdfb8c4a668b44e951d16` |

All four were untracked in the captured source worktree. This entry preserves that provenance and does not
pretend the migration created or accepted those bytes.

## Ontology branches

### Product branch

The product branch connects checked system maps, typed domain graphs, exact realizations, non-inflating evidence,
Workflow forward recovery, Recovery Intent, Dispatch, Attempt, Invocation Identity, Claim, Lease, Retry,
Terminal Disposition, and D45–D49 integration bindings. These records navigate existing definitions; they do not
redefine them or create new meta-types/relationships.

### System branch

The system branch distinguishes implemented formation and bounded evidence from designed durable machinery.
Today it includes the baseline-v10 selection, private instantiation CLI, target observer, receipts, Operation and
Workflow generated contracts, three-language recovery planner/executor, and provider-neutral integration-contract
formation. Durable store adapters, workers, Claim/Lease services, journals, schedulers, restart recovery,
publishers, and persistent replay recognition remain designed.

### Bridge branch

Bridge relations connect business intent to exact system realizations and cite separate business and system
evidence. A bridge proves only the cited source alignment; it does not turn design into implementation or evidence
into authority.

## Non-collapse rules

- Meta-type, realization, and instance remain distinct.
- Workflow orchestration remains distinct from Operation state/effect authority.
- Claim safety remains distinct from Lease liveness and Invocation Identity replay protection.
- Attempt outcome remains distinct from whole-recovery Terminal Disposition.
- Dependency contract, metadata binding, adapter, runtime observation, evidence, and owner decision remain distinct.
- Research provenance and owner admission remain distinct from implementation evidence.

## Migration rule

The successor ontology must move as one closed package: profile, sources, nodes, relations, residue, schema,
views, validator, and append-only validation receipts. Source paths and digests must be rebound into a new receipt;
copying only the Markdown views is not a migration.

## Open Questions

The current system view labels several D45–D49 formation nodes implemented while the bridge view annotates their
realization edges as designed. The successor migration must resolve that projection mismatch from the machine
records and validator, not silently choose one Markdown statement.
