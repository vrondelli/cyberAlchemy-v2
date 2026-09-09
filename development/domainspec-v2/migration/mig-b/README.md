---
document_id: cav2-domainspec-v2-mig-b-materialization/v1
status: selected-in-progress
authority_effect: migration-route-selected-only
visibility: private
updated_at: 2026-08-30
---

# MIG-B DomainSpec v2 Staged Successor

This package executes the selected `MIG-B-STAGED-SUCCESSOR` route as an additive migration. It preserves
`projects/domainspec-v2/` and baseline-v10 evidence while materializing an exact CyberAlchemy-native successor
candidate.

## Stage 2 materialization

[`materialize-successor.mjs`](materialize-successor.mjs) derives the exact copy set from:

- `cyberAlchemy-v2/inventory/domainspec-v2/source-manifest.json`;
- `cyberAlchemy-v2/authority/decisions/domainspec-v2-migration/selection.json`;
- `projects/domainspec-v2/RUNTIME.json`; and
- baseline `domainspec-meta-types-current-implemented@10` and its 847-entry immutable inventory.

The script copies every present non-development source and only the development files required by the selected
baseline/runtime closure. It does not import the whole historical development tree.

## Destination groups

| Group | Destination | Role |
| --- | --- | --- |
| Runtime closure | `cyberAlchemy-v2/implementation/domainspec-v2/` | Exact project-shape candidate used for rebinding and validation. |
| Product snapshot | `cyberAlchemy-v2/product/domainspec-v2/source-snapshot/` | Exact product-source provenance. |
| Architecture snapshot | `cyberAlchemy-v2/architecture/domainspec-v2/source-snapshot/` | Exact source architecture provenance. |
| Authority import | `cyberAlchemy-v2/authority/domainspec-v2/imported-source/` | Exact definitions/authority candidate, not self-promoting. |
| Ontology package | `cyberAlchemy-v2/ontology/domainspec-v2/package/` | Complete machine ontology successor candidate. |
| Research import | `cyberAlchemy-v2/research/domainspec-v2/imported-source/` | Exact research/discovery provenance. |

The runtime closure intentionally mirrors all selected source dependencies in their original project-relative
shape. The layer imports establish CyberAlchemy ownership boundaries. Stage 3 will rebind the runtime closure to
those layer authorities and record every changed successor byte under a new baseline; it will not mutate v10.

## Stage 3 path rebinding

[`rebind-successor.mjs`](rebind-successor.mjs) consumes the exact stage-2 outputs and publishes separate
`rebound-candidate/` trees. It replaces every literal `projects/domainspec-v2` reference with the corresponding
CyberAlchemy product, architecture, authority, ontology, implementation, research, or retained-development path.
The exact materialization remains unchanged and repeatably checkable.

The rebound receipt deliberately reports baseline-v10 identity as stale for the candidate: changing path-bearing
bytes requires a new baseline rather than stretching v10 over them.

## Run

```text
toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl -- node ../../../cyberAlchemy-v2/development/domainspec-v2/migration/mig-b/materialize-successor.mjs --materialized-at 2026-08-30T18:51:18Z --write
toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl -- node ../../../cyberAlchemy-v2/development/domainspec-v2/migration/mig-b/materialize-successor.mjs --materialized-at 2026-08-30T18:51:18Z --check
toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl -- node ../../../cyberAlchemy-v2/development/domainspec-v2/migration/mig-b/rebind-successor.mjs --rebound-at 2026-08-30T19:00:15Z --write
toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl -- node ../../../cyberAlchemy-v2/development/domainspec-v2/migration/mig-b/rebind-successor.mjs --rebound-at 2026-08-30T19:00:15Z --check
```

## Claim ceiling

Materialization proves exact source-to-target byte copying for the selected closure. It does not prove the copied
runtime executes from its new location, admit a successor baseline, switch authority, publish, release, deploy,
or authorize deletion.

## Open Questions

After path rebinding passes, stage 4 must generate and validate the successor baseline without rewriting
historical baseline-v10 records.

## Stage 4 baseline candidate

[`build-baseline-v11-candidate.mjs`](build-baseline-v11-candidate.mjs) turns the immutable rebound postimage into
separate `current-candidate/` trees and derives `domainspec-meta-types-current-implemented@11-candidate`. It maps
the same 847 semantic baseline members to CyberAlchemy layers, recalculates their post-rebind digests, and
regenerates only the current projections deliberately excluded from baseline digest membership.

The candidate is not owner-admitted and cannot switch authority. [`validate-successor-candidate.mjs`](validate-successor-candidate.mjs)
checks the full candidate without trusting the source project runtime validator.
