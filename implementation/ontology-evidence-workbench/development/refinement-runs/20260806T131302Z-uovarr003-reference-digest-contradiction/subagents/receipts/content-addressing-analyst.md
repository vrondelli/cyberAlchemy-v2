# Read-only receipt — content-addressing analyst

- Dispatch: `2026-08-06-uovarr003-reference-digest-review`
- Agent: `/root/uovarr003_content_addressing_analyst`
- Role: `content-addressing-analyst`
- Status: `completed-read-only`
- Validation: `flag`
- Authority effect: none
- Writes by agent: none

## Inspected paths

- current run `REFINE-SEED-PROPOSAL.md`, `REFINE-DISPATCH.json`, and `strategy-inventory-packet.json`
- parent design `DIGEST-AND-MIGRATION-LAWS.md`, `KNOWLEDGE-SCENE.v1.2.schema.json`, and `RELATION-REFERENCE.schema.json`
- current `relationReference.ts` and `sceneQuery.ts`
- UOVARR-001 `PROTOTYPE-VALIDATION-REPORT.md`

## Dependency graphs

### Validated embedded back-references

```text
semantic scene fields + relation IDs + receipt basis
  -> scene_content_digest
  -> final scene_digest
  -> top-level, receipt, navigation, and typed RelationRef copies
stored back-reference -> admission equality(final scene_digest)
```

Conditional pass. It is acyclic only when schema-declared digest-value leaves are omitted from the digest basis, all relation IDs and portal/Path/selection semantics remain hashed, finalization constructs a new frozen object, and admission enumerates and validates every reference slot. Blanket recursive deletion fails integrity coverage.

### Detached projection artifacts

```text
scene semantic core -> scene_digest
scene_digest + projection semantics + relation IDs -> projection_digest
scene_digest + ordered projection digests -> optional bundle manifest digest
```

Acyclic, but flagged until the projection has its own domain-separated digest, canonical ordering, bundle completeness, co-admission, and missing/extra/duplicate behavior.

### Two-level revision/envelope identity

```text
revision semantic fields -> revision R
R -> embedded relation references
R + complete finalized envelope -> envelope E
E -> envelope receipt copies
```

Acyclic when `R` and `E` have distinct names and one-way ownership. Flagged because the current resolver exposes one `scene_digest`; a migration and exhaustive revision/envelope field matrix would be required.

### Ambient scene scope — negative control

```text
scene semantics -> scene_digest
ambient current scene + bare relation ID -> process-local resolution
```

Rejected. It cannot serialize origin, detect ambient scene substitution, or distinguish same-ID references transplanted across scenes.

## Findings

1. The current law hashes the complete scene except top-level, receipt, and navigation digest copies, while portal/Path/selection schemas embed `RelationRef.scene_digest`; this is the fixed point under review.
2. `relationReference.ts:205-228` implements that cycle: typed nested reference digests remain in the hash input.
3. `relationReference.ts:313-337` binds only top-level, navigation, and receipt digest copies; it cannot finalize nested references.
4. `relationReference.ts:235-279,339-360` admits those three copies only and neither validates all embedded references nor rejects their missing relation IDs.
5. `relationReference.ts:373-405` resolves against one identity; a two-level model needs a distinct revision identity.
6. `relationReference.ts:144-187,298-311` already provides exact-ID indexing, duplicate rejection, a non-enumerable runtime index, and deep freezing that can support stable serialization.
7. `RELATION-REFERENCE.schema.json` and the digest laws provide a detached snapshot precedent with an independent digest; they do not implement a detached scene projection model.
8. `sceneQuery.ts:244-301` currently finalizes `portals: []`, no Path, and `selected: none`; current proof stops before UOVARR-003.
9. UOVARR-001 evidence is fresh for the inspected files but explicitly candidate-local and not browser, release, deployment, or readiness evidence.
10. Inventory was used only as a source locator and no Inventory conclusion was inherited.

## Rejected models

- current complete-scene hash with an embedded final digest: cryptographic fixed point and self-stale references;
- ambient scene scope: no portable origin or stale-scene proof;
- blanket recursive `scene_digest` exclusion: silently drops unrelated semantic fields;
- detached projection without independent digest and manifest: incomplete integrity coverage;
- two-level identity reusing `scene_digest` for both identities: resolver ambiguity;
- portal-only detachment: Path/navigation retain the same cycle.

## Unresolved risks

- Exact typed exclusion/validation paths and navigation-selection variants are not specified.
- Embedded references require distinct pre-finalization input and finalized output contracts.
- Ordering of portals, paths, summaries, and manifests must be declared semantic or normalized.
- Artifact admission must decide whether any missing reference rejects the whole artifact.
- Detached projections need schema, digest domain, manifest, orphan, and packaging laws.
- Two-level identity needs exhaustive field ownership and unambiguous API names.
- SHA-256 provides integrity, not signer authenticity.
- The bounded corpus does not prove implemented Path, migration, navigation, or static-export compatibility.

## Validation rationale

`flag`: multiple acyclic families can be constructed, but none is proven by the current candidate prose. The current implementation remains circular for embedded UOVARR-003 references, and every viable family needs explicit schema, admission, and serialization contracts. The agent selected no final model.
