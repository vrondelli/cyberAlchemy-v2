---
task_session: SWU-CDSC2-007R
status: accepted
strict_coverage: pass
runtime: local-fresh-process
adapter: none
source_count: 16
---

# Context Pack: SWU-CDSC2-007R

## Selected Scope

Independently replay the immutable three-layer evidence chain, compatibility
projection, F3 and suite evaluation, and generation-2 index entry in a fresh
process. Audit target provenance, uncertainty, receipts, source boundaries, and
authority limits. Only after every gate passes, close the work-pack and append
one non-authority Inventory read model.

## Controlling Sources

- Refreshed work-pack, W3 wave, and SWU-CDSC2-007R task contract.
- Three-layer protocol and refreshed dispatch step `s5` with its boundary and
  authority gates.
- Generation-1 protected-files manifest and current two-entry generation index.
- Immutable parent F3, M1, M2, overlay, and compatibility projection.
- Frozen F1/F2 results and generation-2 F3, suite, provenance, and run receipt.
- Direct layer validators, compatibility materializer, frozen evaluator,
  successor wrapper, and generation-index validator.
- Closed Task Session receipts for SWU-CDSC2-005A, 005B, and 006R.
- Repository-local Inventory schema, controlled tags, machine index, human
  index, deterministic updater contract, existing generation-1 synthesis, and
  inventory log.

## Immutable Audit Handles

| Artifact | Handle |
| --- | --- |
| Parent F3 | `record:sha256:6d2066bded781e8dc739eb65f09f5237b131a4c55e7a858a03de8d1f5118681a` |
| M1 | `record:sha256:26cbc95a46c790b819ac0c9ebbef94771eed89a5457927fa0fd0967d32ec0140` |
| M2 | `record:sha256:55f0f6a99f8df7f5d9c4bf6da8c218f9366733a300e689c24ff8a2672e4309bd` |
| Overlay | `record:sha256:668ea537da92ee33b4640fe34175aaffa1b387b0809352984b552a7530dae8b5` |
| Projection | `record:sha256:8fa5b9015945b56aa2a9cdbf47d0743281a1a299fe1f0e8751b33518cbb03ccd` |
| F3 result | `record:sha256:8000b77fa0a60967707f5b830b8320fe92bee9965edbb3ff21e12f834620bd1a` |
| Suite result | `record:sha256:2953bb722b9d729c7c6126ef31331a2d652781020a999d2d9a0f466691763e52` |
| Provenance | `record:sha256:d7f4353c339cb2826e29860d17367c75737ff7f96c3367f856957ff4e98f47e2` |
| Generation 2 | `generation:sha256:24c4e0292197d0d8895bd5a668813437ba6d5c6f02cf6b549d85b2ae350ce683` |

## Hard Gates

- Run replay in a new Node process from a run-local auditor, not through the
  generation writer or a second append attempt.
- Verify generation-1 protected bytes plus exact pre-refresh M1/M2 byte hashes.
- Validate parent, observations, overlay, compatibility, F3, suite,
  provenance, and two-entry index independently.
- Rebuild compatibility from bound layers and compare complete canonical bytes,
  content digest, record ID, and generation ID.
- Re-evaluate F3 and suite from the one-entry prefix and compare exact outputs.
- Prove Q-06/Q-07 derive only from parent substitutions and exclude observed
  consequence text.
- Require twelve overlay coordinates, exact 2/4/6 state counts, two approved
  uncertainty resolutions, and five carried non-portability rows.
- Require all prior Task Session receipts to pass with no blockers.
- Reject any positive identity, type, relationship, pattern, portability,
  candidate, activation, or promotion inference.
- Hash evidence, results, and index before and after replay; only run-local
  evidence may be written.

## Inventory Contract

Append a new generation-2 synthesis; do not overwrite the verified generation-1
entry. The read model must report F3 `INSUFFICIENT-EVIDENCE`, suite
`CALIBRATION-DEFER`, exact replay, remaining non-portability limits, and bounded
next route `evidence-repair`. It is not a candidate or authority artifact.

## Decisions

Blocker decisions: none. The task fixes fresh-process replay, read-only target
scope, Inventory append behavior, and the parent suite route. Runtime is local
with no delegation, adapter, fallback search, subagent, or experiment harness.
