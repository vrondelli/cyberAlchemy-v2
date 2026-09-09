---
document_id: cav2-domainspec-v2-migration-contract/v1
status: candidate
authority_effect: none
visibility: private
updated_at: 2026-08-30
---

# DomainSpec v2 Migration Contract

## Objective

Move the active DomainSpec product into CyberAlchemy v2 without rewriting history, losing exact evidence, or
creating two silent authorities.

## Non-negotiable invariants

1. Private DomainSpec content remains private and never enters public `arcanum/`.
2. Existing dirty bytes retain their pre-migration provenance.
3. Frozen receipts and baselines remain resolvable at their declared exact paths and digests.
4. CyberAlchemy inventory and ontology remain read models; they cannot promote their own classifications.
5. Definitions move only through their owner-gated authority route and do not redefine public Arcanum terms.
6. Executable imports, package roots, runtime manifests, and validators move as a dependency-closed slice.
7. A changed authority-bearing or executable path requires a new baseline identity and fresh validation.
8. Old active paths are not removed until every reachable declared consumer resolves and passes.

## Staged successor route

The recommended `MIG-B` route has six stages:

| Stage | Effect | Required evidence |
| --- | --- | --- |
| 0. Inventory | No authority effect | Exact source manifest, Git-state snapshot, path-consumer map |
| 1. Entry documents | Candidate only | Product, architecture, ontology, and migration surfaces bound to source digests |
| 2. Successor materialization | Additive copy | Dependency-closed active product slice in CyberAlchemy; no source deletion |
| 3. Consumer rebinding | Active candidate | Exact old→new path map and every reachable consumer validation |
| 4. Successor baseline | Owner-gated | New runtime/profile manifest, immutable digest set, independent validation and acceptance |
| 5. Authority switch | Owner-gated | CyberAlchemy sources selected; old active root marked compatibility/archive |
| 6. Optional cleanup | Destructive gate | Proof that no frozen or active consumer requires removed paths |

## Layer destinations

| Product concern | Destination |
| --- | --- |
| Thesis and product navigation | `product/domainspec-v2/` |
| Architecture and patterns | `architecture/domainspec-v2/` |
| DomainSpec authority import | `authority/domainspec-v2/` |
| Product/system ontology | `ontology/domainspec-v2/` |
| Runtime, CLI, schemas, generators, tests | `implementation/domainspec-v2/` |
| Research and discovery | `research/domainspec-v2/` |
| Working packs and non-frozen development | `development/domainspec-v2/` |
| Exact migration read model | `inventory/domainspec-v2/` |

Historical development evidence may remain at `projects/domainspec-v2/` even after active authority moves. A
historical record is not made obsolete merely because its producer receives a successor location.

## Validation bar

Before the authority switch:

- inventory reproduction passes twice with one digest;
- every selected file matches its migration manifest digest;
- all relative and literal path consumers are accounted for;
- Node 26 runtime, CLI, package, ontology, definition-drift, architecture-conformance, and clean-package checks pass;
- TypeScript, Python, and Rust profile outputs remain deterministic;
- old frozen baselines still resolve or have an explicit content-addressed compatibility mechanism;
- an independent review binds the exact successor manifest; and
- an owner decision selects the successor baseline without implying publication or release.

## Rollback boundary

Until the authority switch, rollback means discarding only the additive CyberAlchemy candidate and consumer
candidate changes; the existing source remains intact. After the authority switch, rollback requires a new owner
decision because authority identity has changed.

## Open Questions

- Select `MIG-A` governed adoption or `MIG-B` staged successor migration.
- Define the permanent addressability policy for frozen development evidence.
- Decide whether cleanup of the old active root is ever required; migration completion does not require deletion.
