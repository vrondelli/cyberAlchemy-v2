# TASK-OEWSN-01: Relation Presentation Core

Status: blocked at Task Session preflight; selection, dependencies, baselines,
write algebra and closeout contract passed, but build-binding scope did not.

## Objective

Create the single versioned pure relation-presentation contract consumed by
every graph, portal, inspector and Path renderer.

## Inputs and outputs

- Inputs: admitted graph edge, sidecar evidence, approved predicate color map,
  presentation pattern map and optional traversal orientation
- Output: `relation-presentation-record.v1` or a typed fail-closed diagnostic

## Algorithm

1. Resolve graph edge ID to exactly one source relation ID and endpoint pair.
2. Copy exact predicate, source direction, evidence and source authority.
3. Derive projected direction from admitted endpoints without rewriting source.
4. Resolve color by exact predicate and pattern by presentation relation.
5. Add traversal orientation only when the caller is Path.
6. Set projection authority to none and canonicalize the record.
7. Reject unknown/lossy/missing required fields or duplicate identities.

## Smallest Working Unit

### SWU-OEWSN-004 — Derive one lossless relation record

- Primary behavior: deterministic exact source edge -> presentation record
- Independent acceptance: positive/negative fixture bank passes without UI
- Candidate child units: schema, mapping lookup, canonicalization
- Retained-boundary rationale: independently none is usable; together they are
  the smallest record a renderer can safely consume
- Dependencies: SWU-021 approved relation-encoding profile; existing admitted
  graph/sidecar. OD-01–OD-03 do not block this pure L0 unit.
- Dependency evidence: SWU-021 is complete in the approved profile and Decision
  Gate receipt; the semantic-family v1 table and validation receipt are
  digest-bound there.
- Source anchors: Define mappings/operations; Design concept/type and authority
  extension; Body War graph/sidecar fixtures
- Related context: existing focus derivation and OEW type conventions
- Write scope: new `upstream/overlay/packages/dashboard/src/oew/relationPresentation.ts`,
  new `relationPresentation.test.ts`, `upstream/overlay/overlay-manifest.json`,
  new `upstream/patches/0003-oew-semantic-navigation.patch`, build/test
  admission bindings for those exact files
- Done: versioned type/validator, mappings and negative bank are complete;
  no renderer or visible behavior changes
- Acceptance evidence: focused unit result, fixture inventory/digests, scoped
  manifest diff and protected-source equality
- Validation: targeted Node/retained TypeScript tests, fresh patch apply/build
  admission, JSON manifests and scoped whitespace check
- Preflight result: `20260802T014636Z` blocked before product mutation because
  `overlay-manifest.json` is digest/size-bound by both
  `first-working-version-manifest.json` and `L1-BUILD.lock.json`, neither of
  which is in the material scope.
- Repair owner: Invoke must either admit and validate consistent rebinding of
  both targets or introduce a separately owned semantic-navigation build
  binding; weakening the builder is not an accepted substitute.
- Execution owner: subagent or local fallback under Task Session
- Handoff: return typed test receipt, exact files/digests and no-UI-change proof

## Edge cases and failure modes

Unknown predicate/pattern mapping, unavailable direction, graph/source ID
collision, reversed endpoints, duplicated source relation, missing evidence,
non-none projection authority and non-canonical output fail closed.

## Synchronization

Closeout row `SWU-OEWSN-004` in `CLOSEOUT-SYNC-INVENTORY.json` is mandatory.
