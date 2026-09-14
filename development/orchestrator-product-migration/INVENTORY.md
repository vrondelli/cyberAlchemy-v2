# Orchestrator Product Migration Inventory

Status: planning candidate  
Checked: 2026-09-13  
Authority effect: none

## Purpose

This inventory identifies the current orchestration and RWO holdings that must
be reconciled before CyberAlchemy v2 can become the sole product repository.
It distinguishes executable consumers, generated bindings, product
definitions, domain examples, and historical evidence so that retirement does
not erase unique work or provenance.

No path in this inventory is approved for deletion.

## Repositories checked

| Repository | Observed role | State relevant to migration |
| --- | --- | --- |
| `/home/vrondelli/projects/cyberAlchemy-v2` | Intended canonical product repository | Contains the older orchestration implementation, RWO decisions, a trusted-dataset consumer, Robot World integration, and unrelated dirty owner work. |
| `/home/vrondelli/projects/cya-orquestrator` | Standalone successor experiment | Contains the newer runtime, frontend, dispatch work, product package, VPS/Gateway work, and substantial uncommitted and untracked owner work. |

The newer implementation cannot be copied wholesale over the canonical tree.
A normalized comparison of the two `work-orchestration-implementation` trees
found 32 equal files, 24 changed files, 34 files unique to CyberAlchemy v2, and
588 files unique to the standalone experiment. The CyberAlchemy-v2-only set
includes the host evidence and host provisioning extensions, so the standalone
tree is not a complete superset.

The two named legacy paths are directories in the main CyberAlchemy v2 Git
repository, not separate Git repositories. They are nevertheless mandatory
retirement targets. The current `work-orchestration` directory contains 12
filtered files and `work-orchestration-implementation` contains 90 filtered
files, excluding build caches and dependencies.

## Holdings and proposed disposition

| Current holding | Evidence found | Proposed destination | Disposition |
| --- | --- | --- | --- |
| `cyberAlchemy-v2/work-orchestration/` | Product-capability profile, definitions, nodes, relations, schema, sources, residue, validator, and negative tests | Shared definitions and ontology under `cyberAlchemy-v2/orchestrator/authority/` and `orchestrator/ontology/`, plus contracts, capability metadata, migration provenance, and tests under `orchestrator/` | Selectively migrate every still-current responsibility, preserve superseded authority evidence, then remove this exact directory before migration completion. |
| `cyberAlchemy-v2/work-orchestration-implementation/` | Older runtime and contracts; Cargo currently reaches into `../cya-orquestrator` for `rwo-rust`; includes target-only host extensions | `cyberAlchemy-v2/orchestrator/` | Selectively merge and preserve unique extensions, then remove this exact directory after all consumers and bindings move. |
| `cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/` | Newer DagEngine, durable controller, API, frontend, dispatch strategy, ARE Gateway, recovery, Robot Talks, and deployment work; about 653 filtered files and 48.36 MiB excluding build caches, dependencies, and Playwright state | Capability, runtime, frontend, deployment, examples, and evidence areas under the canonical product | Migrate by manifest and digest. Exclude caches and classify generated run output separately from source. |
| `cya-orquestrator/cyberAlchemy-v2/product/orchestrator/` | Forty-four product-package files with ORCH-D1 through ORCH-D13 definitions, ontologies, architecture, journey, validation, work pack, and acceptance candidate | Split by responsibility across `cyberAlchemy-v2/orchestrator/product/`, `orchestrator/authority/`, `orchestrator/ontology/`, and `orchestrator/docs/` | Use as a predecessor, then revise it for the general-agent scope and merged single-engine architecture. It is not current authority merely because it is copied. |
| `cya-orquestrator/projects/cyberalchemy-orchestrator/` | Three historical files: original RWO design, Cargo manifest, and semantic reducer source | `orchestrator/rwo/legacy-fixtures/` or a digest-bound provenance bundle under `orchestrator/migration/` | Preserve temporarily for differential fixtures and design provenance. Remove it from runtime dependencies before retiring the old repository. |
| `cyberAlchemy-v2/trusted-dataset-materialization/rwo-adapter/` | A real RWO consumer whose Cargo path currently points into `../cya-orquestrator`; source bindings also name the historical repository path | Public `rwo-core` API or a product integration package | Migrate and revalidate as a consumer. Retire the old adapter directory only if its behavior and source bindings have an explicit replacement. |
| `cyberAlchemy-v2/development/robot-world-kep/orchestrator-integration/` | Domain-specific contracts, compiler, fixtures, tests, and run evidence | Keep Robot World as a product consumer/example; move only reusable orchestration behavior into the product | Do not delete the world or its evidence. Replace bespoke integration code only after the generic contracts reproduce its journey. |
| `cyberAlchemy-v2/development/agent-reasoning-engine/design/**` references | Design and research links to the historical orchestrator repository | Updated links or a migration provenance map | Treat as documentary consumers. Rewrite live links when a canonical replacement exists; retain immutable research evidence. |
| CyberAlchemy Lab migration and conformance evidence | Historical import and architecture-conformance records | Remain where recorded | Preserve. These records are evidence, not duplicate runtime implementations. |

