# Context Pack — UOVARR-003 Digest/Reference Repair

This strict runtime handoff supports Refine run `20260806T131302Z-uovarr003-reference-digest-contradiction`. It does not change the current v1.2 schema, product implementation, admitted work pack, or authority state.

## Summary

- Task: replace the circular `KnowledgeScene.scene_digest` / embedded `RelationRef.scene_digest` contract with one acyclic, tamper-evident finalization and admission law.
- Mode: `standard --strict --emit both --handoff runtime`.
- Files selected: 14.
- Obligations: 8/8 covered.
- Strict coverage: PASS.
- Blockers: none for definition and design; product mutation remains forbidden.

## Obligations

| ID | Obligation | Evidence |
| --- | --- | --- |
| O1 | Reproduce the current circular dependency and its `stale-scene` consequence. | Current digest law, schema, implementation, and UOVARR-001 prototype report. |
| O2 | Define exactly which fields belong to the scene semantic digest basis. | v1.2 schema, `sceneContent`, and design architecture. |
| O3 | Define reference-binding and admission behavior without a fixed-point assumption. | RelationRef schema, current resolver, and validation contract. |
| O4 | Compare embedded back-reference, detached projection, two-level identity, and ambient-scope control. | Refine seed, schema boundary, and direct implementation. |
| O5 | Preserve portal, Path, navigation, snapshot, and static-consumer semantics. | UOVARR-003/UOVARR-004 tasks and architecture. |
| O6 | Preserve relation identity, parallel-relation separation, and tamper detection. | Relation reference core task, current index implementation, and validation contract. |
| O7 | Define explicit migration/supersession requirements for v1.2 artifacts and admitted tasks. | Digest/migration law and admission contract. |
| O8 | Produce only a validated design and executable work pack; do not mutate product or inflate readiness. | Refine seed and current admission boundary. |

## Current contradiction

`sceneContent` removes only the top-level digest, the runtime index, receipt-basis back-reference, and `navigation_frame.scene_digest`. The v1.2 portal schema requires each constituent to embed a `relation_ref` whose `scene_digest` equals the final scene. Because portal constituents remain inside the digest basis, adding a correctly bound portal changes the scene digest after the reference was created. The resulting reference is therefore resolved as `stale-scene`.

This is a contract contradiction, not a rendering defect. Portal layout, icons, and graph presentation cannot repair it.

## Candidate boundary

The refinement compares:

1. a schema-classified embedded back-reference whose digest field is excluded narrowly and rebound/validated during finalization and admission;
2. a detached reference projection outside the hashed semantic scene;
3. separate scene-revision and envelope identities;
4. ambient scene scope as a negative control.

No candidate is selected by this context pack.

## Constraints

- Hash exclusions must be schema-known paths, never arbitrary key-name removal.
- Unknown or extension fields remain content-addressed.
- Admission recomputes; it never trusts stored scene or reference digests.
- A finalized object must be immutable and stable through serialize/admit round trips.
- Direct source bytes outrank the prior design, Inventory, and inference.
- Inventory is discovery-only. The selected browser-neutral digest precedent distinguishes content identity, portability, and receipt evidence but owns no Body War decision.
- Product code, current work-pack tasks, canonical ontology, promotion, deployment, and release remain outside this run.

## Gaps carried forward

- Path and navigation reference-bearing consumers are planned rather than fully implemented.
- The current v1.2 migration law does not explain how circular portal references become valid.
- UOVARR-003 cannot safely continue until a superseding digest/reference contract and negative controls exist.

## Runtime handoff

Invoke Define may establish semantic-basis, revision identity, reference-binding phase, validation, and migration terms. The two registered analysts may inspect only their declared source sets and return read-only receipts. External research is unnecessary unless a later stage names a gap not answerable from these current sources.
