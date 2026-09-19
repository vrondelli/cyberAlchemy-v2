---
artifact: bte-l0-red-fixture-payload-scope-context
status: strict-pass
updatedAt: 2026-08-04
semanticAuthority: none
---

# Context Pack — L0 RED Fixture Payload Scope

## Task and obligations

Invoke Refresh must repair one planning contradiction without changing L0A
published bytes or selecting L0B:

1. every RED manifest case must resolve to independently authored bytes;
2. containment cases must preserve no-follow filesystem evidence;
3. all 25 closed diagnostic codes need causally isolated RED coverage;
4. owner identity, digest convention, and root resolution must be deterministic;
5. the exact owner write scope must be declared before the owner writes;
6. implementation, admission, release, publication, and production remain out of
   scope.

Coverage is 6/6. This is a standard strict authoring pack, not a runtime
handoff pack.

## Selected evidence

| Evidence | Selector | Obligation |
| --- | --- | --- |
| `WORK-PACK.md` | L0 Output Contract, Handoff Gate | 1, 2, 5, 6 |
| `work-pack/tasks/TASK-BTE-L0-PROOF-PRIMITIVES.md` | L0B Consumes, Required Red Cases, Write Scope | 1, 2, 3, 5, 6 |
| `impl/test-derivation-engine/src/bte/contracts/red-fixture-manifest.v1.schema.json` | case shape and `additionalProperties: false` | 1 |
| `impl/test-derivation-engine/src/bte/contracts/artifact-handle.v1.schema.json` | path, digest, bytes, producer, authority | 1, 2, 4 |
| `impl/test-derivation-engine/src/bte/validation/diagnostics.ts` | closed 25-code registry | 3 |
| `runs/20260723T020759Z/l0a/contract-publication-receipt.json` | immutable publication handles | 1, 4, 6 |
| current user approval | recommended fixture/topology scope accepted | 5 |
| independent owner audit | no files written; ceremonial two-file freeze blocked | 1, 2, 5 |

The repository Inventory was lookup-ready, but its matching BTE entries were
excluded because current direct planning contracts and published schemas are
more precise. Inventory remains a non-authority discovery surface.

## Resolution

Use existing ArtifactHandles as designed: authorize real package-local fixture
and topology bytes before manifest serialization. Do not republish L0A. Record
one stable role identity, canonical owner-digest rule, package-root mapping,
no-follow link hashing, and explicit `BTE_SCHEMA_INVALID` coverage.

## Hard boundary

This refresh may update only its nine declared planning/control targets and its
own refresh evidence. It may not create validation inputs, edit implementation,
select or execute L0B, grant admission, or touch public Arcanum.