## Dependency classes

### Live build dependencies

- `work-orchestration-implementation/runtime/Cargo.toml` depends on
  `../../../cya-orquestrator/.../runtime/vendor/rwo-rust`.
- `trusted-dataset-materialization/rwo-adapter/Cargo.toml` has the same external
  repository dependency.

These prevent CyberAlchemy v2 from building as a standalone checkout.

### Compiled and generated source bindings

The work-orchestration and trusted-dataset packages contain bindings, locks,
system ontologies, and build receipts that still identify
`projects/cyberalchemy-orchestrator/implementations/rwo-rust`. Their historical
digests must remain visible, while newly compiled projections must bind to the
new canonical internal package.

### Historical and research references

Research dispatches, prior orchestration runs, design documents, and evidence
bundles contain many old path references. They should not be mass-rewritten.
Only active documentation and build inputs should move; immutable evidence may
retain its original path with a migration map explaining the successor.

## Retirement gates

A directory or repository becomes a deletion candidate only when all of these
conditions hold:

1. Every file is classified as `move`, `merge`, `preserve-as-evidence`,
   `regenerate`, `cache`, or `retire`, with source and destination digests.
2. Dirty and untracked owner work is included in the inventory and preserved.
3. No live build, compiler, validator, test, deployment, or current-document
   reference points to the old location.
4. The internal RWO package and the durable orchestrator pass unit,
   differential replay, recovery, adapter, API, and frontend tests from the
   canonical checkout alone.
5. The trusted-dataset and Robot World consumer journeys pass against the new
   public contracts.
6. Historical RWO fixtures and source digests remain available in a provenance
   bundle even after runtime dependency removal.
7. A deletion manifest names the exact paths to remove and demonstrates that
   no unclassified files remain.
8. Deletion is performed as its own authorized, reviewable change after the
   pre-retirement migration checks pass, rather than during the copy or merge
   step.
9. Final verification asserts that neither
   `cyberAlchemy-v2/work-orchestration` nor
   `cyberAlchemy-v2/work-orchestration-implementation` exists.

## Required retirement targets

The consolidation is incomplete until all three legacy locations have been
retired:

1. `/home/vrondelli/projects/cyberAlchemy-v2/work-orchestration`
2. `/home/vrondelli/projects/cyberAlchemy-v2/work-orchestration-implementation`
3. `/home/vrondelli/projects/cya-orquestrator`, after its unique product work
   has migrated and its owner-controlled dirty state has been preserved

The first two are removed from the canonical repository through reviewed Git
changes. The third is a separate checkout and may be removed only after the
canonical repository independently builds, tests, and serves the product.

## Current conclusion

The old directories cannot be deleted safely today, but deleting them is a
required outcome of the migration. The standalone experiment contains most of
the new product behavior, while CyberAlchemy v2 contains unique extensions and
consumers. The first executable migration result must be a self-contained
canonical checkout with no `../cya-orquestrator` dependency. The migration then
removes both named CyberAlchemy v2 directories and finally retires the separate
standalone repository after the consumer and provenance gates pass.

## Open Questions

- Which generated run outputs are product fixtures, which are audit evidence,
  and which are disposable local state?
- Should the historical RWO source remain as a frozen test fixture after
  equivalence is established, or should only its digest and selected fixtures
  remain?
- Which ARE design documents are active specifications rather than immutable
  research records?
