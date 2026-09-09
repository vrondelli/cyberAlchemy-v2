# Digest and Migration Laws

Status: normative candidate design for the repair package

## Canonical digest profile

All JSON inputs use RFC 8785 canonical JSON, UTF-8 bytes, SHA-256, lowercase
hexadecimal output, and an explicit NUL-terminated domain prefix. The profile ID is
`oew.relation-digest.v1`.

1. `relation_digest = sha256("oew/relation-binding/v1\\0" + canonical(binding))`,
   where `binding` contains every SourceGraph-owned relation field in schema order,
   including evidence, mapping loss, authority effect, and compatibility cue fields.
2. Sort `[source_relation_id, relation_digest]` pairs by Unicode code-point order of
   the relation ID. Reject duplicate IDs. `facet_set_digest` hashes that canonical
   array under domain `oew/facet-set/v1`.
3. `relation_count` must equal both `relation_ids.length` and the cardinality of
   `internal_relations union cut_relations`. `relation_ids` must equal the canonical
   sorted union exactly.
4. `scene_content_digest` hashes the complete v1.2 scene except `scene_digest`, the
   runtime-only index, and `relation_index_receipt.scene_digest` under domain
   `oew/scene-content/v1.2`.
5. `scene_digest` hashes `{scene_content_digest, receipt_basis}` under domain
   `oew/scene/v1.2`; `receipt_basis` contains source graph digest, canonical relation
   IDs, count, facet-set digest, digest profile, canonicalization version, and hash
   algorithm, but excludes the scene-digest back-reference.
6. The finalized receipt copies that computed `scene_digest`. Admission recomputes
   every layer; it never trusts a stored digest or count.
7. `snapshot_digest` hashes the complete snapshot except its own digest under domain
   `oew/relation-snapshot/v1`. A snapshot is admitted only after both snapshot digest
   and relation digest recompute successfully.

These domain prefixes prevent a valid digest from one object kind being substituted
for another.

## Migration law

A v1 or v1.1 scene cannot self-certify migration. The adapter requires:

- the exact admitted SourceGraph whose digest equals the legacy scene graph digest,
- the exact ViewPack whose digest equals the legacy scene ViewPack digest, and
- the legacy scene plus its original schema identity.

The adapter re-resolves every internal and cut relation by ID and compares all
SourceGraph-owned semantic fields. Missing, extra, duplicated, or drifted bindings
fail. Only after that comparison may it compile a new v1.2 scene and issue a new
receipt. It does not edit, relabel, or strengthen the legacy artifact or its receipt.

## Static fallback law

Exact predicate text, endpoint labels, source-direction text, and—when portal/path
local—traversal text are semantic fallback fields. Color and pattern tokens are
nullable presentation enhancements. A missing cue never invalidates the relation
snapshot, but a present cue is included in the snapshot digest and must match the
admitted encoding result.
