# Craft MIG-B Migration Order

Status: **M00 refresh and freeze complete; revision 2 corrected; M01 not started**
Authority effect: **none**
Machine view: [CRAFT-MIGRATION-ORDER.json](CRAFT-MIGRATION-ORDER.json)
Correction witness: [CRAFT-MIGRATION-ORDER-AMENDMENT-001.json](CRAFT-MIGRATION-ORDER-AMENDMENT-001.json)

## Corrected Boundary

Craft is the current name of the DomainSpec v2 Product lineage and is both a Project and a Product. Its active
surfaces therefore live inside one self-contained root:

```text
cyberAlchemy-v2/craft/
  product/
  project/
  authority/
    definitions/
  ontology/
  architecture/
  implementation/
  research/
  development/
```

Layer-first paths such as `cyberAlchemy-v2/authority/craft` and
`cyberAlchemy-v2/implementation/craft` are not migration destinations. The canonical definitions destination
is `cyberAlchemy-v2/craft/authority/definitions`.

Craft remains the same renamed Product, not a successor Product. Existing DomainSpec-v2 paths remain readable
legacy and migration evidence. This order neither deletes nor bulk-copies them.

## Selective Migration Rule

The complete inventory exists so that selection is safe; it is not a list of material that must move. The 53
development directories and 1,027 literal-path consumer files remain discovery and preservation evidence.
A file, directory, or consumer migrates only when a numbered phase names its exact dependency closure.
Everything else stays in place.

The earlier five directory waves are superseded as an execution schedule. Their lifecycle classifications
remain useful observations, but completed, superseded, historical, blocked, and unrelated development packages
are not copied merely because they were inventoried.

## First Slice: Canonical Definitions

M01 migrates the definition predecessor before Product Capability, ontology, architecture, realization, CLI,
or implementation:

- 13 active backend meta types: `DS-D1.1..9` and `DS-D1.11..14`;
- 13 corresponding criterion records;
- a scoped 17-signature active-backend `DS-D8` relationship authority;
- the supported backend profile registry;
- meta-type state definitions `domainspec-v2-D31..D35`;
- the transitive canonical definition references required by those records;
- synchronized human definitions, index, drift audit, schemas, validator, and snapshot manifest.

The destination machine format is JSON. Real YAML source is deterministically converted to JSON criterion
records, while JSON content currently stored under `.yml` names is renamed and rebound. A shared Draft 2020-12
JSON Schema validates the criterion-record shape. No `.yml`, `.yaml`, or YAML runtime dependency may remain in
the Craft definitions package.

M01 excludes UI candidates, deferred and superseded meta-type records, ontology, architecture, language
realizations, CLI code, and development work packs. The scoped 17-signature authority records that the source
registry has 31 signatures and defers 14; it does not claim full source parity.

## Corrected Execution Order

| Order | Phase | Required result |
| ---: | --- | --- |
| 0 | Refresh and freeze | **Completed.** Preserve the immutable M00 source and map evidence. |
| 1 | Migrate canonical definitions | Materialize the active-backend JSON definition closure under `craft/authority/definitions`. |
| 2 | Freeze Definition Snapshot | Prove conversion equivalence, reference closure, three definition voices, source currentness, and two-run determinism; bind one exact owner-reviewed snapshot. |
| 3 | Finalize Craft entry surfaces | Establish Product, Project, and Method surfaces inside `cyberAlchemy-v2/craft`, bound to the Definition Snapshot. |
| 4 | Migrate Product Capability and ontology | Select only the capability and business-ontology records required by the first vertical. |
| 5 | Migrate DomainSpec and system ontology | Carry the selected authored source, compiled graph, and system ontology closure. |
| 6 | Migrate architecture and realizations | Carry only the required architecture properties and TypeScript, Python, and Rust realization bindings. |
| 7 | Migrate one runtime closure | Build one standalone Node 26 implementation and CLI under `craft/implementation`. |
| 8 | Rebind selected consumers | Rewrite only consumers belonging to the selected vertical. |
| 9 | Validate and freeze the first vertical | Pass the final-path generation, three-profile, Operation, Workflow, target-project, conformance, and deterministic replay checks twice. |

No phase carries every development directory, archives all historical packages, or rewrites all 9,073 old-root
occurrences.

## M00 Amendment Boundary

The original M00 receipt is immutable and records the hashes of migration-order revision 1. Revision 2 does not
rewrite that receipt. `CRAFT-MIGRATION-ORDER-AMENDMENT-001.json` preserves its prior hashes and records the
owner-directed corrections: selective migration, definitions first, JSON definition schemas, and the
product-first Craft root.

## Completion Proof

The first Craft vertical is complete only when:

1. the accepted Definition Snapshot precedes and binds every later selected layer;
2. the final implementation installs, typechecks, tests, and builds in the repository Node 26 container;
3. TypeScript, Python, and Rust realizations pass independent conformance from final Craft paths;
4. Operation and Workflow enforce the selected relationship, effect, failure, and recovery contracts;
5. a target project is generated from typed intent and checked against the exact selected realization; and
6. two identical runs produce identical target bytes, manifests, and conformance results.

Validation proves only the selected vertical. Unselected DomainSpec-v2 material remains legacy evidence and is
not implicitly migrated, admitted, published, released, or deployed.

Validate this order with:

```text
toolchains/node-typescript/bin/node-env run --project projects/domainspec-v2/impl -- node ../../../cyberAlchemy-v2/development/domainspec-v2/migration/mig-b/validate-craft-migration-order.mjs
```
